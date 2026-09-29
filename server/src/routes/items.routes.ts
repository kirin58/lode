import { Router } from 'express'
import { z } from 'zod'
import { getStore } from '../db/index.js'
import { requireAuth } from '../auth.js'
import { upload } from '../upload.js'

export const itemsRouter = Router()

const createSchema = z.object({
  kind: z.enum(['lost', 'found']),
  title: z.string().min(3, 'ชื่อของสั้น ๆ นะ อย่างน้อย 3 ตัวอักษร').max(90),
  description: z.string().max(1200).default(''),
  category_id: z.string().max(40).nullable().optional(),
  location: z.string().max(120).default(''),
  occurred_at: z.string().max(20).nullable().optional(),
  contact_line: z.string().max(120).default(''),
  reward: z.coerce.number().int().min(0).max(100000).default(0),
})

itemsRouter.get('/', async (req, res) => {
  const store = getStore()
  const q = req.query
  const { items, total } = await store.listItems({
    q: (q.q as string) || undefined,
    kind: (q.kind as any) ?? 'all',
    category: (q.category as string) || 'all',
    status: (q.status as any) ?? 'all',
    sort: (q.sort as any) ?? 'new',
    ownerId: (q.mine as string) || undefined,
    claimedBy: (q.claimed as string) || undefined,
    limit: Number(q.limit ?? 24),
    offset: Number(q.offset ?? 0),
  })
  res.json({ items, total })
})

itemsRouter.get('/categories', async (_req, res) => {
  res.json({ categories: await getStore().listCategories() })
})

itemsRouter.get('/stats', async (_req, res) => {
  res.json({ stats: await getStore().stats() })
})

itemsRouter.get('/:id', async (req, res) => {
  const item = await getStore().getItem(String(req.params.id))
  if (!item) {
    res.status(404).json({ error: 'ไม่พบประกาศนี้' })
    return
  }
  const me = req.user?.sub
  res.json({
    item: me ? { ...item, is_mine: item.owner_id === me } : item,
    has_claimed: me
      ? (await getStore().listClaimsByUser(me)).some((c) => c.item_id === item.id)
      : false,
  })
})

itemsRouter.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const store = getStore()
  const me = await store.findUserById(req.user!.sub)
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null
  const item = await store.createItem({
    kind: parsed.data.kind,
    title: parsed.data.title,
    description: parsed.data.description,
    category_id: parsed.data.category_id || null,
    location: parsed.data.location,
    occurred_at: parsed.data.occurred_at || null,
    contact_name: me?.display_name ?? '',
    contact_line: parsed.data.contact_line || me?.email || '',
    image_url: imageUrl,
    reward: parsed.data.reward,
    owner_id: req.user!.sub,
  })
  res.status(201).json({ item })
})

itemsRouter.patch('/:id', requireAuth, async (req, res) => {
  const schema = z.object({
    title: z.string().min(3).max(90).optional(),
    description: z.string().max(1200).optional(),
    category_id: z.string().nullable().optional(),
    location: z.string().max(120).optional(),
    occurred_at: z.string().nullable().optional(),
    contact_line: z.string().max(120).optional(),
    reward: z.coerce.number().int().min(0).max(100000).optional(),
    status: z.enum(['open', 'claimed', 'returned', 'closed']).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const store = getStore()
  const item = await store.updateItem(String(req.params.id), parsed.data, req.user!.sub)
  if (!item) {
    res.status(403).json({ error: 'แก้ไขไม่ได้ เพราะไม่ใช่ประกาศของคุณ 🙃' })
    return
  }
  res.json({ item })
})

itemsRouter.delete('/:id', requireAuth, async (req, res) => {
  const ok = await getStore().deleteItem(String(req.params.id), req.user!.sub)
  if (!ok) {
    res.status(403).json({ error: 'ลบไม่ได้ เพราะไม่ใช่ประกาศของคุณ 🙃' })
    return
  }
  res.json({ ok: true })
})
