/**
 * API ทั้งหมดของ Lost & Found — เขียนแบบ framework-agnostic
 *
 * ใช้ร่วมกันได้ 2 แบบ (โค้ดชุดเดียว ไม่มี logic ซ้ำ):
 *   1) api/[[...path]].ts  → Vercel Serverless Function (deploy จริง)
 *   2) server/src/index.ts → Express adapter (dev ในเครื่อง / self-host ได้)
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { getStore } from './db/index.js'
import type { ClaimStatus, ItemStatus, User } from './types.js'

// ───────────────────────────────────────────────────────────
//  ชนิด request/response ที่ไม่ผูกกับเฟรมเวิร์ก
// ───────────────────────────────────────────────────────────
export interface ReqCtx {
  method: string
  path: string // เช่น /api/items/:id
  query: Record<string, any>
  body: any
  headers: Record<string, string | undefined>
  /** ไฟล์ที่อัปโหลด (มีเฉพาะตอนรันบน Express) */
  file?: { originalname: string; buffer?: Buffer; size: number }
}

export interface HandlerResult {
  status: number
  body: any
}

const ok = (body: any, status = 200): HandlerResult => ({ status, body })
const fail = (error: string, status = 400): HandlerResult => ({ status, body: { error } })

const SECRET = process.env.JWT_SECRET ?? 'lost-and-found-dev-secret'

/** serverless ไม่มี multer → ปิดการอัปโหลดรูป (client จะซ่อนตัวเลือกนี้ให้อัตโนมัติ) */
export const UPLOADS_ENABLED =
  String(process.env.DISABLE_UPLOADS ?? '') !== '1' && String(process.env.VERCEL ?? '') !== '1'

// ───────────────────────────────────────────────────────────
//  helpers
// ───────────────────────────────────────────────────────────
function bearer(headers: Record<string, string | undefined>): { sub: string; role: 'user' | 'admin' } | null {
  const h = headers.authorization ?? headers.Authorization
  if (!h?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(h.slice(7), SECRET) as { sub: string; role: 'user' | 'admin' }
  } catch {
    return null
  }
}

function publicUser(u: Record<string, any> | null) {
  if (!u) return null
  const { password_hash: _drop, ...rest } = u
  return rest
}

const num = (v: any, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

// ───────────────────────────────────────────────────────────
//  🛡 middleware
// ───────────────────────────────────────────────────────────
function requireAuth(ctx: ReqCtx): { sub: string; role: 'user' | 'admin' } | null {
  return bearer(ctx.headers)
}

function requireAdmin(ctx: ReqCtx): HandlerResult | null {
  const user = bearer(ctx.headers)
  if (!user) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  if (user.role !== 'admin') return fail('เฉพาะแอดมินเท่านั้นที่ทำได้ 🚫', 403)
  return null
}

// ───────────────────────────────────────────────────────────
//  🩺 health
// ───────────────────────────────────────────────────────────
async function health(): Promise<HandlerResult> {
  return ok({ ok: true, driver: getStore().driver, uploads: UPLOADS_ENABLED })
}

// ───────────────────────────────────────────────────────────
//  🔐 auth
// ───────────────────────────────────────────────────────────
async function register(ctx: ReqCtx): Promise<HandlerResult> {
  const parsed = z
    .object({
      email: z.string().email('อีเมลไม่ถูกต้องนะ'),
      password: z.string().min(8, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัว'),
      display_name: z.string().min(2, 'ใส่ชื่อที่เรียกได้หน่อย').max(40),
      avatar_emoji: z.string().max(8).optional(),
      campus: z.string().max(80).optional().nullable(),
    })
    .safeParse(ctx.body)
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const store = getStore()
  const { email, password, display_name, avatar_emoji, campus } = parsed.data
  if (await store.findUserByEmail(email))
    return fail('อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบดิ 💅', 409)

  const isFirstUser = (await store.stats()).members === 0
  const user = await store.createUser({
    email: email.toLowerCase(),
    password_hash: await bcrypt.hash(password, 10),
    display_name,
    avatar_emoji,
    campus: campus || null,
    role: isFirstUser ? 'admin' : 'user',
  })
  return ok(
    {
      token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' }),
      user: publicUser(user as any),
      is_first: isFirstUser,
    },
    201
  )
}

async function login(ctx: ReqCtx): Promise<HandlerResult> {
  const parsed = z
    .object({
      email: z.string().email('อีเมลไม่ถูกต้องนะ'),
      password: z.string().min(1, 'ใส่รหัสผ่านด้วย'),
    })
    .safeParse(ctx.body)
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const store = getStore()
  const user = await store.findUserByEmail(parsed.data.email)
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash)))
    return fail('อีเมลหรือรหัสผ่านไม่ถูกต้อง 😢', 401)

  return ok({
    token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' }),
    user: publicUser(user as any),
  })
}

