<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ItemCard from '@/components/ItemCard.vue'
import ItemSkeleton from '@/components/ItemSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useItemsStore } from '@/stores/items'
import type { ItemKind, ItemStatus } from '@/types'

const store = useItemsStore()
const route = useRoute()
const router = useRouter()

const q = ref((route.query.q as string) ?? '')

const kinds: { id: ItemKind | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'ทั้งหมด', emoji: '🗂️' },
  { id: 'lost', label: 'ทำหาย', emoji: '🫥' },
  { id: 'found', label: 'เจอแล้ว', emoji: '🫶' },
]

const sorts: { id: 'new' | 'hot' | 'reward'; label: string; emoji: string }[] = [
  { id: 'new', label: 'ล่าสุด', emoji: '🕒' },
  { id: 'hot', label: 'คนยอมจอย', emoji: '🔥' },
  { id: 'reward', label: 'ให้รางวัล', emoji: '💎' },
]

const statuses: { id: ItemStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'ทุกสถานะ' },
  { id: 'open', label: 'กำลังตามหา' },
  { id: 'claimed', label: 'มีคนอ้างแล้ว' },
  { id: 'returned', label: 'คืนสำเร็จ' },
]

let t: ReturnType<typeof setTimeout> | undefined
watch(q, (val) => {
  clearTimeout(t)
  t = setTimeout(() => {
    store.setFilter('q', val || undefined)
    syncUrl()
  }, 350)
})

watch(
  () => store.filters,
  () => syncUrl(),
  { deep: true }
)

function syncUrl() {
  const f = store.filters
  const query: Record<string, string> = {}
  if (f.q) query.q = f.q
  if (f.kind && f.kind !== 'all') query.kind = f.kind
  if (f.category && f.category !== 'all') query.category = f.category
  if (f.status && f.status !== 'all') query.status = f.status
  router.replace({ query })
}

function applyCategory(id: string) {
  store.setFilter('category', store.filters.category === id ? 'all' : id)
}

const resultText = computed(() => {
  const n = store.total
  return n === 0 ? 'ไม่พบประกาศ' : `พบ ${n} ประกาศ`
})

const activeChips = computed(() => {
  const chips: string[] = []
  if (store.filters.q) chips.push(`ค้นหา “${store.filters.q}”`)
  if (store.filters.kind === 'lost') chips.push('ทำหาย')
  if (store.filters.kind === 'found') chips.push('เจอแล้ว')
  if (store.filters.category !== 'all') {
    const c = store.categories.find((x) => x.id === store.filters.category)
    if (c) chips.push(`${c.emoji} ${c.label}`)
  }
  if (store.filters.status !== 'all') {
    const s = statuses.find((x) => x.id === store.filters.status)
    if (s) chips.push(s.label)
  }
  return chips
})

