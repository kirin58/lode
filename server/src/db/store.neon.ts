import type {
  Category,
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
    return (res.rows ?? []) as T[]
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
        `insert into users (email, password_hash, display_name, avatar_emoji, campus)
         values ($1, $2, $3, $4, $5)
         returning *`,
        [
          input.email,
          input.password_hash,
          input.display_name,
          input.avatar_emoji ?? '🫥',
          input.campus ?? null,
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
      return (await this.getItem(row!.id))!
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
      return (row as any) ?? null
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
  }
}