async function me(ctx: ReqCtx): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const user = await getStore().findUserById(auth.sub)
  if (!user) return fail('ไม่พบผู้ใช้', 404)
  return ok({ user })
}

async function updateMe(ctx: ReqCtx): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const parsed = z
    .object({
      display_name: z.string().min(2).max(40).optional(),
      avatar_emoji: z.string().max(8).optional(),
      campus: z.string().max(80).nullable().optional(),
      bio: z.string().max(280).optional(),
    })
    .safeParse(ctx.body)
  if (!parsed.success) return fail(parsed.error.issues[0].message)
  const user = await getStore().updateUser(auth.sub, parsed.data)
  return ok({ user })
}

// ───────────────────────────────────────────────────────────
//  📦 items
// ───────────────────────────────────────────────────────────
async function listItems(ctx: ReqCtx): Promise<HandlerResult> {
  const store = getStore()
  const q = ctx.query
  const { items, total } = await store.listItems({
    q: (q.q as string) || undefined,
    kind: (q.kind as any) ?? 'all',
    category: (q.category as string) || 'all',
    status: (q.status as any) ?? 'all',
    sort: (q.sort as any) ?? 'new',
    ownerId: (q.mine as string) || undefined,
    claimedBy: (q.claimed as string) || undefined,
    limit: num(q.limit, 24),
    offset: num(q.offset, 0),
  })
  return ok({ items, total })
}

async function createItem(ctx: ReqCtx): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)

  const parsed = z
    .object({
      kind: z.enum(['lost', 'found']),
      title: z.string().min(3, 'ชื่อของสั้น ๆ นะ อย่างน้อย 3 ตัวอักษร').max(90),
      description: z.string().max(1200).default(''),
      category_id: z.string().max(40).nullable().optional(),
      location: z.string().max(120).default(''),
      occurred_at: z.string().max(20).nullable().optional(),
      contact_line: z.string().max(120).default(''),
      reward: z.coerce.number().int().min(0).max(100000).default(0),
    })
    .safeParse(ctx.body)
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const store = getStore()
  const meUser = await store.findUserById(auth.sub)
  const item = await store.createItem({
    kind: parsed.data.kind,
    title: parsed.data.title,
    description: parsed.data.description,
    category_id: parsed.data.category_id || null,
    location: parsed.data.location,
    occurred_at: parsed.data.occurred_at || null,
    contact_name: meUser?.display_name ?? '',
    contact_line: parsed.data.contact_line || meUser?.email || '',
    image_url: ctx.file ? `/uploads/${ctx.file.originalname}` : null,
    reward: parsed.data.reward,
    owner_id: auth.sub,
  })
  return ok({ item }, 201)
}

async function getItem(ctx: ReqCtx, id: string): Promise<HandlerResult> {
  const item = await getStore().getItem(id)
  if (!item) return fail('ไม่พบประกาศนี้', 404)
  const meUser = bearer(ctx.headers)
  return ok({
    item: meUser ? { ...item, is_mine: item.owner_id === meUser.sub } : item,
    has_claimed: meUser
      ? (await getStore().listClaimsByUser(meUser.sub)).some((c) => c.item_id === item.id)
      : false,
  })
}

async function updateItem(ctx: ReqCtx, id: string): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const parsed = z
    .object({
      title: z.string().min(3).max(90).optional(),
      description: z.string().max(1200).optional(),
      category_id: z.string().nullable().optional(),
      location: z.string().max(120).optional(),
      occurred_at: z.string().nullable().optional(),
      contact_line: z.string().max(120).optional(),
      reward: z.coerce.number().int().min(0).max(100000).optional(),
      status: z.enum(['open', 'claimed', 'returned', 'closed']).optional(),
    })
    .safeParse(ctx.body)
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const item = await getStore().updateItem(id, parsed.data, auth.sub)
  if (!item) return fail('แก้ไขไม่ได้ เพราะไม่ใช่ประกาศของคุณ 🙃', 403)
  return ok({ item })
}

async function deleteItem(ctx: ReqCtx, id: string): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const deleted = await getStore().deleteItem(id, auth.sub)
  if (!deleted) return fail('ลบไม่ได้ เพราะไม่ใช่ประกาศของคุณ 🙃', 403)
  return ok({ ok: true })
}

