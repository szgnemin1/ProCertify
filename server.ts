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

  // --- SERVER FOLDER & STORAGE MANAGEMENT ---
  const getServerRootPath = (): string => {
    const data = readJsonFile<any>(DATA_FILE, { serverSettings: {} })
    const configuredPath = data?.serverSettings?.rootPath
    if (configuredPath && typeof configuredPath === 'string' && configuredPath.trim().length > 0) {
      const resolved = path.resolve(configuredPath.trim())
      if (!fs.existsSync(resolved)) {
        try { fs.mkdirSync(resolved, { recursive: true }) } catch (e) { /* ignore */ }
      }
      return resolved
    }
    const defaultArchive = path.join(process.cwd(), 'archive')
    if (!fs.existsSync(defaultArchive)) {
      try { fs.mkdirSync(defaultArchive, { recursive: true }) } catch (e) { /* ignore */ }
    }
    return defaultArchive
  }

  const sanitizePath = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\-\. _]/g, '_')
  }

  const isSafeSubPath = (baseDir: string, targetPath: string): boolean => {
    const resolvedBase = path.resolve(baseDir)
    const resolvedTarget = path.resolve(targetPath)
    return resolvedTarget === resolvedBase || (resolvedTarget.startsWith(resolvedBase + path.sep) && !resolvedTarget.includes('..'))
  }

  app.get('/api/server-folders/available-roots', verifyToken, async (req, res) => {
    try {
      const rootPath = getServerRootPath()
      res.json({ rootPath, exists: fs.existsSync(rootPath) })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.get('/api/server-folders/browse', verifyToken, async (req, res) => {
    try {
      const reqDir = (req.query.dir as string) || ''
      const rootPath = getServerRootPath()
      const targetPath = path.resolve(rootPath, reqDir)

      if (!isSafeSubPath(rootPath, targetPath)) {
        return res.status(403).json({ error: "Geçersiz veya yetkisiz dizin yolu." })
      }

      if (!fs.existsSync(targetPath)) {
        return res.json({ folders: [] })
      }

      const items = await fs.promises.readdir(targetPath, { withFileTypes: true })
      const folders = items.filter(item => item.isDirectory()).map(item => item.name)
      res.json({ folders, currentPath: path.relative(rootPath, targetPath) })
    } catch (error: any) {
      console.error("Browse error:", error)
      res.status(500).json({ error: error.message })
    }
  })

  app.post('/api/server-folders/create', verifyToken, async (req, res) => {
    try {
      const { targetDir, newFolderName } = req.body
      if (!newFolderName || typeof newFolderName !== 'string' || !newFolderName.trim()) {
        return res.status(400).json({ error: "Klasör ismi boş olamaz." })
      }

      const rootPath = getServerRootPath()
      const sanitized = sanitizePath(newFolderName.trim())
      const targetDirResolved = path.resolve(rootPath, targetDir || '')

      if (!isSafeSubPath(rootPath, targetDirResolved)) {
        return res.status(403).json({ error: "Yetkisiz dizin yolu." })
      }

      const fullNewFolderPath = path.join(targetDirResolved, sanitized)
      if (!isSafeSubPath(rootPath, fullNewFolderPath)) {
        return res.status(403).json({ error: "Geçersiz klasör konumu." })
      }

      if (fs.existsSync(fullNewFolderPath)) {
        return res.status(400).json({ error: "Bu isimde bir klasör zaten mevcut." })
      }

      await fs.promises.mkdir(fullNewFolderPath, { recursive: true })
      res.json({ success: true, folderName: sanitized })
    } catch (error: any) {
      console.error("Folder create error:", error)
      res.status(500).json({ error: error.message })
    }
  })

  app.post('/api/server-folders/save-file', verifyToken, async (req, res) => {
    try {
      const { targetDir, filename, fileBase64 } = req.body
      if (!filename || !fileBase64) {
        return res.status(400).json({ error: "Dosya adı ve içeriği gereklidir." })
      }

      const rootPath = getServerRootPath()
      const safeFilename = sanitizePath(filename)
      const targetDirResolved = path.resolve(rootPath, targetDir || '')

      if (!isSafeSubPath(rootPath, targetDirResolved)) {
        return res.status(403).json({ error: "Yetkisiz dizin yolu." })
      }

      if (!fs.existsSync(targetDirResolved)) {
        await fs.promises.mkdir(targetDirResolved, { recursive: true })
      }

      const base64Data = fileBase64.replace(/^data:(.*,)?/, "")
      const buffer = Buffer.from(base64Data, 'base64')

      let finalFilename = safeFilename
      let finalPath = path.join(targetDirResolved, finalFilename)
      let counter = 1
      const extMatch = safeFilename.match(/(\.[^.]+)$/)
      const ext = extMatch ? extMatch[1] : ''
      const baseName = extMatch ? safeFilename.substring(0, safeFilename.length - ext.length) : safeFilename

      while (fs.existsSync(finalPath)) {
        finalFilename = `${baseName}_${counter}${ext}`
        finalPath = path.join(targetDirResolved, finalFilename)
        counter++
      }

      await fs.promises.writeFile(finalPath, buffer)
      res.json({ success: true, savedPath: finalPath, filename: finalFilename })
    } catch (error: any) {
      console.error("File save error:", error)
      res.status(500).json({ error: error.message })
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
      appType: "custom",
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

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
      } catch (e) {
        vite.ssrFixStacktrace(e as Error)
        next(e)
      }
    })
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
