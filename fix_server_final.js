const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf-8');

const s = `  app.post('/api/server-folders/create', verifyToken, async (req, res) => {
    try {
      const { allowedFolder, newFolderName } = req.body;
      if (!allowedFolder || !newFolderName) return res.status(400).json({ error: "Eksik parametre" });
      
      const safeNewFolder = newFolderName.replace(/[^a-zA-Z0-9_ \\-]/g, '');
      if (!safeNewFolder) return res.status(400).json({ error: "Geçersiz klasör adı" });

      const settings = getServerSettings();
      if (!settings.allowedFolders.includes(allowedFolder)) {
          return res.status(403).json({ error: "Bu ana klasöre yazma izni yok" });
      }

      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive');
      const targetPath = path.join(rootDir, sanitizePath(allowedFolder), safeNewFolder);

      if (!fs.existsSync(targetPath)) {
          await fs.promises.mkdir(targetPath, { recursive: true });
      }
      
      res.json({ success: true, folderName: safeNewFolder });
    } catch (e) {
      res.status(500).json({ error: "Klasör oluşturulamadı" });
    }
  });`;

const r = `  app.get('/api/server-folders/browse', verifyToken, async (req, res) => {
    try {
      const dir = (req.query.dir as string) || '';
      
      // Basic protection against directory traversal
      const safeDir = dir.replace(/\\.\\./g, '');
      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive');
      
      const targetPath = path.join(rootDir, safeDir);
      
      // Ensure target path is still within root
      if (!targetPath.startsWith(rootDir)) {
         return res.status(403).json({ error: "Geçersiz dizin erişimi" });
      }

      if (!fs.existsSync(targetPath)) {
          // If it doesn't exist, we just return empty
          return res.json({ folders: [] });
      }

      const dirents = await fs.promises.readdir(targetPath, { withFileTypes: true });
      const folders = dirents
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

      res.json({ folders });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Klasörler okunamadı" });
    }
  });

  app.post('/api/server-folders/create', verifyToken, async (req, res) => {
    try {
      const { targetDir, newFolderName } = req.body;
      if (!newFolderName) return res.status(400).json({ error: "Klasör adı gerekli" });
      
      const safeNewFolder = newFolderName.replace(/[^a-zA-Z0-9_ \\-]/g, '');
      if (!safeNewFolder) return res.status(400).json({ error: "Geçersiz klasör adı" });

      const safeTargetDir = (targetDir || '').replace(/\\.\\./g, '');
      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive');
      const targetPath = path.join(rootDir, safeTargetDir, safeNewFolder);

      if (!targetPath.startsWith(rootDir)) {
          return res.status(403).json({ error: "Geçersiz dizin erişimi" });
      }
      
      if (!fs.existsSync(targetPath)) {
          await fs.promises.mkdir(targetPath, { recursive: true });
      }
      
      res.json({ success: true, folderName: safeNewFolder });
    } catch (e) {
      res.status(500).json({ error: "Klasör oluşturulamadı" });
    }
  });`;

c = c.replace(s, r);

const s2 = `  app.post('/api/server-folders/save-file', verifyToken, async (req, res) => {
    try {
      const { allowedFolder, subFolder, filename, fileBase64 } = req.body;
      
      if (!allowedFolder || !filename || !fileBase64) {
          return res.status(400).json({ error: "Eksik parametre" });
      }

      const settings = getServerSettings();
      if (!settings.allowedFolders.includes(allowedFolder)) {
          return res.status(403).json({ error: "Bu ana klasöre yazma izni yok" });
      }

      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive');
      
      // Klasör hiyerarşisi oluştur
      let targetDir = path.join(rootDir, sanitizePath(allowedFolder));
      if (subFolder) {
          targetDir = path.join(targetDir, sanitizePath(subFolder));
      }

      if (!fs.existsSync(targetDir)) {
          await fs.promises.mkdir(targetDir, { recursive: true });
      }

      const safeFilename = sanitizePath(filename);
      const filePath = path.join(targetDir, safeFilename);

      const base64Data = fileBase64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      await fs.promises.writeFile(filePath, base64Data, 'base64');

      res.json({ success: true, savedPath: filePath });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Dosya kaydedilemedi" });
    }
  });`;

const r2 = `  app.post('/api/server-folders/save-file', verifyToken, async (req, res) => {
    try {
      const { targetDir, filename, fileBase64 } = req.body;
      
      if (!filename || !fileBase64) {
          return res.status(400).json({ error: "Eksik parametre" });
      }

      const safeTargetDir = (targetDir || '').replace(/\\.\\./g, '');
      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive');
      const targetPath = path.join(rootDir, safeTargetDir);

      if (!targetPath.startsWith(rootDir)) {
          return res.status(403).json({ error: "Geçersiz dizin erişimi" });
      }

      if (!fs.existsSync(targetPath)) {
          await fs.promises.mkdir(targetPath, { recursive: true });
      }

      const safeFilename = sanitizePath(filename);
      const filePath = path.join(targetPath, safeFilename);

      const base64Data = fileBase64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      await fs.promises.writeFile(filePath, base64Data, 'base64');

      res.json({ success: true, savedPath: filePath });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Dosya kaydedilemedi" });
    }
  });`;
  
c = c.replace(s2, r2);
fs.writeFileSync('server.ts', c);
