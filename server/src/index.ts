/**
 * Express adapter — ใช้ตอน dev ในเครื่องเท่านั้น (npm run dev)
 * บน Vercel ใช้ api/[[...path]].ts แทน (โค้วง logic เดียวกัน)
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStore } from './db/index.js'
import { handleRequest, type ReqCtx } from './api.js'
import { upload } from './upload.js'

const app = express()
const PORT = Number(process.env.PORT ?? 8787)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '4mb' }))
app.use('/uploads', express.static(path.resolve(fileURLToPath(new URL('../uploads', import.meta.url)))))

/** จับทุกคำขอ /api/* แล้วส่งต่อไปที่ตรรกะกลาง */
app.all(/^\/api(\/.*)?$/, upload.single('image'), async (req, res) => {
  try {
    const ctx: ReqCtx = {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      query: req.query as Record<string, any>,
      body: req.method === 'GET' ? {} : req.body,
      headers: req.headers as Record<string, string | undefined>,
      file: req.file
        ? { originalname: (req.file as any).filename, size: req.file.size }
        : undefined,
    }
    const result = await handleRequest(ctx)
    res.status(result.status).json(result.body)
  } catch (err: any) {
    console.error('[api]', err)
    res.status(500).json({ error: err?.message ?? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' })
  }
})

const store = getStore()
await store.init()

app.listen(PORT, () => {
  console.log(`\n  ✨ Lost & Found API (dev) → http://localhost:${PORT}`)
  console.log(`  🗄️  driver: ${store.driver}`)
  console.log(`  👤  ทดลอง: demo@lostfound.app / demo1234`)
  console.log(`  👑  แอดมิน: joe@lostfound.app / demo1234\n`)
})
