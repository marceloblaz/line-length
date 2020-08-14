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
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "change-length") {
    const selection = figma.currentPage.selection;
    var txtobject:SceneNode;
    function checktype(txtobject) {
      return txtobject.type == "TEXT";
    }
    const txtbxs = selection.filter(checktype);
    if (txtbxs.length === 0) {
      figma.notify("No text layers were selected!");
      return;
    } else {
      //funcao para capturar a length do objeto
      function getlength(txtobject){
        return txtobject.name.length
      }
      //criando um novo array com as lengths dos objetos
       const temp = txtbxs.map(getlength);
      //verifica se a selecao tem qtd menor ou igual ao inputado pelo usuário
       if (temp.every(function a (item:number){return item <= msg.characters})){
         const notification = "That selection is already shorter than " + msg.characters + " characters";
         figma.notify(notification);
       }
       
      figma.viewport.scrollAndZoomIntoView(selection);
    }
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
