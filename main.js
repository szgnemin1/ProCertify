const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: "ProCertify Studio",
    icon: path.join(__dirname, 'public/favicon.ico'), // Optional: Add an icon if you have one
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple apps, this allows easier communication
    },
    autoHideMenuBar: true // Hides the top menu bar for a cleaner app look
  });

  // Load the index.html of the app.
  // In production (EXE), we load the built React files.
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Open the DevTools. (Optional - comment out for production)
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});