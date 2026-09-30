import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useItemsStore } from './items'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'
import { useExtrasStore } from './extras'

const fetchMock = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => '{}',
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function json(data: unknown, status = 200) {
  return { ok: status < 400, status, text: async () => JSON.stringify(data) }
}

const CATS = {
  categories: [
    { id: 'bag', label: 'กระเป๋า', emoji: '🎒', color: 'sky' },
    { id: 'keys', label: 'กุญแจ', emoji: '🔑', color: 'amber' },
  ],
}

const ITEMS = {
  total: 2,
  items: [
    { id: 'a', kind: 'found', title: 'AirPods', description: '', category_id: 'bag', location: 'A1', occurred_at: null, contact_name: '', contact_line: '', image_url: null, reward: 0, status: 'open', owner_id: 'o1', created_at: new Date().toISOString(), category: CATS.categories[0], owner: null, claim_count: 0 },
    { id: 'b', kind: 'lost', title: 'กุญแจ', description: '', category_id: 'keys', location: 'A2', occurred_at: null, contact_name: '', contact_line: '', image_url: null, reward: 100, status: 'open', owner_id: 'o2', created_at: new Date().toISOString(), category: CATS.categories[1], owner: null, claim_count: 2 },
  ],
}

describe('items store', () => {
  it('โหลดรายการและหมวดหมู่', async () => {
    fetchMock
      .mockResolvedValueOnce(json(ITEMS))
      .mockResolvedValueOnce(json(CATS))
      .mockResolvedValueOnce(json({ stats: { total: 2, lost: 1, found: 1, open: 2, returned: 0, resolvedRate: 0, members: 3, claims: 1 } }))

    const store = useItemsStore()
    await store.load()
    expect(store.items).toHaveLength(2)
    expect(store.total).toBe(2)
    expect(store.loading).toBe(false)

    await store.loadMeta()
    expect(store.categories).toHaveLength(2)
    expect(store.stats?.members).toBe(3)
  })

  it('สร้าง query string ตามตัวกรอง', async () => {
    const store = useItemsStore()
    store.filters.q = 'airpods'
    store.filters.kind = 'lost'
    store.filters.category = 'bag'
    store.filters.sort = 'reward'
    await store.load()

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('q=airpods')
    expect(url).toContain('kind=lost')
    expect(url).toContain('category=bag')
    expect(url).toContain('sort=reward')
  })

  it('ไม่ส่งพารามิเตอร์ที่เป็นค่า all', async () => {
    const store = useItemsStore()
    store.filters.kind = 'all'
    store.filters.category = 'all'
    store.filters.status = 'all'
    await store.load()
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).not.toContain('kind=')
    expect(url).not.toContain('category=')
    expect(url).not.toContain('status=')
  })

  it('setFilter เลื่อน offset กลับไป 0 และ resetFilters ล้างหมด', async () => {
    const store = useItemsStore()
    store.filters.offset = 24
    await store.setFilter('kind', 'found')
    expect(store.filters.offset).toBe(0)
    expect(store.filters.kind).toBe('found')

    store.filters.q = 'x'
    store.filters.category = 'keys'
    await store.resetFilters()
    expect(store.filters).toEqual({ kind: 'all', category: 'all', status: 'all', sort: 'new' })
  })
})

