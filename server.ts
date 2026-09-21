import express from "express"
import path from "path"
import fs from "fs"
import jwt from "jsonwebtoken"
import { exec } from "child_process"
import Database from "better-sqlite3"

const JWT_SECRET = "procertify-super-secret-key-2024-static"

async function startServer() {
  const app = express()
  const PORT = 3000

  app.use(express.json({ limit: '200mb' }))
  
  const DB_FILE = path.join(process.cwd(), 'database.sqlite')
  const OLD_DATA_FILE = path.join(process.cwd(), 'data.json')
  const OLD_CERT_FILE = path.join(process.cwd(), 'certificates.json')
  
  const isProduction = process.env.NODE_ENV === "production"

  // Initialize SQLite Database
  const db = new Database(DB_FILE)

  db.exec(`
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS certificates (
      serialNo TEXT PRIMARY KEY,
      record TEXT
    );
  `)

  // Migrate JSON to SQLite if necessary
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM store').get() as {count: number}
    if (row.count === 0 && fs.existsSync(OLD_DATA_FILE)) {
       console.log("Migrating data.json to SQLite...")
       const data = JSON.parse(await fs.promises.readFile(OLD_DATA_FILE, 'utf-8'))
       const stmt = db.prepare('INSERT INTO store (key, value) VALUES (?, ?)')
       if (data.projects) stmt.run('projects', JSON.stringify(data.projects))
       if (data.signatures) stmt.run('signatures', JSON.stringify(data.signatures))
       if (data.companies) stmt.run('companies', JSON.stringify(data.companies))
       if (data.serverSettings) stmt.run('serverSettings', JSON.stringify(data.serverSettings))
       console.log("data.json migrated successfully.")
       fs.renameSync(OLD_DATA_FILE, OLD_DATA_FILE + '.backup')
    }

    const certRow = db.prepare('SELECT COUNT(*) as count FROM certificates').get() as {count: number}
    if (certRow.count === 0 && fs.existsSync(OLD_CERT_FILE)) {
       console.log("Migrating certificates.json to SQLite...")
       const certs = JSON.parse(await fs.promises.readFile(OLD_CERT_FILE, 'utf-8'))
       const stmt = db.prepare('INSERT INTO certificates (serialNo, record) VALUES (?, ?)')
       for (const serialNo of Object.keys(certs)) {
          stmt.run(serialNo, JSON.stringify(certs[serialNo]))
       }
       console.log("certificates.json migrated successfully.")
       fs.renameSync(OLD_CERT_FILE, OLD_CERT_FILE + '.backup')
    }
  } catch (err) {
    console.error("Migration error:", err)
  }

  const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: "Erişim reddedildi. Token bulunamadı." })
    }
    
    try {
      const verified = jwt.verify(token, JWT_SECRET)
      ;(req as any).user = verified
      next()
    } catch (err) {
      res.status(401).json({ error: "Geçersiz veya süresi dolmuş token." })
    }
  }

  app.get('/api/data', verifyToken, async (req, res) => {
    try {
      const rows = db.prepare('SELECT key, value FROM store').all() as {key: string, value: string}[]
      const data: any = { projects: [], signatures: [], companies: [], serverSettings: {} }
      rows.forEach(row => {
         data[row.key] = JSON.parse(row.value)
      })
      res.json(data)
    } catch (error) {
      console.error("Error reading data:", error)
      res.status(500).json({ error: "Veri okuma hatasi" })
    }
  })

  app.post('/api/data', verifyToken, async (req, res) => {
    try {
      const { projects, signatures, companies, serverSettings } = req.body
      const stmt = db.prepare('INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)')
      if (projects) stmt.run('projects', JSON.stringify(projects))
      if (signatures) stmt.run('signatures', JSON.stringify(signatures))
      if (companies) stmt.run('companies', JSON.stringify(companies))
      if (serverSettings) stmt.run('serverSettings', JSON.stringify(serverSettings))
      res.json({ success: true })
    } catch (error) {
      console.error("Error writing data:", error)
      res.status(500).json({ error: "Veri kaydetme hatasi" })
    }
  })

  app.post('/api/login', (req, res) => {
    const { password } = req.body
    if (password === "159357Vp!!") {
      const token = jwt.sign({ user: "admin" }, JWT_SECRET, { expiresIn: "24h" })
      res.json({ success: true, token })
    } else {
      res.status(401).json({ success: false, error: "Hatali sifre" })
    }
  })

  app.get('/api/verify/:id', async (req, res) => {
    try {
      const cert = db.prepare('SELECT record FROM certificates WHERE serialNo = ?').get(req.params.id) as {record: string} | undefined
      if (cert && cert.record) {
         res.json(JSON.parse(cert.record))
      } else {
         res.status(404).json({ error: "Certificate not found" })
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" })
    }
  })

  app.post('/api/issue', verifyToken, async (req, res) => {
    try {
      const records = req.body
      const stmt = db.prepare('INSERT OR REPLACE INTO certificates (serialNo, record) VALUES (?, ?)')
      if (Array.isArray(records)) {
         for (const r of records) {
            stmt.run(r.serialNo, JSON.stringify(r))
         }
      } else {
         stmt.run(records.serialNo, JSON.stringify(records))
      }
      res.json({ success: true })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: "Failed to issue certificates" })
    }
  })

  app.post('/api/update-app', verifyToken, (req, res) => {
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
        })
      }
      
      res.json({
        success: true,
        stdout: stdout || "",
        stderr: stderr || "",
        message: "Uygulama başarıyla güncellendi ve derlendi! Sunucu PM2 tarafından yeniden başlatılıyor..."
      })
      
      setTimeout(() => {
        console.log("PM2 tetiklemesi için çıkış yapılıyor...")
        process.exit(0)
      }, 1500)
    })
  })

  const dogrulaPath = isProduction 
      ? path.join(process.cwd(), 'dist', 'dogrula.html')
      : path.join(process.cwd(), 'public', 'dogrula.html')

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite")
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    })
    
    // Custom middleware to intercept /dogrula to send dogrula.html
    app.use('/dogrula', (req, res) => {
        if (fs.existsSync(dogrulaPath)) {
            res.sendFile(dogrulaPath)
        } else {
            res.status(404).send("Dogrulama sayfasi bulunamadi.")
        }
    })

    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    
    app.get('/dogrula', (req, res) => {
      if (fs.existsSync(dogrulaPath)) {
         res.sendFile(dogrulaPath)
      } else {
         res.status(404).send("Dogrulama sayfasi bulunamadi.")
      }
    })

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Sunucu http://0.0.0.0:${PORT} adresinde çalışıyor`)
  })
}

startServer()
