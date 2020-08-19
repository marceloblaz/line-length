// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => {
  if (msg.type === "change-length") {
    //checa se o node é realmente de texto
    const selection = figma.currentPage.selection;
    function checktype(item) {
      return item.type === "TEXT";
    }
    const txtbx: Array<any> = selection.filter(checktype);
    //cria um array somente com os nodes de texto
    if (txtbx.length === 0) {
      figma.notify("No text layers were selected!");
      //checa se existe algum node que não possui fonte
    } else if (txtbx.every((item) => item.hasMissingFont)) {
      figma.notify("Uh oh, I can't work here. Looks like a font is missing!");
    } else if (
      txtbx.every((item) => item.characters.length <= msg.characters)
    ) {
      let notification =
        "All the text layers you selected were already shorter than " +
        msg.characters +
        " characters";
      figma.notify(notification);
    } else {
      //variável que armazena a substring do texto da layer
      const nodesToResize = txtbx.filter(function (item: TextNode) {
        return item.characters.length > msg.characters;
      });

      var lista = [];
      function insereNovo(objeto: any) {
        // pesquisa na lista algum objeto q tenha o mesmo nome da fonte e o mesmo estilo
        let resultado = lista.find(
          (item) =>
            item.fontName.family == objeto.fontName.family &&
            item.fontName.style == objeto.fontName.style
        );
        if (!resultado) {
          // se nao achou na lista
          lista.push(objeto);
        }
      }

      for (let i = 0; i < nodesToResize.length; i++) {
        insereNovo(nodesToResize[i]);
      }

      const uniqueFonts = lista;
      const promise = figma.loadFontAsync(uniqueFonts[0].fontName as FontName);
      Promise.all([promise]).then(() => {
        nodesToResize.forEach(function (item: TextNode) {
          let temp = item.clone();
          temp.characters = item.characters.substr(0, msg.characters);
          let newWidth = temp.width;
          temp.remove();
          item.resize(newWidth, item.height);
        });
      });
    }

    figma.viewport.scrollAndZoomIntoView(selection);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
