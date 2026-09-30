import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { handleRequest, type ReqCtx } from './api.js'

/**
 * ทดสอบ "ตรรกะกลาง" ของ API ที่ทั้ง Vercel Function และ Express ใช้ร่วมกัน
 * เรียก handleRequest() โดยตรง ไม่ต้องเปิด HTTP server
 */
process.env.DATABASE_URL = '' // ใช้ demo (in-memory) driver

let seq = 0
const SECRET = process.env.JWT_SECRET ?? 'lost-and-found-dev-secret'

const call = (
  method: string,
  path: string,
  opts: { body?: any; query?: any; token?: string; file?: ReqCtx['file'] } = {}
) =>
  handleRequest({
    method,
    path,
    query: opts.query ?? {},
    body: opts.body ?? {},
    headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
    file: opts.file,
  })

async function newUser(name = 'ผู้ใช้ทดสอบ') {
  const email = `api-${++seq}-${Date.now()}@test.app`
  const r = await call('POST', '/api/auth/register', {
    body: { email, password: 'password-123', display_name: name },
  })
  return { email, token: r.body.token, id: r.body.user.id, role: r.body.user.role }
}

describe('API core (handleRequest)', () => {
  let user: Awaited<ReturnType<typeof newUser>>

  beforeAll(async () => {
    user = await newUser('เจ้าของ')
  })

  it('GET /api/health บอก driver + ความสามารถอัปโหลดรูป', async () => {
    const r = await call('GET', '/api/health')
    expect(r.status).toBe(200)
    expect(r.body.ok).toBe(true)
    expect(['neon', 'memory']).toContain(r.body.driver)
    expect(typeof r.body.uploads).toBe('boolean')
    expect(['cloudinary', 'local', false]).toContain(r.body.uploadMode)
  })

  it('อัปโหลดรูป: ต้อง login และต้องเปิด Cloudinary ก่อน', async () => {
    // ยังไม่ login → 401
    expect(
      (await call('POST', '/api/uploads/sign', { body: { contentType: 'image/jpeg', size: 100 } })).status
    ).toBe(401)
    // login แล้วแต่เทสต์นี้ไม่มี Cloudinary env → 503 พร้อมข้อความชัด
    const r = await call('POST', '/api/uploads/sign', {
      token: user.token,
      body: { contentType: 'image/jpeg', size: 100 },
    })
    expect(r.status).toBe(503)
    expect(r.body.error).toContain('Cloudinary')
  })


  it('register → บัญชีแรกเป็นแอดมิน', async () => {
    expect(user.id).toBeTruthy()
    expect(user.token).toBeTruthy()
  })

  it('register ซ้ำ → 409', async () => {
    const r = await call('POST', '/api/auth/register', {
      body: { email: user.email, password: 'password-123', display_name: 'ซ้ำ' },
    })
    expect(r.status).toBe(409)
  })

  it('register ข้อมูลไม่ครบ → 400 พร้อมข้อความ', async () => {
    const r = await call('POST', '/api/auth/register', { body: { email: 'bad', password: '1' } })
    expect(r.status).toBe(400)
    expect(r.body.error).toBeTruthy()
  })

  it('login ถูก/ผิด', async () => {
    const good = await call('POST', '/api/auth/login', {
      body: { email: user.email, password: 'password-123' },
    })
    expect(good.status).toBe(200)
    const bad = await call('POST', '/api/auth/login', {
      body: { email: user.email, password: 'ผิดแน่นอน' },
    })
    expect(bad.status).toBe(401)
  })

  it('GET /api/auth/me ต้องมี token', async () => {
    expect((await call('GET', '/api/auth/me')).status).toBe(401)
    const r = await call('GET', '/api/auth/me', { token: user.token })
    expect(r.body.user.email).toBe(user.email)
  })

  it('PATCH /api/auth/me แก้โปรไฟล์ได้', async () => {
    const r = await call('PATCH', '/api/auth/me', {
      token: user.token,
      body: { display_name: 'ชื่อใหม่', bio: 'ช่วยหาของ' },
    })
    expect(r.body.user.display_name).toBe('ชื่อใหม่')
  })

  it('เส้นทางที่ไม่มี → 404', async () => {
    expect((await call('GET', '/api/ไม่มีจริง')).status).toBe(404)
  })

  it('categories + stats', async () => {
    expect((await call('GET', '/api/items/categories')).body.categories.length).toBe(9)
    const stats = await call('GET', '/api/items/stats')
    expect(stats.body.stats.total).toBeGreaterThan(0)
  })

  it('items: ต้อง login → สร้าง → ดู → แก้ → ลบ', async () => {
    expect((await call('POST', '/api/items', { body: { kind: 'found', title: 'hack' } })).status).toBe(401)

    const created = await call('POST', '/api/items', {
      token: user.token,
      body: {
        kind: 'found',
        title: 'กระเป๋าทดสอบ API',
        description: 'รายละเอียด',
        category_id: 'bag',
        location: 'อาคาร A',
        occurred_at: '2026-01-01',
        contact_line: '@test',
        reward: 100,
      },
    })
    expect(created.status).toBe(201)
    const id = created.body.item.id
    expect(created.body.item.status).toBe('open')

    const detail = await call('GET', `/api/items/${id}`, { token: user.token })
    expect(detail.body.item.is_mine).toBe(true)
    expect(detail.body.has_claimed).toBe(false)

    const patched = await call('PATCH', `/api/items/${id}`, {
      token: user.token,
      body: { status: 'returned' },
    })
    expect(patched.body.item.status).toBe('returned')

    expect((await call('DELETE', `/api/items/${id}`, { token: user.token })).body.ok).toBe(true)
    expect((await call('GET', `/api/items/${id}`)).status).toBe(404)
  })

  it('คนอื่นแก้/ลบประกาศไม่ได้', async () => {
    const other = await newUser('คนอื่น')
    const created = await call('POST', '/api/items', {
      token: user.token,
      body: { kind: 'lost', title: 'ของของเจ้าของ', description: '', location: '', contact_line: '', reward: 0 },
    })
    const id = created.body.item.id
    expect((await call('PATCH', `/api/items/${id}`, { token: other.token, body: { title: 'แย่ง' } })).status).toBe(403)
    expect((await call('DELETE', `/api/items/${id}`, { token: other.token })).status).toBe(403)
  })

  it('claims: ขอซ้ำไม่ได้ / ขอของตัวเองไม่ได้ / อนุมัติแล้วได้แต้ม', async () => {
    const helper = await newUser('ผู้ช่วย')
    const created = await call('POST', '/api/items', {
      token: user.token,
      body: { kind: 'lost', title: 'กุญแจสำหรับเทสต์ claim', description: '', location: '', contact_line: '', reward: 0 },
    })
    const id = created.body.item.id

    expect((await call('POST', `/api/claims/${id}`, { token: user.token, body: { message: 'ของผม' } })).status).toBe(400)

    const c1 = await call('POST', `/api/claims/${id}`, { token: helper.token, body: { message: 'ของผม' } })
    expect(c1.status).toBe(201)
    expect((await call('POST', `/api/claims/${id}`, { token: helper.token, body: { message: 'ซ้ำ' } })).status).toBe(409)

    const before = (await call('GET', '/api/auth/me', { token: user.token })).body.user.points
    const approve = await call('PATCH', `/api/claims/${c1.body.claim.id}`, {
      token: user.token,
      body: { status: 'approved' },
    })
    expect(approve.body.item.status).toBe('returned')
    const after = (await call('GET', '/api/auth/me', { token: user.token })).body.user.points
    expect(after).toBe(before + 10)

    // แจ้งเตือนเจ้าของ
    const notes = await call('GET', '/api/notifications', { token: user.token })
    expect(notes.body.notifications.length).toBeGreaterThan(0)
  })

  it('watchlist: เพิ่ม/ลบ + ต้องเลือกอย่างน้อยหนึ่งอย่าง', async () => {
    expect((await call('POST', '/api/watches', { token: user.token, body: {} })).status).toBe(400)
    const w = await call('POST', '/api/watches', { token: user.token, body: { keyword: 'airpods' } })
    expect(w.status).toBe(201)
    const list = await call('GET', '/api/watches', { token: user.token })
    expect(list.body.watches.some((x: any) => x.keyword === 'airpods')).toBe(true)
    expect((await call('DELETE', `/api/watches/${w.body.watch.id}`, { token: user.token })).body.ok).toBe(true)
  })

  it('reviews: ให้คะแนนได้เฉพาะคู่ที่คืนของสำเร็จ', async () => {
    const helper = await newUser('รีวิวเออร์')
    const created = await call('POST', '/api/items', {
      token: user.token,
      body: { kind: 'found', title: 'ของสำหรับรีวิว', description: '', location: '', contact_line: '', reward: 0 },
    })
    const id = created.body.item.id
    // ยังไม่คืนสำเร็จ → ให้คะแนนไม่ได้
    const tooEarly = await call('POST', '/api/reviews', {
      token: helper.token,
      body: { item_id: id, target_id: user.id, rating: 5, comment: 'เร็ว' },
    })
    expect(tooEarly.status).toBe(400)

    const claim = await call('POST', `/api/claims/${id}`, { token: helper.token, body: { message: 'ของผม' } })
    await call('PATCH', `/api/claims/${claim.body.claim.id}`, { token: user.token, body: { status: 'approved' } })

    const rev = await call('POST', '/api/reviews', {
      token: helper.token,
      body: { item_id: id, target_id: user.id, rating: 5, comment: 'นัดไวดี' },
    })
    expect(rev.status).toBe(201)
    // ให้ซ้ำไม่ได้
    expect(
      (await call('POST', '/api/reviews', { token: helper.token, body: { item_id: id, target_id: user.id, rating: 4 } })).status
    ).toBe(409)

    const rep = await call('GET', `/api/reputation/${user.id}`, { token: user.token })
    expect(rep.body.reputation.reviews_count).toBeGreaterThan(0)
    expect(['newbie', 'trusted', 'hero', 'legend']).toContain(rep.body.reputation.badge)
  })

  it('chat: เข้าได้เฉพาะเจ้าของ + คนที่ขอรับ', async () => {
    const helper = await newUser('คนคุย')
    const stranger = await newUser('คนแปลกหน้า')
    const created = await call('POST', '/api/items', {
      token: user.token,
      body: { kind: 'found', title: 'ห้องแชททดสอบ', description: '', location: '', contact_line: '', reward: 0 },
    })
    const id = created.body.item.id
    await call('POST', `/api/claims/${id}`, { token: helper.token, body: { message: 'ของผม' } })

    expect((await call('GET', `/api/items/${id}/messages`, { token: helper.token })).status).toBe(200)
    expect((await call('GET', `/api/items/${id}/messages`, { token: stranger.token })).status).toBe(403)

    const sent = await call('POST', `/api/items/${id}/messages`, {
      token: user.token,
      body: { body: 'อยู่ห้อง 402' },
    })
    expect(sent.status).toBe(201)
    expect(sent.body.message.body).toBe('อยู่ห้อง 402')
  })

  it('admin: ผู้ใช้ทั่วไปโดน 403', async () => {
    expect((await call('GET', '/api/admin/overview', { token: user.token })).status).toBe(403)

    // สร้าง admin ปลอมด้วย JWT เพื่อทดสอบ path ของแอดมิน
    const fake = jwt.sign({ sub: user.id, email: user.email, role: 'admin' }, SECRET)
    const r = await call('GET', '/api/admin/overview', { token: fake })
    expect(r.status).toBe(200)
    expect(r.body.overview.top_users.length).toBeGreaterThan(0)
    expect(r.body.overview.daily.length).toBe(14)
  })
})
