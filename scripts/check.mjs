/**
 * ตรวจว่าเซิร์ฟเวอร์พร้อมใช้งานหรือยัง
 *   node scripts/check.mjs          → ตรวจ API + web
 *   node scripts/check.mjs --fix    → ถ้ายังไม่ทำงานจะบอกวิธีสตาร์ต
 */
const API = process.env.API_URL ?? 'http://localhost:8787'
const WEB = process.env.WEB_URL ?? 'http://localhost:5173'

const ping = async (url) => {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, status: err?.cause?.code ?? 'down' }
  }
}

console.log('🔍 ตรวจความพร้อมของ Lost & Found\n')

const api = await ping(`${API}/api/health`)
const web = await ping(WEB)

if (api.ok) {
  const body = await (await fetch(`${API}/api/health`)).json()
  const driver = body.driver === 'neon' ? '🟣 Neon (ฐานข้อมูลจริง)' : '🟡 Demo mode (in-memory)'
  console.log(`✅ API      ${API}  → ${driver}`)
} else {
  console.log(`❌ API      ${API}  → ไม่ตอบสนอง (${api.status})`)
}

if (web.ok) console.log(`✅ Web      ${WEB}`)
else console.log(`❌ Web      ${WEB}  → ไม่ตอบสนอง (${web.status})`)

if (!api.ok || !web.ok) {
  console.log('\n👉 สตาร์ตด้วยคำสั่งนี้ในโฟลเดอร์โปรเจกต์:  npm run dev')
  console.log('   (หรือดูว่าขั้นตอนตั้งค่า Neon ที่ README.md)\n')
  process.exit(1)
}

console.log('\n🎉 ทุกอย่างพร้อมใช้งาน\n')
