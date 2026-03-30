const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const DEFAULT_PORT = 3000;

function createAppServer(dataPath) {
  const app = express();
  const DATA_FILE = dataPath || path.join(__dirname, 'db.json');

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // Ensure db.json exists
  async function initDb() {
    try {
      await fs.access(DATA_FILE);
    } catch {
      const initialData = {
        projects: [],
        companies: [],
        signatures: []
      };
      await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
  }

  // API Routes
  app.get('/api/data', async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: 'Failed to read data' });
    }
  });

  app.post('/api/data', async (req, res) => {
    try {
      const newData = req.body;
      const currentFile = await fs.readFile(DATA_FILE, 'utf-8');
      const currentData = JSON.parse(currentFile);
      
      const updatedData = { ...currentData, ...newData };
      
      await fs.writeFile(DATA_FILE, JSON.stringify(updatedData, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save data' });
    }
  });

  // Vite Integration (only in dev mode when run directly)
  if (process.env.NODE_ENV !== 'production' && require.main === module) {
    import('vite').then(viteModule => {
      viteModule.createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then(vite => {
        app.use(vite.middlewares);
      }).catch(err => console.error('Vite failed to start:', err));
    }).catch(err => console.error('Failed to import vite:', err));
  } else {
    // Serve static files in production
    // In Electron packaged app, we need to be careful about paths.
    let distPath = path.join(__dirname, 'dist');
    
    // Robust path finding for Electron
    const fsSync = require('fs');
    
    // 1. Check relative to __dirname (standard)
    if (!fsSync.existsSync(distPath)) {
        console.log(`Dist not found at ${distPath}, trying alternatives...`);
        
        // 2. Check in resources path (if unpacked)
        if (process.resourcesPath) {
            const resourcesDist = path.join(process.resourcesPath, 'dist');
            if (fsSync.existsSync(resourcesDist)) {
                distPath = resourcesDist;
            }
        }
    }
    
    // 3. Last resort: Check current working directory
    if (!fsSync.existsSync(distPath)) {
        const cwdDist = path.join(process.cwd(), 'dist');
        if (fsSync.existsSync(cwdDist)) {
            distPath = cwdDist;
        }
    }

    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    
    // Fallback for SPA - matches any GET request not handled above
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return { app, initDb };
}

function startServer(port = DEFAULT_PORT, dataPath = null) {
  const { app, initDb } = createAppServer(dataPath);
  
  initDb().then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${port}`);
      
      // Log LAN IP addresses
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`  LAN Access: http://${iface.address}:${port}`);
          }
        }
      }
    });
  });
}

if (require.main === module) {
  const dataPath = process.env.DB_PATH || path.join(__dirname, 'db.json');
  startServer(process.env.PORT || 3000, dataPath);
}

module.exports = { startServer };
