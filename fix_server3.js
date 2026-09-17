const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const s = `      if (fs.existsSync(certPath)) {
         data = JSON.parse(fs.readFileSync(certPath, 'utf8'))
      
      if (Array.isArray(records)) {
          records.forEach(r => {
             data[r.serialNo] = r
          )
       else {
          data[records.serialNo] = records
      
      fs.writeFileSync(certPath, JSON.stringify(data, null, 2), 'utf8')
      res.json({ success: true )
     catch (e) {
      console.error(e)
      res.status(500).json({ error: "Failed to issue certificates" )
      )`;
const r = `      if (fs.existsSync(certPath)) {
         data = JSON.parse(fs.readFileSync(certPath, 'utf8'));
      }
      
      if (Array.isArray(records)) {
          records.forEach(r => {
             data[r.serialNo] = r;
          });
      } else {
          data[records.serialNo] = records;
      }
      
      fs.writeFileSync(certPath, JSON.stringify(data, null, 2), 'utf8');
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to issue certificates" });
    }
  });`;

content = content.replace(s, r);

const s2 = `  app.post('/api/server-folders/create', verifyToken, async (req, res) => {
    try {
      const { targetDir, newFolderName } = req.body
      if (!newFolderName) return res.status(400).json({ error: "Klasör adı gerekli" )
      
      const safeNewFolder = newFolderName.replace(/[^a-zA-Z0-9_ -]/g, '')
      if (!safeNewFolder) return res.status(400).json({ error: "Geçersiz klasör adı" )

      const safeTargetDir = (targetDir || '').replace(/\\.\\./g, '')
      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive')
      const targetPath = path.join(rootDir, safeTargetDir, safeNewFolder)

      if (!targetPath.startsWith(rootDir)) {
          return res.status(403).json({ error: "Geçersiz dizin erişimi" )
      
      if (!fs.existsSync(targetPath)) {
          await fs.promises.mkdir(targetPath, { recursive: true })
      
      res.json({ success: true, folderName: safeNewFolder )
     catch (e) {
      res.status(500).json({ error: "Klasör oluşturulamadı" )
      )`;

const r2 = `  app.post('/api/server-folders/create', verifyToken, async (req, res) => {
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
content = content.replace(s2, r2);

fs.writeFileSync('server.ts', content);
