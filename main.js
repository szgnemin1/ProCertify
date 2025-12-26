const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "ProCertify Studio",
    icon: path.join(__dirname, 'public/favicon.ico'), 
    backgroundColor: '#0f172a', // Matches slate-900 to prevent white flash
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      webSecurity: false // Sometimes needed for local file loading issues in some environments
    },
    autoHideMenuBar: true, // Hides the top menu bar for a cleaner app look
    frame: true // Keep native frame for standard window controls
  });

  // Load the app
  // In dev, usually you'd load localhost, but the script provided builds first.
  // We will prioritize loading the built file.
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Open the DevTools only in development mode if needed
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }
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