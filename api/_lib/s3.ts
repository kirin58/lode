/**
 * อัปโหลดรูปผ่าน Neon S3 (S3-compatible) — ใช้ได้ทั้งบน Vercel serverless และ local
 * วิธีใช้: client ขอ presigned PUT URL → PUT ไฟล์ตรงไป S3 → บันทึก key ลงประกาศ
 * ดูรูปผ่าน GET /api/images/:key (proxy ผ่าน API ไม่ต้องเปิด bucket เป็น public)
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'

const ENDPOINT = process.env.AWS_ENDPOINT_URL_S3
const REGION = process.env.AWS_REGION ?? 'ap-southeast-1'
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY
const BUCKET = process.env.S3_BUCKET

export function s3Enabled(): boolean {
  return Boolean(ENDPOINT && ACCESS_KEY && SECRET_KEY && BUCKET)
}

let client: S3Client | null = null

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY as string,
        secretAccessKey: SECRET_KEY as string,
      },
      // Neon S3 ใช้ path-style addressing
      forcePathStyle: true,
    })
  }
  return client
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 4 * 1024 * 1024

export function keyForUpload(contentType: string): string | null {
  if (!ALLOWED_TYPES.includes(contentType)) return null
  const ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1]
  return `lf-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
}

export function validKey(key: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,120}$/.test(key) && !key.includes('..')
}

/** สร้าง presigned PUT URL (อายุ 5 นาที) — client PUT ไฟล์ไปได้เลย */
export async function presignPut(
  key: string,
  contentType: string,
  size: number
): Promise<{ uploadUrl: string; key: string } | null> {
  if (!s3Enabled()) return null
  if (!validKey(key) || !ALLOWED_TYPES.includes(contentType)) return null
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) return null

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  })
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 })
  return { uploadUrl, key }
}

/** ดึงไฟล์รูปจาก S3 (สำหรับ proxy ผ่าน GET /api/images/:key) */
export async function getImage(
  key: string
): Promise<{ body: Buffer; contentType: string } | null> {
  if (!s3Enabled() || !validKey(key)) return null
  try {
    const res = await getClient().send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    )
    const bytes = await res.Body?.transformToByteArray()
    if (!bytes) return null
    return {
      body: Buffer.from(bytes),
      contentType: res.ContentType ?? 'image/jpeg',
    }
  } catch {
    return null
  }
}
