import { test, expect } from './fixtures'

test.describe('หน้าแรก + การค้นหา', () => {
  test('แสดง hero, สถิติ และประกาศล่าสุด', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Lost & Found/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ของหาย')
    // การ์ดสถิติในหน้าแรก (กรองเฉพาะตัวที่มองเห็นจริง เพราะมี badge ที่ซ่อนบนมือถือ)
    await expect(page.getByText('ประกาศในระบบ').filter({ visible: true })).toBeVisible()
    await expect(page.getByText('คืนสำเร็จ', { exact: true }).filter({ visible: true }).first()).toBeVisible()
    await expect(page.locator('a[href^="/item/"]')).not.toHaveCount(0)
  })

  test('ค้นหาจาก hero แล้วเจอผลลัพธ์', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder(/ค้นหา: AirPods/).fill('AirPods')
    await page.getByRole('button', { name: 'ค้นหาเลย' }).click()

    await page.waitForURL('**/browse?q=AirPods')
    await expect(page).toHaveURL(/q=AirPods/)
    await expect(page.locator('a[href^="/item/"]').first()).toBeVisible()
  })

  test('กดหมวดหมู่แล้ว URL ถูกอัปเดต', async ({ page }) => {
    await page.goto('/browse')
    await page.getByRole('button', { name: /กุญแจ/ }).first().click()
    await expect(page).toHaveURL(/category=keys/)
    await expect(page.getByText('ตัวกรอง:')).toBeVisible()
  })

  test('ค้นหาแล้วไม่เจอ → ขึ้น empty state พร้อมปุ่มล้างตัวกรอง', async ({ page }) => {
    await page.goto('/browse?q=zzzzzไม่มีของจริงแน่นอน')
    await expect(page.getByText('ไม่เจออะไรเลย')).toBeVisible()
    await page.getByRole('button', { name: /ล้างตัวกรองทั้งหมด/ }).click()
    await expect(page.locator('a[href^="/item/"]').first()).toBeVisible()
  })

  test('หน้า 404 สวยงามตามแบรนด์', async ({ page }) => {
    await page.goto('/ไม่มีหน้านี้')
    await expect(page.getByText('404?')).toBeVisible()
    await page.getByRole('link', { name: 'กลับหน้าแรก' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('สวิตช์ธีมสว่าง/มืด', () => {
  test('กดแล้วธีมเปลี่ยนและจำไว้ข้ามหน้า', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')

    const toggle = page.getByRole('button', { name: /โหมด/ })
    const wasLight = await html.evaluate((el) => el.classList.contains('light'))
    await toggle.click()

    await expect
      .poll(async () => html.evaluate((el) => el.classList.contains('light')))
      .toBe(!wasLight)

    const stored = await page.evaluate(() => localStorage.getItem('lf_theme'))
    expect(stored).toBe(wasLight ? 'dark' : 'light')

    await page.goto('/browse')
    expect(await html.evaluate((el) => el.classList.contains('light'))).toBe(!wasLight)
  })
})
