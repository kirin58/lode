/**
 * Vercel Serverless Function — จุดเดียวที่ให้บริการ API ทั้งหมดบน Vercel
 * จับทุก /api/* แล้วส่งต่อไปที่ตรรกะกลางใน server/src/api.ts
 * (โค้ดชุดเดียวกับที่ Express ในเครื่องใช้)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleRequest, type ReqCtx } from '../server/src/api'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    res.status(result.status).json(result.body)
  } catch (err: any) {
    console.error('[api]', err)
    res.status(500).json({ error: err?.message ?? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
