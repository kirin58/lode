<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LogoMark from '@/components/LogoMark.vue'
import { useItemsStore } from '@/stores/items'

const items = useItemsStore()
</script>

<template>
  <footer class="mt-20 border-t border-white/8 bg-ink/60 backdrop-blur-xl">
    <div
      class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"
    >
      <div class="space-y-4">
        <LogoMark />
        <p class="max-w-xs text-sm leading-relaxed text-night-300">
          พื้นที่รวมประกาศของหาย–ของเจอ สำหรับนักศึกษา คืนของง่าย ๆ โดยไม่ต้องเดินไปทุกห้อง
        </p>
        <p class="text-xs text-night-400">
          ทำด้วย Vue 3 · Tailwind CSS · Neon Postgres 🟣
        </p>
      </div>

      <div>
        <h4 class="mb-4 font-display text-sm font-extrabold">🧭 ใช้งาน</h4>
        <ul class="space-y-2.5 text-sm text-night-300">
          <li><RouterLink to="/browse" class="transition hover:text-white">ค้นหาของทั้งหมด</RouterLink></li>
          <li><RouterLink to="/report?kind=found" class="transition hover:text-white">ฉันเจอของแล้ว</RouterLink></li>
          <li><RouterLink to="/report?kind=lost" class="transition hover:text-white">ฉันทำของหาย</RouterLink></li>
        </ul>
      </div>

      <div>
        <h4 class="mb-4 font-display text-sm font-extrabold">🙋 สำหรับเจ้าของประกาศ</h4>
        <ul class="space-y-2.5 text-sm text-night-300">
          <li><RouterLink to="/mine" class="transition hover:text-white">ดูคำขอเข้ามา</RouterLink></li>
          <li><RouterLink to="/mine?tab=claimed" class="transition hover:text-white">ติดตามสิ่งที่ฉันไปขอ</RouterLink></li>
          <li><RouterLink to="/profile" class="transition hover:text-white">ตั้งค่าโปรไฟล์</RouterLink></li>
        </ul>
      </div>

      <div>
        <h4 class="mb-4 font-display text-sm font-extrabold">📊 ตัวเลขตอนนี้</h4>
        <ul class="space-y-2.5 font-mono text-sm text-night-300">
          <li>ประกาศทั้งหมด <span class="text-lime-pop">{{ items.stats?.total ?? '—' }}</span></li>
          <li>คืนสำเร็จ <span class="text-lime-pop">{{ items.stats?.returned ?? '—' }}</span></li>
          <li>สมาชิก <span class="text-bubble-400">{{ items.stats?.members ?? '—' }}</span></li>
        </ul>
      </div>
    </div>

    <div
      class="border-t border-white/6 px-4 py-5 text-center text-xs text-night-400 sm:px-6"
    >
      สร้างด้วย 💜 เพื่อคนที่ทำของหาย — 2567
    </div>
  </footer>
</template>
