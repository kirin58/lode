<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ItemCard from '@/components/ItemCard.vue'
import ItemSkeleton from '@/components/ItemSkeleton.vue'
import CountUp from '@/components/CountUp.vue'
import { useItemsStore } from '@/stores/items'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const items = useItemsStore()
const auth = useAuthStore()
const q = ref('')

const featured = computed(() => items.items.slice(0, 6))

onMounted(async () => {
  if (!items.categories.length) await items.loadMeta().catch(() => {})
  await items.load().catch(() => {})
})

function search() {
  router.push({ path: '/browse', query: q.value ? { q: q.value } : {} })
}

const steps = [
  {
    n: '01',
    emoji: '📸',
    title: 'โพสต์ใน 10 วินาที',
    body: 'ถ่ายรูป พิมพ์ที่ไหน เมื่อไหร่ เสร็จ — ไม่ต้องไปเดินหาทีละห้อง',
    color: 'from-bubble-500/25 to-night-500/10',
  },
  {
    n: '02',
    emoji: '🔎',
    title: 'คนที่เจอเห็นทันที',
    body: 'ระบบแจ้งเตือนเจ้าของทันทีที่มีคนกดขอรับของ',
    color: 'from-night-500/25 to-mint-pop/10',
  },
  {
    n: '03',
    emoji: '🤝',
    title: 'นัดเจอ ได้ของคืน',
    body: 'อนุมัติคำขอในแอป แล้วคุยกันตามสะดวก — ไม่ต้องเป็นภาษากลาง',
    color: 'from-mango-400/25 to-bubble-500/10',
  },
]

const ticker = [
  '🎧 AirPods หายที่ห้องเรียน',
  '🔑 กุญแจรถยนต์ เจอแล้ว!',
  '👛 กระเป๋าสตางค์ คืนสำเร็จ',
  '📱 iPhone 13 มีคนอ้างแล้ว',
  '🎒 กระเป๋าผ้าใบชาแพนซา',
  '🐢 ทองเย็นกลับเจ้าของแล้ว',
  '💻 MacBook Air ประกาศใหม่',
  '🧢 เสื้อกันฝน ชั้น 3',
]
</script>

