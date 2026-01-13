const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

// --- IPC HANDLERS FOR FILE SYSTEM ACCESS ---

// 1. Let user select a folder
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Klasörü Seç ve Kaydet'
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// 2. Save a specific file to disk
ipcMain.handle('save-file', async (event, { folderPath, fileName, dataBuffer }) => {
  try {
    const fullPath = path.join(folderPath, fileName);
    fs.writeFileSync(fullPath, Buffer.from(dataBuffer));
    return { success: true, path: fullPath };
  } catch (error) {
    console.error("File save error:", error);
    return { success: false, error: error.message };
  }
});

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