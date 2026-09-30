# 🔍 Lost & Found — คืนของดี ๆ กันนะ

แอปแจ้งของหาย / ของเจอ สำหรับนักศึกษา สร้างด้วย **Vue 3 + TypeScript + Tailwind CSS v4** และเชื่อมฐานข้อมูล **Neon (PostgreSQL Serverless)**

> 🚀 **Deploy ครั้งเดียวบน Vercel** — เว็บ (Vue) + API (Serverless Functions) อยู่โดเมนเดียวกัน
> ไม่ต้องมี server แยก และไม่ต้องตั้ง `VITE_API_URL` เพราะ client ยิง `/api/...` ไปที่ตัวเอง

UI แนว Gen-Z: gradient สด ๆ, glassmorphism, ฟอนต์ Outfit + Noto Sans Thai, การ์ดมน ๆ, สติกเกอร์หมวดหมู่, toast และแอนิเมชันลอย ๆ
พร้อม **ธีมมืด/สว่าง**, แชทเรียลไทม์, watchlist แจ้งเตือนอัตโนมัติ, ระบบรีวิว+คะแนนความน่าเชื่อถือ, แดชบอร์ดแอดมิน
และมี **CI/CD + unit test (Vitest) + E2E (Playwright)** ครบ

---

## ✨ ฟีเจอร์

| หน้า | รายละเอียด |
| --- | --- |
| 🏠 หน้าแรก | Hero, ตัวเลขสถิติ (นับเลขขึ้น), 3 ขั้นตอน, หมวดหมู่, ประกาศล่าสุด, marquee เลื่อน |
| 🔎 ค้นหาของ | ค้นหาข้อความ (debounce 350ms), กรอง LOST/FOUND, หมวด, สถานะ, เรียงล่าสุด/คนยอมจอย/รางวัล, URL sync, skeleton |
| 📣 ลงประกาศ | สลับโหมดเจอแล้ว/ทำหาย, อัปโหลดรูป (preview, จำกัด 4MB), เลือกหมวด, ตั้งรางวัล, ติดต่อ |
| 🙋 ขอรับของ | พิสูจน์ตัวตนด้วยรายละเอียดจุดสังเกต, กันขอซ้ำ, เจ้าของอนุมัติ/ปฏิเสธ, ปิดเคสอัตโนมัติ, ป้ายความน่าเชื่อถือของเจ้าของ |
| 🎒 พื้นที่ของฉัน | 3 แท็บ: ประกาศของฉัน (เปลี่ยนสถานะ/ลบ), คำขอเข้ามา, ที่ฉันไปขอ |
| 🧑‍🎤 โปรไฟล์ | เลือกอวตารอีโมจิ, ชื่อ, คณะ, bio, ออกจากระบบ |
| 🔔 การแจ้งเตือน | แจ้งเมื่อมีคนอ้างของ / คำขอถูกอนุมัติหรือปฏิเสธ / มีแชทใหม่ / ได้รับรีวิว |
| 🔔 ติดตาม (Watchlist) | ตั้งคำค้น/หมวด/ประเภทที่สนใจ แล้วระบบแจ้งทันทีที่มีประกาศตรงเงื่อนไข |
| ⭐ รีวิว + คะแนน | ให้คะแนนหลังคืนของสำเร็จ (เฉพาะคู่ที่คืนกัน) → badge มือใหม่/คนน่าเชื่อถือ/ฮีโร่/ตำนาน |
| 💬 แชท | คุยกันในประกาศ (เฉพาะเจ้าของ + คนที่ขอรับ) poll ทุก 3 วินาที |
| 👑 สถิติทั้งระบบ | แอดมินดู KPI, กราฟ 14 วัน, หมวดยอดนิยม, ฮีโร่คืนของ, ประกาศล่าสุด |
| 🌙☀️ ธีม | สลับโหมดมืด/สว่าง จำค่าไว้ใน localStorage |
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
npm install
```

### 2. (สำคัญ) ตั้งค่า Neon

### 2. (สำคัญ) ตั้งค่า Neon

1. สมัคร/เข้า [console.neon.tech](https://console.neon.tech) → **Create a project** (เลือก region ที่ใกล้ เช่น Singapore)
2. สร้าง database ชื่ออะไรก็ได้ เช่น `lostfound`
3. ไปที่ **Connection Details** → คัดลอก **Pooled connection string** (หรือ Direct) จะได้ค่าลักษณะ
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/lostfound?sslmode=require`
4. สร้างไฟล์ `.env` ที่ root

