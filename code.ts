// Helper to get all selected text nodes
function getSelectedTextNodes(): TextNode[] {
  return figma.currentPage.selection.filter(
    (node): node is TextNode => node.type === "TEXT"
  );
}

async function loadFontsForNode(node: TextNode) {
  const fonts = node.getRangeAllFontNames(0, node.characters.length);
  await Promise.all(fonts.map(figma.loadFontAsync));
}

async function loadFontsForNodes(nodes: TextNode[]) {
  await Promise.all(
    nodes.map(node =>
      Promise.all(
        node.getRangeAllFontNames(0, node.characters.length)
          .map(figma.loadFontAsync)
      )
    )
  );
}

async function checkCharacters(txtndArr: TextNode[]) {
  if (txtndArr.length !== 1) {
    figma.ui.postMessage({ pluginMessage: { countable: false } });
    return;
  }
  
  const node = txtndArr[0];
  if (node.hasMissingFont) {
    figma.notify("Uh oh, can't work here. Looks like a font is missing!");
    return;
  }

  const tempnodeArr = [node.clone()];
  const charactersArr = node.characters.replace(/\n/g, "").split("");
  const tempnode = tempnodeArr[0];
  
  await loadFontsForNodes(tempnodeArr);
  tempnode.deleteCharacters(0, tempnode.characters.length);
  tempnode.textAutoResize = "WIDTH_AND_HEIGHT";
  
  let i = 0;
  do {
    tempnode.insertCharacters(0, charactersArr[i++]);
    await Promise.resolve(); // Microtask delay for width update
  } while (i < charactersArr.length && tempnode.width <= node.width);
  
  const currentCount = tempnode.characters.length;
  tempnode.remove();
  
  figma.ui.postMessage({
    pluginMessage: { countable: true },
    currentCount,
  });
}

// --- Main plugin logic ---
figma.showUI(__html__, { width: 316, height: 200 });

function updateUIWithSelection() {
  checkCharacters(getSelectedTextNodes());
}

updateUIWithSelection();
figma.on("selectionchange", updateUIWithSelection);

figma.ui.onmessage = async (msg) => {
  const textNodes = getSelectedTextNodes();
  
  if (msg.type === "change-length") {
    if (msg.characters === 0) {
      figma.notify("Sorry, but you can't set your average line length to zero characters");
      figma.closePlugin();
      return;
    }
    
    if (textNodes.length === 0) {
      figma.notify("No text layers were selected!");
      return;
    }
    
    if (textNodes.every(node => node.hasMissingFont)) {
      figma.notify("Uh oh, can't work here. Looks like a font is missing!");
      return;
    }
    
    const nodesToResize = textNodes.filter(node => node.characters.length >= msg.characters);
    if (nodesToResize.length === 0) {
      figma.notify("There aren't that many characters in the layers you selected");
      return;
    }
    
    await loadFontsForNodes(nodesToResize);
    for (const node of nodesToResize) {
      node.textAutoResize = "WIDTH_AND_HEIGHT";
      const temp = node.clone();
      temp.characters = node.characters.slice(0, msg.characters);
      const newWidth = temp.width;
      temp.remove();
      node.resize(newWidth, node.height);
    }
    
    // Update UI after resizing
    checkCharacters(nodesToResize);
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }
};