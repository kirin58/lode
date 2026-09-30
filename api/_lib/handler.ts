/**
 * Factory สร้าง Vercel Function handler — logic จริงทั้งหมดอยู่ใน ./api.ts (handleRequest)
 * แต่ละไฟล์ใน api/ เป็นแค่ทางเข้า 3 บรรทัด (Vercel จับ route จากตำแหน่งไฟล์)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleRequest, type ReqCtx } from './api.js'

async function readBody(req: VercelRequest): Promise<any> {
  if (req.body !== undefined && req.body !== null) return req.body
  if (req.method === 'GET' || req.method === 'HEAD') return {}
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function createHandler() {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    try {
      const ctx: ReqCtx = {
        method: req.method ?? 'GET',
        path: (req.url ?? '/').split('?')[0],
        query: (req.query ?? {}) as Record<string, any>,
        body: await readBody(req),
        headers: req.headers as Record<string, string | undefined>,
      }

      const result = await handleRequest(ctx)

      // ใส่ CORS (deploy หลายโดเมนได้)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
      if (req.method === 'OPTIONS') {
        res.status(204).end()
        return
      }

      // ถ้าเป็น binary (รูปจาก S3) ส่งเป็นไฟล์แทน JSON
      if (result.contentType && Buffer.isBuffer(result.body)) {
        res.setHeader('Content-Type', result.contentType)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.status(result.status).send(result.body)
        return
      }

      res.status(result.status).json(result.body)
    } catch (err: any) {
      console.error('[api]', err)
      res.status(500).json({ error: err?.message ?? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' })
    }
  }
}
