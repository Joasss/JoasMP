const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Create the electron window.
const createWindow = () => {
    const win =  new BrowserWindow({
        width: 800,
        heigth: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    ipcMain.handle('ping', () => 'pong!');
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
})