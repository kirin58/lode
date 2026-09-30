/**
 * ล้างข้อมูลทดสอบออกจาก Neon เหลือไว้เฉพาะโพสต์ของคนจริง
 *   npx tsx scripts/db-clean.ts            → dry-run (ดูอย่างเดียว ไม่ลบ)
 *   npx tsx scripts/db-clean.ts --confirm  → ลบจริง
 *
 * เกณฑ์ลบ (ปรับ TEST_PATTERNS ได้ตามต้องการ):
 *  - ประกาศ: ชื่อตรงกับข้อมูล seed (DEMO_ITEMS) หรือมีคำทดสอบในชื่อ/คำอธิบาย
 *  - ประกาศ: เจ้าของเป็นอีเมลทดสอบ
 *  - ผู้ใช้: อีเมลทดสอบ (ลบเฉพาะคนที่ไม่มีประกาศเหลือแล้ว)
 *  - รูป /uploads/* (ไฟล์ local ที่บน production เปิดไม่ได้) → ตั้ง image_url เป็น null
 *  - ลบ claims / reviews / messages / notifications / watches ที่อ้างถึงของที่ถูกลบ
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { DEMO_ITEMS } from '../api/_lib/data/demo.js'

const CONFIRM = process.argv.includes('--confirm')

const TEST_PATTERNS = [
  'E2E',
  'e2e',
  'ทดสอบ',
  'test',
  'Test',
  'TEST',
  'demo',
  'Demo',
  'จับตา',
  'ไม่ตรง',
  'Neon',
  'neon',
]

const TEST_EMAILS = [
  '@test.app',
  '@t.app',
  '@x.app',
  'plain-',
  'refac',
  'smoke',
  'flat',
  'live',
  'probe',
  'tester',
  'helper',
  'stranger',
  'noise',
  'watcher',
  'reviewer',
]

const url = process.env.DATABASE_URL
if (!url) {
  console.error('❌ ไม่พบ DATABASE_URL')
  process.exit(1)
}
const sql = neon(url)

const like = (col: string, patterns: string[]) =>
  patterns.map((p) => `${col} ilike '%${p.replace(/'/g, "''")}%'`).join(' or ')

console.log(CONFIRM ? '🧹 ล้างข้อมูลทดสอบ (ลบจริง)…' : '👀 dry-run — ดูอย่างเดียว ยังไม่ลบ\n')

// 1) หาประกาศทดสอบ
const demoTitles = DEMO_ITEMS.map((d) => d.title)
const seeded = await sql.query(
  `select id, title from items where title = any($1)`,
  [demoTitles]
)
const keyworded = await sql.query(
  `select id, title from items where ${like('title', TEST_PATTERNS)} or ${like('description', TEST_PATTERNS)}`
)
const byOwner = await sql.query(
  `select i.id, i.title from items i join users u on u.id = i.owner_id
   where ${TEST_EMAILS.map((e) => `u.email ilike '%${e}%'`).join(' or ')}`
)
const itemIds = [...new Set([...seeded, ...keyworded, ...byOwner].map((r: any) => r.id))]
console.log(`  🗑️ ประกาศทดสอบ: ${itemIds.length} รายการ`)
for (const r of [...seeded, ...keyworded, ...byOwner].slice(0, 40)) {
  console.log(`     - ${(r as any).title}`)
}

// 2) รูป local ที่เปิดบน production ไม่ได้
const localImgs = await sql.query(
  `select id, title from items where image_url like '/uploads/%'`
)
console.log(`  🖼️ รูป local (จะตั้งเป็น null): ${localImgs.length} รายการ`)

// 3) ผู้ใช้ทดสอบที่ไม่มีประกาศเหลือแล้ว
const testUsers = await sql.query(
  `select u.id, u.email, u.display_name,
          (select count(*) from items i where i.owner_id = u.id and not (i.id = any($1))) as kept
   from users u
   where ${TEST_EMAILS.map((e) => `u.email ilike '%${e}%'`).join(' or ')}
      or ${like('u.display_name', ['E2E', 'ทดสอบ', 'Tester'])}`,
  [itemIds.length ? itemIds : ['00000000-0000-0000-0000-000000000000']]
)
const removableUsers = testUsers.filter((u: any) => Number(u.kept) === 0)
console.log(`  👤 ผู้ใช้ทดสอบที่จะลบ: ${removableUsers.length} คน`)
for (const u of removableUsers.slice(0, 20)) {
  console.log(`     - ${(u as any).email} (${(u as any).display_name})`)
}
const keptUsers = testUsers.filter((u: any) => Number(u.kept) > 0)
if (keptUsers.length) {
  console.log(`  ⚠️ ผู้ใช้ทดสอบที่มีประกาศของคนจริงติดอยู่ (ไม่ลบ): ${keptUsers.length} คน`)
}

if (!CONFIRM) {
  console.log('\nพอใจแล้วรันอีกครั้งด้วย --confirm เพื่อลบจริง')
  process.exit(0)
}

if (!itemIds.length && !removableUsers.length && !localImgs.length) {
  console.log('✅ ไม่มีอะไรต้องลบ')
  process.exit(0)
}

// ลบจริง — ตามลำดับ foreign key
if (itemIds.length) {
  await sql.query(`delete from messages where item_id = any($1)`, [itemIds])
  await sql.query(`delete from reviews where item_id = any($1)`, [itemIds])
  await sql.query(`delete from claims where item_id = any($1)`, [itemIds])
  await sql.query(`delete from notifications where item_id = any($1)`, [itemIds])
  await sql.query(`delete from items where id = any($1)`, [itemIds])
  console.log(`  ✔ ลบประกาศ + ข้อมูลพ่วง ${itemIds.length} รายการ`)
}
if (localImgs.length) {
  await sql.query(`update items set image_url = null where image_url like '/uploads/%'`)
  console.log(`  ✔ เคลียร์รูป local ${localImgs.length} รายการ`)
}
const userIds = removableUsers.map((u: any) => u.id)
if (userIds.length) {
  await sql.query(`delete from watches where user_id = any($1)`, [userIds])
  await sql.query(`delete from notifications where user_id = any($1)`, [userIds])
  await sql.query(`delete from users where id = any($1)`, [userIds])
  console.log(`  ✔ ลบบัญชีทดสอบ ${userIds.length} บัญชี`)
}

const stats = await sql.query(
  `select (select count(*) from items)::int as items, (select count(*) from users)::int as users`
)
console.log(`✅ เสร็จ — เหลือ items=${(stats as any)[0].items} users=${(stats as any)[0].users}`)
