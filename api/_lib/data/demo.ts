import bcrypt from 'bcryptjs'
import type { UserWithSecret } from '../types.js'

const hash = (p: string) => bcrypt.hashSync(p, 8)

let seq = 0
const uid = () => `demo-user-${++seq}`

function user(
  display_name: string,
  avatar_emoji: string,
  campus: string,
  email: string,
  role: 'user' | 'admin' = 'user',
  points = 0
): UserWithSecret {
  return {
    id: uid(),
    email,
    password_hash: hash('demo1234'),
    display_name,
    avatar_emoji,
    campus,
    bio: '',
    role,
    points,
    created_at: new Date().toISOString(),
  }
}

export const DEMO_USERS: UserWithSecret[] = [
  user('โจ้ 🕶️', '🕶️', 'มหาวิทยาลัยบูรพา', 'joe@lostfound.app', 'admin', 320),
  user('น้องฟ้า', '🌤️', 'มหาวิทยาลัยบูรพา', 'fah@lostfound.app', 'user', 140),
  user('ต้น', '🌿', 'มหาวิทยาลัยบูรพา', 'ton@lostfound.app', 'user', 88),
  user('มะลิ', '🪷', 'มหาวิทยาลัยบูรพา', 'mali@lostfound.app', 'user', 65),
  user('เบส', '🐻', 'มหาวิทยาลัยบูรพา', 'best@lostfound.app', 'user', 42),
  user('ป้อม', '🧢', 'วิทยาลัยเทคนิคฯ', 'pom@lostfound.app', 'user', 30),
  user('เอิร์ธ', '🌍', 'มหาวิทยาลัยบูรพา', 'earth@lostfound.app', 'user', 21),
  user('ซา', '🫧', 'มหาวิทยาลัยบูรพา', 'sa@lostfound.app', 'user', 12),
  // บัญชีสำหรับทดสอบ E2E / ลองเล่น (เพิ่มท้ายสุดเพื่อไม่ให้ owner_index ใน DEMO_ITEMS เปลี่ยน)
  user('ผู้ใช้เดโม 🧪', '🧪', 'มหาวิทยาลัยบูรพา', 'demo@lostfound.app', 'user', 0),
]

export interface DemoItem {
  kind: 'lost' | 'found'
  title: string
  description: string
  category_id: string
  location: string
  occurred_at: string | null
  contact_line: string
  reward: number
  status: 'open' | 'claimed' | 'returned' | 'closed'
  owner_index: number
  display_name?: string
}

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

