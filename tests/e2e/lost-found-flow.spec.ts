import { test, expect, registerAndLogin, typeInto } from './fixtures'

test.describe('วงจรคืนของครบสาย (report → claim → approve → review)', () => {
  test('ลงประกาศ → อีกคนขอรับ → เจ้าของอนุมัติ → ให้คะแนน', async ({ browser }) => {
    // ---------- เจ้าของ ----------
    const ownerCtx = await browser.newContext()
    const owner = await ownerCtx.newPage()
    await registerAndLogin(owner, 'เจ้าของ E2E')

    await owner.goto('/report?kind=found')
    await typeInto(owner.getByPlaceholder(/เช่น AirPods Pro 2/), 'กระเป๋าหนังสือ E2E สีฟ้า')
    await typeInto(owner.getByPlaceholder(/สี ตรา รอยขีด/), 'มีตราหนังสือเก่า ขอบซ้ายถลอก')
    await typeInto(owner.getByPlaceholder(/เช่น อาคาร A ชั้น 4/), 'อาคาร E2E ชั้น 7')
    await owner.getByRole('button', { name: /กระเป๋า/ }).first().click()
    await owner.locator('form').getByRole('button', { name: '฿200', exact: true }).click()
    await owner.getByRole('button', { name: /ลงประกาศ “เจอแล้ว”/ }).click()

    await owner.waitForURL('**/item/**')
    const itemUrl = owner.url()
    await expect(owner.getByRole('heading', { level: 1 })).toContainText('กระเป๋าหนังสือ E2E')
    await expect(owner.getByText('รางวัล ฿200').first()).toBeVisible()

    // ---------- คนมาขอรับ ----------
    const helperCtx = await browser.newContext()
    const helper = await helperCtx.newPage()
    await registerAndLogin(helper, 'ผู้ช่วย E2E')
    await helper.goto(itemUrl)

    await typeInto(helper.getByPlaceholder(/เป็นไอโพดสีขาว/), 'ใช่ของฉันจริง ขอบซ้ายถลอกตรงนี้แน่นอน')
    await helper.getByRole('button', { name: /ยืนยันว่าเป็นของฉัน/ }).click()
    await expect(helper.getByText('คุณส่งคำขอไปแล้วนะ')).toBeVisible()
    await expect(helper.getByRole('button', { name: /ยืนยันว่าเป็นของฉัน/ })).toHaveCount(0)


    // ---------- เจ้าของอนุมัติ ----------
    await owner.reload()
    await expect(owner.getByText('นี่ประกาศของคุณ')).toBeVisible()
    await owner.getByRole('button', { name: /✓ ใช่ของเขา/ }).click()
    await expect(owner.getByText('คืนของสำเร็จ!')).toBeVisible()
    await expect(owner.getByText('คืนสำเร็จ').first()).toBeVisible()

    // ---------- แชทกันได้ ----------
    await owner.getByRole('button', { name: /💬 แชทกัน/ }).click()
    await typeInto(owner.getByPlaceholder('พิมพ์ข้อความ…'), 'เจอที่ห้อง 702 นะ')
    await owner.getByRole('button', { name: 'ส่งข้อความ' }).click()
    await expect(owner.getByText('เจอที่ห้อง 702 นะ')).toBeVisible()

    // ---------- ให้คะแนนกัน ----------
    await helper.reload()
    await helper.getByRole('button', { name: /ให้คะแนน/ }).click()
    await helper.getByRole('button', { name: '5 ดาว', exact: true }).first().click()
    await typeInto(helper.getByPlaceholder(/ฝากคำชม/), 'นัดเจอไวมาก ขอบคุณครับ')
    await helper.getByRole('button', { name: /ส่ง 5 ดาว/ }).click()
    await expect(helper.getByText('ขอบคุณสำหรับรีวิว!')).toBeVisible()

    await owner.reload()
    await expect(owner.getByText('ดีมาก!')).toBeVisible()

    await ownerCtx.close()
    await helperCtx.close()
  })

  test('ประกาศของตัวเองขอรับเองไม่ได้ — ต้องเห็นแผงจัดการแทน', async ({ page }) => {
    await registerAndLogin(page, 'เจ้าของคนเดียว')
    await page.goto('/report?kind=found')
    await typeInto(page.getByPlaceholder(/เช่น AirPods Pro 2/), 'ของของฉันเอง E2E')
    await page.getByRole('button', { name: /ลงประกาศ “เจอแล้ว”/ }).click()
    await page.waitForURL('**/item/**')

    // ต้องเห็นแผงจัดการของเจ้าของ และไม่มีปุ่มยืนยันว่าเป็นของฉัน
    await expect(page.getByText('นี่ประกาศของคุณ')).toBeVisible()
    await expect(page.getByRole('button', { name: /ยืนยันว่าเป็นของฉัน/ })).toHaveCount(0)

    // ลองเรียก API ขอรับของตัวเอง → ต้องถูกปฏิเสธ
    const res = await page.evaluate(async () => {
      const id = location.pathname.split('/').pop()
      const r = await fetch(`/api/claims/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lf_token')}`,
        },
        body: JSON.stringify({ message: 'ของตัวเอง' }),
      })
      return { status: r.status, body: await r.json() }
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('ของตัวเอง')
  })
})

test.describe('พื้นที่ของฉัน', () => {
  test('เปลี่ยนสถานะ + ลบประกาศได้', async ({ page }) => {
    await registerAndLogin(page, 'เจ้าของพื้นที่')
    await page.goto('/report?kind=lost')
    await typeInto(page.getByPlaceholder(/เช่น กระเป๋าผ้าใบใหญ่/), 'กุญแจทดสอบของฉัน E2E')
    await page.getByRole('button', { name: /โพสต์ “ทำของหาย”/ }).click()
    await page.waitForURL('**/item/**')

    await page.goto('/mine')
    await expect(page.getByText('กุญแจทดสอบของฉัน E2E')).toBeVisible()

    await page.locator('select').last().selectOption('returned')
    await expect(page.getByText('อัปเดตสถานะแล้ว')).toBeVisible()

    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'ลบ' }).click()
    await expect(page.getByText('ยังไม่มีประกาศเลย')).toBeVisible()
  })

  test('แท็บ 3 อันสลับได้', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/mine')
    for (const tab of ['คำขอเข้ามา', 'ที่ฉันไปขอ', 'ประกาศของฉัน']) {
      await page.getByRole('button', { name: new RegExp(tab) }).click()
      await expect(page.getByRole('button', { name: new RegExp(tab) })).toBeVisible()
    }
  })
})
