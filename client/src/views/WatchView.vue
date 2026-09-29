<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useExtrasStore } from '@/stores/extras'
import { useItemsStore } from '@/stores/items'
import { useToastStore } from '@/stores/toast'
import { ApiError } from '@/lib/api'
import { timeAgo } from '@/lib/format'
import type { ItemKind } from '@/types'

const extras = useExtrasStore()
const store = useItemsStore()
const toast = useToastStore()

const keyword = ref('')
const category = ref('')
const kind = ref<ItemKind | ''>('')
const saving = ref(false)

const canSave = computed(() => Boolean(keyword.value.trim() || category.value || kind.value))

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    await extras.addWatch({
      keyword: keyword.value.trim(),
      category_id: category.value || null,
      kind: kind.value || null,
    })
    toast.success('ติดตามแล้ว!', 'มีประกาศตรงเงื่อนไข ระบบจะแจ้งเตือนเลย 🔔')
    keyword.value = ''
    category.value = ''
    kind.value = ''
  } catch (err) {
    toast.error('บันทึกไม่สำเร็จ', err instanceof ApiError ? err.message : undefined)
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  try {
    await extras.removeWatch(id)
    toast.info('เลิกติดตามแล้ว', 'ไม่ต้องกังวลเรื่องประกาศใบนี้อีกแล้ว')
  } catch {
    toast.error('ลบไม่สำเร็จ')
  }
}

function describe(w: { keyword: string; category_id: string | null; kind: ItemKind | null; category: any }) {
  const parts: string[] = []
  if (w.keyword) parts.push(`คำว่า “${w.keyword}”`)
  if (w.category) parts.push(`${w.category.emoji} ${w.category.label}`)
  if (w.kind) parts.push(w.kind === 'lost' ? '🫥 เฉพาะของทำหาย' : '🫶 เฉพาะของที่เจอ')
  return parts.length ? parts.join(' · ') : 'ทุกประกาศ'
}

onMounted(async () => {
  if (!store.categories.length) await store.loadMeta().catch(() => {})
  await extras.loadWatches()
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <div class="mb-8 text-center">
      <p
        class="mb-3 inline-flex items-center gap-2 rounded-full bg-fill px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-1 ring-1 ring-line"
      >
        <span class="size-1.5 rounded-full bg-mint-pop animate-pulse" />
        watchlist
      </p>
      <h1 class="font-display text-3xl font-black sm:text-5xl">
        ติดตามสิ่งที่ <span class="text-gradient">สนใจ</span> 🔔
      </h1>
      <p class="mt-2 text-sm text-muted-2">
        ตั้งคำค้นหรือหมวดที่อยากรู้ — เจอประกาศตรงเงื่อนไขแล้วเราแจ้งทันที
      </p>
    </div>

    <!-- add form -->
    <div class="rounded-[2rem] glass-strong p-6">
      <div class="grid gap-4 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">คำค้น</span>
          <input
            v-model="keyword"
            type="text"
            maxlength="60"
            placeholder="เช่น airpods, กระเป๋า…"
            class="w-full rounded-2xl bg-fill px-4 py-3 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
            @keyup.enter="save"
          />
        </label>
        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">หมวด</span>
          <select
            v-model="category"
            class="w-full rounded-2xl bg-fill px-4 py-3 text-sm text-night-100 outline-none ring-1 ring-line transition focus:ring-2 focus:ring-bubble-400/60"
          >
            <option value="" class="bg-veil-strong">ทุกหมวด</option>
            <option v-for="c in store.categories" :key="c.id" :value="c.id" class="bg-veil-strong">
              {{ c.emoji }} {{ c.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">ประเภท</span>
          <select
            v-model="kind"
            class="w-full rounded-2xl bg-fill px-4 py-3 text-sm text-night-100 outline-none ring-1 ring-line transition focus:ring-2 focus:ring-bubble-400/60"
          >
            <option value="" class="bg-veil-strong">ทั้งหมด</option>
            <option value="lost" class="bg-veil-strong">🫥 ทำหาย</option>
            <option value="found" class="bg-veil-strong">🫶 เจอแล้ว</option>
          </select>
        </label>
        <button
          class="self-end rounded-2xl bg-gradient-to-r from-mint-pop to-lime-pop px-5 py-3 text-sm font-extrabold text-paper shadow-glow transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-40"
          :disabled="!canSave || saving"
          @click="save"
        >
          {{ saving ? 'กำลังบันทึก…' : '+ ติดตาม' }}
        </button>
      </div>

      <p class="mt-3 text-[11px] text-muted-3">
        💡 เว้นว่างไว้ถ้าอยากติดตามทุกประกาศ · เงื่อนไขทุกช่องต้องตรงกันพร้อมกัน (ถ้าเลือกไว้)
      </p>
    </div>

    <!-- list -->
    <div v-if="extras.loadingWatches" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="skeleton h-24 w-full rounded-3xl" />
    </div>

    <div v-else-if="extras.watches.length" class="mt-6 space-y-3">
      <div
        v-for="w in extras.watches"
        :key="w.id"
        class="group flex items-center gap-4 rounded-3xl glass p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
      >
        <span
          class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mint-pop/25 to-night-500/25 text-xl ring-1 ring-line"
        >
          {{ w.category?.emoji ?? (w.kind === 'lost' ? '🫥' : '🔔') }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold">{{ describe(w) }}</p>
          <p class="text-[11px] text-muted-3">ติดตามเมื่อ {{ timeAgo(w.created_at) }}</p>
        </div>
        <RouterLink
          :to="{
            path: '/browse',
            query: {
              q: w.keyword || undefined,
              category: w.category_id || undefined,
              kind: w.kind || undefined,
            },
          }"
          class="shrink-0 rounded-2xl bg-fill-2 px-3 py-2 text-[11px] font-bold ring-1 ring-line transition hover:bg-fill-2"
        >
          ดูผลลัพธ์
        </RouterLink>
        <button
          class="shrink-0 rounded-2xl bg-rose-400/10 px-3 py-2 text-[11px] font-bold text-rose-300 transition hover:bg-rose-400/20"
          @click="remove(w.id)"
        >
          เลิกติดตาม
        </button>
      </div>
    </div>

    <div
      v-else
      class="mt-6 flex flex-col items-center gap-4 rounded-[2rem] glass px-6 py-16 text-center"
    >
      <div
        class="grid size-20 animate-float place-items-center rounded-[1.75rem] bg-gradient-to-br from-mint-pop/25 to-night-500/25 text-4xl ring-1 ring-line"
      >
        🛰️
      </div>
      <div class="space-y-1.5">
        <h3 class="font-display text-lg font-extrabold">ยังไม่ได้ติดตามอะไรเลย</h3>
        <p class="max-w-sm text-sm text-muted-2">
          ลองตั้งคำค้นว่า “airpods” หรือเลือกหมวดที่ชอบ แล้วเราจะเตือนทันทีที่มีคนลงประกาศ
        </p>
      </div>
    </div>
  </div>
</template>
