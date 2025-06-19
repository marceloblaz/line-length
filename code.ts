// Helper to load all unique fonts in a set of text nodes
async function loadFonts(nodes: TextNode[]): Promise<void> {
  const fonts: FontName[] = [];
  for (const node of nodes) {
    if (node.fontName === figma.mixed) {
      for (let i = 0; i < node.characters.length; i++) {
        const font = node.getRangeFontName(i, i + 1) as FontName;
        if (!fonts.some(f => f.family === font.family && f.style === font.style)) {
          fonts.push(font);
        }
      }
    } else {
      const font = node.fontName as FontName;
      if (!fonts.some(f => f.family === font.family && f.style === font.style)) {
        fonts.push(font);
      }
    }
  }
  await Promise.all(fonts.map(font => figma.loadFontAsync(font)));
}

// Helper to get all selected text nodes
function getSelectedTextNodes(): TextNode[] {
  return figma.currentPage.selection.filter(
    (node): node is TextNode => node.type === "TEXT"
  );
}

// Calculate max chars per line before wrapping
async function getMaxCharsPerLine(node: TextNode): Promise<number> {
  const clone = node.clone();
  await loadFonts([clone]);
  clone.deleteCharacters(0, clone.characters.length);
  clone.resize(node.width, node.height);
  clone.textAutoResize = "HEIGHT";

  const chars = node.characters.split("");
  const initialHeight = clone.height;
  let i = 0;
  for (; i < chars.length; i++) {
    clone.insertCharacters(i, chars[i]);
    if (clone.height > initialHeight) break;
  }
  clone.remove();
  return i;
}

// Check and report average line length
async function checkCharacters(nodes: TextNode[]): Promise<void> {
  if (nodes.length !== 1) {
    figma.ui.postMessage({ pluginMessage: { countable: false } });
    return;
  }
  const node = nodes[0];
  if (node.hasMissingFont) {
    figma.notify("Uh oh, can't work here. Looks like a font is missing!");
    return;
  }
  const currentCount = await getMaxCharsPerLine(node);
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
    await loadFonts(nodesToResize);
    for (const node of nodesToResize) {
      node.textAutoResize = "WIDTH_AND_HEIGHT";
      const temp = node.clone();
      temp.characters = node.characters.slice(0, msg.characters);
      const newWidth = temp.width;
      temp.remove();
      node.resize(newWidth, node.height);
    }
    // Optionally, update UI after resizing
    checkCharacters(nodesToResize);
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }
};