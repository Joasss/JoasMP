const { ipcRenderer, ipcMain } = require('electron');

document.getElementById('select').onclick = () => {
  ipcRenderer.send('select-file')
}