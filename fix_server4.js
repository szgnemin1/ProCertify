const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const s = `  const getServerSettings = () => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8')
        const parsed = JSON.parse(data)
        return parsed.serverSettings || { rootPath: 'D:\\\\Arsiv', allowedFolders: [] 
            catch(e) {}
    return { rootPath: 'D:\\\\Arsiv', allowedFolders: [] 
    
const sanitizePath = (name: string) => {
    return name.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\\-\\. _]/gi, '_')
    
app.get('/api/server-folders/available-roots', verifyToken, async (req, res) => {
      )`;
const r = `  const getServerSettings = () => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.serverSettings || { rootPath: 'D:\\\\Arsiv', allowedFolders: [] };
      }
    } catch(e) {}
    return { rootPath: 'D:\\\\Arsiv', allowedFolders: [] };
  }
    
  const sanitizePath = (name: string) => {
    return name.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\\-\\. _]/gi, '_');
  }
    
  app.get('/api/server-folders/available-roots', verifyToken, async (req, res) => {
      res.json({ folders: [] });
  });`;
content = content.replace(s, r);

const s2 = `  app.post('/api/update-app', verifyToken, (req, res) => {
    console.log("GitHub güncelleme tetiklendi...")
    const cmd = "git pull && npm run build"
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("Güncelleme hatası oluştu:", error)
        return res.status(500).json({
          success: false,
          error: error.message,
          stdout: stdout || "",
          stderr: stderr || ""
        )
      
      
      res.json({
        success: true,
        stdout: stdout || "",
        stderr: stderr || "",
        message: "Uygulama başarıyla güncellendi ve derlendi! Sunucu PM2 tarafından yeniden başlatılıyor..."
      )
      
      // Since PM2 manages this, process.exit(0) will trigger an automatic clean reload
      setTimeout(() => {
        console.log("PM2 tetiklemesi için çıkış yapılıyor...")
        process.exit(0)
      , 1500)
    )
  )`;

const r2 = `  app.post('/api/update-app', verifyToken, (req, res) => {
    console.log("GitHub güncelleme tetiklendi...")
    const cmd = "git pull && npm run build"
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("Güncelleme hatası oluştu:", error)
        return res.status(500).json({
          success: false,
          error: error.message,
          stdout: stdout || "",
          stderr: stderr || ""
        });
      }
      
      res.json({
        success: true,
        stdout: stdout || "",
        stderr: stderr || "",
        message: "Uygulama başarıyla güncellendi ve derlendi! Sunucu PM2 tarafından yeniden başlatılıyor..."
      });
      
      // Since PM2 manages this, process.exit(0) will trigger an automatic clean reload
      setTimeout(() => {
        console.log("PM2 tetiklemesi için çıkış yapılıyor...")
        process.exit(0)
      }, 1500);
    });
  });`;

content = content.replace(s2, r2);

const s3 = `  // Serve static files in production or map vite middleware in dev
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite")
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    )
    app.use(vite.middlewares)
   else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    )
  
  // Bind to 0.0.0.0
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(\`Sunucu http://0.0.0.0:\${PORT adresinde çalışıyor\`)
  )
startServer()

  app.get('/api/server-folders/browse', verifyToken, async (req, res) => {
    try {
      const dir = (req.query.dir as string) || ''`;

const r3 = `  // Serve static files in production or map vite middleware in dev
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  // Bind to 0.0.0.0
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(\`Sunucu http://0.0.0.0:\${PORT} adresinde çalışıyor\`);
  });
}

  app.get('/api/server-folders/browse', verifyToken, async (req, res) => {
    try {
      const dir = (req.query.dir as string) || '';`;
content = content.replace(s3, r3);

fs.writeFileSync('server.ts', content);