describe('auth store', () => {
  it('เก็บ token และผู้ใช้หลัง login และแนบ Authorization header ในคำขอถัดไป', async () => {
    const user = { id: 'u1', email: 'a@b.co', display_name: 'โจ้', avatar_emoji: '🕶️', campus: null, bio: '', role: 'user', points: 0, created_at: '' }
    fetchMock
      .mockResolvedValueOnce(json({ token: 'tok-1', user }))
      .mockResolvedValueOnce(json({ user }))

    const auth = useAuthStore()
    await auth.login('a@b.co', 'password123')
    expect(auth.isAuthed).toBe(true)
    expect(localStorage.getItem('lf_token')).toBe('tok-1')

    await auth.fetchMe()
    const headers = fetchMock.mock.calls[1][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer tok-1')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('register สร้าง session ให้อัตโนมัติ', async () => {
    const user = { id: 'u2', email: 'c@d.co', display_name: 'ฟ้า', avatar_emoji: '🌤️', campus: 'บูรพา', bio: '', role: 'admin', points: 100, created_at: '' }
    fetchMock.mockResolvedValueOnce(json({ token: 'tok-2', user, is_first: true }))

    const auth = useAuthStore()
    await auth.register({ email: 'c@d.co', password: 'password123', display_name: 'ฟ้า' })
    expect(auth.isAdmin).toBe(true)
  })

  it('token หมดอายุ (401) หรือผู้ใช้ไม่มีแล้ว (404) → ล้าง session', async () => {
    localStorage.setItem('lf_token', 'stale')
    fetchMock.mockResolvedValueOnce(json({ error: 'ไม่พบผู้ใช้' }, 404))
    const auth = useAuthStore()
    await auth.fetchMe()
    expect(auth.token).toBeNull()
    expect(localStorage.getItem('lf_token')).toBeNull()
    expect(auth.ready).toBe(true)
  })

  it('ไม่ยิงเครือข่ายถ้าไม่มี token', async () => {
    const auth = useAuthStore()
    await auth.fetchMe()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logout ล้าง token', async () => {
    const auth = useAuthStore()
    localStorage.setItem('lf_token', 'x')
    auth.logout()
    expect(auth.isAuthed).toBe(false)
    expect(localStorage.getItem('lf_token')).toBeNull()
  })
})

describe('toast store', () => {
  it('เพิ่ม toast แล้วหายเองตามเวลา (fake timers)', () => {
    vi.useFakeTimers()
    const toast = useToastStore()
    toast.success('บันทึกแล้ว', 'เรียบร้อย')
    expect(toast.toasts).toHaveLength(1)
    expect(toast.toasts[0].emoji).toBe('✅')

    vi.advanceTimersByTime(4300)
    expect(toast.toasts).toHaveLength(0)
  })

  it('dismiss ได้เอง', () => {
    const toast = useToastStore()
    toast.party('คืนของแล้ว!')
    const id = toast.toasts[0].id
    toast.dismiss(id)
    expect(toast.toasts).toHaveLength(0)
  })
})

describe('extras store (watchlist + chat)', () => {
  it('โหลด watchlist เฉพาะเมื่อ login แล้ว', async () => {
    const extras = useExtrasStore()
    await extras.loadWatches()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(extras.watches).toHaveLength(0)
  })

  it('เพิ่ม watchlist แล้วนำขึ้นหัวรายการ', async () => {
    const extras = useExtrasStore()
    const watch = { id: 'w1', user_id: 'u1', keyword: 'airpods', category_id: null, kind: null, active: true, created_at: '', category: null }
    fetchMock.mockResolvedValueOnce(json({ watch }))

    await extras.addWatch({ keyword: 'airpods', category_id: null, kind: null })
    expect(extras.watches).toHaveLength(1)
    expect(extras.watchCount).toBe(1)
  })

  it('ลบ watchlist ได้', async () => {
    const extras = useExtrasStore()
    extras.watches.push({ id: 'w1', user_id: 'u1', keyword: 'x', category_id: null, kind: null, active: true, created_at: '', category: null } as any)
    fetchMock.mockResolvedValueOnce(json({ ok: true }))
    await extras.removeWatch('w1')
    expect(extras.watches).toHaveLength(0)
  })

  it('ส่งข้อความแล้วต่อท้ายในแชท', async () => {
    const extras = useExtrasStore()
    extras.chatItemId = 'item-1'
    const message = { id: 'm1', item_id: 'item-1', user_id: 'u1', body: 'สวัสดี', created_at: '', user: null }
    fetchMock.mockResolvedValueOnce(json({ message }))
    await extras.send('สวัสดี')
    expect(extras.messages).toHaveLength(1)
    expect(extras.messages[0].body).toBe('สวัสดี')
  })

  it('ถูกตัดสิทธิ์แชท (403) → ปิดแชทอัตโนมัติ', async () => {
    const extras = useExtrasStore()
    extras.chatOpen = true
    fetchMock.mockResolvedValueOnce(json({ error: 'ไม่มีสิทธิ์' }, 403))
    await extras.loadChat('item-1')
    expect(extras.chatOpen).toBe(false)
    expect(extras.messages).toHaveLength(0)
  })
})