```bash
cp .env.example .env     # Windows: copy .env.example .env
```

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/lostfound?sslmode=require
JWT_SECRET=สตริงสุ่มยาว ๆ สัก 32 ตัวอักษร
PORT=8787

# อัปโหลดรูปผ่าน Neon S3 (ไม่บังคับ — ไม่มี = ใช้วิธี local ตอน dev / ปิดตอน deploy)
#AWS_ENDPOINT_URL_S3=https://xxx.storage.c-4.ap-southeast-1.aws.neon.tech
#AWS_ACCESS_KEY_ID=nak_live_...
#AWS_SECRET_ACCESS_KEY=nsk_live_...
#AWS_REGION=ap-southeast-1
#S3_BUCKET=ชื่อ-bucket-ใน-Neon-Storage
```

5. **สร้างตาราง + ข้อมูลตัวอย่าง** (ปลอดภัย รันซ้ำได้)

```bash
npm run db:push     # สร้าง schema
npm run db:seed     # ใส่หมวดหมู่ 9 + บัญชีเดโม + ประกาศตัวอย่าง (เฉพาะตอนเริ่ม)
```

> 🧹 ล้างข้อมูลทดสอบทีหลัง: `npx tsx scripts/db-clean.ts` (dry-run) แล้ว
> `npx tsx scripts/db-clean.ts --confirm` (ลบจริง) — เหลือไว้เฉพาะโพสต์ของคนจริง

> หรือเปิดไฟล์ [`api/_lib/sql/schema.sql`](api/_lib/sql/schema.sql) ไปวางใน **Neon SQL Editor** แล้วกด Run ก็ได้

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
npm run check          # เช็คว่า API + เว็บทำงานอยู่ไหม
npm run test:unit      # Vitest: 45 unit tests
npm run test:e2e       # Playwright: 30 E2E tests (เปิดเซิร์ฟเวอร์แยกพอร์ตให้เอง)
npm run test           # unit + e2e ทั้งหมด
npm run build          # server (tsc) + client (vite)
```

### 🚦 พอร์ต (แยกกันเพื่อไม่ให้เทสต์ชนกับ dev server)

| | เว็บ | API |
| --- | --- | --- |
| ใช้งานปกติ `npm run dev` | 5173 | 8787 |
| E2E `npm run test:e2e` | 5175 | 8788 |

รัน `npm run dev` ไว้แล้วสั่ง `npm run test:e2e` ได้เลย — เทสต์เปิดเซิร์ฟเวอร์ของตัวเองที่อีกชุด
และ **ไม่ไปแตะ dev server ของคุณ** (ปิดเทสต์แล้วแอปหลักยังรันต่อ)

> 💡 ถ้าเห็นหน้าเว็บได้แต่ข้อมูลไม่โหลด (404 ทุก endpoint) แปลว่า **API ไม่ทำงาน**
> หน้าเว็บจะขึ้นแถบแดง `🔌 เชื่อมต่อ API ไม่ได้` พร้อมปุ่ม "ลองใหม่" — แก้ด้วย `npm run dev`
> (หรือ `npm run check` เพื่อตรวจสถานะก่อน)

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
| `api/_lib/db/store.test.ts` | สร้าง/ค้น/กรองประกาศ, กันขอซ้ำ, อนุมัติ→คืนสำเร็จ+แต้ม, ปฏิเสธ→เปิดกลับ, สิทธิ์เจ้าของ, watchlist แจ้งเตือนตรงเงื่อนไข, review ครั้งเดียว, chat access, admin overview |
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

`playwright.config.ts` จะ**เปิด API + เว็บของตัวเอง** บนพอร์ตแยก (8788 / 5175) พร้อมปิด `DATABASE_URL` ให้ใช้ **demo mode**
เพื่อให้ผลลัพธ์นิ่งและรันซ้ำได้ทุกครั้ง (บัญชี `demo@lostfound.app` / `joe@lostfound.app` รหัส `demo1234` ใช้ได้เลย)
และไม่ไปกวน `npm run dev` ของคุณ

ถ้าอยากเทสกับ **Neon จริง**: `E2E_NEON=1 npx playwright test` (จะ seed ข้อมูลตัวอย่างลงฐานข้อมูลก่อน)

