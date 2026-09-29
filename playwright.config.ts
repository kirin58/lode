import { defineConfig, devices } from '@playwright/test'

/**
 * E2E แยกพอร์ตจาก dev server ของผู้ใช้เสมอ
 *   - เว็บทดสอบ : 5175   - API ทดสอบ : 8788
 *   - dev ปกติ  : 5173   - API ปกติ  : 8787
 * ทำให้ `npm run dev` ของคุณไม่ถูก Playwright ไปแตะ และปิดเทสต์แล้วแอปคุณยังรันต่อ
 *
 * โหมดปกติใช้ demo mode (in-memory) เพื่อให้ผลลัพธ์นิ่งและรันซ้ำได้
 * ถ้าอยากเทสกับ Neon จริง:  E2E_NEON=1 npx playwright test
 */
const useNeon = process.env.E2E_NEON === '1'
const WEB_PORT = 5175
const API_PORT = 8788
const WEB_URL = `http://localhost:${WEB_PORT}`
const API_URL = `http://localhost:${API_PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'th-TH',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      // API สำหรับเทสต์ (port ของตัวเอง ไม่ชนกับของผู้ใช้)
      command: 'npm --prefix server run dev',
      url: `${API_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: { ...(useNeon ? {} : { DATABASE_URL: '' }), PORT: String(API_PORT) },
    },
    {
      // เว็บสำหรับเทสต์ (proxy ไปยัง API port 8788)
      command: `npm --prefix client run dev -- --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        VITE_PORT: String(WEB_PORT),
        VITE_API_TARGET: API_URL,
      },
    },
  ],
})

export { API_URL, WEB_URL }
