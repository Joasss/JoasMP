const { app, BrowserWindow, webContents } = require('electron');
require('@electron/remote/main').initialize();

// Create the electron window.
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        heigth: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    require('@electron/remote/main').enable(win.webContents);

    win.webContents.openDevTools();
    win.loadFile('src/index.html');

    require('@electron/remote/main').enable(win.webContents);
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