// ───────────────────────────────────────────────────────────
//  🙋 claims + 🔔 notifications
// ───────────────────────────────────────────────────────────
async function createClaim(ctx: ReqCtx, itemId: string): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)

  const store = getStore()
  const item = await store.getItem(itemId)
  if (!item) return fail('ไม่พบประกาศนี้', 404)
  if (item.owner_id === auth.sub) return fail('ของตัวเอง จะมาเก็บเองทำไม 🤡')
  if (item.status === 'returned') return fail('ประกาศนี้ปิดรับเรียบร้อยแล้ว')

  const parsed = z.object({ message: z.string().max(600).default('') }).safeParse(ctx.body ?? {})
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const claim = await store.createClaim(item.id, auth.sub, parsed.data.message)
  if (!claim) return fail('คุณส่งคำขอนี้ไปแล้ว รอเจ้าของตอบนะ 👀', 409)
  return ok({ claim }, 201)
}

async function decideClaim(ctx: ReqCtx, id: string): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const parsed = z
    .object({ status: z.enum(['approved', 'rejected']) })
    .safeParse(ctx.body ?? {})
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const store = getStore()
  const claim = await store.updateClaim(id, parsed.data.status as ClaimStatus, auth.sub)
  if (!claim) return fail('อัปเดตไม่ได้ (ไม่ใช่เจ้าของประกาศ)', 403)

  const item = await store.getItem(claim.item_id)
  const verb = parsed.data.status === 'approved' ? 'อนุมัติแล้ว 🎉' : 'ปฏิเสธแล้ว'
  await store.notify(
    claim.claimant_id,
    claim.item_id,
    'review',
    `คำขอรับ "${item?.title ?? 'ของชิ้นเดิม'}" ของคุณถูก${verb}`
  )
  return ok({ claim, item })
}

// ───────────────────────────────────────────────────────────
//  🔔 watchlist
// ───────────────────────────────────────────────────────────
async function createWatch(ctx: ReqCtx): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const parsed = z
    .object({
      keyword: z.string().max(60).default(''),
      category_id: z.string().max(40).nullable().optional(),
      kind: z.enum(['lost', 'found']).nullable().optional(),
    })
    .safeParse(ctx.body ?? {})
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const { keyword, category_id, kind } = parsed.data
  if (!keyword.trim() && !category_id && !kind)
    return fail('เลือกอย่างน้อยหนึ่งอย่าง: คำค้น หมวด หรือประเภท')

  const watch = await getStore().createWatch({
    user_id: auth.sub,
    keyword: keyword.trim(),
    category_id: category_id || null,
    kind: kind || null,
  })
  return ok({ watch }, 201)
}

// ───────────────────────────────────────────────────────────
//  ⭐ reviews
// ───────────────────────────────────────────────────────────
async function createReview(ctx: ReqCtx): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const parsed = z
    .object({
      item_id: z.string().min(1, 'ไม่พบประกาศนี้'),
      target_id: z.string().min(1, 'ไม่พบผู้ใช้นี้'),
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().max(300).default(''),
    })
    .safeParse(ctx.body ?? {})
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const store = getStore()
  const { item_id, target_id, rating, comment } = parsed.data
  if (target_id === auth.sub) return fail('ให้คะแนนตัวเองไม่ได้นะ 🙃')

  const item = await store.getItem(item_id)
  if (!item) return fail('ไม่พบประกาศนี้', 404)
  if (item.status !== 'returned')
    return fail('ให้คะแนนได้หลังประกาศถูกปิดเป็น “คืนสำเร็จ” เท่านั้น')

  // ต้องเป็นคู่ (เจ้าของ ↔ ผู้ขอรับ) ที่มี claim อนุมัติสำเร็จบนประกาศนี้เท่านั้น
  const claims = await store.listClaimsForOwner(item.owner_id)
  const pair = (a: string, b: string) => [a, b].sort().join('|')
  const related = claims.some(
    (c) =>
      c.item_id === item_id &&
      c.status === 'approved' &&
      pair(c.claimant_id, item.owner_id) === pair(auth.sub, target_id)
  )
  if (!related) return fail('ให้คะแนนได้เฉพาะคู่ที่คืนของสำเร็จด้วยกันเท่านั้น', 403)

  const review = await store.addReview({
    reviewer_id: auth.sub,
    target_id,
    item_id,
    rating,
    comment,
  })
  if (!review) return fail('ให้คะแนนไปแล้วสำหรับเคสนี้', 409)

  const target = await store.findUserById(target_id)
  await store.notify(
    target_id,
    item_id,
    'review',
    `มีคนให้คะแนนคุณ ${rating} ดาว ⭐ (${item.title})`
  )
  return ok({ review, target }, 201)
}

