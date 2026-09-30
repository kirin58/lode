/**
 * Cloud Functions entry — function เดียวชื่อ `api` รับทุก /api/*
 * logic จริงทั้งหมดอยู่ใน ./lib/api.ts (handleRequest ชุดเดียวกับ dev ในเครื่อง)
 *
 * Secrets ที่ต้องตั้ง (firebase functions:secrets:set ...):
 *   DATABASE_URL, JWT_SECRET (+ AWS_* / S3_BUCKET ถ้าจะเปิดอัปโหลดรูป)
 */
import 'dotenv/config'
import { onRequest } from 'firebase-functions/v2/https'
import { handleRequest, type ReqCtx } from './lib/api.js'

export const api = onRequest(
  {
    region: 'asia-southeast1',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (req, res) => {
    try {
      const ctx: ReqCtx = {
        method: req.method,
        // hosting rewrite /api/** → function ส่ง path เดิมมาให้ (เช่น /api/items/stats)
        path: req.path.split('?')[0],
        query: req.query as Record<string, any>,
        body: req.body ?? {},
        headers: req.headers as Record<string, string | undefined>,
      }

      const result = await handleRequest(ctx)

      res.set('Access-Control-Allow-Origin', '*')
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
      if (req.method === 'OPTIONS') {
        res.status(204).end()
        return
      }

      if (result.contentType && Buffer.isBuffer(result.body)) {
        res.set('Content-Type', result.contentType)
        res.set('Cache-Control', 'public, max-age=31536000, immutable')
        res.status(result.status).send(result.body)
        return
      }

      res.status(result.status).json(result.body)
    } catch (err: any) {
      console.error('[api]', err)
      res.status(500).json({ error: err?.message ?? 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' })
    }
  }
)
