import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'lost-and-found-dev-secret'

export interface AuthPayload {
  sub: string
  email: string
  role: 'user' | 'admin'
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function publicUser(u: Record<string, any> | null) {
  if (!u) return null
  const { password_hash: _drop, ...rest } = u as Record<string, any>
  return rest
}

/** ใส่ user จาก token (ไม่บังคับต้องมี) */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), SECRET) as AuthPayload
    } catch {
      req.user = undefined
    }
  }
  next()
}

/** บังคับต้อง login */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนนะ 👀' })
    return
  }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนนะ 👀' })
    return
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'เฉพาะแอดมินเท่านั้นที่ทำได้ 🚫' })
    return
  }
  next()
}
