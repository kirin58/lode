import { execFileSync } from 'node:child_process'

/**
 * เตรียมข้อมูลก่อน E2E
 * - โหมดปกติ (demo/in-memory): ไม่ต้องทำอะไร เซิร์ฟเวอร์เตรียมข้อมูลตัวอย่างให้แล้ว
 * - E2E_NEON=1: seed ข้อมูลตัวอย่างลง Neon ก่อน (idempotent)
 */
export default function globalSetup() {
  if (process.env.E2E_NEON !== '1') {
    console.log('🎬 E2E: ใช้ demo mode (in-memory) — เร็วและผลลัพธ์นิ่ง')
    return
  }
  console.log('🎬 E2E: seed ข้อมูลลง Neon…')
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
