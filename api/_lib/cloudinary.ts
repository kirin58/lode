/**
 * อัปโหลดรูปผ่าน Cloudinary — ใช้ได้ทั้งบน Vercel serverless และ local
 *
 * Flow:
 *   1) Client ขอ signature จาก POST /api/uploads/sign
 *   2) Client POST ไฟล์ตรงไป Cloudinary (พร้อม signature)
 *   3) Cloudinary ตอบ secure_url กลับมา → client ส่ง URL นี้ตอนสร้างประกาศ
 *   4) แสดงรูปจาก Cloudinary CDN ตรงๆ (ไม่ต้อง proxy)
 */
import { createHash } from 'node:crypto'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? ''
const API_KEY = process.env.CLOUDINARY_API_KEY ?? ''
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? ''
const FOLDER = process.env.CLOUDINARY_FOLDER ?? 'lostfound'

export function cloudinaryEnabled(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET)
}

export function getCloudName(): string {
  return CLOUD_NAME
}

export function getApiKey(): string {
  return API_KEY
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 4 * 1024 * 1024

export function validateUpload(contentType: string, size: number): string | null {
  if (!ALLOWED_TYPES.includes(contentType)) return 'อัปโหลดได้แค่รูป JPG/PNG/WebP/GIF นะ'
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) return 'ไฟล์ใหญ่เกินไป (สูงสุด 4 MB)'
  return null
}

/**
 * สร้าง signature สำหรับ client อัปโหลดตรงไป Cloudinary
 * https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
export function signUpload(): {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
  uploadUrl: string
} {
  const timestamp = Math.floor(Date.now() / 1000)

  // สร้าง signature ตาม spec ของ Cloudinary
  // params ที่ส่งไป sign ต้องเรียงตามตัวอักษร
  const paramsToSign = `folder=${FOLDER}&timestamp=${timestamp}`
  const signature = createHash('sha1')
    .update(paramsToSign + API_SECRET)
    .digest('hex')

  return {
    signature,
    timestamp,
    apiKey: API_KEY,
    cloudName: CLOUD_NAME,
    folder: FOLDER,
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
  }
}

/** ตรวจว่า URL เป็นของ Cloudinary จริงหรือเปล่า (กัน injection) */
export function isCloudinaryUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname === 'res.cloudinary.com' && u.pathname.includes(`/${CLOUD_NAME}/`)
  } catch {
    return false
  }
}