// ───────────────────────────────────────────────────────────
//  💬 chat
// ───────────────────────────────────────────────────────────
async function listMessages(ctx: ReqCtx, itemId: string): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const store = getStore()
  if (!(await store.canAccessChat(itemId, auth.sub)))
    return fail('แชทนี้เปิดสำหรับเจ้าของประกาศและคนที่ขอรับของเท่านั้น', 403)
  return ok({ messages: await store.listMessages(itemId) })
}

async function sendMessage(ctx: ReqCtx, itemId: string): Promise<HandlerResult> {
  const auth = requireAuth(ctx)
  if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
  const parsed = z
    .object({ body: z.string().min(1, 'พิมพ์อะไรสักอย่างดีกว่า').max(800) })
    .safeParse(ctx.body ?? {})
  if (!parsed.success) return fail(parsed.error.issues[0].message)

  const store = getStore()
  if (!(await store.canAccessChat(itemId, auth.sub))) return fail('ส่งข้อความไม่ได้ในแชทนี้', 403)
  const message = await store.sendMessage(itemId, auth.sub, parsed.data.body.trim())
  return ok({ message }, 201)
}

// ───────────────────────────────────────────────────────────
//  🧭 router
// ───────────────────────────────────────────────────────────
export async function handleRequest(ctx: ReqCtx): Promise<HandlerResult> {
  const { method, path } = ctx
  const seg = path.split('/').filter(Boolean) // ['api','items','123']
  const [, resource, id, sub] = seg
  const store = getStore()

  // ── /api/health
  if (resource === 'health') return health()

  // ── /api/auth/*
  if (resource === 'auth') {
    if (id === 'register' && method === 'POST') return register(ctx)
    if (id === 'login' && method === 'POST') return login(ctx)
    if (id === 'me' && method === 'GET') return me(ctx)
    if (id === 'me' && method === 'PATCH') return updateMe(ctx)
  }

  // ── /api/items/*
  if (resource === 'items') {
    if (!id && method === 'GET') return listItems(ctx)
    if (!id && method === 'POST') return createItem(ctx)
    if (id === 'categories' && method === 'GET') return ok({ categories: await store.listCategories() })
    if (id === 'stats' && method === 'GET') return ok({ stats: await store.stats() })
    if (id && sub === 'messages' && method === 'GET') return listMessages(ctx, id)
    if (id && sub === 'messages' && method === 'POST') return sendMessage(ctx, id)
    if (id && method === 'GET') return getItem(ctx, id)
    if (id && method === 'PATCH') return updateItem(ctx, id)
    if (id && method === 'DELETE') return deleteItem(ctx, id)
  }

  // ── /api/claims/*
  if (resource === 'claims') {
    const auth = requireAuth(ctx)
    if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
    if (id === 'mine' && method === 'GET') return ok({ claims: await store.listClaimsByUser(auth.sub) })
    if (id === 'incoming' && method === 'GET')
      return ok({ claims: await store.listClaimsForOwner(auth.sub) })
    if (id && method === 'POST') return createClaim(ctx, id)
    if (id && method === 'PATCH') return decideClaim(ctx, id)
  }

  // ── /api/notifications
  if (resource === 'notifications') {
    const auth = requireAuth(ctx)
    if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
    if (method === 'GET') return ok({ notifications: await store.listNotifications(auth.sub) })
    if (id === 'read' && method === 'POST') {
      await store.markNotificationsRead(auth.sub)
      return ok({ ok: true })
    }
  }

  // ── /api/watches
  if (resource === 'watches') {
    const auth = requireAuth(ctx)
    if (!auth) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
    if (!id && method === 'GET') return ok({ watches: await store.listWatches(auth.sub) })
    if (!id && method === 'POST') return createWatch(ctx)
    if (id && method === 'DELETE') {
      const removed = await store.deleteWatch(id, auth.sub)
      if (!removed) return fail('ไม่พบรายการที่ติดตาม', 404)
      return ok({ ok: true })
    }
  }

  // ── /api/reputation/:userId
  if (resource === 'reputation' && id && method === 'GET') {
    if (!requireAuth(ctx)) return fail('กรุณาเข้าสู่ระบบก่อนนะ 👀', 401)
    const [reputation, reviews] = await Promise.all([
      store.reputation(id),
      store.listReviewsForUser(id),
    ])
    return ok({ reputation, reviews })
  }

  // ── /api/reviews
  if (resource === 'reviews' && method === 'POST') return createReview(ctx)

  // ── /api/admin/overview
  if (resource === 'admin' && id === 'overview') {
    const denied = requireAdmin(ctx)
    if (denied) return denied
    return ok({ overview: await store.adminOverview() })
  }

  return fail('ไม่พบเส้นทางนี้', 404)
}

export type { User, ItemStatus }
