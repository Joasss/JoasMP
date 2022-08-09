const { app, BrowserWindow, webContents } = require('electron');
require('@electron/remote/main').initialize();

// Create the electron window.
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        heigth: 600,
        minWidth: 325,
        minHeight: 500,
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Vinyl_record.svg/2048px-Vinyl_record.svg.png',
        
        title: "JoasMP",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    require('@electron/remote/main').enable(win.webContents);

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
    app.quit();
});