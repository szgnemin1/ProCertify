import express from "express"
import path from "path"
import fs from "fs"
import jwt from "jsonwebtoken"
import { exec } from "child_process"

const JWT_SECRET = "procertify-super-secret-key-2024-static"

async function startServer() {
  const app = express()
  const PORT = 3000

  app.use(express.json({ limit: '200mb' }))
  
  const DATA_FILE = path.join(process.cwd(), 'data.json')
  const CERT_FILE = path.join(process.cwd(), 'certificates.json')
  
  const isProduction = process.env.NODE_ENV === "production"

  // Helper functions for reading and writing JSON storage safely
  const readJsonFile = <T>(filePath: string, defaultValue: T): T => {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(content) as T
      }
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err)
    }
    return defaultValue
  }

  const writeJsonFile = (filePath: string, data: any): void => {
    try {
      const tempPath = `${filePath}.tmp`
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8')
      fs.renameSync(tempPath, filePath)
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err)
    }
  }

  // Ensure initial data files exist if not present
  if (!fs.existsSync(DATA_FILE)) {
    writeJsonFile(DATA_FILE, { projects: [], signatures: [], companies: [], serverSettings: {} })
  }
  if (!fs.existsSync(CERT_FILE)) {
    writeJsonFile(CERT_FILE, {})
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

  app.get('/api/data', async (req, res) => {
    try {
      const data = readJsonFile(DATA_FILE, { projects: [], signatures: [], companies: [], serverSettings: {} })
      res.json(data)
    } catch (error) {
      console.error("Error reading data:", error)
      res.status(500).json({ error: "Veri okuma hatasi" })
    }
  })

  app.post('/api/data', verifyToken, async (req, res) => {
    try {
      const { projects, signatures, companies, serverSettings } = req.body
      const current = readJsonFile<any>(DATA_FILE, { projects: [], signatures: [], companies: [], serverSettings: {} })
      if (projects !== undefined) current.projects = projects
      if (signatures !== undefined) current.signatures = signatures
      if (companies !== undefined) current.companies = companies
      if (serverSettings !== undefined) current.serverSettings = serverSettings
      writeJsonFile(DATA_FILE, current)
      res.json({ success: true })
    } catch (error) {
      console.error("Error writing data:", error)
      res.status(500).json({ error: "Veri kaydetme hatasi" })
    }
  })

  app.post('/api/login', (req, res) => {
    const { password } = req.body
    const data = readJsonFile<any>(DATA_FILE, { serverSettings: {} })
    const validPassword = data?.serverSettings?.adminPassword || "159357Vp!!"
    if (password === validPassword) {
      const token = jwt.sign({ user: "admin" }, JWT_SECRET, { expiresIn: "24h" })
      res.json({ success: true, token })
    } else {
      res.status(401).json({ success: false, error: "Hatali sifre" })
    }
  })

  app.post('/api/change-password', verifyToken, (req, res) => {
    try {
      const { newPassword } = req.body
      if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Lütfen geçerli bir şifre girin." })
      }
      const data = readJsonFile<any>(DATA_FILE, { projects: [], signatures: [], companies: [], serverSettings: {} })
      if (!data.serverSettings) data.serverSettings = {}
      data.serverSettings.adminPassword = newPassword.trim()
      writeJsonFile(DATA_FILE, data)
      res.json({ success: true, message: "Şifre başarıyla güncellendi!" })
    } catch (error) {
      console.error("Error changing password:", error)
      res.status(500).json({ success: false, error: "Şifre değiştirilirken hata oluştu." })
    }
  })

  app.get('/api/verify/:id', async (req, res) => {
    try {
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      const record = certs[req.params.id]
      if (record) {
        res.json(record)
      } else {
        res.status(404).json({ error: "Certificate not found" })
      }
    } catch (err) {
      res.status(500).json({ error: "Database error" })
    }
  })

  app.post('/api/issue', async (req, res) => {
    try {
      const records = req.body
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      if (Array.isArray(records)) {
        for (const r of records) {
          if (r && r.serialNo) {
            certs[r.serialNo] = r
          }
        }
      } else if (records && records.serialNo) {
        certs[records.serialNo] = records
      }
      writeJsonFile(CERT_FILE, certs)
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
