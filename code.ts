function loadFonts(nodesToResize: Array<TextNode>) {
  return new Promise((resolve, reject) => {
    let fontList: Array<FontName> = nodesToResize.reduce(
      (prev: Array<FontName>, node: TextNode) => {
        function pushFont(font: FontName) {
          if (
            !prev.find(
              (fontName) =>
                fontName.family === (font as FontName).family &&
                fontName.style === (font as FontName).style
            )
          ) {
            prev.push(font);
          }
        }

        if (node.fontName == figma.mixed) {
          for (let i = 0; i < node.characters.length; i++) {
            pushFont(node.getRangeFontName(i, i + 1) as FontName);
          }
        } else {
          pushFont(node.fontName);
        }

        return prev;
      },
      [] as Array<FontName>
    );

    Promise.all(fontList.map((font) => figma.loadFontAsync(font))).then(() =>
      resolve()
    );
  });
}

function checkCharacters(txtndArr: Array<any>) {
  if (txtndArr.length != 1) {
    figma.ui.postMessage({ pluginMessage: { countable: false } });
  } else if (txtndArr.every((item) => item.hasMissingFont)) {
    figma.notify("Uh oh, can't work here. Looks like a font is missing!");
  } else {
    let node = txtndArr[0];
    let tempnodeArr = [node.clone()];
    let charactersArr = node.characters.split("");
    let tempnode = tempnodeArr[0];
    loadFonts(tempnodeArr).then(() => {
      tempnode.deleteCharacters(0, tempnode.characters.length);
      tempnode.textAutoResize = "WIDTH_AND_HEIGHT";
      var i = 0;
      do {
        tempnode.insertCharacters(0, charactersArr[i++]);
      } while (i < charactersArr.length && tempnode.width <= node.width);
      const currentCount = tempnode.characters.length;
      tempnode.remove();
      figma.ui.postMessage({
        pluginMessage: { countable: true },
        currentCount,
      });
    });
  }
}
//__

figma.showUI(__html__, { width: 316, height: 200 });
checkCharacters(
  figma.currentPage.selection.filter((item) => {
    return item.type == "TEXT";
  })
);
figma.on("selectionchange", () =>
  checkCharacters(
    figma.currentPage.selection.filter((item) => {
      return item.type == "TEXT";
    })
  )
);
//triggers checkcharacters everytime selection changes
//must not use constants created below because the selection must not be a constant

figma.ui.onmessage = (msg) => {
  const selection = figma.currentPage.selection;
  const txtbx: Array<any> = selection.filter(function (item) {
    return item.type === "TEXT";
  });
  const nodesToResize = txtbx.filter(function (item: TextNode) {
    return item.characters.length >= msg.characters;
  });
  //--
  if (msg.type === "change-length") {
    if (msg.characters === 0) {
      figma.notify(
        "Sorry, but you can't set your average line length to zero characters"
      );
      figma.closePlugin();
    } else if (txtbx.length === 0) {
      figma.notify("No text layers were selected!");
    } else if (txtbx.every((item) => item.hasMissingFont)) {
      figma.notify("Uh oh, can't work here. Looks like a font is missing!");
    } else if (nodesToResize.length === 0) {
      figma.notify(
        "There aren't that many characters in the layers you selected"
      );
    } else {
      loadFonts(nodesToResize).then(() =>
        nodesToResize.forEach(function (item: TextNode) {
          item.textAutoResize = "WIDTH_AND_HEIGHT";
          let temp = item.clone();
          temp.characters = item.characters.substr(0, msg.characters - 1);
          let newWidth = temp.width;
          temp.remove();
          item.resize(newWidth, item.height);
        })
      );
    }
    switch (nodesToResize.length) {
      case 1:
        figma.notify(nodesToResize.length + " layer was resized!");
        break;
      default:
        figma.notify(nodesToResize.length + " layers were resized!");
    }
  }

  figma.closePlugin();
};
