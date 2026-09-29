import { test, expect, registerAndLogin, login, typeInto, DEMO } from './fixtures'

test.describe('⭐ Watchlist + แจ้งเตือนอัตโนมัติ', () => {
  test('ตั้ง watchlist แล้วได้รับแจ้งเตือนเมื่อมีประกาศตรงคำค้น', async ({ browser }) => {
    // watcher
    const wCtx = await browser.newContext()
    const watcher = await wCtx.newPage()
    await registerAndLogin(watcher, 'คนติดตาม E2E')
    await watcher.goto('/watch')
    await typeInto(watcher.getByPlaceholder(/airpods, กระเป๋า/), 'E2Eจับตา')
    await watcher.getByRole('button', { name: /\+ ติดตาม/ }).click()
    await expect(watcher.getByText('ติดตามแล้ว!')).toBeVisible()
    await expect(watcher.getByText(/E2Eจับตา/)).toBeVisible()

    // ประกาศที่ไม่ตรงคำค้น → ยังไม่ต้องแจ้ง
    const noiseCtx = await browser.newContext()
    const noise = await noiseCtx.newPage()
    await registerAndLogin(noise, 'คนไม่ตรง E2E')
    await noise.goto('/report?kind=found')
    await typeInto(noise.getByPlaceholder(/เช่น AirPods Pro 2/), 'กระเป๋าไม่ตรงคำ E2E')
    await noise.getByRole('button', { name: /ลงประกาศ “เจอแล้ว”/ }).click()
    await noise.waitForURL('**/item/**')

    // ประกาศที่ตรงคำค้น → ต้องแจ้ง
    const owner = await wCtx.newPage()
    await login(owner, DEMO.admin.email, DEMO.admin.password)
    await owner.goto('/report?kind=found')
    await typeInto(owner.getByPlaceholder(/เช่น AirPods Pro 2/), 'E2Eจับตา เจอแล้วนะ')
    await owner.getByRole('button', { name: /ลงประกาศ “เจอแล้ว”/ }).click()
    await owner.waitForURL('**/item/**')

    await watcher.reload()
    await watcher.getByRole('button', { name: 'การแจ้งเตือน' }).click()
    await expect(watcher.getByText(/มีประกาศใหม่ที่คุณติดตาม/)).toBeVisible()
    await expect(watcher.getByText(/E2Eจับตา/).first()).toBeVisible()

    // ลบ watchlist
    await watcher.getByRole('button', { name: 'การแจ้งเตือน' }).click()
    await watcher.goto('/watch')
    await watcher.getByRole('button', { name: 'เลิกติดตาม' }).click()
    await expect(watcher.getByText('ยังไม่ได้ติดตามอะไรเลย')).toBeVisible()

    await wCtx.close()
    await noiseCtx.close()
  })

  test('watchlist ต้องเลือกอย่างน้อยหนึ่งอย่าง', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/watch')
    await expect(page.getByRole('button', { name: /\+ ติดตาม/ })).toBeDisabled()
    await typeInto(page.getByPlaceholder(/airpods, กระเป๋า/), 'อะไรสักอย่าง')
    await expect(page.getByRole('button', { name: /\+ ติดตาม/ })).toBeEnabled()
  })
})

test.describe('👑 หน้าแอดมิน', () => {
  test('ผู้ใช้ทั่วไปเข้าไม่ได้', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/browse/)
  })

  test('แอดมินเห็นสถิติ, กราฟ และฮีโร่', async ({ page }) => {
    await login(page, DEMO.admin.email, DEMO.admin.password)
    await page.goto('/admin')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('สถิติทั้งระบบ')
    await expect(page.getByText('ประกาศทั้งหมด').first()).toBeVisible()
    await expect(page.getByText('อัตราสำเร็จ').first()).toBeVisible()
    await expect(page.getByText('ประกาศ 14 วันล่าสุด')).toBeVisible()
    await expect(page.getByText('ฮีโร่คืนของ')).toBeVisible()
    await expect(page.getByText('หมวดที่คนลงประกาศเยอะ')).toBeVisible()
    await expect(page.getByText('ประกาศล่าสุด')).toBeVisible()
  })
})

test.describe('🧑‍🎤 โปรไฟล์ + รีวิว', () => {
  test('แก้ชื่อ อวตาร และคณะได้', async ({ page }) => {
    await registerAndLogin(page, 'ชื่อเดิม E2E')
    await page.goto('/profile')

    const form = page.locator('form')
    const save = form.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' })
    await expect(save).toBeDisabled() // ยังไม่มีอะไรเปลี่ยน

    await form.getByRole('button', { name: '🍑' }).click()
    await typeInto(form.locator('input[type=text]').first(), 'ชื่อใหม่ E2E')
    await typeInto(form.locator('textarea'), 'ช่วยหาของเก่งมาก')
    await expect(save).toBeEnabled()
    await save.click()
    await expect(page.getByText('บันทึกโปรไฟล์แล้ว')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ชื่อใหม่ E2E')
  })
})
