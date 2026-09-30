/**
 * ฐาน URL ของ API
 * - ไม่ตั้ง VITE_API_URL  → ใช้ relative `/api` (เหมาะกับ dev ที่ Vite proxy ไป :8787)
 * - ตั้ง VITE_API_URL      → ใช้ URL เต็ม (ตอน deploy client แยกจาก API เช่นบน Vercel)
 */
const RAW = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
export const API_BASE = RAW || '/api'

/** URL เต็มของ API (ใช้กับ fetch และรูปที่อัปโหลดไว้บนฝั่ง API) */
export function apiUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('blob:') || path.startsWith('data:')) return path
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${suffix}`
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function token() {
  return localStorage.getItem('lf_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const isForm = options.body instanceof FormData
  if (!isForm) headers.set('Content-Type', 'application/json')
  const t = token()
  if (t) headers.set('Authorization', `Bearer ${t}`)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจว่า API กำลังรันอยู่ไหม', 0)
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw new ApiError(data.error ?? `เกิดข้อผิดพลาด (${res.status})`, res.status)
  }
  return data as T
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T,>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
}
