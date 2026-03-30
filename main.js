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
    backgroundColor: '#0f172a', // Matches slate-900
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      webSecurity: false
    },
    autoHideMenuBar: true,
    frame: true
  });

  // 1. Load a temporary loading screen immediately
  const loadingHtml = `
    <html>
      <head>
        <style>
          body { background-color: #0f172a; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h2>Uygulama Başlatılıyor...</h2>
        <p>Sunucu bağlantısı kuruluyor, lütfen bekleyin.</p>
      </body>
    </html>
  `;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`);

  // 2. Start Server Logic
  const serverUrl = 'http://localhost:3000';
  let retryCount = 0;
  
  const loadServer = () => {
    // Try to fetch first to see if server is up, to avoid Electron load errors
    // But we can't fetch easily in main process without extra deps.
    // Just use loadURL.
    mainWindow.loadURL(serverUrl).then(() => {
      console.log('Server loaded successfully');
    }).catch(err => {
      console.log(`Server not ready (Attempt ${retryCount + 1})...`);
      retryCount++;
      if (retryCount > 30) { // 30 seconds timeout
          dialog.showErrorBox("Bağlantı Hatası", "Sunucuya bağlanılamadı. Lütfen uygulamayı yeniden başlatın.");
          return;
      }
      // Retry every 1 second
      setTimeout(loadServer, 1000);
    });
  };

  // Give the server a moment to spin up
  setTimeout(loadServer, 1500);
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

// 2. Save a specific file to disk (Optimized: Async)
ipcMain.handle('save-file', async (event, { folderPath, fileName, dataBuffer }) => {
  try {
    const fullPath = path.join(folderPath, fileName);
    await fs.promises.writeFile(fullPath, Buffer.from(dataBuffer));
    return { success: true, path: fullPath };
  } catch (error) {
    console.error("File save error:", error);
    return { success: false, error: error.message };
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // In production, start the server process
  if (app.isPackaged) {
    try {
      process.env.NODE_ENV = 'production'; // Force production
      const { startServer } = require('./server');
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'db.json');
      
      console.log("Starting internal server with DB:", dbPath);
      startServer(3000, dbPath);
    } catch (e) {
      console.error("Failed to start internal server:", e);
      dialog.showErrorBox("Başlatma Hatası", "Sunucu başlatılamadı: " + e.message);
    }
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});