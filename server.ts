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
  const CERTS_DIR = path.join(process.cwd(), 'storage', 'certs')

  if (!fs.existsSync(CERTS_DIR)) {
    try { fs.mkdirSync(CERTS_DIR, { recursive: true }) } catch (e) { /* ignore */ }
  }
  
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
    writeJsonFile(DATA_FILE, { projects: [], signatures: [], companies: [], users: [], serverSettings: {} })
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

  const optionalToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token) {
      try {
        const verified = jwt.verify(token, JWT_SECRET)
        ;(req as any).user = verified
      } catch (err) { /* ignore optional */ }
    }
    next()
  }

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Bu işlem için yönetici yetkisi gereklidir." })
    }
    next()
  }

  app.get('/api/data', async (req, res) => {
    try {
      const data = readJsonFile<any>(DATA_FILE, { projects: [], signatures: [], companies: [], users: [], serverSettings: {} })
      const safeData = {
        ...data,
        users: (data.users || []).map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role || 'user',
          createdAt: u.createdAt
        }))
      }
      res.json(safeData)
    } catch (error) {
      console.error("Error reading data:", error)
      res.status(500).json({ error: "Veri okuma hatasi" })
    }
  })

  app.post('/api/data', verifyToken, async (req, res) => {
    try {
      const { projects, signatures, companies, serverSettings } = req.body
      const current = readJsonFile<any>(DATA_FILE, { projects: [], signatures: [], companies: [], users: [], serverSettings: {} })
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
    const { username, password } = req.body
    const data = readJsonFile<any>(DATA_FILE, { serverSettings: {}, users: [] })
    const validPassword = data?.serverSettings?.adminPassword || "159357Vp!!"

    // 1. Admin login check (either username is 'admin' or no username provided and password matches admin password)
    const isAdminAttempt = !username || username.trim().toLowerCase() === 'admin'
    if (isAdminAttempt && password === validPassword) {
      const userPayload = { id: 'admin', username: 'admin', role: 'admin', name: 'Sistem Yöneticisi' }
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "24h" })
      return res.json({ success: true, token, user: userPayload })
    }

    // 2. User login check
    if (username) {
      const cleanUser = username.trim().toLowerCase()
      const users: any[] = data.users || []
      const found = users.find(u => u.username && u.username.trim().toLowerCase() === cleanUser)
      if (found && found.password === password) {
        const userPayload = {
          id: found.id,
          username: found.username,
          role: found.role || 'user',
          name: found.name || found.username
        }
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "24h" })
        return res.json({ success: true, token, user: userPayload })
      }
    }

    return res.status(401).json({ success: false, error: "Hatalı kullanıcı adı veya şifre." })
  })

  // --- USER MANAGEMENT (ADMIN ONLY) ---
  app.get('/api/users', verifyToken, requireAdmin, (req, res) => {
    try {
      const data = readJsonFile<any>(DATA_FILE, { users: [] })
      const safeUsers = (data.users || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role || 'user',
        createdAt: u.createdAt
      }))
      res.json(safeUsers)
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  app.post('/api/users', verifyToken, requireAdmin, (req, res) => {
    try {
      const { username, password, name, role } = req.body
      if (!username || !password || !name) {
        return res.status(400).json({ error: "Kullanıcı adı, isim ve şifre zorunludur." })
      }
      const data = readJsonFile<any>(DATA_FILE, { users: [] })
      if (!data.users) data.users = []

      const cleanUsername = username.trim().toLowerCase()
      const exists = data.users.some((u: any) => u.username && u.username.trim().toLowerCase() === cleanUsername)
      if (exists || cleanUsername === 'admin') {
        return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanılıyor." })
      }

      const newUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role: role === 'admin' ? 'admin' : 'user',
        createdAt: Date.now()
      }

      data.users.push(newUser)
      writeJsonFile(DATA_FILE, data)
      res.json({ success: true, user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role } })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  app.delete('/api/users/:id', verifyToken, requireAdmin, (req, res) => {
    try {
      const data = readJsonFile<any>(DATA_FILE, { users: [] })
      if (!data.users) data.users = []
      data.users = data.users.filter((u: any) => u.id !== req.params.id)
      writeJsonFile(DATA_FILE, data)
      res.json({ success: true })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
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

  const saveCertImageIfBase64 = (record: any) => {
    if (!record || !record.serialNo || !record.image) return
    const imgStr = record.image
    if (typeof imgStr === 'string' && imgStr.startsWith('data:image/')) {
      try {
        const safeSerial = record.serialNo.replace(/[^a-zA-Z0-9_\-]/g, '')
        const isPng = imgStr.startsWith('data:image/png')
        const ext = isPng ? 'png' : 'jpg'
        const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, '')
        const filePath = path.join(CERTS_DIR, `${safeSerial}.${ext}`)
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
        record.image = `/api/cert-image/${safeSerial}`
      } catch (err) {
        console.error("Error offloading certificate image to disk:", err)
      }
    }
  }

  app.get('/api/cert-image/:id', (req, res) => {
    const safeSerial = req.params.id.replace(/[^a-zA-Z0-9_\-]/g, '')
    const jpgPath = path.join(CERTS_DIR, `${safeSerial}.jpg`)
    const pngPath = path.join(CERTS_DIR, `${safeSerial}.png`)
    const targetPath = fs.existsSync(jpgPath) ? jpgPath : (fs.existsSync(pngPath) ? pngPath : null)
    if (targetPath) {
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.sendFile(targetPath)
    } else {
      res.status(404).send('Sertifika görseli bulunamadı.')
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

  const enrichRecord = (r: any, callingUser: any) => {
    if (!r) return
    saveCertImageIfBase64(r)

    if (callingUser) {
      if (!r.issuedBy) r.issuedBy = callingUser.id
      if (!r.issuedByName) r.issuedByName = callingUser.name
    }

    if (!r.recipientName && r.fields) {
      for (const [k, v] of Object.entries(r.fields)) {
        const lk = k.toLowerCase()
        if (lk.includes('ad soyad') || lk.includes('adi soyadi') || lk.includes('ad_soyad')) {
          r.recipientName = v
          break
        }
        if ((lk.includes('ad') || lk.includes('isim')) && !lk.includes('soyad') && typeof v === 'string') {
          r.recipientName = v
        }
      }
    }

    if (!r.recipientTc && r.fields) {
      for (const [k, v] of Object.entries(r.fields)) {
        const lk = k.toLowerCase()
        if (lk.includes('tc') || lk.includes('tckn') || lk.includes('kimlik')) {
          r.recipientTc = v
          break
        }
      }
    }

    if (!r.trainingDate && r.fields) {
      for (const [k, v] of Object.entries(r.fields)) {
        const lk = k.toLowerCase()
        if (lk.includes('egitim tarihi') || lk.includes('eğitim tarihi') || lk === 'tarih') {
          r.trainingDate = v
          break
        }
      }
    }

    if (!r.company && r.fields) {
      for (const [k, v] of Object.entries(r.fields)) {
        const lk = k.toLowerCase()
        if ((lk.includes('firma') || lk.includes('kurum') || lk.includes('şirket') || lk.includes('sirket')) && typeof v === 'string') {
          r.company = v
          break
        }
      }
    }

    if (r.company) {
      try {
        const data = readJsonFile<any>(DATA_FILE, {})
        data.companies = data.companies || []
        const found = data.companies.find((c: any) => 
          (c.id && c.id === r.companyId) ||
          (c.name && c.name.toLowerCase() === r.company.toLowerCase()) ||
          (c.shortName && c.shortName.toLowerCase() === r.company.toLowerCase())
        )
        if (!found) {
          const newId = r.companyId || (Date.now().toString() + '.' + Math.random().toString().slice(2, 8))
          const newComp = {
            id: newId,
            name: r.company.trim(),
            shortName: r.company.trim().substring(0, 15).toUpperCase().replace(/\s+/g, '_'),
            dangerClass: r.dangerClass || 'cok_tehlikeli',
            validityYears: r.validityYears || 1,
            createdAt: Date.now()
          }
          data.companies.push(newComp)
          writeJsonFile(DATA_FILE, data)
          r.companyId = newId
        } else if (!r.companyId) {
          r.companyId = found.id
        }
      } catch (e) {}
    }
  }

  app.post('/api/issue', optionalToken, async (req, res) => {
    try {
      const records = req.body
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      const callingUser = (req as any).user

      if (Array.isArray(records)) {
        for (const r of records) {
          if (r && r.serialNo) {
            enrichRecord(r, callingUser)
            certs[r.serialNo] = r
          }
        }
      } else if (records && records.serialNo) {
        enrichRecord(records, callingUser)
        certs[records.serialNo] = records
      }
      writeJsonFile(CERT_FILE, certs)
      res.json({ success: true })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: "Failed to issue certificates" })
    }
  })

  // --- CERTIFICATE QUERIES & DASHBOARD STATS ---
  app.get('/api/certificates', verifyToken, (req, res) => {
    try {
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      let list = Object.values(certs)

      const company = req.query.company as string
      const search = req.query.search as string
      const status = req.query.status as string
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined

      if (company) {
        const compLower = company.trim().toLowerCase()
        list = list.filter(c => (c.company || '').toLowerCase().includes(compLower) || (c.companyId === company))
      }

      if (search) {
        const q = search.trim().toLowerCase()
        list = list.filter(c => {
          const name = (c.recipientName || '').toLowerCase()
          const tc = (c.recipientTc || '').toLowerCase()
          const serial = (c.serialNo || '').toLowerCase()
          return name.includes(q) || tc.includes(q) || serial.includes(q)
        })
      }

      const now = new Date()
      now.setHours(0, 0, 0, 0)

      if (status && status !== 'all') {
        list = list.filter(c => {
          if (!c.expiryDate) return status === 'valid'
          const exp = new Date(c.expiryDate)
          if (isNaN(exp.getTime())) return status === 'valid'
          exp.setHours(0, 0, 0, 0)
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (status === 'expired') return diffDays < 0
          if (status === 'expiring' || status === 'expiring_soon') return diffDays >= 0 && diffDays <= 30
          if (status === 'valid') return diffDays > 30
          return true
        })
      }

      // Sort newest first
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

      if (limit && limit > 0) {
        list = list.slice(0, limit)
      }

      res.json(list)
    } catch (e: any) {
      res.status(500).json({ error: e.message })
    }
  })

  app.get('/api/stats/dashboard', verifyToken, (req, res) => {
    try {
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      const list = Object.values(certs)

      const user = (req as any).user
      const userOnly = req.query.userOnly === 'true'
      const targetList = (userOnly && user?.id && user.id !== 'admin')
        ? list.filter(c => c.issuedBy === user.id)
        : list

      const now = new Date()
      now.setHours(0, 0, 0, 0)

      let expired = 0
      let expiringSoon = 0
      let valid = 0

      for (const c of targetList) {
        if (!c.expiryDate) {
          valid++
          continue
        }
        const exp = new Date(c.expiryDate)
        if (isNaN(exp.getTime())) {
          valid++
          continue
        }
        exp.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          expired++
        } else if (diffDays <= 30) {
          expiringSoon++
        } else {
          valid++
        }
      }

      res.json({
        total: targetList.length,
        expired,
        expiringSoon,
        valid
      })
    } catch (e: any) {
      res.status(500).json({ error: e.message })
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
