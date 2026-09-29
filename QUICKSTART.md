# 🚀 Lost & Found — Vue 3 + Tailwind + Neon

> แอปแจ้งของหาย–ของเจอ สำหรับนักศึกษา · UI แนว Gen-Z · ฐานข้อมูล Neon (Postgres serverless)

## สคริปต์ที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev` | รัน API (8787) + เว็บ (5173) พร้อมกัน ← **ใช้อันนี้** |
| `npm run check` | เช็คว่า API + เว็บทำงานอยู่ไหม (บอกด้วยว่าใช้ Neon หรือ demo) |
| `npm run db:push` | สร้าง/อัปเดตตารางบน Neon (idempotent) |
| `npm run db:seed` | ใส่ข้อมูลตัวอย่าง (หมวดหมู่ 9 · ผู้ใช้ 9 · ประกาศ 18) |
| `npm run typecheck` | ตรวจ type ทั้ง server (tsc) และ client (vue-tsc) |
| `npm run test:unit` | Unit test 45 เคส (Vitest) |
| `npm run test:e2e` | E2E 30 เคส × 2 โปรเจกต์ (chromium + mobile) |
| `npm run test` | unit + e2e ทั้งหมด |
| `npm run build` | build server (tsc → dist) + client (vite → dist) |
| `npm run ci` | typecheck + unit + build (เหมือนที่ GitHub Actions ทำ) |

## พอร์ต

| | เว็บ | API |
| --- | --- | --- |
| ใช้งานปกติ (`npm run dev`) | 5173 | 8787 |
| E2E (`npm run test:e2e`) | **5175** | **8788** |

> แยกพอร์ตกันไว้ เพื่อให้ **เทสต์ไม่ไปชนกับ dev server ของคุณ** — รัน `npm run dev` ไว้แล้วสั่ง `npm run test:e2e` ได้เลย แอปหลักยังทำงานต่อไป

## ถ้าเห็นหน้าเว็บขึ้นแต่ข้อมูลไม่โหลด (404 ทุก endpoint)

แปลว่า **API ไม่ทำงาน** — หน้าเว็บจะขึ้นแถบแดง `🔌 เชื่อมต่อ API ไม่ได้` พร้อมปุ่ม "ลองใหม่" แก้ด้วย:

```bash
npm run check      # ตรวจสถานะก่อน
npm run dev        # แล้วสตาร์ตใหม่
```

## ทดสอบกับ Neon จริง

```bash
E2E_NEON=1 npx playwright test        # จะ seed ข้อมูลลงฐานข้อมูลก่อน
```

## โครงสร้าง

```
server/   Express 5 + Neon (store.neon.ts) + memory driver สำหรับ demo
client/   Vue 3 + Tailwind v4 (ธีมมืด/สว่าง, 11 หน้า)
tests/    Playwright E2E + fixtures
scripts/  check.mjs (ตัวตรวจความพร้อม)
.github/  ci.yml (5 jobs) · cd.yml (deploy)
```

รายละเอียดทั้งหมดอยู่ใน [`README.md`](./README.md)