| Spec | ครอบคลุม |
| --- | --- |
| `browse.spec.ts` | หน้าแรก, ค้นหา, กรองหมวด, empty state, 404, สวิตช์ธีมสว่าง/มืดจำค่าไว้ |
| `auth.spec.ts` | สมัครสมาชิก, validation ทุกกรณี, ความแข็งแรงรหัสผ่าน, อีเมลซ้ำ, login demo/ผิดรหัส, route guard, logout |
| `lost-found-flow.spec.ts` | **วงจรเต็ม:** ลงประกาศ → คนขอรับ → เจ้าของอนุมัติ → แชทกัน → ให้คะแนน + จัดการสถานะ/ลบประกาศ |
| `extras.spec.ts` | watchlist → ได้รับแจ้งเตือนอัตโนมัติ, หน้าแอดมิน + การป้องกันสิทธิ์, แก้โปรไฟล์ |
| `api.spec.ts` | REST contract: health, categories/stats, 401/403, register→create→patch→delete, validation |

> 💡 เคสที่เทสต์เจอ bug จริงระหว่างพัฒนา: ช่อง `type="email"` ทำให้เบราว์เซอร์บล็อกการส่งฟอร์มเมื่ออีเมลผิดรูปแบบ ข้อความ validation ภาษาไทยของเราจึงไม่แสดง → แก้ด้วยการใส่ `novalidate` ในฟอร์ม

---

## 🚀 CI/CD

| ไฟล์ | ทำอะไร |
| --- | --- |
| `.github/workflows/ci.yml` | 5 jobs: **Typecheck** → **Unit tests** → **Build** → **E2E (Playwright)** → **Neon schema check** (ถ้ามี secret) |

> หมายเหตุ: ไม่มี CD workflow แยก — Vercel deploy อัตโนมัติทุกครั้งที่ push ขึ้น `main` อยู่แล้ว

**รายละเอียด**
- ทุก job ติดตั้ง dependency เอง (`npm ci` ที่ root + `npm --prefix client ci`)
- E2E ติดตั้งเฉพาะ Chromium เพื่อความเร็ว (`npx playwright install --with-deps chromium`) และอัปโหลด `playwright-report` เป็น artifact
- ถ้าไม่มี `DATABASE_URL` ใน CI → เซิร์ฟเวอร์ใช้ demo mode ทำให้เทสต์ไม่ต้องพึ่งฐานข้อมูลภายนอก
- Job `neon-schema-check` จะรันเฉพาะเมื่อมี secret `DATABASE_URL` — ใช้ `npm run db:push` กับฐานข้อมูลจริงเพื่อยืนยันว่า schema ใช้ได้

**ตั้งค่า secrets** (GitHub → Settings → Secrets and variables → Actions)

| Secret | ใช้ทำอะไร |
| --- | --- |
| `DATABASE_URL` | (ไม่บังคับ) เปิด job ตรวจ schema กับ Neon จริง |

> `DATABASE_URL` กับ `JWT_SECRET` ของตัวเว็บ production ตั้งใน **Vercel → Project Settings → Environment Variables** (คนละที่กับตารางข้างบน)

**รันในเครื่องแบบเดียวกับ CI**
```bash
npm run ci     # typecheck + unit + build
npm run test   # unit + e2e ครบ
```

**Deploy ครั้งเดียวที่ Vercel** — เว็บ + API อยู่โดเมนเดียวกัน (ไม่ต้องมี server แยก)

| ขั้นตอน | ทำอะไร |
| --- | --- |
| 1. Import โปรเจกต์ | เชื่อม GitHub repo → Vercel (**Root Directory = เอาออก / repo root**) |
| 2. Environment Variables | `DATABASE_URL` (จาก Neon) · `JWT_SECRET` (สตริงยาว ๆ 32 ตัว) |
| 3. Deploy | เสร็จ! เว็บที่ `https://<โปรเจกต์>.vercel.app` ใช้ได้ทันที |

`vercel.json` ที่ root จัดการให้อัตโนมัติ: build client, rewrite SPA (ยกเว้น `/api`) และ cache assets

> ❌ **อย่าตั้ง Root Directory = `client`** เพราะจะทำให้ `api/[...path].ts` (โฟลเดอร์ `api/` ที่ repo root)
> ไม่ถูก build → จะได้ 404 ทุก request (Vercel ต้องเห็นทั้ง `client/` และ `api/`)

