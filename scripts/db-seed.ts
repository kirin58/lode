/**
 * สร้างข้อมูลตัวอย่างลง Neon (idempotent — รันซ้ำได้)
 *   npm run db:seed
 * ถ้าไม่มี DATABASE_URL จะข้ามไป (demo mode เตรียมข้อมูลให้อยู่แล้ว)
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { CATEGORIES } from '../functions/src/lib/data/categories.js'
import { DEMO_ITEMS, DEMO_USERS } from '../functions/src/lib/data/demo.js'

const url = process.env.DATABASE_URL
if (!url) {
  console.log('🟡 ไม่พบ DATABASE_URL → ข้ามการ seed (ใช้ demo mode แทน)')
  process.exit(0)
}

const sql = neon(url)
const hash = bcrypt.hashSync('demo1234', 8)

console.log('🌱 กำลัง seed ข้อมูลตัวอย่างลง Neon…')

for (const c of CATEGORIES) {
  await sql.query(
    `insert into categories (id, label, emoji, color) values ($1,$2,$3,$4)
     on conflict (id) do update set label = excluded.label, emoji = excluded.emoji, color = excluded.color`,
    [c.id, c.label, c.emoji, c.color]
  )
}
console.log(`  ✔ หมวดหมู่ ${CATEGORIES.length} หมวด`)

const userIds: string[] = []
for (const u of DEMO_USERS) {
  const rows = await sql.query(
    `insert into users (email, password_hash, display_name, avatar_emoji, campus, role, points)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (email) do update
       set display_name = excluded.display_name,
           avatar_emoji = excluded.avatar_emoji,
           campus = excluded.campus,
           role = excluded.role,
           password_hash = excluded.password_hash
     returning id`,
    [u.email, hash, u.display_name, u.avatar_emoji, u.campus, u.role, u.points]
  )
  userIds.push(rows[0].id)
}
console.log(`  ✔ ผู้ใช้ ${DEMO_USERS.length} คน (รหัสผ่าน: demo1234)`)

let created = 0
for (const d of DEMO_ITEMS) {
  const ownerId = userIds[d.owner_index % userIds.length]
  const exists = await sql.query(`select 1 from items where title = $1 and owner_id = $2`, [
    d.title,
    ownerId,
  ])
  if (exists.length) continue
  await sql.query(
    `insert into items
      (kind, title, description, category_id, location, occurred_at, contact_name, contact_line, reward, status, owner_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      d.kind,
      d.title,
      d.description,
      d.category_id,
      d.location,
      d.occurred_at,
      d.display_name ?? 'สมาชิก',
      d.contact_line,
      d.reward,
      d.status,
      ownerId,
    ]
  )
  created++
}
console.log(`  ✔ ประกาศตัวอย่าง ${created} รายการ (ข้ามที่มีอยู่แล้ว)`)

const stats = await sql.query(
  `select (select count(*) from items)::int as items,
          (select count(*) from users)::int as users,
          (select count(*) from categories)::int as cats`
)
console.log(`✅ seed เสร็จแล้ว → items=${stats[0].items} users=${stats[0].users} categories=${stats[0].cats}`)
