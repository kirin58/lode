import { test as base, expect, type Page, type Locator } from '@playwright/test'

/** API ของเซิร์ฟเวอร์ทดสอบ (แยกพอร์ตจาก dev server ปกติ) */
export const API = process.env.E2E_API_URL ?? 'http://localhost:8788'

export const DEMO = {
  email: 'demo@lostfound.app',
  password: 'demo1234',
  admin: { email: 'joe@lostfound.app', password: 'demo1234' },
}

/**
 * พิมพ์แบบ "ผู้ใช้จริง" (ใช้ key events จริง ไม่ใช่การ set value ตรง ๆ)
 * ทำให้ v-model ของ Vue อัปเดตแน่นอน เหมือนคนใช้งานจริง
 */
/**
 * กรอกข้อความลงช่อง (เร็วและตรงกับ v-model ของ Vue)
 * ใช้ `typeSlowly()` ในเทสต์ที่ต้องดูพฤติกรรมระหว่างพิมพ์ (เช่น ตัววัดความแข็งแรงรหัสผ่าน)
 */
export async function typeInto(locator: Locator, text: string) {
  await locator.fill(text)
}

/** พิมพ์ทีละตัวอักษร (จำลองผู้ใช้จริง) */
export async function typeSlowly(locator: Locator, text: string) {
  await locator.click()
  await locator.pressSequentially(text, { delay: 5 })
}

/** สมัครบัญชีใหม่แบบสุ่ม แล้ว login พร้อมกัน */
export async function registerAndLogin(page: Page, name = 'ผู้ทดสอบ E2E') {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.app`
  await page.goto('/register')
  await typeInto(page.getByPlaceholder('เช่น โจ้ หรือ น้องฟ้า'), name)
  await typeInto(page.getByPlaceholder('you@campus.ac.th'), email)
  await typeInto(page.getByPlaceholder('อย่างน้อย 8 ตัวอักษร'), 'e2epass123')
  await typeInto(page.getByPlaceholder('เช่น มหาวิทยาลัยพะเยา'), 'พะเยา')
  await page.locator('input[type=checkbox]').check()
  await page.getByRole('button', { name: /สร้างบัญชี/ }).click()
  await page.waitForURL('**/browse')
  return { email, name }
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await typeInto(page.getByPlaceholder('you@campus.ac.th'), email)
  await typeInto(page.getByPlaceholder('••••••••'), password)
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click()
  await page.waitForURL('**/browse')
}

export const test = base
export { expect }
