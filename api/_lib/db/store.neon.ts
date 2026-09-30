import type {
  AdminOverview,
  Category,
  Claim,
  ClaimStatus,
  Item,
  ItemWithMeta,
  ListItemsQuery,
  Stats,
  Store,
  User,
} from '../types.js'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { CATEGORIES } from '../data/categories.js'

const ITEM_SELECT = `
  select i.*,
         c.id as cat_id, c.label as cat_label, c.emoji as cat_emoji, c.color as cat_color,
         u.id as own_id, u.display_name as own_name, u.avatar_emoji as own_emoji, u.campus as own_campus,
         (select count(*) from claims cl where cl.item_id = i.id) as claim_count
  from items i
  left join categories c on c.id = i.category_id
  left join users u on u.id = i.owner_id
`

type Row = Record<string, any>

function mapItem(row: Row): ItemWithMeta {
  const item: Item = {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    category_id: row.category_id,
    location: row.location,
    occurred_at: row.occurred_at,
    contact_name: row.contact_name,
    contact_line: row.contact_line,
    image_url: row.image_url,
    reward: row.reward,
    status: row.status,
    owner_id: row.owner_id,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }
  return {
    ...item,
    category: row.cat_id
      ? { id: row.cat_id, label: row.cat_label, emoji: row.cat_emoji, color: row.cat_color }
      : null,
    owner: row.own_id
      ? {
          id: row.own_id,
          display_name: row.own_name,
          avatar_emoji: row.own_emoji,
          campus: row.own_campus,
        }
      : null,
    claim_count: Number(row.claim_count ?? 0),
  }
}

const SORTS: Record<string, string> = {
  new: 'i.created_at desc',
  hot: 'claim_count desc, i.created_at desc',
  reward: 'i.reward desc, i.created_at desc',
}

