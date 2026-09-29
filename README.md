# 🔍 Lost & Found — คืนของดี ๆ กันนะ

แอปแจ้งของหาย / ของเจอ สำหรับนักศึกษา สร้างด้วย **Vue 3 + TypeScript + Tailwind CSS v4** และเชื่อมฐานข้อมูล **Neon (PostgreSQL Serverless)**

UI แนว Gen-Z: gradient สด ๆ, glassmorphism, ฟอนต์ Outfit + Noto Sans Thai, การ์ดมน ๆ, สติกเกอร์หมวดหมู่, toast และแอนิเมชันลอย ๆ

---

## ✨ ฟีเจอร์

| หน้า | รายละเอียด |
| --- | --- |
| 🏠 หน้าแรก | Hero, ตัวเลขสถิติ (นับเลขขึ้น), 3 ขั้นตอน, หมวดหมู่, ประกาศล่าสุด, marquee เลื่อน |
| 🔎 ค้นหาของ | ค้นหาข้อความ (debounce 350ms), กรอง LOST/FOUND, หมวด, สถานะ, เรียงล่าสุด/คนยอมจอย/รางวัล, URL sync, skeleton |
| 📣 ลงประกาศ | สลับโหมดเจอแล้ว/ทำหาย, อัปโหลดรูป (preview, จำกัด 4MB), เลือกหมวด, ตั้งรางวัล, ติดต่อ |
| 🙋 ขอรับของ | พิสูจน์ตัวตนด้วยรายละเอียดจุดสังเกต, กันขอซ้ำ, เจ้าของอนุมัติ/ปฏิเสธ, ปิดเคสอัตโนมัติ |
| 🎒 พื้นที่ของฉัน | 3 แท็บ: ประกาศของฉัน (เปลี่ยนสถานะ/ลบ), คำขอเข้ามา, ที่ฉันไปขอ |
| 🧑‍🎤 โปรไฟล์ | เลือกอวตารอีโมจิ, ชื่อ, คณะ, bio, ออกจากระบบ |
| 🔔 การแจ้งเตือน | แจ้งเมื่อมีคนอ้างของ / คำขอถูกอนุมัติหรือปฏิเสธ |
| 🔐 สมัครสมาชิก | เลือกอวตาร, ตัววัดความแข็งแรงรหัสผ่าน, validation, redirect กลับหน้าเดิม |
| 🧭 เข้าสู่ระบบ | แสดง/ซ่อนรหัสผ่าน, ปุ่มบัญชีเดโม, ประกาศไฮไลต์ |
| 404 | หน้าหายไปตามของที่หาย 😼 |

รองรับมือถือครบ: **bottom tab bar** + FAB กลาง, header แบบ glass

---

## 🧰 Tech stack

**Frontend**
- Vue 3.5 (`<script setup>` + TypeScript) · Vite 8
- Vue Router 5 (lazy route + auth guard) · Pinia 4
- Tailwind CSS v4 (ผ่าน `@tailwindcss/vite`, ธีมใน `@theme`, utility เองด้วย `@utility`)
- @vueuse/core (`onClickOutside`)
- ฟอนต์: Outfit, Noto Sans Thai, Space Grotesk

**Backend**
- Express 5 + TypeScript (รันด้วย `tsx`)
- **Neon** `@neondatabase/serverless` (NeonQueryFunction ผ่าน HTTP)
- JWT (`jsonwebtoken`) + `bcryptjs` + `zod` ตรวจ input + `multer` อัปโหลดรูป
- โครงสร้างแบบ driver: ต่อ **Neon** อัตโนมัติ ถ้าไม่มี `DATABASE_URL` จะสลับเป็น **Demo mode** (memory) เพื่อให้เปิดดู UI ได้ทันที

---

## 🚀 เริ่มใช้งาน

### 1. ติดตั้ง

```bash
npm install                 # root
npm --prefix server install
npm --prefix client install
```

### 2. (สำคัญ) ตั้งค่า Neon

