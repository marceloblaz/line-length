function loadFonts(nodesToResize) {
    return new Promise((resolve, reject) => {
        let fontList = nodesToResize.reduce((prev, node) => {
            function pushFont(font) {
                if (!prev.find((fontName) => fontName.family === font.family &&
                    fontName.style === font.style)) {
                    prev.push(font);
                }
            }
            if (node.fontName == figma.mixed) {
                for (let i = 0; i < node.characters.length; i++) {
                    pushFont(node.getRangeFontName(i, i + 1));
                }
            }
            else {
                pushFont(node.fontName);
            }
            return prev;
        }, []);
        Promise.all(fontList.map((font) => figma.loadFontAsync(font))).then(() => resolve());
    });
}
// This shows the HTML page in "ui.html"
figma.showUI(__html__, { width: 300, height: 180 });
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => {
    if (msg.type === "change-length") {
        const selection = figma.currentPage.selection;
        const txtbx = selection.filter(function (item) {
            return item.type === "TEXT";
        });
        //creates an array of only text nodes
        const nodesToResize = txtbx.filter(function (item) {
            return item.characters.length >= msg.characters;
        });
        //store only nodes that have at least the same amount of characters than what the user wants
        if (msg.characters === 0) {
            figma.notify("Sorry, but you can't set your average line length to zero characters");
            figma.closePlugin();
        }
        else if (txtbx.length === 0) {
            figma.notify("No text layers were selected!");
        }
        else if (txtbx.every((item) => item.hasMissingFont)) {
            figma.notify("Uh oh, can't work here. Looks like a font is missing!");
        }
        else if (nodesToResize.length === 0) {
            figma.notify("There aren't that many characters in the layers you selected");
        }
        else {
            loadFonts(nodesToResize).then(() => nodesToResize.forEach(function (item) {
                item.textAutoResize = "WIDTH_AND_HEIGHT";
                let temp = item.clone();
                temp.characters = item.characters.substr(0, msg.characters - 1);
                let newWidth = temp.width;
                temp.remove();
                item.resize(newWidth, item.height);
            }));
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