<template>
  <div class="overflow-hidden">
    <!-- ================= HERO ================= -->
    <section class="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-20">
      <div class="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="animate-rise">
          <span
            class="inline-flex items-center gap-2 rounded-full bg-white/6 px-3.5 py-1.5 text-xs font-bold text-night-100 ring-1 ring-white/12 backdrop-blur"
          >
            <span class="size-2 rounded-full bg-lime-pop animate-pulse" />
            ชุมชนคืนของ · มหาวิทยาลัยบูรพา
          </span>

          <h1
            class="mt-6 font-display text-[2.6rem] font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
          >
            ของหาย<br />
            <span class="text-gradient">เจอแล้ว</span><br />
            มาบอกกัน<br class="hidden sm:block" />
            <span class="text-gradient-hot">ที่นี่กันสิ</span> ✨
          </h1>

          <p class="mt-6 max-w-lg text-base leading-relaxed text-night-200 sm:text-lg">
            ไม่ต้องเดินไปทุกห้องอีกต่อไป — โพสต์ทีเดียว เพื่อนในมหาลักษณ์เห็นแล้ววิ่งมาคืนให้
            <span class="text-lime-pop">ฟรี</span> 💚
          </p>

          <form
            class="mt-8 flex max-w-lg flex-col gap-2 rounded-3xl glass-strong p-2 sm:flex-row"
            @submit.prevent="search"
          >
            <div class="flex flex-1 items-center gap-2 px-3">
              <span class="text-lg">🔍</span>
              <input
                v-model="q"
                type="search"
                placeholder="ค้นหา: AirPods, กระเป๋า, กุญแจ…"
                class="w-full bg-transparent py-3 text-sm outline-none placeholder:text-night-400"
              />
            </div>
            <button
              class="rounded-2xl bg-gradient-to-r from-bubble-500 to-night-500 px-6 py-3 text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 active:scale-95"
            >
              ค้นหาเลย
            </button>
          </form>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <RouterLink
              to="/report"
              class="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-ink transition hover:-translate-y-0.5 active:scale-95"
            >
              📣 ลงประกาศของฉัน
            </RouterLink>
            <RouterLink
              to="/browse"
              class="inline-flex items-center gap-2 rounded-2xl glass px-5 py-3 text-sm font-bold text-night-50 transition hover:bg-white/12"
            >
              ดูประกาศทั้งหมด →
            </RouterLink>
            <span v-if="!auth.isAuthed" class="text-xs text-night-400">
              สมัครฟรี ใช้เวลา 20 วินาที
            </span>
          </div>
        </div>

        <!-- floating card stack -->
        <div class="relative mx-auto hidden w-full max-w-md lg:block">
          <div
            class="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-night-500/25 via-bubble-500/15 to-transparent blur-2xl animate-float"
          />
          <div class="relative space-y-4">
            <div
              v-for="(item, i) in featured.slice(0, 3)"
              :key="item.id"
              class="w-[86%] rounded-[1.75rem] glass-strong p-4 shadow-lift transition duration-500 hover:scale-[1.02]"
              :class="i === 0 ? 'ml-auto animate-drift' : i === 1 ? 'mr-auto' : 'ml-8'"
            >
              <div class="flex items-center gap-3">
                <span
                  class="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl ring-1 ring-white/15"
                  :class="
                    item.kind === 'found'
                      ? 'from-mint-pop/80 to-lime-pop/60 text-ink'
                      : 'from-bubble-500/80 to-night-500/80'
                  "
                >
                  {{ item.category?.emoji ?? '✨' }}
                </span>
                <div class="min-w-0">
                  <span
                    class="inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                    :class="
                      item.kind === 'found'
                        ? 'bg-mint-pop/15 text-mint-pop'
                        : 'bg-bubble-500/15 text-bubble-400'
                    "
                  >
                    {{ item.kind === 'found' ? '🫶 เจอแล้ว' : '🫥 ทำหาย' }}
                  </span>
                  <p class="mt-1 line-clamp-1 font-display text-sm font-bold">
                    {{ item.title }}
                  </p>
                  <p class="line-clamp-1 text-[11px] text-night-300">📍 {{ item.location }}</p>
                </div>
              </div>
            </div>

            <div
              class="absolute -bottom-6 -left-10 hidden animate-float items-center gap-2 rounded-2xl bg-lime-pop px-4 py-2.5 text-sm font-extrabold text-ink shadow-glow xl:flex"
            >
              🎉 คืนสำเร็จ {{ items.stats?.returned ?? 0 }} ชิ้น
            </div>
          </div>
        </div>
      </div>

      <!-- stats -->
      <div
        class="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        <div
          v-for="(s, i) in [
            { label: 'ประกาศในระบบ', value: items.stats?.total ?? 0, suffix: ' ชิ้น', emoji: '📦' },
            { label: 'คืนสำเร็จ', value: items.stats?.returned ?? 0, suffix: ' ชิ้น', emoji: '🎉' },
            { label: 'อัตราสำเร็จ', value: items.stats?.resolvedRate ?? 0, suffix: '%', emoji: '📈' },
            { label: 'สมาชิกในชุมชน', value: items.stats?.members ?? 0, suffix: ' คน', emoji: '🫶' },
          ]"
          :key="i"
          class="rounded-3xl glass p-4 transition hover:-translate-y-1 sm:p-5"
          :style="{ animationDelay: `${i * 80}ms` }"
        >
          <div class="text-2xl">{{ s.emoji }}</div>
          <p class="mt-2 font-display text-2xl font-black sm:text-3xl">
            <CountUp :value="s.value" :suffix="s.suffix" />
          </p>
          <p class="mt-1 text-[11px] font-semibold text-night-300 sm:text-xs">{{ s.label }}</p>
        </div>
      </div>
    </section>

    <!-- ================= TICKER ================= -->
    <section class="relative my-14 border-y border-white/8 bg-ink/40 py-3 backdrop-blur">
      <div class="flex w-max animate-marquee gap-3">
        <span
          v-for="(t, i) in [...ticker, ...ticker]"
          :key="i"
          class="whitespace-nowrap rounded-full bg-white/6 px-4 py-1.5 text-xs font-semibold text-night-200 ring-1 ring-white/8"
        >
          {{ t }}
        </span>
      </div>
    </section>

    <!-- ================= STEPS ================= -->
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div class="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-night-200 ring-1 ring-white/10">
            <span class="size-1.5 rounded-full bg-bubble-400 animate-pulse" />
            how it works
          </p>
          <h2 class="font-display text-3xl font-black sm:text-4xl">
            คืนของง่ายกว่าที่คิด <span class="text-gradient-hot">3 ขั้นตอน</span>
          </h2>
        </div>
        <p class="max-w-sm text-sm leading-relaxed text-night-300">
          ไม่มีค่าใช้จ่าย ไม่ต้องไปทำรายงาน แค่ช่วยกันก็พอ 💛
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="s in steps"
          :key="s.n"
          class="group relative overflow-hidden rounded-[2rem] glass p-6 transition duration-300 hover:-translate-y-2 hover:shadow-glow"
        >
          <div
            class="absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br blur-2xl transition duration-500 group-hover:scale-150"
            :class="s.color"
          />
          <span class="font-mono text-4xl font-bold text-white/10">{{ s.n }}</span>
          <div class="mt-2 text-4xl">{{ s.emoji }}</div>
          <h3 class="mt-3 font-display text-lg font-extrabold">{{ s.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-night-300">{{ s.body }}</p>
        </div>
      </div>
    </section>

    <!-- ================= CATEGORIES ================= -->
    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 class="font-display text-2xl font-black sm:text-3xl">
        เลือกหมวดที่หา <span class="text-gradient">ง่ายกว่า</span>
      </h2>
      <div class="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-9">
        <RouterLink
          v-for="c in items.categories"
          :key="c.id"
          :to="{ path: '/browse', query: { category: c.id } }"
          class="group flex flex-col items-center gap-2 rounded-3xl glass p-3.5 text-center transition hover:-translate-y-1.5 hover:shadow-glow"
        >
          <span class="text-2xl transition duration-300 group-hover:scale-125">{{ c.emoji }}</span>
          <span class="text-[11px] font-bold leading-tight text-night-200 group-hover:text-white">
            {{ c.label }}
          </span>
        </RouterLink>
      </div>
    </section>

    <!-- ================= LATEST ================= -->
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-night-200 ring-1 ring-white/10">
            <span class="size-1.5 rounded-full bg-lime-pop animate-pulse" />
            fresh drops
          </p>
          <h2 class="font-display text-3xl font-black sm:text-4xl">
            ลงใหม่ล่าสุด <span class="text-gradient-hot">วันนี้</span>
          </h2>
        </div>
        <RouterLink
          to="/browse"
          class="hidden shrink-0 items-center gap-2 rounded-2xl glass px-4 py-2.5 text-sm font-bold transition hover:bg-white/12 sm:inline-flex"
        >
          ดูทั้งหมด →
        </RouterLink>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <template v-if="items.loading && !featured.length">
          <ItemSkeleton v-for="i in 6" :key="i" />
        </template>
        <template v-else>
          <ItemCard v-for="item in featured" :key="item.id" :item="item" />
        </template>
      </div>

      <RouterLink
        to="/browse"
        class="mt-6 flex items-center justify-center gap-2 rounded-2xl glass py-3.5 text-sm font-bold transition hover:bg-white/12 sm:hidden"
      >
        ดูประกาศทั้งหมด →
      </RouterLink>
    </section>

    <!-- ================= CTA ================= -->
    <section class="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
      <div
        class="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-bubble-500 via-night-500 to-night-700 p-8 sm:p-12"
      >
        <div class="absolute inset-0 dotgrid opacity-25" />
        <div class="absolute -right-16 -top-16 size-56 rounded-full bg-lime-pop/25 blur-3xl animate-float" />
        <div class="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="font-display text-3xl font-black leading-tight text-white sm:text-4xl">
              เจอของแล้ว?<br class="sm:hidden" />อย่าเก็บไว้เดี่ยว ๆ นะ 😼
            </h2>
            <p class="mt-3 max-w-md text-sm leading-relaxed text-white/80">
              โพสต์ 10 วินาที รอคนมารับ พร้อมคะแนนความดีจากชุมชน ✨
            </p>
          </div>
          <RouterLink
            to="/report?kind=found"
            class="shrink-0 rounded-2xl bg-ink px-6 py-4 text-sm font-extrabold text-white shadow-lift transition hover:-translate-y-1 active:scale-95"
          >
            ลงประกาศ “เจอแล้ว” 🫶
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