export const DEMO_ITEMS: DemoItem[] = [
  {
    kind: 'found',
    title: 'AirPods Pro 2 สีขาว + เคสชาร์จ',
    description:
      'เจอวางอยู่บนโต๊ะหนังสือ ชั้น 4 อาคาร A ใกล้หน้าต่างคาเฟ่ ของใหม่ยังไม่ได้เปิดใช้ มีสายครบ เดี๋ยวส่งให้ที่หน้าเสนอหน่อย 🫶',
    category_id: 'electronics',
    location: 'อาคาร A ชั้น 4 · ห้องประชุม A402',
    occurred_at: day(1),
    contact_line: '@joe_found',
    reward: 0,
    status: 'open',
    owner_index: 0,
  },
  {
    kind: 'lost',
    title: 'กระเป๋าผ้าใบชาแพนซา 🐼 (ใบใหญ่มีตัวลิง)',
    description:
      'หนีไปตอนไปเรียนคอมพิวเตอร์ ใบนี้ใบใหญ่ที่มีตัวลิงแขวนอยู่ข้างล่าง ในรูปมีสมุดปกสีเขียว + ไฟฉาย USB + บัตรนักศึกษา',
    category_id: 'bag',
    location: 'คณะวิทยาการจัดการ ชั้น 3 ห้องคอมฯ 305',
    occurred_at: day(2),
    contact_line: '081-234-5678',
    reward: 500,
    status: 'open',
    owner_index: 1,
  },
  {
    kind: 'lost',
    title: 'กุญแจรถมอเตอร์ไซค์ (ท้องแบบเดียวกับหัวพวง + แท่งเหล็กเล็ก)',
    description: 'ลืมไว้ที่ล็อคเตอร์ชั้น 2 ตรงทางเข้าห้องน้ำ มีป้ายห้อยเป็นเลข 42',
    category_id: 'keys',
    location: 'อาคารเรียนรวม ชั้น 2 (ทางเข้าห้องน้ำชาย)',
    occurred_at: day(1),
    contact_line: '089-999-1122',
    reward: 300,
    status: 'open',
    owner_index: 2,
  },
  {
    kind: 'found',
    title: 'กระเป๋าสตางค์หนัง PU สีน้ำตาล มีบัตรเครดิต',
    description: 'พบวางบนโต๊ะกลางห้องสมุด เปิดดูข้างในแล้วไม่ได้แตะเงินสดนะ แค่ตามรูปจำได้',
    category_id: 'wallet',
    location: 'ห้องสมุดกลาง ชั้น 1 (โซนอ่านหนังสือ)',
    occurred_at: day(3),
    contact_line: 'line: @library.savior',
    reward: 0,
    status: 'open',
    owner_index: 3,
  },
  {
    kind: 'lost',
    title: 'สมุดโน้ตภาษาอังกฤษครบทุกบท (มีชื่อเขียนด้วย)',
    description: 'สีฟ้าอมเขียว เขียนชื่อ "Sutasinee" เป็นฟอนต์หวัดไป เลยไม่กล้าเปิดอ่านรายชื่อนะครับ 🙏',
    category_id: 'stationery',
    location: 'ตึกเรียน ชั้น 6 ห้อง 604',
    occurred_at: day(4),
    contact_line: 'suthinee@bru.ac.th',
    reward: 200,
    status: 'open',
    owner_index: 4,
  },
  {
    kind: 'found',
    title: 'เสื้อกันฝนสีเหลืองเบอร์ 3 (ใส่ตอนขับมอเตอร์ไซ)',
    description: 'แขวนอยู่ที่เสาต้นไม้หน้าอาคารจอดรถ ใบเดียวที่เหลืออยู่ในราว ขอผู้ที่หยิบมาคืนด้วยนะคะ 🙏',
    category_id: 'clothing',
    location: 'ที่จอดรถ ชั้น 3 หลังอาคาร C',
    occurred_at: day(2),
    contact_line: '065-111-2233',
    reward: 0,
    status: 'open',
    owner_index: 5,
  },
  {
    kind: 'lost',
    title: 'iPhone 13 สีมิดแพน มีเคสซิลิโคนสีเขียว',
    description: 'ลืมไว้ที่โต๊ะปาร์ตี้ ชั้น 1 อาคาร D (มีที่ประจำโต๊ะยาว) ถ้ามีรหัสผ่านบอกได้ ไม่ลบข้อมูลนะ',
    category_id: 'electronics',
    location: 'อาคาร D ชั้น 1 ห้องอาหาร',
    occurred_at: day(0),
    contact_line: 'line: @mintphone13',
    reward: 1500,
    status: 'open',
    owner_index: 6,
  },
  {
    kind: 'found',
    title: 'บัตรนักศึกษา + บัตรเครดิต CIMB',
    description: 'เจอตอนทำความสะอาดโต๊ะในห้องเรียน ส่งคืนได้ที่ห้องพักครู หรือโทรมาบอกได้เลย',
    category_id: 'documents',
    location: 'อาคาร B ชั้น 3 ห้อง 312',
    occurred_at: day(5),
    contact_line: '089-888-7766',
    reward: 0,
    status: 'open',
    owner_index: 7,
  },
  {
    kind: 'lost',
    title: 'แว่นตาดำเอกสาร (แผ่นใหญ่)',
    description: 'ตาแมวมาก เป็นแว่นตาดำเต็มกรอบ ใส่ในกระเป๋าสายสะพาย',
    category_id: 'other',
    location: 'สนามฟุตบอล / เขตอนุรักษ์',
    occurred_at: day(7),
    contact_line: 'beam@lostfound.app',
    reward: 150,
    status: 'open',
    owner_index: 0,
  },
  {
    kind: 'found',
    title: 'น้ำหวานเย็นแก้วใหญ่ 2 แก้ว (ยังไม่เปิด)',
    description: 'วางทิ้งไว้บนโต๊ะปิดโครงการ ของยังปิดผ้าอยู่เลย เจ้าของมาดึงได้ที่ห้องทำงานอาจารย์',
    category_id: 'other',
    location: 'อาคาร A ชั้น 5 ห้องทำงาน',
    occurred_at: day(1),
    contact_line: 'line: @dessert.table',
    reward: 0,
    status: 'open',
    owner_index: 1,
  },
  {
    kind: 'lost',
    title: 'รองเท้าผ้าใบ Nike ขนาด 42.5',
    description: 'ข้างเดียว สีขาวล้วน สวมไปวิ่งตอนเย็น ไปทิ้งไว้ตรงรางน้ำทางเข้า',
    category_id: 'clothing',
    location: 'สนามฟุตบอล เสาไฟ',
    occurred_at: day(3),
    contact_line: '089-666-1234',
    reward: 700,
    status: 'open',
    owner_index: 3,
  },
  {
    kind: 'found',
    title: 'พวงกุญแจรถยนต์ + กระเป๋าสายผ้า (คนละเจ้าของ)',
    description: 'เจอที่เสาติดรถ ขอใครร้องแมว ๆ ด้วย 🐈',
    category_id: 'keys',
    location: 'ลานจอดรถชั้น 1 เสา 12',
    occurred_at: day(6),
    contact_line: 'line: @catmancer',
    reward: 0,
    status: 'open',
    owner_index: 5,
  },
  {
    kind: 'lost',
    title: 'MacBook Air M1 เคสเงิน (เปิดไม่ได้ ไม่มีรหัส)',
    description: 'หนีไปตอนไปฝนตก ใส่ซิปหนัง ตรงระเบียงชั้น 3 ตอนประชุมสหศึกษ์',
    category_id: 'electronics',
    location: 'อาคาร C ชั้น 3 ระเบียงหน้าเสาธง',
    occurred_at: day(1),
    contact_line: 'mac.air.bruno@gmail.com',
    reward: 2000,
    status: 'open',
    owner_index: 7,
  },
  {
    kind: 'found',
    title: 'ยาสีผมสีดำ (ยี่ห้อเมจิ)',
    description: 'ทิ้งไว้ในห้องน้ำชายชั้น 2 ใช้แล้วนิดหน่อย ยังพอใช้ได้ครับ',
    category_id: 'other',
    location: 'อาคารเรียนรวม ชั้น 2 ห้องน้ำ',
    occurred_at: day(8),
    contact_line: '062-345-6789',
    reward: 0,
    status: 'open',
    owner_index: 2,
  },
  {
    kind: 'found',
    title: 'ทรงกระเป๋าสะพายข้างสีน้ำตาลพร้อมป้ายชื่อ',
    description: 'ห้องเรียนคอมฯ 302 เจอบนโต๊ะเรียน มีป้ายชื่อเขียนอยู่เลย ขอใครแมว ๆ รับไปด้วย',
    category_id: 'bag',
    location: 'อาคาร A ชั้น 3 ห้อง 302',
    occurred_at: day(2),
    contact_line: 'line: @bagrescue',
    reward: 0,
    status: 'open',
    owner_index: 4,
  },
  {
    kind: 'lost',
    title: 'เครื่องคิดเลข Casio fx-991 (ปุ่มบางปุ่มยุบ)',
    description: 'สำคัญมาก ใช้สอบแล้วหายเลย เสียดาย',
    category_id: 'stationery',
    location: 'อาคาร B ชั้น 4 ห้องสอบ',
    occurred_at: day(9),
    contact_line: '081-000-9999',
    reward: 900,
    status: 'open',
    owner_index: 6,
  },
  {
    kind: 'found',
    title: 'ทองเขียว ขนาดจิ้งจอก (แถมสายผ่านรอบข้อมือ)',
    description: 'วางบนชั้นวางรองเท้าหน้าห้องน้ำ น่ารักมากกก 🥺',
    category_id: 'pet',
    location: 'อาคาร D ชั้น 1 หน้าห้องน้ำหญิง',
    occurred_at: day(1),
    contact_line: 'line: @turtle_home',
    reward: 0,
    status: 'open',
    owner_index: 7,
  },
  {
    kind: 'lost',
    title: 'ร่างผมปอยส้มพรมกระดาษ',
    description: 'เป็นของขวัญวันเกิดที่แม่ให้ เสียดายมากกกค่ะ 😭',
    category_id: 'other',
    location: 'ห้องครัวแม่ บูรพา',
    occurred_at: day(10),
    contact_line: 'line: @paimon',
    reward: 0,
    status: 'open',
    owner_index: 1,
  },
]
