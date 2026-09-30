import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHealthStore } from './health'
import { api, apiUrl, ApiError, API_BASE } from '@/lib/api'

const fetchMock = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('health store (แถบแจ้ง API ล่ม)', () => {
  it('ออนไลน์เมื่อ /api/health ตอบ ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, driver: 'neon', uploads: true, uploadMode: 's3' }),
    })
    const health = useHealthStore()
    await health.check()
    expect(health.online).toBe(true)
    expect(health.offline).toBe(false)
    expect(health.driver).toBe('neon')
    expect(health.uploadMode).toBe('s3')
    expect(health.uploads).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('/api/health', expect.anything())
  })

  it('ปิดอัปโหลดเมื่อ server บอกว่าไม่รองรับ', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, driver: 'neon', uploads: false, uploadMode: false }),
    })
    const health = useHealthStore()
    await health.check()
    expect(health.uploads).toBe(false)
    expect(health.uploadMode).toBe(false)
  })

  it('ออฟไลน์เมื่อ fetch พัง (เช่น API ไม่ได้รัน)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const health = useHealthStore()
    await health.check()
    expect(health.offline).toBe(true)
    expect(health.lastChecked).toBeTruthy()
  })

  it('ออฟไลน์เมื่อตอบ 404/500', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
    const health = useHealthStore()
    await health.check()
    expect(health.offline).toBe(true)
  })
})

describe('api client', () => {
  it('ใช้ relative /api เมื่อไม่ได้ตั้ง VITE_API_URL', () => {
    expect(API_BASE).toBe('/api')
  })

  it('apiUrl รองรับทั้ง relative และ absolute', () => {
    expect(apiUrl('/uploads/a.jpg')).toBe('/api/uploads/a.jpg')
    expect(apiUrl('/api/images/abc.jpg')).toBe('/api/images/abc.jpg')
    expect(apiUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(apiUrl('')).toBe('')
  })

  it('แนบ token + แปลง error เป็น ApiError พร้อมข้อความไทย', async () => {
    localStorage.setItem('lf_token', 'tok-x')
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ error: 'อีเมลนี้มีบัญชีอยู่แล้ว' }),
    })
    await expect(api.post('/auth/register', { email: 'a@b.co' })).rejects.toThrowError(
      /มีบัญชีอยู่แล้ว/
    )
    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer tok-x')
    localStorage.clear()
  })

  it('ถ้าเชื่อมต่อไม่ได้ ข้อความบอกชัดว่าเซิร์ฟเวอร์ไม่ทำงาน', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const err = await api.get('/items/stats').catch((e) => e as ApiError)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(0)
    expect((err as ApiError).message).toContain('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
  })
})