onMounted(async () => {
  if (route.query.q) store.filters.q = route.query.q as string
  if (route.query.kind) store.filters.kind = route.query.kind as ItemKind
  if (route.query.category) store.filters.category = route.query.category as string
  if (route.query.status) store.filters.status = route.query.status as ItemStatus
  if (!store.categories.length) await store.loadMeta().catch(() => {})
  await store.load()
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <!-- header -->
    <div class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p
          class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-night-200 ring-1 ring-white/10"
        >
          <span class="size-1.5 rounded-full bg-lime-pop animate-pulse" />
          ค้นหาของ
        </p>
        <h1 class="font-display text-3xl font-black sm:text-5xl">
          มีอะไร <span class="text-gradient">หายอยู่</span> บ้าง?
        </h1>
        <p class="mt-2 text-sm text-night-300">{{ resultText }} · อัปเดตล่าสุดแบบเรียลไทม์</p>
      </div>

      <!-- search -->
      <div
        class="flex w-full items-center gap-2 rounded-2xl glass-strong px-4 py-3 transition focus-within:shadow-glow sm:w-96"
      >
        <span class="text-lg">🔍</span>
        <input
          v-model="q"
          type="search"
          placeholder="ค้นหาชื่อของ หรือสถานที่…"
          class="w-full bg-transparent text-sm outline-none placeholder:text-night-400"
        />
        <button
          v-if="q"
          class="text-night-400 transition hover:text-white"
          aria-label="ล้างคำค้น"
          @click="q = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- controls -->
    <div class="sticky top-18 z-30 -mx-4 mb-6 space-y-3 border-b border-white/8 bg-ink/80 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:px-4">
      <div class="flex flex-wrap items-center gap-2">
        <!-- kind -->
        <div class="flex gap-1 rounded-2xl bg-white/6 p-1 ring-1 ring-white/10">
          <button
            v-for="k in kinds"
            :key="k.id"
            class="rounded-xl px-3.5 py-2 text-xs font-extrabold transition sm:text-sm"
            :class="store.filters.kind === k.id ? 'bg-white text-ink shadow' : 'text-night-200 hover:text-white'"
            @click="store.setFilter('kind', k.id)"
          >
            {{ k.emoji }} {{ k.label }}
          </button>
        </div>

        <!-- status -->
        <select
          class="rounded-2xl bg-white/6 px-3 py-2.5 text-xs font-bold text-night-100 ring-1 ring-white/10 outline-none transition hover:bg-white/12 sm:text-sm"
          :value="store.filters.status"
          @change="store.setFilter('status', ($event.target as HTMLSelectElement).value as any)"
        >
          <option v-for="s in statuses" :key="s.id" :value="s.id" class="bg-ink-soft">
            {{ s.label }}
          </option>
        </select>

        <!-- sort -->
        <div class="ml-auto flex gap-1 rounded-2xl bg-white/6 p-1 ring-1 ring-white/10">
          <button
            v-for="s in sorts"
            :key="s.id"
            class="rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition sm:px-3 sm:text-xs"
            :class="store.filters.sort === s.id ? 'bg-white/15 text-white' : 'text-night-300 hover:text-white'"
            @click="store.setFilter('sort', s.id)"
          >
            {{ s.emoji }} {{ s.label }}
          </button>
        </div>
      </div>

      <!-- categories -->
      <div class="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
        <button
          class="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 transition"
          :class="
            store.filters.category === 'all'
              ? 'bg-lime-pop text-ink ring-lime-pop'
              : 'bg-white/6 text-night-200 ring-white/10 hover:bg-white/12'
          "
          @click="store.setFilter('category', 'all')"
        >
          ทุกหมวด
        </button>
        <button
          v-for="c in store.categories"
          :key="c.id"
          class="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 transition"
          :class="
            store.filters.category === c.id
              ? 'bg-white text-ink ring-white'
              : 'bg-white/6 text-night-200 ring-white/10 hover:bg-white/12'
          "
          @click="applyCategory(c.id)"
        >
          {{ c.emoji }} {{ c.label }}
        </button>
      </div>
    </div>

    <!-- active filter chips -->
    <div v-if="activeChips.length" class="mb-5 flex flex-wrap items-center gap-2">
      <span class="text-[11px] font-bold text-night-400">ตัวกรอง:</span>
      <span
        v-for="c in activeChips"
        :key="c"
        class="rounded-full bg-lime-pop/12 px-3 py-1 text-[11px] font-bold text-lime-pop ring-1 ring-lime-pop/25"
      >
        {{ c }}
      </span>
      <button
        class="rounded-full bg-white/8 px-3 py-1 text-[11px] font-bold text-night-200 ring-1 ring-white/10 transition hover:bg-white/16"
        @click="store.resetFilters(); q = ''"
      >
        ล้างทั้งหมด ✕
      </button>
    </div>

    <!-- grid -->
    <div v-if="store.loading && !store.items.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ItemSkeleton v-for="i in 8" :key="i" />
    </div>

    <TransitionGroup
      v-else-if="store.items.length"
      name="list"
      tag="div"
      class="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <ItemCard v-for="item in store.items" :key="item.id" :item="item" />
    </TransitionGroup>

    <EmptyState
      v-else
      emoji="🕳️"
      title="ไม่เจออะไรเลย"
      body="ลองเปลี่ยนคำค้น หรือกดล้างตัวกรอง แล้วลองใหม่อีกครั้งนะ"
    >
      <button
        class="rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-ink transition hover:-translate-y-0.5"
        @click="store.resetFilters()"
      >
        ล้างตัวกรองทั้งหมด
      </button>
    </EmptyState>

    <!-- mobile FAB -->
    <div class="mt-8 flex justify-center sm:hidden">
      <RouterLink
        to="/report"
        class="rounded-2xl bg-gradient-to-r from-bubble-500 to-night-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-glow"
      >
        ＋ ลงประกาศของฉัน
      </RouterLink>
    </div>
  </div>
</template>
