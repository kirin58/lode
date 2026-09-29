import { test, expect, registerAndLogin, login, typeInto, DEMO } from './fixtures'

test.describe('สมัครสมาชิก + เข้าสู่ระบบ', () => {
  test('สมัครสมาชิกใหม่แล้วเข้าไปหน้าค้นหาอัตโนมัติ', async ({ page }) => {
    const { name } = await registerAndLogin(page, 'น้องเอ็ด E2E')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('มีอะไร')
    await expect(page.getByRole('link', { name: /พื้นที่ของฉัน/ }).first()).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('lf_token'))).toBeTruthy()
    expect(name).toBeTruthy()
  })

  test('validation: อีเมลผิด / รหัสสั้น / ไม่ยอมรับเงื่อนไข', async ({ page }) => {
    await page.goto('/register')
    const form = page.locator('form')
    const submit = page.getByRole('button', { name: /สร้างบัญชี/ })

    // 1) ว่างทั้งหมด
    await submit.click()
    await expect(form).toContainText('ใส่ชื่อที่เรียกได้หน่อย')

    // 2) อีเมลไม่ใช่อีเมล
    await typeInto(page.getByPlaceholder('เช่น โจ้ หรือ น้องฟ้า'), 'ทดสอบ')
    await typeInto(page.getByPlaceholder('อย่างน้อย 8 ตัวอักษร'), 'password-1234')
    await typeInto(page.getByPlaceholder('you@campus.ac.th'), 'ไม่ใช่อีเมล')
    await submit.click()
    await expect(form).toContainText('อีเมลดูไม่ถูกนะ')

    // 3) รหัสผ่านสั้นไป
    const pw = page.getByPlaceholder('อย่างน้อย 8 ตัวอักษร')
    await pw.fill('')
    await typeInto(pw, '123')
    await page.getByPlaceholder('you@campus.ac.th').fill('valid-e2e@test.app')
    await submit.click()
    await expect(form).toContainText('รหัสผ่านต้องยาวอย่างน้อย 8 ตัว')

    // 4) ยังไม่ยอมรับเงื่อนไข
    await pw.fill('')
    await typeInto(pw, 'password-1234')
    await submit.click()
    await expect(form).toContainText('ต้องกดยอมรับเงื่อนไขก่อนนะ')
    await expect(page).toHaveURL(/\/register/)
  })

  test('แถบความแข็งแรงรหัสผ่านทำงาน', async ({ page }) => {
    await page.goto('/register')
    const form = page.locator('form')
    const pw = page.getByPlaceholder('อย่างน้อย 8 ตัวอักษร')

    await typeInto(pw, '123')
    await expect(form).toContainText(/อ่อนมาก|ยังไม่น่าเชื่อถือ/)

    await pw.fill('')
    await typeInto(pw, 'Str0ng-P@ssw0rd-2026!')
    await expect(form).toContainText('แข็งแรงมาก')
  })

  test('สมัครอีเมลซ้ำ → แจ้งว่ามีบัญชีแล้ว', async ({ page }) => {
    await page.goto('/register')
    await typeInto(page.getByPlaceholder('เช่น โจ้ หรือ น้องฟ้า'), 'ซ้ำอีเมล')
    await typeInto(page.getByPlaceholder('you@campus.ac.th'), DEMO.email)
    await typeInto(page.getByPlaceholder('อย่างน้อย 8 ตัวอักษร'), 'password-1234')
    await page.locator('input[type=checkbox]').check()
    await page.getByRole('button', { name: /สร้างบัญชี/ }).click()
    await expect(page.getByText(/มีบัญชีอยู่แล้ว/)).toBeVisible()
  })

  test('เข้าสู่ระบบด้วยบัญชีเดโม', async ({ page }) => {
    await login(page, DEMO.email, DEMO.password)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('มีอะไร')
  })

  test('รหัสผ่านผิด → ขึ้นข้อความแจ้งเตือน', async ({ page }) => {
    await page.goto('/login')
    await typeInto(page.getByPlaceholder('you@campus.ac.th'), DEMO.email)
    await typeInto(page.getByPlaceholder('••••••••'), 'รหัสผิดแน่นอน')
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click()
    await expect(page.getByText(/อีเมลหรือรหัสผ่านไม่ถูกต้อง/)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('ปุ่มบัญชีเดโมกรอกฟอร์มให้เอง', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /บัญชีเดโม/ }).click()
    await expect(page.getByPlaceholder('you@campus.ac.th')).toHaveValue(DEMO.email)
    await expect(page.getByPlaceholder('••••••••')).toHaveValue(DEMO.password)
  })

  test('route guard: หน้าที่ต้อง login จะพาไป /login', async ({ page }) => {
    await page.goto('/report')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await expect(page.getByText('อยากรับของชิ้นนี้?').or(page.getByRole('heading', { level: 1 }))).toBeVisible()
  })

  test('logout แล้วกลับไปหน้าแรก', async ({ page }) => {
    await login(page, DEMO.email, DEMO.password)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'ออกจากระบบ' }).click()
    await expect(page).toHaveURL('/')
    expect(await page.evaluate(() => localStorage.getItem('lf_token'))).toBeNull()
  })
})
