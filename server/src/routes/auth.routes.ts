import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getStore } from '../db/index.js'
import { publicUser, requireAuth, signToken } from '../auth.js'

export const authRouter = Router()

const registerSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้องนะ'),
  password: z.string().min(8, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัว'),
  display_name: z.string().min(2, 'ใส่ชื่อที่เรียกได้หน่อย').max(40),
  avatar_emoji: z.string().max(8).optional(),
  campus: z.string().max(80).optional().nullable(),
})

const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้องนะ'),
  password: z.string().min(1, 'ใส่รหัสผ่านด้วย'),
})

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const store = getStore()
  const { email, password, display_name, avatar_emoji, campus } = parsed.data
  const existing = await store.findUserByEmail(email)
  if (existing) {
    res.status(409).json({ error: 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบดิ 💅' })
    return
  }
  const user = await store.createUser({
    email: email.toLowerCase(),
    password_hash: await bcrypt.hash(password, 10),
    display_name,
    avatar_emoji,
    campus: campus || null,
  })
  const token = signToken({ sub: user.id, email: user.email, role: user.role })
  res.status(201).json({ token, user: publicUser(user) })
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const store = getStore()
  const user = await store.findUserByEmail(parsed.data.email)
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง 😢' })
    return
  }
  const token = signToken({ sub: user.id, email: user.email, role: user.role })
  res.json({ token, user: publicUser(user) })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await getStore().findUserById(req.user!.sub)
  if (!user) {
    res.status(404).json({ error: 'ไม่พบผู้ใช้' })
    return
  }
  res.json({ user })
})

authRouter.patch('/me', requireAuth, async (req, res) => {
  const schema = z.object({
    display_name: z.string().min(2).max(40).optional(),
    avatar_emoji: z.string().max(8).optional(),
    campus: z.string().max(80).nullable().optional(),
    bio: z.string().max(280).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const user = await getStore().updateUser(req.user!.sub, parsed.data)
  res.json({ user })
})
