import { Router } from 'express'
import { z } from 'zod'
import { getStore } from '../db/index.js'
import { requireAuth } from '../auth.js'

export const claimsRouter = Router()

claimsRouter.get('/mine', requireAuth, async (req, res) => {
  res.json({ claims: await getStore().listClaimsByUser(req.user!.sub) })
})

claimsRouter.get('/incoming', requireAuth, async (req, res) => {
  res.json({ claims: await getStore().listClaimsForOwner(req.user!.sub) })
})

claimsRouter.post('/:itemId', requireAuth, async (req, res) => {
  const store = getStore()
  const item = await store.getItem(String(req.params.itemId))
  if (!item) {
    res.status(404).json({ error: 'ไม่พบประกาศนี้' })
    return
  }
  if (item.owner_id === req.user!.sub) {
    res.status(400).json({ error: 'ของตัวเอง จะมาเก็บเองทำไม 🤡' })
    return
  }
  if (item.status === 'returned') {
    res.status(400).json({ error: 'ประกาศนี้ปิดรับเรียบร้อยแล้ว' })
    return
  }
  const parsed = z.object({ message: z.string().max(600).default('') }).safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const claim = await store.createClaim(item.id, req.user!.sub, parsed.data.message)
  if (!claim) {
    res.status(409).json({ error: 'คุณส่งคำขอนี้ไปแล้ว รอเจ้าของตอบนะ 👀' })
    return
  }
  res.status(201).json({ claim })
})

claimsRouter.patch('/:id', requireAuth, async (req, res) => {
  const parsed = z
    .object({ status: z.enum(['approved', 'rejected']) })
    .safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const store = getStore()
  const claim = await store.updateClaim(String(req.params.id), parsed.data.status, req.user!.sub)
  if (!claim) {
    res.status(403).json({ error: 'อัปเดตไม่ได้ (ไม่ใช่เจ้าของประกาศ)' })
    return
  }
  const item = await store.getItem(claim.item_id)
  const verb = parsed.data.status === 'approved' ? 'อนุมัติแล้ว 🎉' : 'ปฏิเสธแล้ว'
  await store.notify(
    claim.claimant_id,
    claim.item_id,
    parsed.data.status,
    `คำขอรับ "${item?.title ?? 'ของชิ้นเดิม'}" ของคุณถูก${verb}`
  )
  res.json({ claim, item })
})

export const notifyRouter = Router()

notifyRouter.get('/', requireAuth, async (req, res) => {
  res.json({ notifications: await getStore().listNotifications(req.user!.sub) })
})

notifyRouter.post('/read', requireAuth, async (req, res) => {
  await getStore().markNotificationsRead(req.user!.sub)
  res.json({ ok: true })
})
