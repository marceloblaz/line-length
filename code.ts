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
    //cria um array somente com os nodes de texto
    const txtbx: Array<any> = selection.filter(checktype);
    if (txtbx.length === 0) {
      figma.notify("No text layers were selected!");
      //checa se existe algum node que não possui fonte
    } else if (txtbx.every((item) => item.hasMissingFont != false)) {
      figma.notify("Uh oh, I can't work here. Looks like a font is missing!");
    } else if (
      txtbx.every((item) => item.characters.length <= msg.characters)
    ) {
      const notification =
        "That selection is already shorter than " +
        msg.characters +
        " characters";
      figma.notify(notification);
    } else {
      //variável que armazena a substring do texto da layer
      figma.loadFontAsync({ family: "Roboto", style: "Regular" });

      var substr = txtbx[0].characters.substring(0, msg.characters);
      const temp = figma.createText();
      temp.characters = substr;
    }

    figma.viewport.scrollAndZoomIntoView(selection);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
