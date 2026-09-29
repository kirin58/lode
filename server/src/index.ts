import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getStore } from './db/index.js'
import { attachUser } from './auth.js'
import { authRouter } from './routes/auth.routes.js'
import { itemsRouter } from './routes/items.routes.js'
import { claimsRouter, notifyRouter } from './routes/claims.routes.js'

const app = express()
const PORT = Number(process.env.PORT ?? 8787)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(attachUser)

app.use('/api/auth', authRouter)
app.use('/api/items', itemsRouter)
app.use('/api/claims', claimsRouter)
app.use('/api/notifications', notifyRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, driver: getStore().driver, time: new Date().toISOString() })
})

const uploads = path.resolve(fileURLToPath(new URL('../uploads', import.meta.url)))
app.use('/uploads', express.static(uploads))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err)
  res.status(err?.status ?? 500).json({ error: err?.message ?? 'เกิดข้อผิดพลาดบางอย่าง' })
})

const store = getStore()
await store.init()

if (store.driver === 'memory') {
  // สร้างตัวอย่างบัญชีสำหรับเล่นในโหมด demo
  const known = await store.findUserByEmail('demo@lostfound.app')
  if (!known) {
    const bcrypt = (await import('bcryptjs')).default
    await store.createUser({
      email: 'demo@lostfound.app',
      password_hash: await bcrypt.hash('demo1234', 8),
      display_name: 'ผู้ใช้เดโม 🧪',
      avatar_emoji: '🧪',
      campus: 'มหาวิทยาลัยบูรพา',
    })
  }
}

app.listen(PORT, () => {
  console.log(`\n  ✨ Lost & Found API → http://localhost:${PORT}`)
  console.log(`  🗄️  driver: ${store.driver}\n`)
})

if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true })
