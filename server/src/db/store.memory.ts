/**
 * Demo driver — ใช้เมื่อยังไม่ได้ตั้งค่า DATABASE_URL (Neon)
 * ข้อมูลอยู่ใน memory เท่านั้น รีสตาร์ทเซิร์ฟเวอร์แล้วหาย ใช้สำหรับเปิดดู UI เท่านั้น
 */
import { randomUUID } from 'node:crypto'
import type {
  Claim,
  ClaimStatus,
  ClaimWithMeta,
  Category,
  Item,
  ItemWithMeta,
  ListItemsQuery,
  NotificationRow,
  Stats,
  Store,
  User,
  UserWithSecret,
} from '../types.js'
import { CATEGORIES } from '../data/categories.js'
import { DEMO_ITEMS, DEMO_USERS } from '../data/demo.js'

export function createMemoryStore(): Store {
  const users: UserWithSecret[] = DEMO_USERS.map((u) => ({ ...u }))
  const items: Item[] = []
  const claims: Claim[] = []
  const notifications: NotificationRow[] = []
  const cats: Category[] = [...CATEGORIES]

  const now = Date.now()
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString()

  for (const [i, d] of DEMO_ITEMS.entries()) {
    items.push({
      id: randomUUID(),
      kind: d.kind,
      title: d.title,
      description: d.description,
      category_id: d.category_id,
      location: d.location,
      occurred_at: d.occurred_at,
      contact_name: '',
      contact_line: d.contact_line,
      image_url: null,
      reward: d.reward,
      status: d.status,
      owner_id: users[d.owner_index % users.length].id,
      created_at: daysAgo(i * 0.7 + 0.2),
    })
  }

  const decorate = (item: Item): ItemWithMeta => {
    const owner = users.find((u) => u.id === item.owner_id)
    return {
      ...item,
      category: cats.find((c) => c.id === item.category_id) ?? null,
      owner: owner
        ? {
            id: owner.id,
            display_name: owner.display_name,
            avatar_emoji: owner.avatar_emoji,
            campus: owner.campus,
          }
        : null,
      claim_count: claims.filter((c) => c.item_id === item.id).length,
    }
  }

  const claimMeta = (c: Claim, perspective: 'owner' | 'claimant'): ClaimWithMeta => {
    const item = items.find((i) => i.id === c.item_id) ?? null
    const person = users.find((u) => u.id === (perspective === 'owner' ? c.claimant_id : item?.owner_id))
    return {
      ...c,
      item: item
        ? ({ id: item.id, title: item.title, kind: item.kind, status: item.status } as Item)
        : null,
      claimant: person
        ? {
            id: person.id,
            display_name: person.display_name,
            avatar_emoji: person.avatar_emoji,
          }
        : null,
    }
  }

  return {
    driver: 'memory',

    async init() {},

    async listCategories() {
      return cats
    },

    async createUser(input) {
      const user: UserWithSecret = {
        id: randomUUID(),
        email: input.email,
        password_hash: input.password_hash,
        display_name: input.display_name,
        avatar_emoji: input.avatar_emoji ?? '🫥',
        campus: input.campus ?? null,
        bio: '',
        role: 'user',
        points: 0,
        created_at: new Date().toISOString(),
      }
      users.push(user)
      return user
    },

    async findUserByEmail(email) {
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
    },

    async findUserById(id) {
      const u = users.find((x) => x.id === id)
      if (!u) return null
      const { password_hash, ...rest } = u
      return rest as User
    },

    async updateUser(id, patch) {
      const u = users.find((x) => x.id === id)
      if (!u) return null
      Object.assign(u, patch)
      const { password_hash, ...rest } = u
      return rest as User
    },

    async listItems(query: ListItemsQuery) {
      let list = items.slice()
      const q = query.q?.trim().toLowerCase()
      if (q) {
        list = list.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q) ||
            i.location.toLowerCase().includes(q)
        )
      }
      if (query.kind && query.kind !== 'all') list = list.filter((i) => i.kind === query.kind)
      if (query.status && query.status !== 'all')
        list = list.filter((i) => i.status === query.status)
      if (query.category && query.category !== 'all')
        list = list.filter((i) => i.category_id === query.category)
      if (query.ownerId) list = list.filter((i) => i.owner_id === query.ownerId)
      if (query.claimedBy)
        list = list.filter((i) =>
          claims.some((c) => c.item_id === i.id && c.claimant_id === query.claimedBy)
        )

      const sort = query.sort ?? 'new'
      list.sort((a, b) => {
        if (sort === 'reward') return b.reward - a.reward
        if (sort === 'hot') {
          const ac = claims.filter((c) => c.item_id === a.id).length
          const bc = claims.filter((c) => c.item_id === b.id).length
          return bc - ac
        }
        return b.created_at.localeCompare(a.created_at)
      })

      const total = list.length
      const offset = query.offset ?? 0
      const limit = query.limit ?? 24
      return { items: list.slice(offset, offset + limit).map(decorate), total }
    },

    async getItem(id) {
      const item = items.find((i) => i.id === id)
      return item ? decorate(item) : null
    },

    async createItem(input) {
      const item: Item = {
        ...input,
        id: randomUUID(),
        status: 'open',
        created_at: new Date().toISOString(),
      }
      items.unshift(item)
      return decorate(item)
    },

    async updateItem(id, patch, ownerId) {
      const item = items.find((i) => i.id === id && i.owner_id === ownerId)
      if (!item) return null
      Object.assign(item, patch)
      return decorate(item)
    },

    async deleteItem(id, ownerId) {
      const idx = items.findIndex((i) => i.id === id && i.owner_id === ownerId)
      if (idx === -1) return false
      items.splice(idx, 1)
      for (let i = claims.length - 1; i >= 0; i--) if (claims[i].item_id === id) claims.splice(i, 1)
      return true
    },

    async createClaim(itemId, claimantId, message) {
      if (claims.some((c) => c.item_id === itemId && c.claimant_id === claimantId)) return null
      const claim: Claim = {
        id: randomUUID(),
        item_id: itemId,
        claimant_id: claimantId,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      }
      claims.unshift(claim)
      return claim
    },

    async listClaimsForOwner(ownerId) {
      const mine = items.filter((i) => i.owner_id === ownerId).map((i) => i.id)
      return claims.filter((c) => mine.includes(c.item_id)).map((c) => claimMeta(c, 'owner'))
    },

    async listClaimsByUser(userId) {
      return claims.filter((c) => c.claimant_id === userId).map((c) => claimMeta(c, 'claimant'))
    },

    async updateClaim(id, status: ClaimStatus, ownerId) {
      const claim = claims.find((c) => c.id === id)
      if (!claim) return null
      const item = items.find((i) => i.id === claim.item_id)
      if (!item || item.owner_id !== ownerId) return null
      claim.status = status
      if (status === 'approved' && item.status !== 'returned') item.status = 'returned'
      if (status === 'rejected' && item.status === 'returned') item.status = 'open'
      return claimMeta(claim, 'owner')
    },

    async notify(userId, itemId, kind, message) {
      notifications.unshift({
        id: randomUUID(),
        user_id: userId,
        item_id: itemId,
        kind,
        message,
        read_at: null,
        created_at: new Date().toISOString(),
      })
    },

    async listNotifications(userId) {
      return notifications.filter((n) => n.user_id === userId).slice(0, 50)
    },

    async markNotificationsRead(userId) {
      for (const n of notifications) if (n.user_id === userId && !n.read_at) n.read_at = new Date().toISOString()
    },

    async stats(): Promise<Stats> {
      const total = items.length
      const returned = items.filter((i) => i.status === 'returned').length
      return {
        total,
        lost: items.filter((i) => i.kind === 'lost').length,
        found: items.filter((i) => i.kind === 'found').length,
        open: items.filter((i) => i.status === 'open').length,
        returned,
        resolvedRate: total ? Math.round((returned / total) * 100) : 0,
        members: users.length,
        claims: claims.length,
      }
    },
  }
}
