import { test, expect } from './fixtures'

const API = 'http://localhost:8787'

test.describe('REST API (contract)', () => {
  test('health บอก driver ที่ใช้งาน', async ({ request }) => {
    const res = await request.get(`${API}/api/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(['neon', 'memory']).toContain(body.driver)
  })

  test('categories ครบ 9 หมวด + stats มีตัวเลข', async ({ request }) => {
    const cats = await (await request.get(`${API}/api/items/categories`)).json()
    expect(cats.categories.length).toBe(9)

    const stats = await (await request.get(`${API}/api/items/stats`)).json()
    expect(stats.stats.total).toBeGreaterThan(0)
  })

  test('ปกป้อง route ที่ต้อง login', async ({ request }) => {
    const res = await request.post(`${API}/api/items`, { data: { kind: 'found', title: 'hack' } })
    expect(res.status()).toBe(401)
    expect((await res.json()).error).toContain('เข้าสู่ระบบ')
  })

  test('register → ปลดล็อกประกาศ → แก้ → ลบ', async ({ request }) => {
    const email = `api-${Date.now()}@test.app`
    const reg = await request.post(`${API}/api/auth/register`, {
      data: { email, password: 'api-password-1', display_name: 'API Tester', campus: 'บูรพา' },
    })
    expect(reg.status()).toBe(201)
    const { token } = await reg.json()
    expect(token).toBeTruthy()

    const auth = { headers: { Authorization: `Bearer ${token}` } }
    const me = await (await request.get(`${API}/api/auth/me`, auth)).json()
    expect(me.user.email).toBe(email)

    const created = await request.post(`${API}/api/items`, {
      ...auth,
      data: {
        kind: 'found',
        title: 'API ทดสอบของชิ้น',
        description: 'สร้างผ่าน REST',
        category_id: 'other',
        location: 'ห้องทดสอบ',
        occurred_at: '2026-01-01',
        contact_line: '@api',
        reward: 0,
      },
    })
    expect(created.status()).toBe(201)
    const { item } = await created.json()
    expect(item.status).toBe('open')

    const detail = await (await request.get(`${API}/api/items/${item.id}`, auth)).json()
    expect(detail.item.is_mine).toBe(true)

    const patched = await request.patch(`${API}/api/items/${item.id}`, {
      ...auth,
      data: { status: 'returned' },
    })
    expect((await patched.json()).item.status).toBe('returned')

    const del = await request.delete(`${API}/api/items/${item.id}`, auth)
    expect(del.ok()).toBeTruthy()
  })

  test('validation: ข้อมูลไม่ครบ → 400 พร้อมข้อความไทย', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      data: { email: 'not-an-email', password: '123', display_name: 'x' },
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).error).toBeTruthy()
  })

  test('admin route ปฏิเสธผู้ใช้ทั่วไป (403)', async ({ request }) => {
    const reg = await request.post(`${API}/api/auth/register`, {
      data: { email: `plain-${Date.now()}@test.app`, password: 'plain-password', display_name: 'Plain' },
    })
    const { token } = await reg.json()
    const res = await request.get(`${API}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(403)
  })
})
