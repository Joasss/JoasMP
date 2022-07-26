const { app, BrowserWindow, ipcMain, dialog, ipcRenderer } = require('electron');

// Create the electron window.
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        heigth: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.webContents.openDevTools();
    win.loadFile('index.html');
}

// Create the window when the app starts.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
});

// Close the app when all windows are closed.
app.on('window-all-closed', () => {
    if (window.process !== 'darwin') app.quit();
});

ipcMain.on('select-file', event => {
    dialog.showOpenDialog({ 
        properties: ['openFile', 'multiSelections'],
        title: "Select a song to play",
        filters: [
            { name: "Songs", extensions: ['mp3'] }
        ]
    }).then(file => {
        if (file.canceled === true) ipcMain.send('file', 'No file returned.');
        console.log(file)
    })
    console.log("Recieved request to open file dialog.");
})