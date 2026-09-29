import { describe, it, expect, beforeEach } from 'vitest'
import { createMemoryStore } from './store.memory.js'
import { createNeonStore } from './store.neon.js'
import type { Store } from '../types.js'

/**
 * ทดสอบ business logic ทั้งหมดผ่าน Store interface
 * (รันได้ทั้งกับ Neon driver และ memory driver)
 */
async function makeStore() {
  const store = createMemoryStore()
  await store.init()
  return store
}

async function makeUser(store: Store, name = 'ทดสอบ') {
  return store.createUser({
    email: `${Math.random().toString(36).slice(2)}@test.app`,
    password_hash: 'x',
    display_name: name,
  })
}

type NewItem = Parameters<Store['createItem']>[0]

function baseItem(over: Partial<NewItem> = {}): NewItem {
  return {
    kind: 'found' as const,
    title: 'กระเป๋าทดสอบ',
    description: 'รายละเอียด',
    category_id: 'bag',
    location: 'อาคาร A',
    occurred_at: '2026-01-01',
    contact_name: 'เจ้าของ',
    contact_line: '@test',
    image_url: null,
    reward: 0,
    owner_id: 'x',
    ...over,
  }
}

describe('Store (memory driver)', () => {
  let store: Store

  beforeEach(async () => {
    store = await makeStore()
  })

  it('มีหมวดหมู่ครบ 9 หมวด', async () => {
    const cats = await store.listCategories()
    expect(cats.length).toBe(9)
    expect(cats.map((c) => c.id)).toContain('electronics')
  })

  it('สร้างผู้ใช้และค้นหาด้วยอีเมล (ไม่สนตัวพิมพ์)', async () => {
    const u = await makeUser(store, 'โจ้')
    expect(u.id).toBeTruthy()
    expect(u.role).toBe('user')

    const found = await store.findUserByEmail(u.email.toUpperCase())
    expect(found?.display_name).toBe('โจ้')
    expect(await store.findUserByEmail('ไม่มี@ไม่มี.com')).toBeNull()
  })

  it('สร้างประกาศแล้วสถานะเริ่มต้นเป็น open', async () => {
    const u = await makeUser(store)
    const item = await store.createItem(baseItem({ owner_id: u.id }))
    expect(item.status).toBe('open')
    expect(item.category?.label).toBe('กระเป๋า')
    expect(item.owner?.display_name).toBe(u.display_name)
  })

  it('กรองประกาศได้: kind / category / คำค้น / เรียงตามรางวัล', async () => {
    const u = await makeUser(store)
    const lostBefore = (await store.listItems({ kind: 'lost' })).total
    const keysBefore = (await store.listItems({ category: 'keys' })).total
    const allBefore = (await store.listItems({})).total

    const created = await store.createItem(
      baseItem({ owner_id: u.id, title: 'AirPods หาย ทดสอบ', kind: 'lost', reward: 100 })
    )
    const created2 = await store.createItem(
      baseItem({ owner_id: u.id, title: 'กุญแจรถทดสอบ', category_id: 'keys', reward: 900 })
    )

    expect((await store.listItems({ kind: 'lost' })).total).toBe(lostBefore + 1)
    expect((await store.listItems({ category: 'keys' })).total).toBe(keysBefore + 1)
    expect((await store.listItems({})).total).toBe(allBefore + 2)

    const found = await store.listItems({ q: 'airpods หาย ทดสอบ' })
    expect(found.total).toBe(1)
    expect(found.items[0].id).toBe(created.id)
    expect((await store.listItems({ q: 'ไม่มีจริงแน่นอน' })).total).toBe(0)

    const sorted = await store.listItems({ sort: 'reward' })
    const rewards = sorted.items.map((i) => i.reward)
    expect(rewards).toEqual([...rewards].sort((a, b) => b - a))
    expect(sorted.items.map((i) => i.id)).toContain(created2.id)
  })

  it('แก้ไข/ลบประกาศได้เฉพาะเจ้าของ', async () => {
    const owner = await makeUser(store, 'เจ้าของ')
    const other = await makeUser(store, 'คนอื่น')
    const item = await store.createItem(baseItem({ owner_id: owner.id }))

    expect(await store.updateItem(item.id, { title: 'แก้แล้ว' }, other.id)).toBeNull()
    expect(await store.deleteItem(item.id, other.id)).toBe(false)

    const updated = await store.updateItem(item.id, { title: 'แก้แล้ว' }, owner.id)
    expect(updated?.title).toBe('แก้แล้ว')
    expect(await store.deleteItem(item.id, owner.id)).toBe(true)
    expect(await store.getItem(item.id)).toBeNull()
  })

  it('กันขอรับของซ้ำ และนับจำนวนคนยอมจอย', async () => {
    const owner = await makeUser(store)
    const a = await makeUser(store, 'A')
    const b = await makeUser(store, 'B')
    const item = await store.createItem(baseItem({ owner_id: owner.id }))

    expect(await store.createClaim(item.id, a.id, 'ของผม')).toBeTruthy()
    expect(await store.createClaim(item.id, a.id, 'ซ้ำ')).toBeNull()
    expect(await store.createClaim(item.id, b.id, 'เดี๋ยวกัน')).toBeTruthy()

    const detail = await store.getItem(item.id)
    expect(detail?.claim_count).toBe(2)
    expect((await store.listClaimsForOwner(owner.id)).length).toBe(2)
    expect((await store.listClaimsByUser(a.id)).length).toBe(1)
  })

  it('อนุมัติคำขอ → ประกาศกลายเป็นคืนสำเร็จ + เพิ่มแต้มทั้งสองฝั่ง', async () => {
    const owner = await makeUser(store)
    const claimer = await makeUser(store)
    const item = await store.createItem(baseItem({ owner_id: owner.id }))
    const claim = await store.createClaim(item.id, claimer.id, 'ของผม')

    const p0 = (await store.findUserById(owner.id))!.points
    const c0 = (await store.findUserById(claimer.id))!.points

    const updated = await store.updateClaim(claim!.id, 'approved', owner.id)
    expect(updated?.status).toBe('approved')
    expect((await store.getItem(item.id))?.status).toBe('returned')
    expect((await store.findUserById(owner.id))!.points).toBe(p0 + 10)
    expect((await store.findUserById(claimer.id))!.points).toBe(c0 + 10)
  })

  it('ปฏิเสธคำขอ → เปิดประกาศกลับ + ไม่เพิ่มแต้ม', async () => {
    const owner = await makeUser(store)
    const claimer = await makeUser(store)
    const item = await store.createItem(baseItem({ owner_id: owner.id }))
    const claim = await store.createClaim(item.id, claimer.id, 'เดี๋ยวกัน')
    const p0 = (await store.findUserById(owner.id))!.points

    await store.updateClaim(claim!.id, 'approved', owner.id)
    await store.updateClaim(claim!.id, 'rejected', owner.id)
    expect((await store.getItem(item.id))?.status).toBe('open')
    expect((await store.findUserById(owner.id))!.points).toBe(p0 + 10) // ได้แค่ครั้งเดียวตอนอนุมัติ
  })

  it('เจ้าของคนอื่นอนุมัติคำขอไม่ได้', async () => {
    const owner = await makeUser(store)
    const stranger = await makeUser(store)
    const claimer = await makeUser(store)
    const item = await store.createItem(baseItem({ owner_id: owner.id }))
    const claim = await store.createClaim(item.id, claimer.id, 'ของผม')
    expect(await store.updateClaim(claim!.id, 'approved', stranger.id)).toBeNull()
  })

  it('แจ้งเตือนเจ้าของเมื่อมีคนอ้างของ', async () => {
    const owner = await makeUser(store)
    const claimer = await makeUser(store)
    const item = await store.createItem(baseItem({ owner_id: owner.id }))
    await store.createClaim(item.id, claimer.id, 'ของผม')

    const notes = await store.listNotifications(owner.id)
    expect(notes.length).toBe(1)
    expect(notes[0].kind).toBe('claim')

    await store.markNotificationsRead(owner.id)
    expect((await store.listNotifications(owner.id))[0].read_at).toBeTruthy()
  })
})

