const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf-8');
const s = `    const token = authHeader && authHeader.split(' ')[1]
        if (!token) {
      return res.status(401).json({ error: "Erişim reddedildi. Token bulunamadı." })
        try {
      const verified = jwt.verify(token, JWT_SECRET)
      (req as any).user = verified
      next()
     catch (err) {
      res.status(401).json({ error: "Geçersiz veya süresi dolmuş token." })`;
const r = `    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Erişim reddedildi. Token bulunamadı." });
    }
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      (req as any).user = verified;
      next();
    } catch (err) {
      res.status(401).json({ error: "Geçersiz veya süresi dolmuş token." });
    }`;
c = c.replace(s, r);

const s2 = `  app.get('/api/data', verifyToken, async (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = await fs.promises.readFile(DATA_FILE, 'utf-8')
        const parsed = JSON.parse(data)
       res.json(parsed)
     else {
       res.json({ projects: [], signatures: [], companies: [], serverSettings: { allowedFolders: [] } });
    }
    } catch (error) {
      console.error("Error reading data:", error);
      res.status(500).json({ error: "Veri okuma hatasi" });
    }
  });`;

const r2 = `  app.get('/api/data', verifyToken, async (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = await fs.promises.readFile(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        res.json(parsed);
      } else {
        res.json({ projects: [], signatures: [], companies: [], serverSettings: { allowedFolders: [] } });
      }
    } catch (error) {
      console.error("Error reading data:", error);
      res.status(500).json({ error: "Veri okuma hatasi" });
    }
  });`;
c = c.replace(s2, r2);
fs.writeFileSync('server.ts', c);
