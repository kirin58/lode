import { describe, it, expect, vi, afterEach } from 'vitest'
import { timeAgo, formatDate, baht, STATUS_META, KIND_META, CATEGORY_CHIP } from './format'

afterEach(() => {
  vi.useRealTimers()
})

describe('timeAgo (ภาษาไทย)', () => {
  it('เมื่อกี้', () => {
    expect(timeAgo(new Date().toISOString())).toBe('เมื่อกี้')
  })

  it('นาทีที่แล้ว', () => {
    const d = new Date(Date.now() - 25 * 60_000).toISOString()
    expect(timeAgo(d)).toBe('25 นาทีที่แล้ว')
  })

  it('ชั่วโมงที่แล้วแบบเลขไทย', () => {
    const d = new Date(Date.now() - 3 * 3_600_000).toISOString()
    expect(timeAgo(d)).toBe('สาม ชั่วโมงที่แล้ว')
  })

  it('วันที่แล้วแบบเลขไทย', () => {
    const d = new Date(Date.now() - 2 * 86_400_000).toISOString()
    expect(timeAgo(d)).toBe('สอง วันที่แล้ว')
  })

  it('อาทิตย์ / วันที่ว่าง / ค่าผิดรูปแบบ', () => {
    expect(timeAgo(new Date(Date.now() - 8 * 86_400_000).toISOString())).toBe('หนึ่ง อาทิตย์ที่แล้ว')
    expect(timeAgo(null)).toBe('—')
    expect(timeAgo('ไม่ใช่วันที่')).toBe('—')
  })
})

describe('formatDate + baht', () => {
  it('แปลงวันที่เป็นภาษาไทยแบบยาว', () => {
    const out = formatDate('2026-01-05')
    expect(out).toContain('มกราคม')
    expect(out).not.toBe('ไม่ระบุ')
  })

  it('ครอบคลุมค่าว่าง', () => {
    expect(formatDate(null)).toBe('ไม่ระบุ')
    expect(formatDate('วันที่เพี้ยน')).toBe('ไม่ระบุ')
  })

  it('ใส่สัญลักษณ์บาทพร้อมเลขพันละครั่ง', () => {
    expect(baht(0)).toBe('฿0')
    expect(baht(1500)).toMatch(/^฿1,?500$/)
  })
})

describe('meta ของสถานะ/ประเภท/หมวด', () => {
  it('สถานะครบ 4 แบบและมีสีกำกับ', () => {
    const keys = Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]
    expect(keys.sort()).toEqual(['claimed', 'closed', 'open', 'returned'])
    for (const k of keys) {
      expect(STATUS_META[k].label).toBeTruthy()
      expect(STATUS_META[k].chip).toContain('ring-')
    }
  })

  it('ประเภท lost/found มี gradient แยกกัน', () => {
    expect(KIND_META.lost.gradient).not.toBe(KIND_META.found.gradient)
    expect(KIND_META.found.short).toBe('FOUND')
  })

  it('หมวดหมู่ทุกตัวมีสีที่กำหนดไว้', () => {
    const colors = ['violet', 'sky', 'amber', 'emerald', 'orange', 'pink', 'lime', 'teal', 'slate']
    for (const c of colors) expect(CATEGORY_CHIP[c]).toBeTruthy()
  })
})
