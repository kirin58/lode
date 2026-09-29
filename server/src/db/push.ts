/**
 * สคริปต์สร้างตารางใน Neon: npm run db:push
 * อ่าน DATABASE_URL จากไฟล์ .env
 */
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('❌ ไม่พบ DATABASE_URL — ดูวิธีตั้งค่าใน README.md')
  process.exit(1)
}

const schema = await readFile(
  fileURLToPath(new URL('../../sql/schema.sql', import.meta.url)),
  'utf8'
)

const sql = neon(url)

// ตัดคอมเมนต์แล้วแยกเป็น statement ทีละอัน (Neon HTTP รองรับ multi-statement แต่ทำทีละอันปลอดภัยกว่า)
const statements = schema
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean)

for (const statement of statements) {
  await sql.query(statement)
}

console.log(`✅ สร้าง/อัปเดตตารางบน Neon เรียบร้อย (${statements.length} statements)`)
