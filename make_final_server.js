const fs = require('fs');

const serverStr = `import express from "express"
import path from "path"
import fs from "fs"
import jwt from "jsonwebtoken"
import { exec } from "child_process"

const JWT_SECRET = "procertify-super-secret-key-2024-static"

async function startServer() {
  const app = express()
  const PORT = process.env.PORT || 3000

  app.use(express.json({ limit: '200mb' }))
  
  const DATA_FILE = path.join(process.cwd(), 'data.json')
  const isProduction = process.env.NODE_ENV === "production"

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
      if (fs.existsSync(DATA_FILE)) {
        const data = await fs.promises.readFile(DATA_FILE, 'utf-8')
        const parsed = JSON.parse(data)
        res.json(parsed)
      } else {
        res.json({ projects: [], signatures: [], companies: [], serverSettings: {} })
      }
    } catch (error) {
      console.error("Error reading data:", error)
      res.status(500).json({ error: "Veri okuma hatasi" })
    }
  })

  app.post('/api/data', verifyToken, async (req, res) => {
    try {
      await fs.promises.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2))
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

  const sanitizePath = (name: string) => {
    return name.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\\-\\. _]/gi, '_')
  }

  app.get('/api/server-folders/browse', verifyToken, async (req, res) => {
    try {
      const dir = (req.query.dir as string) || ''
      const safeDir = dir.replace(/\\.\\./g, '')
      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive')
      const targetPath = path.join(rootDir, safeDir)
      
      if (!targetPath.startsWith(rootDir)) {
         return res.status(403).json({ error: "Geçersiz dizin erişimi" })
      }

      if (!fs.existsSync(targetPath)) {
          return res.json({ folders: [] })
      }

      const dirents = await fs.promises.readdir(targetPath, { withFileTypes: true })
      const folders = dirents
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

      res.json({ folders })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: "Klasörler okunamadı" })
    }
  })

  app.post('/api/server-folders/create', verifyToken, async (req, res) => {
    try {
      const { targetDir, newFolderName } = req.body
      if (!newFolderName) return res.status(400).json({ error: "Klasör adı gerekli" })
      
      const safeNewFolder = newFolderName.replace(/[^a-zA-Z0-9_ \\-]/g, '')
      if (!safeNewFolder) return res.status(400).json({ error: "Geçersiz klasör adı" })

      const safeTargetDir = (targetDir || '').replace(/\\.\\./g, '')
      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive')
      const targetPath = path.join(rootDir, safeTargetDir, safeNewFolder)

      if (!targetPath.startsWith(rootDir)) {
          return res.status(403).json({ error: "Geçersiz dizin erişimi" })
      }
      
      if (!fs.existsSync(targetPath)) {
          await fs.promises.mkdir(targetPath, { recursive: true })
      }
      
      res.json({ success: true, folderName: safeNewFolder })
    } catch (e) {
      res.status(500).json({ error: "Klasör oluşturulamadı" })
    }
  })

  app.post('/api/server-folders/save-file', verifyToken, async (req, res) => {
    try {
      const { targetDir, filename, fileBase64 } = req.body
      
      if (!filename || !fileBase64) {
          return res.status(400).json({ error: "Eksik parametre" })
      }

      const safeTargetDir = (targetDir || '').replace(/\\.\\./g, '')
      const rootDir = process.env.ARCHIVE_ROOT || path.join(process.cwd(), 'archive')
      const targetPath = path.join(rootDir, safeTargetDir)

      if (!targetPath.startsWith(rootDir)) {
          return res.status(403).json({ error: "Geçersiz dizin erişimi" })
      }

      if (!fs.existsSync(targetPath)) {
          await fs.promises.mkdir(targetPath, { recursive: true })
      }

      const safeFilename = sanitizePath(filename)
      const filePath = path.join(targetPath, safeFilename)

      const base64Data = fileBase64.replace(/^data:([A-Za-z-+/]+);base64,/, '')
      await fs.promises.writeFile(filePath, base64Data, 'base64')

      res.json({ success: true, savedPath: filePath })
    } catch (e: any) {
      console.error(e)
      res.status(500).json({ error: e.message || "Dosya kaydedilemedi" })
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

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite")
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(\`Sunucu http://0.0.0.0:\${PORT} adresinde çalışıyor\`)
  })
}

startServer()
`;
fs.writeFileSync('server.ts', serverStr);
