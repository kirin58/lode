import { Router } from 'express'
import { z } from 'zod'
import { getStore } from '../db/index.js'
import { requireAuth, requireAdmin } from '../auth.js'

export const extraRouter = Router()

// ============================================================
//  ⭐ WATCHLIST
// ============================================================
extraRouter.get('/watches', requireAuth, async (req, res) => {
  res.json({ watches: await getStore().listWatches(req.user!.sub) })
})

extraRouter.post('/watches', requireAuth, async (req, res) => {
  const parsed = z
    .object({
      keyword: z.string().max(60).default(''),
      category_id: z.string().max(40).nullable().optional(),
      kind: z.enum(['lost', 'found']).nullable().optional(),
    })
    .safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const { keyword, category_id, kind } = parsed.data
  if (!keyword.trim() && !category_id && !kind) {
    res.status(400).json({ error: 'เลือกอย่างน้อยหนึ่งอย่าง: คำค้น หมวด หรือประเภท' })
    return
  }
  const watch = await getStore().createWatch({
    user_id: req.user!.sub,
    keyword: keyword.trim(),
    category_id: category_id || null,
    kind: kind || null,
  })
  res.status(201).json({ watch })
})

extraRouter.delete('/watches/:id', requireAuth, async (req, res) => {
  const ok = await getStore().deleteWatch(String(req.params.id), req.user!.sub)
  if (!ok) {
    res.status(404).json({ error: 'ไม่พบรายการที่ติดตาม' })
    return
  }
  res.json({ ok: true })
})

// ============================================================
//  ⭐ REVIEWS
// ============================================================
extraRouter.get('/reputation/:userId', requireAuth, async (req, res) => {
  const store = getStore()
  const [reputation, reviews] = await Promise.all([
    store.reputation(String(req.params.userId)),
    store.listReviewsForUser(String(req.params.userId)),
  ])
  res.json({ reputation, reviews })
})

extraRouter.post('/reviews', requireAuth, async (req, res) => {
  const parsed = z
    .object({
      item_id: z.string().min(1, 'ไม่พบประกาศนี้'),
      target_id: z.string().min(1, 'ไม่พบผู้ใช้นี้'),
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().max(300).default(''),
    })
    .safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const store = getStore()
  const { item_id, target_id, rating, comment } = parsed.data
  if (target_id === req.user!.sub) {
    res.status(400).json({ error: 'ให้คะแนนตัวเองไม่ได้นะ 🙃' })
    return
  }
  const item = await store.getItem(item_id)
  if (!item) {
    res.status(404).json({ error: 'ไม่พบประกาศนี้' })
    return
  }
  if (item.status !== 'returned') {
    res.status(400).json({ error: 'ให้คะแนนได้หลังประกาศถูกปิดเป็น “คืนสำเร็จ” เท่านั้น' })
    return
  }
  // ต้องเป็นคู่ (เจ้าของ ↔ ผู้ขอรับ) ที่มี claim อนุมัติสำเร็จบนประกาศนี้เท่านั้น
  const claims = await store.listClaimsForOwner(item.owner_id)
  const pair = (a: string, b: string) => [a, b].sort().join('|')
  const related = claims.some(
    (c) =>
      c.item_id === item_id &&
      c.status === 'approved' &&
      pair(c.claimant_id, item.owner_id) === pair(req.user!.sub, target_id)
  )
  if (!related) {
    res.status(403).json({ error: 'ให้คะแนนได้เฉพาะคู่ที่คืนของสำเร็จด้วยกันเท่านั้น' })
    return
  }
  const review = await store.addReview({
    reviewer_id: req.user!.sub,
    target_id,
    item_id,
    rating,
    comment,
  })
  if (!review) {
    res.status(409).json({ error: 'ให้คะแนนไปแล้วสำหรับเคสนี้' })
    return
  }
  const target = await store.findUserById(target_id)
  await store.notify(
    target_id,
    item_id,
    'review',
    `${req.user!.email} ให้คะแนนคุณ ${rating} ดาว ⭐ (${item.title})`
  )
  res.status(201).json({ review, target })
})

// ============================================================
//  💬 CHAT
// ============================================================
extraRouter.get('/items/:itemId/messages', requireAuth, async (req, res) => {
  const store = getStore()
  const itemId = String(req.params.itemId)
  if (!(await store.canAccessChat(itemId, req.user!.sub))) {
    res.status(403).json({ error: 'แชทนี้เปิดสำหรับเจ้าของประกาศและคนที่ขอรับของเท่านั้น' })
    return
  }
  res.json({ messages: await store.listMessages(itemId) })
})

extraRouter.post('/items/:itemId/messages', requireAuth, async (req, res) => {
  const parsed = z.object({ body: z.string().min(1, 'พิมพ์อะไรสักอย่างดีกว่า').max(800) }).safeParse(
    req.body ?? {}
  )
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const store = getStore()
  const itemId = String(req.params.itemId)
  if (!(await store.canAccessChat(itemId, req.user!.sub))) {
    res.status(403).json({ error: 'ส่งข้อความไม่ได้ในแชทนี้' })
    return
  }
  const message = await store.sendMessage(itemId, req.user!.sub, parsed.data.body.trim())
  res.status(201).json({ message })
})

// ============================================================
//  👑 ADMIN
// ============================================================
extraRouter.get('/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  res.json({ overview: await getStore().adminOverview() })
})
