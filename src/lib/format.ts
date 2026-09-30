import type { ItemKind, ItemStatus } from '@/types'

export const STATUS_META: Record<
  ItemStatus,
  { label: string; chip: string; emoji: string; dot: string }
> = {
  open: {
    label: 'กำลังตามหา',
    chip: 'bg-mint-pop/12 text-mint-pop ring-mint-pop/25',
    emoji: '🔎',
    dot: 'bg-mint-pop',
  },
  claimed: {
    label: 'มีคนอ้างแล้ว',
    chip: 'bg-mango-400/15 text-mango-300 ring-mango-400/30',
    emoji: '🙋',
    dot: 'bg-mango-400',
  },
  returned: {
    label: 'คืนสำเร็จ',
    chip: 'bg-lime-pop/15 text-lime-pop ring-lime-pop/30',
    emoji: '🎉',
    dot: 'bg-lime-pop',
  },
  closed: {
    label: 'ปิดประกาศ',
    chip: 'bg-white/8 text-night-200 ring-white/12',
    emoji: '🫥',
    dot: 'bg-night-400',
  },
}

export const KIND_META: Record<
  ItemKind,
  { label: string; short: string; chip: string; emoji: string; gradient: string }
> = {
  lost: {
    label: 'ทำหาย',
    short: 'LOST',
    chip: 'bg-bubble-500/18 text-bubble-400 ring-bubble-500/30',
    emoji: '🫥',
    gradient: 'from-bubble-600 to-night-500',
  },
  found: {
    label: 'เจอแล้ว',
    short: 'FOUND',
    chip: 'bg-mint-pop/15 text-mint-pop ring-mint-pop/25',
    emoji: '🫶',
    gradient: 'from-mint-pop to-lime-pop',
  },
}

export const CATEGORY_CHIP: Record<string, string> = {
  violet: 'bg-night-500/20 text-night-200 ring-night-400/30',
  sky: 'bg-sky-500/15 text-sky-300 ring-sky-400/25',
  amber: 'bg-mango-400/15 text-mango-300 ring-mango-400/25',
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25',
  orange: 'bg-orange-500/15 text-orange-300 ring-orange-400/25',
  pink: 'bg-pink-500/15 text-pink-300 ring-pink-400/25',
  lime: 'bg-lime-pop/15 text-lime-pop ring-lime-pop/25',
  teal: 'bg-teal-500/15 text-teal-300 ring-teal-400/25',
  slate: 'bg-white/8 text-night-200 ring-white/12',
}

const THAI_NUM: Record<number, string> = {
  0: 'ไม่มี',
  1: 'หนึ่ง',
  2: 'สอง',
  3: 'สาม',
  4: 'สี่',
  5: 'ห้า',
  6: 'หก',
  7: 'เจ็ด',
  8: 'แปด',
  9: 'เก้า',
}

function thaiNumber(n: number): string {
  if (n < 10) return THAI_NUM[n]
  if (n < 20) return 'สิบ' + (n % 10 ? THAI_NUM[n % 10] : '')
  if (n < 100) return THAI_NUM[Math.floor(n / 10)] + 'สิบ' + (n % 10 ? THAI_NUM[n % 10] : '')
  return String(n)
}

export function timeAgo(input: string | null | undefined): string {
  if (!input) return '—'
  const then = new Date(input).getTime()
  if (Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'เมื่อกี้'
  if (min < 60) return `${min} นาทีที่แล้ว`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${thaiNumber(hr)} ชั่วโมงที่แล้ว`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${thaiNumber(day)} วันที่แล้ว`
  if (day < 30) return `${thaiNumber(Math.floor(day / 7))} อาทิตย์ที่แล้ว`
  return new Date(input).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function formatDate(input: string | null | undefined): string {
  if (!input) return 'ไม่ระบุ'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return 'ไม่ระบุ'
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: '2-digit' })
}

export function baht(n: number): string {
  return `฿${n.toLocaleString('th-TH')}`
}

export const AVATAR_POOL = [
  '🕶️', '🌤️', '🌿', '🪷', '🐻', '🧢', '🌍', '🫧', '🍑', '🪐', '🎧', '🧋', '🦖', '🌈', '🍜', '🐣',
]
