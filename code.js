var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function loadFontsForNode(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const fonts = node.getRangeAllFontNames(0, node.characters.length);
        yield Promise.all(fonts.map(figma.loadFontAsync));
    });
}
function loadFontsForNodes(nodes) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(nodes.map(node => Promise.all(node.getRangeAllFontNames(0, node.characters.length)
            .map(figma.loadFontAsync))));
    });
}
function checkCharacters(txtndArr) {
    return __awaiter(this, void 0, void 0, function* () {
        if (txtndArr.length != 1) {
            figma.ui.postMessage({ pluginMessage: { countable: false } });
        }
        else if (txtndArr.some((item) => item.hasMissingFont)) {
            figma.notify("Uh oh, can't work here. Looks like a font is missing!");
        }
        else {
            let node = txtndArr[0];
            let tempnodeArr = [node.clone()];
            let charactersArr = node.characters.replace(/\n/g, "").split("");
            let tempnode = tempnodeArr[0];
            // await loadFonts(tempnodeArr);
            yield loadFontsForNodes(tempnodeArr);
            tempnode.deleteCharacters(0, tempnode.characters.length);
            tempnode.textAutoResize = "WIDTH_AND_HEIGHT";
            var i = 0;
            do {
                tempnode.insertCharacters(0, charactersArr[i++]);
                yield Promise.resolve(); // Microtask delay for width update
            } while (i < charactersArr.length && tempnode.width <= node.width);
            const currentCount = tempnode.characters.length;
            tempnode.remove();
            figma.ui.postMessage({
                pluginMessage: { countable: true },
                currentCount,
            });
        }
    });
}
//__
figma.showUI(__html__, { width: 316, height: 200 });
checkCharacters(figma.currentPage.selection.filter((item) => {
    return item.type == "TEXT";
}));
figma.on("selectionchange", () => checkCharacters(figma.currentPage.selection.filter((item) => {
    return item.type == "TEXT";
})));
//triggers checkcharacters everytime selection changes
//must not use constants created below because the selection must not be a constant
figma.ui.onmessage = (msg) => {
    const selection = figma.currentPage.selection;
    const txtbx = selection.filter(function (item) {
        return item.type === "TEXT";
    });
    const nodesToResize = txtbx.filter(function (item) {
        return item.characters.length >= msg.characters;
    });
    //--
    if (msg.type === "change-length") {
        if (msg.characters === 0) {
            figma.notify("Sorry, but you can't set your average line length to zero characters");
            figma.closePlugin();
        }
        else if (txtbx.length === 0) {
            figma.notify("No text layers were selected!");
        }
        else if (txtbx.some((item) => item.hasMissingFont)) {
            figma.notify("Uh oh, can't work here. Looks like a font is missing!");
        }
        else if (nodesToResize.length === 0) {
            figma.notify("There aren't that many characters in the layers you selected");
        }
        else {
            loadFontsForNodes(nodesToResize).then(() => nodesToResize.forEach(function (item) {
                item.textAutoResize = "WIDTH_AND_HEIGHT";
                let temp = item.clone();
                temp.characters = item.characters.slice(0, msg.characters);
                let newWidth = temp.width;
                temp.remove();
                item.resize(newWidth, item.height);
                checkCharacters(nodesToResize);
            }));
        }
    }
};
// switch (nodesToResize.length) {
//   case 1:
//     figma.notify(nodesToResize.length + " layer was resized!");
//     break;
//   default:
//     figma.notify(nodesToResize.length + " layers were resized!");
// }