> 💡 ถ้าอยากแยก client กับ API จริง ๆ (เช่นเอา API ไป Render/Railway) ให้ตั้ง `VITE_API_URL`
> ไว้ใน Vercel ได้ — โค้ดรองรับอยู่แล้ว (`client/src/lib/api.ts`)

**ถ้าอยาก self-host / dev แบบมี server จริง (Express)** — `scripts/dev-server.ts` เป็น adapter บาง ๆ ที่ห่อ logic ชุดเดียวกับ function (`npm run dev`)
- รองรับอัปโหลดรูป (Express เท่านั้น — serverless เขียนไฟล์ไม่ได้ ระบบจะซ่อนตัวเลือกนี้ให้อัตโนมัติ)

> หมายเหตุ: ถ้า `/api/health` ตอบ `uploads: false` หน้าลงประกาศจะซ่อนช่องอัปโหลดรูปให้เอง
> (การ deploy แบบ serverless เขียนไฟล์ลงดิสก์ไม่ได้)

> ถ้ายังไม่ได้ deploy API: ปล่อยแค่ Vercel ไว้ หน้าเว็บจะขึ้นแถบแดง `🔌 เชื่อมต่อ API ไม่ได้`
> พร้อมปุ่ม "ลองใหม่" (ตรวจทุก 10 วินาทีและกลับมาออนไลน์เองเมื่อ API ฟื้น)

---

## 📁 โครงสร้างโปรเจกต์

