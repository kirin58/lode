<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import CountUp from '@/components/CountUp.vue'
import { CATEGORY_CHIP, timeAgo } from '@/lib/format'
import type { AdminOverview } from '@/types'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const data = ref<AdminOverview | null>(null)
const loading = ref(true)

const maxDaily = computed(() => Math.max(1, ...(data.value?.daily ?? []).map((d) => d.count)))
const maxCat = computed(() => Math.max(1, ...(data.value?.category_breakdown ?? []).map((c) => c.count)))

const cards = computed(() => {
  const s = data.value?.stats
  if (!s) return []
  return [
    { label: 'ประกาศทั้งหมด', value: s.total, suffix: '', emoji: '📦', tint: 'from-night-500/25' },
    { label: 'คืนสำเร็จ', value: s.returned, suffix: '', emoji: '🎉', tint: 'from-lime-pop/25' },
    { label: 'อัตราสำเร็จ', value: s.resolvedRate, suffix: '%', emoji: '📈', tint: 'from-mint-pop/25' },
    { label: 'สมาชิก', value: s.members, suffix: '', emoji: '🫶', tint: 'from-bubble-500/25' },
    { label: 'คำขอทั้งหมด', value: s.claims, suffix: '', emoji: '🙋', tint: 'from-mango-400/25' },
    { label: 'กำลังตามหา', value: s.open, suffix: '', emoji: '🔎', tint: 'from-night-400/25' },
  ]
})