export function createNeonStore(url: string): Store {
  const sql: NeonQueryFunction<false, false> = neon(url) as any

  async function all<T = Row>(text: string, params: any[] = []): Promise<T[]> {
    const res = (await sql.query(text, params)) as any
    // @neondatabase/serverless v1.1 คืน array ตรง ๆ, เวอร์ชันเก่าคืน { rows }
    if (Array.isArray(res)) return res as T[]
    return (res?.rows ?? []) as T[]
  }

  async function one<T = Row>(text: string, params: any[] = []): Promise<T | null> {
    const rows = await all<T>(text, params)
    return rows[0] ?? null
  }

  return {
    driver: 'neon',

    async init() {
      // สร้างตาราง + seed หมวดหมู่ (idempotent)
      for (const c of CATEGORIES) {
        await sql.query(
          `insert into categories (id, label, emoji, color) values ($1, $2, $3, $4)
           on conflict (id) do update set label = excluded.label, emoji = excluded.emoji, color = excluded.color`,
          [c.id, c.label, c.emoji, c.color]
        )
      }
    },

    async listCategories(): Promise<Category[]> {
      return all<Category>(`select * from categories order by id`)
    },

    async createUser(input) {
      const rows = await all<Row>(
        `insert into users (email, password_hash, display_name, avatar_emoji, campus, role, points)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning *`,
        [
          input.email,
          input.password_hash,
          input.display_name,
          input.avatar_emoji ?? '🫥',
          input.campus ?? null,
          input.role ?? 'user',
          input.role === 'admin' ? 100 : 0,
        ]
      )
      return rows[0] as User
    },

    async findUserByEmail(email) {
      return one<any>(`select * from users where email = $1`, [email])
    },

    async findUserById(id) {
      return one<any>(`select * from users where id = $1`, [id])
    },

    async updateUser(id, patch) {
      const current = await one<any>(`select * from users where id = $1`, [id])
      if (!current) return null
      const next = { ...current, ...patch }
      const row = await one<any>(
        `update users set display_name = $2, avatar_emoji = $3, campus = $4, bio = $5
         where id = $1 returning *`,
        [id, next.display_name, next.avatar_emoji, next.campus ?? null, next.bio ?? '']
      )
      return row as User
    },

    async listItems(query: ListItemsQuery) {
      const where: string[] = []
      const params: any[] = []
      const p = (v: any) => `$${params.push(v)}`

      if (query.q) {
        where.push(
          `(i.title ilike ${p(`%${query.q}%`)} or i.description ilike ${p(
            `%${query.q}%`
          )} or i.location ilike ${p(`%${query.q}%`)})`
        )
      }
      if (query.kind && query.kind !== 'all') where.push(`i.kind = ${p(query.kind)}`)
      if (query.status && query.status !== 'all') where.push(`i.status = ${p(query.status)}`)
      if (query.category && query.category !== 'all') where.push(`i.category_id = ${p(query.category)}`)
      if (query.ownerId) where.push(`i.owner_id = ${p(query.ownerId)}`)
      if (query.claimedBy) {
        where.push(
          `exists (select 1 from claims c2 where c2.item_id = i.id and c2.claimant_id = ${p(
            query.claimedBy
          )})`
        )
      }
      const whereSql = where.length ? `where ${where.join(' and ')}` : ''

      const countRow = await one<Row>(
        `select count(*)::int as total from items i ${whereSql}`,
        params
      )
      const total = Number(countRow?.total ?? 0)

      const limit = Math.min(Math.max(query.limit ?? 24, 1), 100)
      const offset = Math.max(query.offset ?? 0, 0)
      const rows = await all<Row>(
        `${ITEM_SELECT} ${whereSql}
         order by ${SORTS[query.sort ?? 'new'] ?? SORTS.new}
         limit ${limit} offset ${offset}`,
        params
      )
      return { items: rows.map(mapItem), total }
    },

    async getItem(id) {
      const row = await one<Row>(`${ITEM_SELECT} where i.id = $1`, [id])
      return row ? mapItem(row) : null
    },

    async createItem(input) {
      const row = await one<Row>(
        `insert into items
          (kind, title, description, category_id, location, occurred_at, contact_name, contact_line, image_url, reward, owner_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
        [
          input.kind,
          input.title,
          input.description,
          input.category_id,
          input.location,
          input.occurred_at,
          input.contact_name,
          input.contact_line,
          input.image_url,
          input.reward,
          input.owner_id,
        ]
      )
      const created = (await this.getItem(row!.id))!
      await this.notifyWatchers(created)
      return created
    },

    async updateItem(id, patch, ownerId) {
      const row = await one<Row>(
        `update items set
           title = coalesce($3, title),
           description = coalesce($4, description),
           category_id = coalesce($5, category_id),
           location = coalesce($6, location),
           occurred_at = coalesce($7, occurred_at),
           contact_line = coalesce($8, contact_line),
           image_url = coalesce($9, image_url),
           reward = coalesce($10, reward),
           status = coalesce($11, status)
         where id = $1 and owner_id = $2 returning id`,
        [
          id,
          ownerId,
          patch.title ?? null,
          patch.description ?? null,
          patch.category_id ?? null,
          patch.location ?? null,
          patch.occurred_at ?? null,
          patch.contact_line ?? null,
          patch.image_url ?? null,
          patch.reward ?? null,
          patch.status ?? null,
        ]
      )
      if (!row) return null
      return this.getItem(id)
    },

    // ⭐ แจ้งเตือนคนที่ตั้ง watchlist ไว้ทันทีที่มีประกาศใหม่ตรงเงื่อนไข
    async notifyWatchers(item: Item) {
      const watchers = await all<Row>(
        `select user_id, keyword from watches
         where active
           and user_id <> $1
           and (kind is null or kind = $2)
           and (category_id is null or category_id = $3)
           and (keyword = '' or $4 ilike '%' || keyword || '%' or $5 ilike '%' || keyword || '%')
         limit 50`,
        [item.owner_id, item.kind, item.category_id, item.title, item.location]
      )
      for (const w of watchers) {
        await sql.query(
          `insert into notifications (user_id, item_id, kind, message) values ($1,$2,'watch',$3)`,
          [
            w.user_id,
            item.id,
            `มีประกาศใหม่ที่คุณติดตาม: “${item.title}”`,
          ]
        )
      }
    },

    async deleteItem(id, ownerId) {
      const row = await one<Row>(`delete from items where id = $1 and owner_id = $2 returning id`, [
        id,
        ownerId,
      ])
      return Boolean(row)
    },

    async createClaim(itemId, claimantId, message) {
      const row = await one<any>(
        `insert into claims (item_id, claimant_id, message) values ($1,$2,$3)
         on conflict (item_id, claimant_id) do nothing returning *`,
        [itemId, claimantId, message]
      )
      if (!row) return null
      const item = await this.getItem(itemId)
      const claimant = await this.findUserById(claimantId)
      if (item) {
        await sql.query(
          `insert into notifications (user_id, item_id, kind, message) values ($1,$2,'claim',$3)`,
          [
            item.owner_id,
            itemId,
            `${claimant?.display_name ?? 'มีคน'} อ้างว่าเป็นของ “${item.title}”`,
          ]
        )
      }
      return row as Claim
    },

    async listClaimsForOwner(ownerId) {
      const rows = await all<Row>(
        `select cl.*, i.title as item_title, i.kind as item_kind, i.status as item_status,
                u.id as u_id, u.display_name as u_name, u.avatar_emoji as u_emoji
         from claims cl
         join items i on i.id = cl.item_id
         join users u on u.id = cl.claimant_id
         where i.owner_id = $1
         order by cl.created_at desc`,
        [ownerId]
      )
      return rows.map((r) => ({
        id: r.id,
        item_id: r.item_id,
        claimant_id: r.claimant_id,
        message: r.message,
        status: r.status,
        created_at:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        item: r.item_title
          ? ({
              id: r.item_id,
              title: r.item_title,
              kind: r.item_kind,
              status: r.item_status,
            } as Item)
          : null,
        claimant: r.u_id
          ? { id: r.u_id, display_name: r.u_name, avatar_emoji: r.u_emoji }
          : null,
      }))
    },

    async listClaimsByUser(userId) {
      const rows = await all<Row>(
        `select cl.*, i.title as item_title, i.kind as item_kind, i.status as item_status,
                o.id as o_id, o.display_name as o_name, o.avatar_emoji as o_emoji
         from claims cl
         join items i on i.id = cl.item_id
         join users o on o.id = i.owner_id
         where cl.claimant_id = $1
         order by cl.created_at desc`,
        [userId]
      )
      return rows.map((r) => ({
        id: r.id,
        item_id: r.item_id,
        claimant_id: r.claimant_id,
        message: r.message,
        status: r.status,
        created_at:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        item: r.item_title
          ? ({
              id: r.item_id,
              title: r.item_title,
              kind: r.item_kind,
              status: r.item_status,
            } as Item)
          : null,
        claimant: r.o_id
          ? { id: r.o_id, display_name: r.o_name, avatar_emoji: r.o_emoji }
          : null,
      }))
    },

    async updateClaim(id, status: ClaimStatus, ownerId) {
      const row = await one<Row>(
        `update claims cl set status = $1
         from items i
         where cl.id = $2 and cl.item_id = i.id and i.owner_id = $3
         returning cl.id, cl.item_id, cl.claimant_id, cl.message, cl.status, cl.created_at`,
        [status, id, ownerId]
      )
      if (!row) return null
      await sql.query(
        `update items set status = $1 where id = $2 and status <> 'returned'`,
        [status === 'approved' ? 'returned' : 'open', row.item_id]
      )
      // ⭐ คะแนนความดี: ทั้งเจ้าของและคนที่มาช่วยกันคืนของ ได้ +10
      if (status === 'approved') {
        await sql.query(
          `update users set points = points + 10
           where id in (
             select owner_id from items where id = $1
             union
             select $2
           )`,
          [row.item_id, row.claimant_id]
        )
      }
      const full = await all<Row>(
        `select cl.*, i.title as item_title, i.kind as item_kind, i.status as item_status,
                u.id as u_id, u.display_name as u_name, u.avatar_emoji as u_emoji
         from claims cl join items i on i.id = cl.item_id join users u on u.id = cl.claimant_id
         where cl.id = $1`,
        [id]
      )
      const r = full[0]
      return {
        id: r.id,
        item_id: r.item_id,
        claimant_id: r.claimant_id,
        message: r.message,
        status: r.status,
        created_at:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        item: {
          id: r.item_id,
          title: r.item_title,
          kind: r.item_kind,
          status: r.item_status,
        } as Item,
        claimant: { id: r.u_id, display_name: r.u_name, avatar_emoji: r.u_emoji },
      }
    },

    async notify(userId, itemId, kind, message) {
      await sql.query(
        `insert into notifications (user_id, item_id, kind, message) values ($1,$2,$3,$4)`,
        [userId, itemId, kind, message]
      )
    },

    async listNotifications(userId) {
      return all<any>(
        `select * from notifications where user_id = $1 order by created_at desc limit 50`,
        [userId]
      )
    },

    async markNotificationsRead(userId) {
      await sql.query(
        `update notifications set read_at = now() where user_id = $1 and read_at is null`,
        [userId]
      )
    },

    async stats(): Promise<Stats> {
      const row = await one<Row>(`
        select
          (select count(*) from items)::int as total,
          (select count(*) from items where kind = 'lost')::int as lost,
          (select count(*) from items where kind = 'found')::int as found,
          (select count(*) from items where status = 'open')::int as open,
          (select count(*) from items where status = 'returned')::int as returned,
          (select count(*) from users)::int as members,
          (select count(*) from claims)::int as claims
      `)
      const total = Number(row?.total ?? 0)
      const returned = Number(row?.returned ?? 0)
      return {
        total,
        lost: Number(row?.lost ?? 0),
        found: Number(row?.found ?? 0),
        open: Number(row?.open ?? 0),
        returned,
        resolvedRate: total ? Math.round((returned / total) * 100) : 0,
        members: Number(row?.members ?? 0),
        claims: Number(row?.claims ?? 0),
      }
    },

    // =========================================================
    //  ⭐ WATCHLIST
    // =========================================================
    async listWatches(userId) {
      const rows = await all<Row>(
        `select w.*, c.id as cat_id, c.label as cat_label, c.emoji as cat_emoji, c.color as cat_color
         from watches w
         left join categories c on c.id = w.category_id
         where w.user_id = $1
         order by w.created_at desc`,
        [userId]
      )
      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        keyword: r.keyword,
        category_id: r.category_id,
        kind: r.kind,
        active: r.active,
        created_at:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        category: r.cat_id
          ? { id: r.cat_id, label: r.cat_label, emoji: r.cat_emoji, color: r.cat_color }
          : null,
      }))
    },

    async createWatch(input) {
      const row = await one<Row>(
        `insert into watches (user_id, keyword, category_id, kind)
         values ($1, $2, $3, $4)
         on conflict (user_id, keyword, category_id, kind) do update set active = true
         returning *`,
        [input.user_id, input.keyword, input.category_id, input.kind]
      )
      const cat = input.category_id
        ? await one<Row>(`select * from categories where id = $1`, [input.category_id])
        : null
      return {
        ...(row as any),
        created_at:
          row!.created_at instanceof Date
            ? row!.created_at.toISOString()
            : String(row!.created_at),
        category: cat
          ? { id: cat.id, label: cat.label, emoji: cat.emoji, color: cat.color }
          : null,
      }
    },

    async deleteWatch(id, userId) {
      const row = await one<Row>(`delete from watches where id = $1 and user_id = $2 returning id`, [
        id,
        userId,
      ])
      return Boolean(row)
    },

    // =========================================================
    //  ⭐ REVIEWS / REPUTATION
    // =========================================================
    async addReview(input) {
      const row = await one<Row>(
        `insert into reviews (reviewer_id, target_id, item_id, rating, comment)
         values ($1, $2, $3, $4, $5)
         on conflict (item_id, reviewer_id) do nothing
         returning *`,
        [input.reviewer_id, input.target_id, input.item_id, input.rating, input.comment]
      )
      return (row as any) ?? null
    },

    async listReviewsForUser(userId) {
      const rows = await all<Row>(
        `select r.*, u.id as u_id, u.display_name as u_name, u.avatar_emoji as u_emoji,
                i.id as i_id, i.title as i_title
         from reviews r
         join users u on u.id = r.reviewer_id
         left join items i on i.id = r.item_id
         where r.target_id = $1
         order by r.created_at desc`,
        [userId]
      )
      return rows.map((r) => ({
        id: r.id,
        reviewer_id: r.reviewer_id,
        target_id: r.target_id,
        item_id: r.item_id,
        rating: r.rating,
        comment: r.comment,
        created_at:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        reviewer: { id: r.u_id, display_name: r.u_name, avatar_emoji: r.u_emoji },
        item: r.i_id ? { id: r.i_id, title: r.i_title } : null,
      }))
    },

    async reputation(userId) {
      const row = await one<Row>(
        `select
           coalesce((select round(avg(rating)::numeric, 2) from reviews where target_id = $1), 0) as avg_rating,
           coalesce((select count(*) from reviews where target_id = $1), 0)::int as reviews_count,
           coalesce((select points from users where id = $1), 0)::int as points,
           coalesce((select count(*) from items i where i.owner_id = $1 and i.status = 'returned'), 0)::int as helped_count`,
        [userId]
      )
      const avg = Number(row?.avg_rating ?? 0)
      const reviews = Number(row?.reviews_count ?? 0)
      const points = Number(row?.points ?? 0)
      const helped = Number(row?.helped_count ?? 0)
      const score = Math.round(avg * 20 * Math.min(reviews, 10) * 0.5 + points + helped * 15)
      return {
        user_id: userId,
        avg_rating: avg,
        reviews_count: reviews,
        points,
        helped_count: helped,
        score,
        badge: score >= 900 ? 'legend' : score >= 400 ? 'hero' : score >= 150 ? 'trusted' : 'newbie',
      }
    },

    // =========================================================
    //  💬 CHAT
    // =========================================================
    async canAccessChat(itemId, userId) {
      const row = await one<Row>(
        `select 1 as ok from items i
         where i.id = $1
           and (i.owner_id = $2
                or exists (select 1 from claims c where c.item_id = i.id and c.claimant_id = $2))`,
        [itemId, userId]
      )
      return Boolean(row)
    },

    async listMessages(itemId) {
      const rows = await all<Row>(
        `select m.*, u.id as u_id, u.display_name as u_name, u.avatar_emoji as u_emoji
         from messages m
         left join users u on u.id = m.user_id
         where m.item_id = $1
         order by m.created_at asc
         limit 200`,
        [itemId]
      )
      return rows.map((r) => ({
        id: r.id,
        item_id: r.item_id,
        user_id: r.user_id,
        body: r.body,
        created_at:
          r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        user: r.u_id
          ? { id: r.u_id, display_name: r.u_name, avatar_emoji: r.u_emoji }
          : null,
      }))
    },

    async sendMessage(itemId, userId, body) {
      const row = await one<Row>(
        `insert into messages (item_id, user_id, body) values ($1, $2, $3) returning *`,
        [itemId, userId, body]
      )
      if (!row) return null
      const u = await this.findUserById(userId)
      const item = await this.getItem(itemId)
      if (item && item.owner_id !== userId) {
        await sql.query(
          `insert into notifications (user_id, item_id, kind, message) values ($1,$2,'chat',$3)`,
          [item.owner_id, itemId, `${u?.display_name ?? 'มีคน'} ส่งข้อความในแชทเรื่อง “${item.title}”`]
        )
      }
      return {
        id: row.id,
        item_id: row.item_id,
        user_id: row.user_id,
        body: row.body,
        created_at:
          row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        user: u
          ? { id: u.id, display_name: u.display_name, avatar_emoji: u.avatar_emoji }
          : null,
      }
    },

    // =========================================================
    //  👑 ADMIN
    // =========================================================
    async adminOverview(): Promise<AdminOverview> {
      const [stats, topUsers, recentItems, cats, daily] = await Promise.all([
        this.stats(),
        all<Row>(
          `select u.id, u.display_name, u.avatar_emoji, u.campus, u.points,
                  coalesce((select count(*) from reviews r where r.target_id = u.id), 0)::int as reviews_count,
                  coalesce((select round(avg(rating)::numeric, 2) from reviews r where r.target_id = u.id), 0) as avg_rating
           from users u
           order by u.points desc, u.created_at asc
           limit 12`
        ),
        this.listItems({ limit: 8, sort: 'new' }),
        all<Row>(
          `select c.id, c.label, c.emoji, c.color, count(i.id)::int as count
           from categories c
           left join items i on i.category_id = c.id
           group by c.id, c.label, c.emoji, c.color
           order by count desc`
        ),
        all<Row>(
          `select to_char(created_at, 'DD/MM') as day, count(*)::int as count
           from items
           where created_at > now() - interval '14 days'
           group by 1 order by 1`
        ),
      ])

      return {
        stats,
        top_users: topUsers.map((u) => ({
          id: u.id,
          display_name: u.display_name,
          avatar_emoji: u.avatar_emoji,
          campus: u.campus,
          points: u.points,
          reviews_count: Number(u.reviews_count ?? 0),
          avg_rating: Number(u.avg_rating ?? 0),
        })),
        recent_items: recentItems.items,
        category_breakdown: cats.map((c) => ({
          id: c.id,
          label: c.label,
          emoji: c.emoji,
          color: c.color,
          count: Number(c.count ?? 0),
        })),
        daily: daily.map((d) => ({ day: d.day, count: Number(d.count ?? 0) })),
      }
    },
  }
}