1. สมัคร/เข้า [console.neon.tech](https://console.neon.tech) → **Create a project** (เลือก region ที่ใกล้ เช่น Singapore)
2. สร้าง database ชื่ออะไรก็ได้ เช่น `lostfound`
3. ไปที่ **Connection Details** → คัดลอก **Pooled connection string** (หรือ Direct) จะได้ค่าลักษณะ
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/lostfound?sslmode=require`
4. สร้างไฟล์ `server/.env`

```bash
cp server/.env.example server/.env     # Windows: copy server\.env.example server\.env
```

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/lostfound?sslmode=require
JWT_SECRET=สตริงสุ่มยาว ๆ สัก 32 ตัวอักษร
PORT=8787
```

5. **สร้างตาราง + ข้อมูลตัวอย่าง** (ปลอดภัย รันซ้ำได้)

```bash
npm run db:push     # สร้าง schema (19 statements)
npm run db:seed     # ใส่หมวดหมู่ 9 + บัญชีเดโม 8 คน + ประกาศ 18 รายการ
```

> หรือเปิดไฟล์ [`server/sql/schema.sql`](server/sql/schema.sql) ไปวางใน **Neon SQL Editor** แล้วกด Run ก็ได้

> 💡 ถ้าขีดเกิด `gen_random_uuid()` ให้รัน `create extension if not exists pgcrypto;` ก่อนหนึ่งครั้ง (Neon 18 ใช้ได้เลย)

6. เช็คว่าต่อได้

```bash
curl http://localhost:8787/api/health
# {"ok":true,"driver":"neon",...}   ← ถ้าได้ "memory" แปลว่ายังไม่ได้ใส่ DATABASE_URL
```

> 👑 **บัญชีแรกที่สมัครถือเป็นแอดมินอัตโนมัติ** หรือถ้าอยากตั้งเอง:
> `update users set role = 'admin' where email = 'you@example.com';`


### 3. รัน

```bash
npm run dev
```

- 🌐 Web: <http://localhost:5173>
- 🔌 API: <http://localhost:8787> (health: `/api/health`)

บัญชีทดลอง (มีทั้งตอนรัน Neon และ demo mode): `demo@lostfound.app` / `demo1234` · แอดมิน: `joe@lostfound.app` / `demo1234`

### 4. Build & Test

```bash
npm run typecheck      # tsc (server) + vue-tsc (client)
npm run test:unit      # Vitest: 45 unit tests
npm run test:e2e       # Playwright: 22 E2E tests (เปิด server ให้เองอัตโนมัติ)
npm run test           # unit + e2e ทั้งหมด
npm run build          # server (tsc) + client (vite)
```

---

## 🧪 การทดสอบ (Testing)

ใช้ 2 ชั้น: **unit test** (เร็ว, ไม่ต้องเปิดเบราว์เซอร์) + **E2E test** (เปิดเบราว์เซอร์จริง)

### Unit test — Vitest (API เหมือน Jest: `describe/it/expect`)

Vitest เป็น runner ฝั่ง Vite ที่ compatible กับ Jest 100% (โค้ดและ assertion เหมือนกันทุกอย่าง แต่ตั้งค่าได้ง่ายกว่ามากในโปรเจกต์ Vue + TS นี้)

```bash
npm --prefix server run test          # 18 tests — business logic ผ่าน Store interface
npm --prefix client run test          # 27 tests — format helpers + Pinia stores
npm run test:coverage                 # พร้อม coverage report
npm --prefix client run test:watch    # โหมด watch
```

**ครอบคลุม:**
| ไฟล์ | สิ่งที่ทดสอบ |
| --- | --- |
| `server/src/db/store.test.ts` | สร้าง/ค้น/กรองประกาศ, กันขอซ้ำ, อนุมัติ→คืนสำเร็จ+แต้ม, ปฏิเสธ→เปิดกลับ, สิทธิ์เจ้าของ, watchlist แจ้งเตือนตรงเงื่อนไข, review ครั้งเดียว, chat access, admin overview |
| `client/src/lib/format.test.ts` | `timeAgo` เลขไทย (เมื่อกี้/นาที/ชั่วโมง/วัน/สัปดาห์), `formatDate`, `baht`, meta ของสถานะ/ประเภท/หมวด |
| `client/src/stores/stores.test.ts` | items store (query string, filter, reset), auth store (login/register/401+404 ล้าง session/logout), toast store (fake timers), extras store (watchlist, chat 403) |

### E2E — Playwright

```bash
npm run test:e2e           # headless ทั้งหมด (chromium + mobile)
npm run test:e2e:ui        # เปิด Playwright Inspector
npm run test:e2e:headed    # เปิดเบราว์เซอร์ให้ดู
npm run test:e2e:mobile    # เฉพาะ Pixel 7
npm run test:e2e:report    # เปิด HTML report
```

`playwright.config.ts` จะ**เปิด API + เว็บเองอัตโนมัติ** (`webServer`) และเรียก `db:seed` ก่อนเทสต์ เท่ากับ `demo@lostfound.app` / `joe@lostfound.app` (รหัส `demo1234`) ใช้ได้ทั้งกับ Neon และ demo mode

| Spec | ครอบคลุม |
| --- | --- |
| `browse.spec.ts` | หน้าแรก, ค้นหา, กรองหมวด, empty state, 404, สวิตช์ธีมสว่าง/มืดจำค่าไว้ |
| `auth.spec.ts` | สมัครสมาชิก, validation ทุกกรณี, ความแข็งแรงรหัสผ่าน, อีเมลซ้ำ, login demo/ผิดรหัส, route guard, logout |
| `lost-found-flow.spec.ts` | **วงจรเต็ม:** ลงประกาศ → คนขอรับ → เจ้าของอนุมัติ → แชทกัน → ให้คะแนน + จัดการสถานะ/ลบประกาศ |
| `extras.spec.ts` | watchlist → ได้รับแจ้งเตือนอัตโนมัติ, หน้าแอดมิน + การป้องกันสิทธิ์, แก้โปรไฟล์ |
| `api.spec.ts` | REST contract: health, categories/stats, 401/403, register→create→patch→delete, validation |

---

## 🚀 CI/CD

| ไฟล์ | ทำอะไร |
| --- | --- |
| `.github/workflows/ci.yml` | 5 jobs: **Typecheck** → **Unit tests** → **Build** → **E2E (Playwright)** → **Neon schema check** (ถ้ามี secret) |
| `.github/workflows/cd.yml` | Deploy หลัง push เข้า `main`: เว็บ → Vercel, API → Render (deploy hook) |

**รายละเอียด**
- ทุก job ติดตั้ง dependency เอง (`npm ci`) ทั้ง 3 package
- E2E ติดตั้งเฉพาะ Chromium เพื่อความเร็ว (`npx playwright install --with-deps chromium`) และอัปโหลด `playwright-report` เป็น artifact
- ถ้าไม่มี `DATABASE_URL` ใน CI → เซิร์ฟเวอร์ใช้ demo mode ทำให้เทสต์ไม่ต้องพึ่งฐานข้อมูลภายนอก
- Job `neon-schema-check` จะรันเฉพาะเมื่อมี secret `DATABASE_URL` — ใช้ `npm run db:push` กับฐานข้อมูลจริงเพื่อยืนยันว่า schema ใช้ได้

**ตั้งค่า secrets** (Settings → Secrets and variables → Actions)

| Secret | ใช้ทำอะไร |
| --- | --- |
| `DATABASE_URL` | (ไม่บังคับ) เปิด job ตรวจ schema กับ Neon จริง |
| `VERCEL_TOKEN` | (ไม่บังคับ) deploy เว็บลง Vercel |
| `RENDER_DEPLOY_HOOK` | (ไม่บังคับ) trigger deploy API บน Render |

**รันในเครื่องแบบเดียวกับ CI**
```bash
npm run ci     # typecheck + unit + build
npm run test   # unit + e2e ครบ
```

**Deploy เอง (ถ้าไม่อยากใช้ GitHub Actions)**
- **Client** → Vercel / Netlify: build `npm --prefix client run build`, output `client/dist`, ใส่ rewrite ทุก path → `index.html` (เพราะใช้ history mode)
- **Server** → Render / Railway / Fly.io: start `npm --prefix server run start`, port 8787, ใส่ env `DATABASE_URL`, `JWT_SECRET`
- อย่าลืมตั้ง CORS ให้โดเมนของ client (เซิร์ฟเวอร์เปิด `origin: true` อยู่แล้ว)

---

## 📁 โครงสร้างโปรเจกต์

```
.
├── package.json              # concurrently: รันทั้ง API + WEB
├── server/
│   ├── .env.example
│   ├── sql/schema.sql        # DDL ทั้งหมด (users/items/categories/claims/notifications)
│   ├── uploads/              # รูปที่อัปโหลด (เสิร์ฟ static ที่ /uploads)
│   └── src/
│       ├── index.ts          # ตั้ง middleware + mount route
│       ├── auth.ts           # JWT sign/verify, requireAuth, requireAdmin
│       ├── upload.ts         # multer (รูปอย่างเดียว, ≤ 4MB)
│       ├── types.ts          # type กลาง + interface Store
│       ├── data/
│       │   ├── categories.ts # 9 หมวดหมู่
│       │   └── demo.ts       # ข้อมูลตัวอย่างตอน demo mode
│       ├── db/
│       │   ├── index.ts      # เลือก driver (neon | memory)
│       │   ├── store.neon.ts # SQL จริงทั้งหมด
│       │   ├── store.memory.ts
│       │   └── push.ts       # npm run db:push
│       └── routes/
│           ├── auth.routes.ts
│           ├── items.routes.ts
│           └── claims.routes.ts  # + notifyRouter
└── client/
    └── src/
        ├── style.css         # Tailwind v4 theme, keyframes, utility
        ├── types.ts          # type ฝั่ง client
        ├── lib/              # api.ts (fetch wrapper), format.ts (เวลาไทย/สถานะ)
        ├── stores/           # auth, items, social, toast
        ├── components/       # AppHeader, MobileTabBar, ItemCard, Toaster, ...
        └── views/            # Landing, Home, ItemDetail, Report, MySpace, Profile, Login, Register, NotFound
```

---

## 🔌 API

| Method | Path | Auth | รายละเอียด |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | สมัคร (ชื่อ/อีเมล/รหัส 8+ / อวตาร / คณะ) |
| POST | `/api/auth/login` | – | เข้าสู่ระบบ |
| GET | `/api/auth/me` | ✅ | ข้อมูลผู้ใช้ปัจจุบัน |
| PATCH | `/api/auth/me` | ✅ | แก้ชื่อ/อวตาร/คณะ/bio |
| GET | `/api/items` | – | `?q=&kind=&category=&status=&sort=&limit=&offset=&mine=&claimed=` |
| GET | `/api/items/categories` | – | หมวดหมู่ทั้งหมด |
| GET | `/api/items/stats` | – | สถิติหน้าแรก |
| GET | `/api/items/:id` | – | รายละเอียด + `has_claimed` |
| POST | `/api/items` | ✅ | ลงประกาศ (multipart ถ้ามีรูป) |
| PATCH | `/api/items/:id` | ✅ | แก้ไข/เปลี่ยนสถานะ (เจ้าของเท่านั้น) |
| DELETE | `/api/items/:id` | ✅ | ลบประกาศ |
| GET | `/api/claims/mine` | ✅ | สิ่งที่ฉันไปขอรับ |
| GET | `/api/claims/incoming` | ✅ | คำขอที่เข้ามาหาประกาศของฉัน |
| POST | `/api/claims/:itemId` | ✅ | ขอรับของ (ห้ามซ้ำ/ห้ามขอของตัวเอง) |
| PATCH | `/api/claims/:id` | ✅ | อนุมัติ/ปฏิเสธ (เจ้าของประกาศ) |
| GET | `/api/notifications` | ✅ | การแจ้งเตือน |
| POST | `/api/notifications/read` | ✅ | ทำเครื่องหมายว่าอ่านแล้ว |
| GET | `/api/health` | – | สถานะเซิร์ฟเวอร์ + driver ที่ใช้ |

---

## 🗄️ โครงสร้างฐานข้อมูล (Neon)

- **users** — บัญชี (email unique, password_hash = bcrypt, role, points)
- **categories** — หมวดหมู่พร้อมอีโมจิ/สี
- **items** — ประกาศ (`kind`: lost/found, `status`: open/claimed/returned/closed, reward, image_url)
- **claims** — คำขอรับของ (`unique(item_id, claimant_id)` กันขอซ้ำ)
- **notifications** — แจ้งเตือนในแอป

มี index ครบทั้ง `created_at`, `kind`, `status`, `owner_id` และตาราง `claims`

---

## 🧠 หมายเหตุ

- **Demo mode**: ถ้าไม่ตั้ง `DATABASE_URL` เซิร์ฟเวอร์จะใช้ข้อมูลใน memory พร้อมข้อมูลตัวอย่าง 18 ประกาศ + บัญชีเดโม (รหัสผ่าน `demo1234`) ข้อมูลจะหายเมื่อรีสตาร์ท — ใช้ดู UI เท่านั้น
- **รูปภาพ** เก็บเป็นไฟล์ใน `server/uploads/` เสิร์ฟที่ `/uploads/*` (ถ้าต้องการเก็บลง Neon Storage หรือ S3 ให้เปลี่ยน `src/upload.ts`)
- **รหัสผ่าน** เก็บเป็น bcrypt hash, token เป็น JWT 7 วัน เก็บใน `localStorage`
- ตัวเลขในหน้าแรกนับจาก `/api/items/stats` จริง (ถ้ายังไม่ต่อ DB จะเป็น 0)