onMounted(async () => {
  await auth.init()
  if (!auth.isAdmin) {
    toast.error('เข้าไม่ได้', 'หน้านี้สำหรับแอดมินเท่านั้น')
    router.push('/browse')
    return
  }
  try {
    const res = await api.get<{ overview: AdminOverview }>('/admin/overview')
    data.value = res.overview
  } catch (err) {
    toast.error('โหลดข้อมูลไม่สำเร็จ', err instanceof ApiError ? err.message : undefined)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p
          class="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-pop/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-pop ring-1 ring-lime-pop/25"
        >
          <span class="size-1.5 rounded-full bg-lime-pop animate-pulse" />
          admin dashboard
        </p>
        <h1 class="font-display text-3xl font-black sm:text-5xl">
          สถิติทั้งระบบ <span class="text-gradient">👑</span>
        </h1>
        <p class="mt-2 text-sm text-muted-2">
          ภาพรวมประกาศ สมาชิก และคนที่ช่วยคืนของมากที่สุด
        </p>
      </div>
      <RouterLink
        to="/browse"
        class="shrink-0 rounded-2xl glass px-4 py-2.5 text-sm font-bold transition hover:bg-fill-2"
      >
        ← กลับไปหน้าเว็บ
      </RouterLink>
    </div>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="skeleton h-28 rounded-3xl" />
    </div>

    <template v-else-if="data">
      <!-- KPI -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="c in cards"
          :key="c.label"
          class="relative overflow-hidden rounded-3xl glass p-5 transition hover:-translate-y-1"
        >
          <div
            class="absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br blur-2xl"
            :class="c.tint"
          />
          <div class="relative flex items-center gap-4">
            <span class="text-2xl">{{ c.emoji }}</span>
            <div>
              <p class="font-display text-3xl font-black">
                <CountUp :value="c.value" :suffix="c.suffix" />
              </p>
              <p class="text-[11px] font-semibold text-muted-2">{{ c.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <!-- chart -->
        <div class="rounded-[2rem] glass p-6">
          <h2 class="font-display text-lg font-extrabold">ประกาศ 14 วันล่าสุด 📈</h2>
          <div class="mt-6 flex h-44 items-end gap-1.5">
            <div
              v-for="d in data.daily"
              :key="d.day"
              class="group relative flex flex-1 flex-col items-center justify-end"
            >
              <span
                class="mb-1 rounded-full bg-fill-2 px-1.5 text-[9px] font-bold opacity-0 transition group-hover:opacity-100"
              >
                {{ d.count }}
              </span>
              <div
                class="w-full rounded-t-xl bg-gradient-to-t from-night-600 to-bubble-500 transition duration-300 group-hover:brightness-125"
                :style="{ height: `${Math.max(4, (d.count / maxDaily) * 100)}%` }"
              />
              <span class="mt-1.5 text-[9px] text-title0">{{ d.day }}</span>
            </div>
          </div>
        </div>

        <!-- category breakdown -->
        <div class="rounded-[2rem] glass p-6">
          <h2 class="font-display text-lg font-extrabold">หมวดที่คนลงประกาศเยอะ 🗂️</h2>
          <div class="mt-5 space-y-3">
            <div v-for="c in data.category_breakdown" :key="c.id">
              <div class="mb-1 flex items-center gap-2 text-xs">
                <span class="font-bold">{{ c.emoji }} {{ c.label }}</span>
                <span class="ml-auto font-mono font-bold text-muted-1">{{ c.count }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-fill-2">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-night-500 to-bubble-500"
                  :style="{ width: `${(c.count / maxCat) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- leaderboard -->
      <div class="mt-6 rounded-[2rem] glass p-6">
        <h2 class="font-display text-lg font-extrabold">ฮีโร่คืนของ 🏆</h2>
        <p class="mt-1 text-[11px] text-muted-3">
          คะแนนมาจากการอนุมัติคืนของสำเร็จ (+10) และจำนวนเคสที่ช่วยได้
        </p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(u, i) in data.top_users"
            :key="u.id"
            class="flex items-center gap-3 rounded-2xl bg-fill p-3.5 ring-1 ring-line"
            :class="i < 3 ? 'ring-lime-pop/25' : ''"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-xl font-mono text-xs font-extrabold"
              :class="i === 0 ? 'bg-lime-pop text-paper' : i === 1 ? 'bg-fill-20 text-paper' : i === 2 ? 'bg-mango-400 text-paper' : 'bg-fill-2 text-muted-1'"
            >
              {{ i + 1 }}
            </span>
            <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-fill-2 text-lg">
              {{ u.avatar_emoji }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{{ u.display_name }}</p>
              <p class="truncate text-[10px] text-muted-3">
                ⭐ {{ u.avg_rating.toFixed(1) }} · {{ u.reviews_count }} รีวิว
              </p>
            </div>
            <span
              class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
              :class="CATEGORY_CHIP['lime']"
            >
              {{ u.points }} แต้ม
            </span>
          </div>
        </div>
      </div>

      <!-- recent items -->
      <div class="mt-6 rounded-[2rem] glass p-6">
        <h2 class="font-display text-lg font-extrabold">ประกาศล่าสุด 🕒</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr class="text-[11px] uppercase tracking-wider text-muted-3">
                <th class="pb-3 font-bold">เรื่อง</th>
                <th class="pb-3 font-bold">ประเภท</th>
                <th class="pb-3 font-bold">สถานะ</th>
                <th class="pb-3 font-bold">คำขอ</th>
                <th class="pb-3 text-right font-bold">เมื่อ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/6">
              <tr v-for="it in data.recent_items" :key="it.id" class="transition hover:bg-fill">
                <td class="py-3 pr-3">
                  <RouterLink :to="`/item/${it.id}`" class="line-clamp-1 font-bold hover:underline">
                    {{ it.title }}
                  </RouterLink>
                  <span class="text-[11px] text-muted-3">📍 {{ it.location || '—' }}</span>
                </td>
                <td class="py-3 pr-3 text-xs">
                  {{ it.kind === 'lost' ? '🫥 ทำหาย' : '🫶 เจอแล้ว' }}
                </td>
                <td class="py-3 pr-3 text-xs">{{ it.status }}</td>
                <td class="py-3 pr-3 font-mono text-xs">{{ it.claim_count }}</td>
                <td class="py-3 text-right text-xs text-muted-3">{{ timeAgo(it.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