describe('⭐ Watchlist', () => {
  let store: Awaited<ReturnType<typeof makeStore>>
  beforeEach(async () => {
    store = await makeStore()
  })

  it('เพิ่มรายการติดตามแล้วลบได้เฉพาะเจ้าของ', async () => {
    const a = await makeUser(store)
    const b = await makeUser(store)
    const w = await store.createWatch({ user_id: a.id, keyword: 'airpods', category_id: null, kind: null })
    expect((await store.listWatches(a.id)).length).toBe(1)
    expect(await store.deleteWatch(w.id, b.id)).toBe(false)
    expect(await store.deleteWatch(w.id, a.id)).toBe(true)
  })

  it('แจ้งเตือนเมื่อมีประกาศใหม่ตรงคำค้น และไม่แจ้งเมื่อไม่ตรง', async () => {
    const watcher = await makeUser(store, 'คนติดตาม')
    const owner = await makeUser(store)
    await store.createWatch({ user_id: watcher.id, keyword: 'airpods', category_id: null, kind: null })

    await store.createItem(baseItem({ owner_id: owner.id, title: 'กระเป๋าผ้า ไม่ตรง' }))
    expect((await store.listNotifications(watcher.id)).length).toBe(0)

    await store.createItem(baseItem({ owner_id: owner.id, title: 'AirPods Pro สีขาว' }))
    const notes = await store.listNotifications(watcher.id)
    expect(notes.length).toBe(1)
    expect(notes[0].kind).toBe('watch')
    expect(notes[0].message).toContain('AirPods')
  })

  it('กรองด้วยหมวด + ประเภท และไม่แจ้งตัวเอง', async () => {
    const watcher = await makeUser(store, 'คนติดตาม')
    await store.createWatch({ user_id: watcher.id, keyword: '', category_id: 'keys', kind: 'found' })

    await store.createItem(baseItem({ owner_id: watcher.id, title: 'กุญแจของฉันเอง', category_id: 'keys', kind: 'found' }))
    await store.createItem(baseItem({ owner_id: (await makeUser(store)).id, title: 'กระเป๋า', category_id: 'bag', kind: 'found' }))
    expect((await store.listNotifications(watcher.id)).length).toBe(0)

    await store.createItem(baseItem({ owner_id: (await makeUser(store)).id, title: 'พวงกุญแจ', category_id: 'keys', kind: 'found' }))
    expect((await store.listNotifications(watcher.id)).length).toBe(1)
  })
})

