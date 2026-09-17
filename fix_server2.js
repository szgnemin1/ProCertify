const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const s = `    const dogrulaPath = isProd 
      ? path.join(process.cwd(), 'dist', 'dogrula.html')
      : path.join(process.cwd(), 'public', 'dogrula.html')
    
    if (fs.existsSync(dogrulaPath)) {
       res.sendFile(dogrulaPath)
     else {
       res.status(404).send("Dogrulama sayfasi bulunamadi.")
      )

  app.get('/api/verify/:id', (req, res) => {
    const certPath = path.join(process.cwd(), 'certificates.json')
    if (!fs.existsSync(certPath)) {
       return res.status(404).json({ error: "No certificates found" )
    
    const data = JSON.parse(fs.readFileSync(certPath, 'utf8'))
    const cert = data[req.params.id]
    if (cert) {
        res.json(cert)
     else {
        res.status(404).json({ error: "Certificate not found" )
      )`;
      
const r = `    const dogrulaPath = isProd 
      ? path.join(process.cwd(), 'dist', 'dogrula.html')
      : path.join(process.cwd(), 'public', 'dogrula.html');
    
    if (fs.existsSync(dogrulaPath)) {
       res.sendFile(dogrulaPath);
    } else {
       res.status(404).send("Dogrulama sayfasi bulunamadi.");
    }
  });

  app.get('/api/verify/:id', (req, res) => {
    const certPath = path.join(process.cwd(), 'certificates.json');
    if (!fs.existsSync(certPath)) {
       return res.status(404).json({ error: "No certificates found" });
    }
    
    const data = JSON.parse(fs.readFileSync(certPath, 'utf8'));
    const cert = data[req.params.id];
    if (cert) {
        res.json(cert);
    } else {
        res.status(404).json({ error: "Certificate not found" });
    }
  });`;

content = content.replace(s, r);

// One more fix for bracket at line 46
content = content.replace(`    const parsed = JSON.parse(data)
       res.json(parsed)
     else {
       res.json({ projects: [, signatures: [, companies: [, serverSettings: { allowedFolders: [ } )
      catch (error) {
      console.error("Error reading data:", error)
      res.status(500).json({ error: "Veri okuma hatasi" })
      )`, `    const parsed = JSON.parse(data);
       res.json(parsed);
    } else {
       res.json({ projects: [], signatures: [], companies: [], serverSettings: { allowedFolders: [] } });
    }
    } catch (error) {
      console.error("Error reading data:", error);
      res.status(500).json({ error: "Veri okuma hatasi" });
    }`);
    
// Replace weird array syntax
content = content.replace(`{ projects: [, signatures: [, companies: [, serverSettings: { allowedFolders: [ } )`, `{ projects: [], signatures: [], companies: [], serverSettings: { allowedFolders: [] } });`);

// App.post(/api/data)
content = content.replace(`  app.post('/api/data', verifyToken, async (req, res) => {
    try {
      await fs.promises.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2))
      res.json({ success: true )
     catch (error) {
      console.error("Error writing data:", error)
      res.status(500).json({ error: "Veri kaydetme hatasi" })
      )`, `  app.post('/api/data', verifyToken, async (req, res) => {
    try {
      await fs.promises.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error("Error writing data:", error);
      res.status(500).json({ error: "Veri kaydetme hatasi" });
    }
  });`);

fs.writeFileSync('server.ts', content);
