import { execFileSync } from 'node:child_process'

/**
 * เตรียมข้อมูลก่อน E2E:
 * - ถ้ามี DATABASE_URL (Neon) → seed บัญชีเดโม + ประกาศตัวอย่าง (idempotent)
 * - ถ้าไม่มี → demo mode ของเซิร์ฟเวอร์เตรียมข้อมูลให้เอง
 */
export default function globalSetup() {
  console.log('🎬 เตรียมข้อมูลสำหรับ E2E…')
  try {
    const out = execFileSync('npm', ['--prefix', 'server', 'run', 'db:seed'], {
      encoding: 'utf8',
      stdio: 'pipe',
      shell: process.platform === 'win32',
    })
    console.log(out.trim())
  } catch (err: any) {
    console.warn('⚠️ seed ไม่สำเร็จ (จะใช้ข้อมูลที่มีอยู่):', err?.message?.split('\n')[0])
  }
}