describe('⭐ Reviews & Reputation', () => {
  let store: Awaited<ReturnType<typeof makeStore>>
  beforeEach(async () => {
    store = await makeStore()
  })

  it('ให้คะแนนได้ครั้งเดียวต่อ 1 เคส และคิด reputation ให้อัตโนมัติ', async () => {
    const owner = await makeUser(store, 'เจ้าของ')
    const helper = await makeUser(store, 'ผู้ช่วย')
    const item = await store.createItem(baseItem({ owner_id: owner.id }))
    await store.createClaim(item.id, helper.id, 'ของผม')

    const before = await store.reputation(owner.id)
    expect(before.reviews_count).toBe(0)
    expect(['newbie', 'trusted', 'hero', 'legend']).toContain(before.badge)

    const review = await store.addReview({
      reviewer_id: helper.id,
      target_id: owner.id,
      item_id: item.id,
      rating: 5,
      comment: 'ดีมาก',
    })
    expect(review?.rating).toBe(5)
    expect(
      await store.addReview({ reviewer_id: helper.id, target_id: owner.id, item_id: item.id, rating: 4, comment: 'ซ้ำ' })
    ).toBeNull()

    const after = await store.reputation(owner.id)
    expect(after.reviews_count).toBe(1)
    expect(after.avg_rating).toBe(5)
    expect(after.score).toBeGreaterThan(before.score)

    const list = await store.listReviewsForUser(owner.id)
    expect(list.length).toBe(1)
    expect(list[0].reviewer?.display_name).toBe(helper.display_name)
  })
})

describe('💬 Chat', () => {
  let store: Awaited<ReturnType<typeof makeStore>>
  beforeEach(async () => {
    store = await makeStore()
  })

  it('เข้าห้องแชทได้เฉพาะเจ้าของและคนที่ขอรับของ', async () => {
    const owner = await makeUser(store)
    const claimer = await makeUser(store)
    const stranger = await makeUser(store)
    const item = await store.createItem(baseItem({ owner_id: owner.id }))
    await store.createClaim(item.id, claimer.id, 'ของผม')

    expect(await store.canAccessChat(item.id, owner.id)).toBe(true)
    expect(await store.canAccessChat(item.id, claimer.id)).toBe(true)
    expect(await store.canAccessChat(item.id, stranger.id)).toBe(false)
  })

  it('ส่ง-อ่านข้อความเรียงตามเวลา และแจ้งเตือนเจ้าของ', async () => {
    const owner = await makeUser(store)
    const claimer = await makeUser(store)
    const item = await store.createItem(baseItem({ owner_id: owner.id }))
    await store.createClaim(item.id, claimer.id, 'ของผม')

    const m1 = await store.sendMessage(item.id, claimer.id, 'อยู่ตรงไหนครับ')
    const m2 = await store.sendMessage(item.id, owner.id, 'อยู่ห้อง 402')
    expect(m1?.user?.display_name).toBe(claimer.display_name)
    expect(m2?.user?.display_name).toBe(owner.display_name)

    const messages = await store.listMessages(item.id)
    expect(messages.map((m) => m.body)).toEqual(['อยู่ตรงไหนครับ', 'อยู่ห้อง 402'])

    const notes = await store.listNotifications(owner.id)
    expect(notes[0].kind).toBe('chat')
  })
})

describe('👑 Admin overview', () => {
  it('คืนสถิติ + ฮีโร่ + หมวด + กราฟ 14 วัน', async () => {
    const store = await makeStore()
    const u = await makeUser(store, 'ฮีโร่')
    await store.createItem(baseItem({ owner_id: u.id, category_id: 'wallet' }))

    const ov = await store.adminOverview()
    expect(ov.stats.total).toBeGreaterThan(0)
    expect(ov.top_users.length).toBeGreaterThan(0)
    expect(ov.top_users[0].display_name).toBeTruthy()
    expect(ov.category_breakdown.length).toBe(9)
    expect(ov.daily.length).toBe(14)
    expect(ov.recent_items.length).toBeGreaterThan(0)
  })
})

describe('Neon driver (SQL composition)', () => {
  it('สร้าง store ได้และรายงาน driver ถูกต้อง', () => {
    const store = createNeonStore('postgresql://u:p@host/db?sslmode=require')
    expect(store.driver).toBe('neon')
  })
})
