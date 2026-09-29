const BASE = '/api'

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

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw new ApiError(data.error ?? 'เกิดข้อผิดพลาดบางอย่าง', res.status)
  }
  return data as T
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  patch: <T,>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
}
