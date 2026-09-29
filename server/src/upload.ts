import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.resolve(fileURLToPath(new URL('../uploads', import.meta.url)))
fs.mkdirSync(dir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '.jpg'
    cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true)
    else cb(new Error('อัปโหลดได้แค่รูปภาพเท่านั้นนะ'))
  },
})
