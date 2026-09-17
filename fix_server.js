const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

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

content = content.replace(s, r);
fs.writeFileSync('server.ts', content);
