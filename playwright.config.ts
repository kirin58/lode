import { defineConfig, devices } from '@playwright/test'

/**
 * E2E ทั้งระบบ: เปิด API + Vite ให้เองอัตโนมัติ
 *
 * ค่าเริ่มต้น = รันกับ **demo mode** (in-memory) เพื่อให้เร็ว ผลลัพธ์นิ่ง และรันซ้ำได้ทุกครั้ง
 * ถ้าอยากเทสกับ Neon จริง:  E2E_NEON=1 npx playwright test
 */
const useNeon = process.env.E2E_NEON === '1'
const apiEnv = useNeon ? {} : { DATABASE_URL: '' }

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
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
      command: 'npm --prefix server run dev',
      url: 'http://localhost:8787/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: apiEnv,
    },
    {
      command: 'npm --prefix client run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