```
.
├── package.json              # ตัวเดียว! deps + scripts ทั้งหมด
├── vite.config.ts            # build เว็บ (alias @ → ./src)
├── tsconfig.app.json         # typecheck ฝั่งเว็บ (vue-tsc)
├── tsconfig.node.json        # typecheck ไฟล์ config
├── tsconfig.json + vitest.config.ts  # typecheck + unit test ฝั่ง api
├── playwright.config.ts      # E2E (chromium + mobile) + webServer
├── vercel.json               # deploy เว็บ + API พร้อมกัน (ครั้งเดียว)
├── index.html                # entry ของเว็บ
├── .env / .env.example       # DATABASE_URL (Neon) + JWT_SECRET
├── src/                      # frontend ทั้งหมด (Vue 3 + Tailwind)
│   ├── style.css             # Tailwind v4 theme, keyframes, utility
│   ├── types.ts              # type ฝั่ง client
│   ├── lib/                  # api.ts (fetch wrapper + VITE_API_URL), format.ts (เวลาไทย/สถานะ)
│   ├── stores/               # auth, items, social, toast, extras (watchlist/chat/review), theme, health
│   ├── components/           # AppHeader, MobileTabBar, ItemCard, ChatPanel, ReviewModal, RepBadge, ApiOfflineBanner, Toaster, ...
│   └── views/                # Landing, Home, ItemDetail, Report, MySpace, Watch, Admin, Profile, Login, Register, NotFound
├── public/favicon.svg        # ไฟล์ static (Vite เสิร์ฟให้เอง)
├── api/[...path].ts          # 🚀 Vercel Serverless Function — จับทุก /api/*
├── api/_lib/                 # backend ทั้งหมด (ไฟล์ใต้ _ ไม่ถูกเสิร์ฟเป็น route)
│   ├── api.ts                # ⭐ ตรรกะ API ทั้งหมด ใช้ร่วมกันทั้ง Vercel + dev
│   ├── api.test.ts           # unit test ของ API core
│   ├── types.ts              # type กลาง + interface Store
│   ├── data/                 # หมวดหมู่ 9 หมวด + ข้อมูล demo
│   ├── db/                   # เลือก driver (neon | memory) + SQL + store.test.ts
│   └── sql/schema.sql        # DDL ทั้ง 8 ตาราง
├── scripts/                  # dev-server (Express) + db-push + db-seed + db-clean + check
├── uploads/                  # รูปที่อัปโหลดตอน dev (gitignored เหลือแค่ .gitkeep)
├── .github/workflows/ci.yml  # CI: typecheck → unit → build → E2E → Neon check
└── tests/e2e/                # Playwright specs + fixtures + global-setup
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
| POST | `/api/items` | ✅ | ลงประกาศ (multipart ตอน dev / JSON + `image_url` ตอน S3) |
| GET | `/api/uploads/presign` | — | (ไม่มี — ใช้ POST) |
| POST | `/api/uploads/presign` | ✅ | ขอ presigned URL อัปโหลดรูปไป S3 (ต้องตั้งค่า S3 ก่อน) |
| GET | `/api/images/:key` | – | ดูรูป (proxy จาก S3 ไม่ต้องเปิด bucket เป็น public) |
| PATCH | `/api/items/:id` | ✅ | แก้ไข/เปลี่ยนสถานะ (เจ้าของเท่านั้น) |
| DELETE | `/api/items/:id` | ✅ | ลบประกาศ |
| GET | `/api/claims/mine` | ✅ | สิ่งที่ฉันไปขอรับ |
| GET | `/api/claims/incoming` | ✅ | คำขอที่เข้ามาหาประกาศของฉัน |
| POST | `/api/claims/:itemId` | ✅ | ขอรับของ (ห้ามซ้ำ/ห้ามขอของตัวเอง) |
| PATCH | `/api/claims/:id` | ✅ | อนุมัติ/ปฏิเสธ (เจ้าของประกาศ) |
| GET | `/api/notifications` | ✅ | การแจ้งเตือน |
| POST | `/api/notifications/read` | ✅ | ทำเครื่องหมายว่าอ่านแล้ว |
| GET | `/api/watches` | ✅ | รายการติดตามของฉัน |
| POST | `/api/watches` | ✅ | ติดตาม (คำค้น / หมวด / ประเภท) |
| DELETE | `/api/watches/:id` | ✅ | เลิกติดตาม |
| GET | `/api/reputation/:userId` | ✅ | คะแนนความน่าเชื่อถือ + รีวิวทั้งหมด |
| POST | `/api/reviews` | ✅ | ให้คะแนน (เฉพาะคู่ที่คืนของสำเร็จ) |
| GET | `/api/items/:itemId/messages` | ✅* | ดูแชท (*เฉพาะเจ้าของ + คนที่ขอรับ) |
| POST | `/api/items/:itemId/messages` | ✅* | ส่งข้อความ |
| GET | `/api/admin/overview` | 👑 | สถิติรวม + กราฟ + ฮีโร่ (แอดมิน) |
| GET | `/api/health` | – | สถานะเซิร์ฟเวอร์ + driver ที่ใช้ |

---

## 🗄️ โครงสร้างฐานข้อมูล (Neon)

- **users** — บัญชี (email unique, password_hash = bcrypt, role, points, bio)
- **categories** — หมวดหมู่พร้อมอีโมจิ/สี
- **items** — ประกาศ (`kind`: lost/found, `status`: open/claimed/returned/closed, reward, image_url)
- **claims** — คำขอรับของ (`unique(item_id, claimant_id)` กันขอซ้ำ)
- **notifications** — แจ้งเตือน (claim / approved / rejected / watch / chat / review)
- **watches** — watchlist (คำค้น + หมวด + ประเภท, `unique` ต่อผู้ใช้)
- **reviews** — รีวิวหลังคืนของสำเร็จ (คิด reputation + badge มือใหม่→คนน่าเชื่อถือ→ฮีโร่→ตำนาน)
- **messages** — แชทในประกาศ (เห็นได้เฉพาะเจ้าของ + คนที่ขอรับ)

มี index ครบทั้ง `created_at`, `kind`, `status`, `owner_id`, `claimant_id`, `target_id` และตาราง `claims`


---

## 🧠 หมายเหตุ

- **Demo mode**: ถ้าไม่ตั้ง `DATABASE_URL` เซิร์ฟเวอร์จะใช้ข้อมูลใน memory พร้อมข้อมูลตัวอย่าง 18 ประกาศ + บัญชีเดโม 8 คน (รหัสผ่าน `demo1234`) ข้อมูลจะหายเมื่อรีสตาร์ท — ใช้ดู UI เท่านั้น
- **Neon**: ตั้ง `DATABASE_URL` ใน `.env` (ที่ root) แล้วรัน `npm run db:push && npm run db:seed` เพื่อสร้างตาราง + ข้อมูลตัวอย่าง (idempotent รันซ้ำได้)
- **รูปภาพ** เก็บเป็นไฟล์ใน `uploads/` เสิร์ฟที่ `/uploads/*` (เฉพาะตอน dev ในเครื่อง — โค้ดอัปโหลดอยู่ใน `scripts/dev-server.ts`)
- **รหัสผ่าน** เก็บเป็น bcrypt hash, token เป็น JWT 7 วัน เก็บใน `localStorage`
- ตัวเลขในหน้าแรกนับจาก `/api/items/stats` จริง

