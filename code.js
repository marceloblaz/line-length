// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.html".
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
        //cria um array somente com os nodes de texto
        const nodesToResize = txtbx.filter(function (item) {
            return item.characters.length >= msg.characters;
        });
        //store only nodes that have at least the same amount of characters than what the user wants
        if (msg.characters === 0) {
            figma.notify("Sorry but you cannot set your average line length to zero characters");
            figma.closePlugin();
        }
        else if (txtbx.length === 0) {
            figma.notify("No text layers were selected!");
        }
        else if (txtbx.every((item) => item.hasMissingFont)) {
            figma.notify("Uh oh, I can't work here. Looks like a font is missing!");
        }
        else if (nodesToResize.length === 0) {
            figma.notify("There aren't that many characters in the layers you selected");
        }
        else {
            let list = [];
            function insertNew(objeto) {
                // searches list for any object that has the same font family name and font style
                let result = list.find((item) => item.fontName.family == objeto.fontName.family &&
                    item.fontName.style == objeto.fontName.style);
                if (!result) {
                    // if it doesn't find it
                    list.push(objeto);
                }
            }
            for (let i = 0; i < nodesToResize.length; i++) {
                insertNew(nodesToResize[i]);
            }
            const uniqueFonts = list;
            for (let i = 0; i < uniqueFonts.length; i++) {
                const promise = figma.loadFontAsync(uniqueFonts[i].fontName);
                Promise.all([promise]).then(() => {
                    nodesToResize.forEach(function (item) {
                        item.textAutoResize = "WIDTH_AND_HEIGHT";
                        let temp = item.clone();
                        temp.characters = item.characters.substr(0, msg.characters);
                        let newWidth = temp.width;
                        temp.remove();
                        item.resize(newWidth, item.height);
                    });
                });
            }
            switch (nodesToResize.length) {
                case 1:
                    figma.notify(nodesToResize.length + " layer was resized!");
                    break;
                default:
                    figma.notify(nodesToResize.length + " layers were resized!");
            }
        }
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
};
