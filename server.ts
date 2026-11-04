import express from "express"
import path from "path"
import fs from "fs"
import jwt from "jsonwebtoken"
import { exec } from "child_process"
import JSZip from "jszip"

const JWT_SECRET = "procertify-super-secret-key-2024-static"

async function startServer() {
  const app = express()
  const PORT = 3000

  app.use(express.json({ limit: '200mb' }))
  
  const DATA_FILE = path.join(process.cwd(), 'data.json')
  const CERT_FILE = path.join(process.cwd(), 'certificates.json')
  const CERTS_DIR = path.join(process.cwd(), 'storage', 'certs')
  const EMPLOYEES_FILE = path.join(process.cwd(), 'employees.json')
  const DOCUMENTS_DIR = path.join(process.cwd(), 'storage', 'documents')

  if (!fs.existsSync(CERTS_DIR)) {
    try { fs.mkdirSync(CERTS_DIR, { recursive: true }) } catch (e) { /* ignore */ }
  }
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    try { fs.mkdirSync(DOCUMENTS_DIR, { recursive: true }) } catch (e) { /* ignore */ }
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
  if (!fs.existsSync(EMPLOYEES_FILE)) {
    writeJsonFile(EMPLOYEES_FILE, {})
  }

  const turkishToLower = (str: string): string => {
    if (!str) return ''
    return str
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/Ğ/g, 'ğ')
      .replace(/Ü/g, 'ü')
      .replace(/Ş/g, 'ş')
      .replace(/Ö/g, 'ö')
      .replace(/Ç/g, 'ç')
      .toLowerCase()
      .trim()
  }

  const syncEmployeesFromCerts = () => {
    try {
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      const employees = readJsonFile<Record<string, any>>(EMPLOYEES_FILE, {})
      let updated = false

      // Sort certs chronologically so latest certificate data takes precedence
      const sortedCerts = Object.values(certs).sort((a: any, b: any) => {
        const timeA = new Date(a.date || a.trainingDate || a.createdAt || 0).getTime()
        const timeB = new Date(b.date || b.trainingDate || b.createdAt || 0).getTime()
        return timeA - timeB
      })

      for (const cert of sortedCerts) {
        if (!cert || (!cert.recipientName && !cert.recipientTc)) continue
        
        const tc = cert.recipientTc ? String(cert.recipientTc).replace(/\s+/g, '').trim() : ''
        const name = (cert.recipientName || '').trim()
        const company = (cert.company || '').trim()
        const companyId = cert.companyId || ''

        // Find existing employee by TC first!
        let existingKey: string | undefined = undefined
        if (tc) {
          existingKey = Object.keys(employees).find(k => {
            const e = employees[k]
            return e.tc && e.tc.replace(/\s+/g, '').trim() === tc
          })
        }
        if (!existingKey && name) {
          existingKey = Object.keys(employees).find(k => {
            const e = employees[k]
            return turkishToLower(e.name || '') === turkishToLower(name) && 
                   (!company || turkishToLower(e.companyName || '') === turkishToLower(company))
          })
        }

        if (existingKey) {
          const emp = employees[existingKey]
          if (tc && !emp.tc) {
            emp.tc = tc
            updated = true
          }
          if (name && !emp.name) {
            emp.name = name
            updated = true
          }
          if (company) {
            emp.companyName = company
            if (companyId) emp.companyId = companyId
            emp.updatedAt = cert.date ? new Date(cert.date).getTime() : Date.now()
            updated = true
          }
          // If existing key was not the TC but we now have a TC, migrate key to TC
          if (tc && existingKey !== tc && !employees[tc]) {
            employees[tc] = { ...emp, id: tc, tc: tc }
            delete employees[existingKey]
            updated = true
          }
        } else {
          const empKey = tc || `emp_${turkishToLower(name).replace(/\s+/g, '_')}`
          employees[empKey] = {
            id: empKey,
            tc: tc,
            name: name,
            companyId: companyId,
            companyName: company,
            status: 'active',
            createdAt: cert.date ? new Date(cert.date).getTime() : Date.now(),
            updatedAt: Date.now(),
            documents: []
          }
          updated = true
        }
      }

      if (updated) {
        writeJsonFile(EMPLOYEES_FILE, employees)
      }
    } catch (err) {
      console.error("Error syncing employees from certificates:", err)
    }
  }

  // Run initial sync on startup
  syncEmployeesFromCerts()

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

    if (r.recipientTc) {
      r.recipientTc = String(r.recipientTc).replace(/\s+/g, '').trim()
      try {
        const employees = readJsonFile<Record<string, any>>(EMPLOYEES_FILE, {})
        const matched = Object.values(employees).find((e: any) => 
          e.tc && e.tc.replace(/\s+/g, '').trim() === r.recipientTc
        )
        if (matched) {
          r.employeeId = matched.id
          if (!r.recipientName && matched.name) r.recipientName = matched.name
          if (!r.company && matched.companyName) r.company = matched.companyName
          if (!r.companyId && matched.companyId) r.companyId = matched.companyId
        }
      } catch (e) {}
    }

    if (!r.trainingDate && r.fields) {
      const dateCandidates: { raw: string; ts: number }[] = []
      for (const [k, v] of Object.entries(r.fields)) {
        const lk = k.toLowerCase()
        if ((lk.includes('tarih') || lk.includes('date')) && !lk.includes('gecerli') && !lk.includes('geçerli') && !lk.includes('bitis') && !lk.includes('bitiş') && typeof v === 'string') {
          const m = v.match(/\b(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})\b/)
          if (m) {
            const dt = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), 12, 0, 0)
            if (!isNaN(dt.getTime())) {
              dateCandidates.push({ raw: `${String(m[1]).padStart(2, '0')}.${String(m[2]).padStart(2, '0')}.${m[3]}`, ts: dt.getTime() })
            }
          }
        }
      }
      if (dateCandidates.length > 0) {
        dateCandidates.sort((a, b) => a.ts - b.ts)
        r.trainingDate = dateCandidates[0].raw
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
      syncEmployeesFromCerts()
      res.json({ success: true })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: "Failed to issue certificates" })
    }
  })

  // Update existing certificate (Edit mode)
  app.put('/api/certificates/:serialNo', verifyToken, (req, res) => {
    try {
      const { serialNo } = req.params
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      if (!certs[serialNo]) {
        return res.status(404).json({ error: "Sertifika bulunamadı." })
      }
      const callingUser = (req as any).user
      const updatedData = { ...certs[serialNo], ...req.body, serialNo }
      enrichRecord(updatedData, callingUser)
      certs[serialNo] = updatedData
      writeJsonFile(CERT_FILE, certs)
      syncEmployeesFromCerts()
      res.json({ success: true, certificate: updatedData })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // --- EMPLOYEE (ÇALIŞAN KARTI & EVRAK) MANAGEMENT ---
  app.get('/api/employees', verifyToken, (req, res) => {
    try {
      const employees = readJsonFile<Record<string, any>>(EMPLOYEES_FILE, {})
      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      const certList = Object.values(certs)

      let list = Object.values(employees)

      const company = req.query.company as string
      const status = req.query.status as string // 'active' | 'passive' | 'all'
      const search = req.query.search as string

      if (company) {
        const compNorm = turkishToLower(company)
        list = list.filter(e => {
          if (e.companyId && e.companyId === company) return true
          const eCompNorm = turkishToLower(e.companyName || '')
          return eCompNorm === compNorm || eCompNorm.includes(compNorm) || compNorm.includes(eCompNorm)
        })
      }

      if (status && status !== 'all') {
        list = list.filter(e => (e.status || 'active') === status)
      }

      if (search) {
        const q = turkishToLower(search)
        list = list.filter(e => 
          turkishToLower(e.name || '').includes(q) || 
          (e.tc && e.tc.includes(q)) || 
          turkishToLower(e.companyName || '').includes(q)
        )
      }

      const enriched = list.map(emp => {
        const cleanEmpTc = emp.tc ? String(emp.tc).replace(/\s+/g, '').trim() : ''
        const empCerts = certList.filter(c => {
          const cleanCertTc = c.recipientTc ? String(c.recipientTc).replace(/\s+/g, '').trim() : ''
          if (cleanEmpTc && cleanCertTc && cleanCertTc === cleanEmpTc) return true
          if (c.employeeId && (c.employeeId === emp.id || (cleanEmpTc && c.employeeId === cleanEmpTc))) return true
          return turkishToLower(c.recipientName || '') === turkishToLower(emp.name || '')
        })

        empCerts.sort((a: any, b: any) => {
          const timeB = new Date(b.date || b.trainingDate || b.createdAt || 0).getTime()
          const timeA = new Date(a.date || a.trainingDate || a.createdAt || 0).getTime()
          return timeB - timeA
        })

        return {
          ...emp,
          certificatesCount: empCerts.length,
          latestCertificate: empCerts[0] || null
        }
      })

      enriched.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR'))
      res.json(enriched)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.get('/api/employees/:id', verifyToken, (req, res) => {
    try {
      const employees = readJsonFile<Record<string, any>>(EMPLOYEES_FILE, {})
      let emp = employees[req.params.id]

      if (!emp) {
        const paramNorm = turkishToLower(req.params.id)
        const cleanParam = req.params.id.replace(/\s+/g, '').trim()
        emp = Object.values(employees).find((e: any) => 
          (e.tc && String(e.tc).replace(/\s+/g, '').trim() === cleanParam) ||
          turkishToLower(e.name || '') === paramNorm
        )
      }

      if (!emp) {
        return res.status(404).json({ error: "Çalışan bulunamadı." })
      }

      const certs = readJsonFile<Record<string, any>>(CERT_FILE, {})
      const cleanEmpTc = emp.tc ? String(emp.tc).replace(/\s+/g, '').trim() : ''
      const empCerts = Object.values(certs).filter((c: any) => {
        const cleanCertTc = c.recipientTc ? String(c.recipientTc).replace(/\s+/g, '').trim() : ''
        if (cleanEmpTc && cleanCertTc && cleanCertTc === cleanEmpTc) return true
        if (c.employeeId && (c.employeeId === emp.id || (cleanEmpTc && c.employeeId === cleanEmpTc))) return true
        return turkishToLower(c.recipientName || '') === turkishToLower(emp.name || '')
      })

      empCerts.sort((a: any, b: any) => {
        const timeB = new Date(b.date || b.trainingDate || b.createdAt || 0).getTime()
        const timeA = new Date(a.date || a.trainingDate || a.createdAt || 0).getTime()
        return timeB - timeA
      })

      res.json({
        ...emp,
        certificates: empCerts
      })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/api/employees/:id/status', verifyToken, (req, res) => {
    try {
      const { status, note } = req.body
      if (!status || (status !== 'active' && status !== 'passive')) {
        return res.status(400).json({ error: "Geçersiz durum. 'active' veya 'passive' olmalı." })
      }

      const employees = readJsonFile<Record<string, any>>(EMPLOYEES_FILE, {})
      let empKey = req.params.id
      if (!employees[empKey]) {
        const foundKey = Object.keys(employees).find(k => 
          employees[k].tc === req.params.id || turkishToLower(employees[k].name || '') === turkishToLower(req.params.id)
        )
        if (foundKey) empKey = foundKey
      }

      if (!employees[empKey]) {
        return res.status(404).json({ error: "Çalışan bulunamadı." })
      }

      employees[empKey].status = status
      if (status === 'passive') {
        employees[empKey].terminatedAt = Date.now()
        employees[empKey].terminationNote = note || ''
      } else {
        employees[empKey].terminatedAt = undefined
        employees[empKey].terminationNote = undefined
      }

      writeJsonFile(EMPLOYEES_FILE, employees)
      res.json({ success: true, employee: employees[empKey] })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/api/employees/:id/documents', verifyToken, (req, res) => {
    try {
      const { name, fileName, fileData, mimeType } = req.body
      if (!name || !fileData) {
        return res.status(400).json({ error: "Belge adı ve dosya içeriği zorunludur." })
      }

      const employees = readJsonFile<Record<string, any>>(EMPLOYEES_FILE, {})
      let empKey = req.params.id
      if (!employees[empKey]) {
        const foundKey = Object.keys(employees).find(k => 
          employees[k].tc === req.params.id || turkishToLower(employees[k].name || '') === turkishToLower(req.params.id)
        )
        if (foundKey) empKey = foundKey
      }

      if (!employees[empKey]) {
        return res.status(404).json({ error: "Çalışan bulunamadı." })
      }

      const base64PrefixMatch = fileData.match(/^data:([a-zA-Z0-9_\-\.\/]+);base64,/)
      const rawBase64 = base64PrefixMatch ? fileData.replace(/^data:([a-zA-Z0-9_\-\.\/]+);base64,/, '') : fileData
      const resolvedMime = mimeType || (base64PrefixMatch ? base64PrefixMatch[1] : 'application/octet-stream')

      const buffer = Buffer.from(rawBase64, 'base64')
      const fileSize = buffer.length

      if (fileSize > 25 * 1024 * 1024) {
        return res.status(400).json({ error: "Dosya boyutu 25 MB'den büyük olamaz." })
      }

      const originalExt = path.extname(fileName || name) || (resolvedMime.includes('pdf') ? '.pdf' : resolvedMime.includes('png') ? '.png' : '.jpg')
      const safeDocId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const diskFileName = `${safeDocId}${originalExt}`
      const diskFilePath = path.join(DOCUMENTS_DIR, diskFileName)

      fs.writeFileSync(diskFilePath, buffer)

      const newDoc = {
        id: safeDocId,
        name: name.trim(),
        fileName: diskFileName,
        fileUrl: `/api/documents/${diskFileName}`,
        fileSize,
        mimeType: resolvedMime,
        uploadedAt: Date.now()
      }

      if (!employees[empKey].documents) {
        employees[empKey].documents = []
      }
      employees[empKey].documents.push(newDoc)

      writeJsonFile(EMPLOYEES_FILE, employees)
      res.json({ success: true, document: newDoc })
    } catch (err: any) {
      console.error("Document upload error:", err)
      res.status(500).json({ error: err.message })
    }
  })

  app.delete('/api/employees/:id/documents/:docId', verifyToken, (req, res) => {
    try {
      const employees = readJsonFile<Record<string, any>>(EMPLOYEES_FILE, {})
      let empKey = req.params.id
      if (!employees[empKey]) {
        const foundKey = Object.keys(employees).find(k => 
          employees[k].tc === req.params.id || turkishToLower(employees[k].name || '') === turkishToLower(req.params.id)
        )
        if (foundKey) empKey = foundKey
      }

      if (!employees[empKey]) {
        return res.status(404).json({ error: "Çalışan bulunamadı." })
      }

      employees[empKey].documents = employees[empKey].documents || []
      const docIndex = employees[empKey].documents.findIndex((d: any) => d.id === req.params.docId)

      if (docIndex === -1) {
        return res.status(404).json({ error: "Belge bulunamadı." })
      }

      const doc = employees[empKey].documents[docIndex]
      const diskPath = path.join(DOCUMENTS_DIR, doc.fileName)
      if (fs.existsSync(diskPath)) {
        try { fs.unlinkSync(diskPath) } catch (e) { /* ignore */ }
      }

      employees[empKey].documents.splice(docIndex, 1)
      writeJsonFile(EMPLOYEES_FILE, employees)

      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.get('/api/documents/:fileName', optionalToken, (req, res) => {
    const safeName = path.basename(req.params.fileName)
    const filePath = path.join(DOCUMENTS_DIR, safeName)
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath)
    } else {
      res.status(404).send('Belge bulunamadı.')
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

  // FULL SYSTEM BACKUP (ZIP: data.json, certificates.json, employees.json and all uploaded documents)
  app.get('/api/backup/full-zip', verifyToken, async (req, res) => {
    try {
      const zip = new JSZip()

      // 1. Add data.json
      if (fs.existsSync(DATA_FILE)) {
        zip.file('data.json', fs.readFileSync(DATA_FILE, 'utf-8'))
      }

      // 2. Add certificates.json
      if (fs.existsSync(CERT_FILE)) {
        zip.file('certificates.json', fs.readFileSync(CERT_FILE, 'utf-8'))
      }

      // 3. Add employees.json
      if (fs.existsSync(EMPLOYEES_FILE)) {
        zip.file('employees.json', fs.readFileSync(EMPLOYEES_FILE, 'utf-8'))
      }

      // 4. Add storage/documents files
      if (fs.existsSync(DOCUMENTS_DIR)) {
        const docFolder = zip.folder('storage/documents')
        const docFiles = fs.readdirSync(DOCUMENTS_DIR)
        for (const file of docFiles) {
          const fullPath = path.join(DOCUMENTS_DIR, file)
          if (fs.statSync(fullPath).isFile()) {
            docFolder?.file(file, fs.readFileSync(fullPath))
          }
        }
      }

      // 5. Add storage/certs files
      if (fs.existsSync(CERTS_DIR)) {
        const certFolder = zip.folder('storage/certs')
        const certFiles = fs.readdirSync(CERTS_DIR)
        for (const file of certFiles) {
          const fullPath = path.join(CERTS_DIR, file)
          if (fs.statSync(fullPath).isFile()) {
            certFolder?.file(file, fs.readFileSync(fullPath))
          }
        }
      }

      // 6. Add manifest
      const manifest = {
        app: "ProCertify Studio",
        version: "1.7.3",
        backupType: "full_archive",
        createdAt: Date.now(),
        dateStr: new Date().toISOString()
      }
      zip.file('manifest.json', JSON.stringify(manifest, null, 2))

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-')
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="ProCertify_Tam_Yedek_${dateStr}.zip"`)
      return res.send(zipBuffer)
    } catch (err: any) {
      console.error("Full zip backup error:", err)
      res.status(500).json({ error: "Tam yedek oluşturulurken sunucu hatası meydana geldi: " + err.message })
    }
  })

  // RESTORE FULL SYSTEM BACKUP (ZIP)
  app.post('/api/backup/full-restore', verifyToken, requireAdmin, async (req, res) => {
    try {
      const { zipBase64 } = req.body
      if (!zipBase64) {
        return res.status(400).json({ error: "Yedek zip verisi eksik." })
      }

      const zipData = Buffer.from(zipBase64, 'base64')
      const zip = await JSZip.loadAsync(zipData)

      let restoredData = false
      let restoredCerts = false
      let restoredEmployees = false
      let docCount = 0
      let certFileCount = 0

      // Ensure storage directories exist
      if (!fs.existsSync(DOCUMENTS_DIR)) fs.mkdirSync(DOCUMENTS_DIR, { recursive: true })
      if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true })

      // Iterate through zip entries
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue

        const normalizedPath = relativePath.replace(/\\/g, '/')

        if (normalizedPath === 'data.json') {
          const content = await zipEntry.async('string')
          writeJsonFile(DATA_FILE, JSON.parse(content))
          restoredData = true
        } else if (normalizedPath === 'certificates.json') {
          const content = await zipEntry.async('string')
          writeJsonFile(CERT_FILE, JSON.parse(content))
          restoredCerts = true
        } else if (normalizedPath === 'employees.json') {
          const content = await zipEntry.async('string')
          writeJsonFile(EMPLOYEES_FILE, JSON.parse(content))
          restoredEmployees = true
        } else if (normalizedPath.startsWith('storage/documents/')) {
          const fileName = path.basename(normalizedPath)
          if (fileName) {
            const fileBuffer = await zipEntry.async('nodebuffer')
            fs.writeFileSync(path.join(DOCUMENTS_DIR, fileName), fileBuffer)
            docCount++
          }
        } else if (normalizedPath.startsWith('storage/certs/')) {
          const fileName = path.basename(normalizedPath)
          if (fileName) {
            const fileBuffer = await zipEntry.async('nodebuffer')
            fs.writeFileSync(path.join(CERTS_DIR, fileName), fileBuffer)
            certFileCount++
          }
        }
      }

      syncEmployeesFromCerts()

      return res.json({
        success: true,
        message: "Tam sistem yedeği başarıyla geri yüklendi.",
        stats: {
          restoredData,
          restoredCerts,
          restoredEmployees,
          documentFilesRestored: docCount,
          certFilesRestored: certFileCount
        }
      })
    } catch (err: any) {
      console.error("Full zip restore error:", err)
      res.status(500).json({ error: "Yedek dosyası açılırken veya geri yüklenirken hata oluştu: " + err.message })
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
