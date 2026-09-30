<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { api, ApiError } from '@/lib/api'
import ItemCard from '@/components/ItemCard.vue'
import ItemSkeleton from '@/components/ItemSkeleton.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { useToastStore } from '@/stores/toast'
import { STATUS_META, timeAgo } from '@/lib/format'
import type { Item, ItemStatus } from '@/types'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const social = useSocialStore()
const toast = useToastStore()

const tab = ref<'mine' | 'incoming' | 'claimed'>((route.query.tab as any) ?? 'mine')
const myItems = ref<Item[]>([])
const loading = ref(true)

const tabs = computed(() => [
  { id: 'mine' as const, label: 'ประกาศของฉัน', emoji: '📦', count: myItems.value.length },
  {
    id: 'incoming' as const,
    label: 'คำขอเข้ามา',
    emoji: '🙋',
    count: social.incoming.length,
  },
  { id: 'claimed' as const, label: 'ที่ฉันไปขอ', emoji: '🤲', count: social.mine.length },
])

const returnedCount = computed(
  () => myItems.value.filter((i) => i.status === 'returned').length
)

async function load() {
  loading.value = true
  try {
    await auth.init()
    if (!auth.user) return
    const [items] = await Promise.all([
      api.get<{ items: Item[] }>(`/items?mine=${auth.user.id}&limit=100`),
      social.loadAll(),
    ])
    myItems.value = items.items
  } finally {
    loading.value = false
  }
}

async function setStatus(item: Item, status: ItemStatus) {
  try {
    await api.patch(`/items/${item.id}`, { status })
    myItems.value = myItems.value.map((i) => (i.id === item.id ? { ...i, status } : i))
    toast.success('อัปเดตสถานะแล้ว', STATUS_META[status].label)
  } catch (err) {
    toast.error('อัปเดตไม่สำเร็จ', err instanceof ApiError ? err.message : undefined)
  }
}

async function remove(item: Item) {
  const result = await Swal.fire({
    title: `ลบ “${item.title}” ใช่ไหม?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบเลย',
    cancelButtonText: 'ยกเลิก',
    buttonsStyling: false,
    background: 'var(--color-paper)',
    color: 'var(--color-title)',
    customClass: {
      popup: 'glass border-line !rounded-[2.5rem]',
      title: 'font-display text-2xl',
      htmlContainer: 'text-muted-1',
      confirmButton: 'btn btn-primary !rounded-full !bg-red-500 hover:!bg-red-600 !px-8 !py-3 mx-2',
      cancelButton: 'btn btn-outline border-line !rounded-full text-muted-1 !px-8 !py-3 mx-2',
    },
  })
  if (!result.isConfirmed) return
  try {
    await api.del(`/items/${item.id}`)
    myItems.value = myItems.value.filter((i) => i.id !== item.id)
    toast.info('ลบแล้ว', 'ขอบคุณที่ดูแลบอร์ดนะ 👋')
  } catch (err) {
    toast.error('ลบไม่สำเร็จ', err instanceof ApiError ? err.message : undefined)
  }
}

async function decide(claimId: string, action: 'approved' | 'rejected') {
  try {
    await social.decide(claimId, action)
    if (action === 'approved') {
      toast.party('คืนของสำเร็จ!', 'ประกาศถูกปิดเป็น “คืนสำเร็จ” แล้ว 🎉')
      await load()
    } else {
      toast.info('ปฏิเสธแล้ว', 'ระบบเปิดประกาศให้คนอื่นต่อ')
    }
  } catch (err) {
    toast.error('ทำไม่ได้', err instanceof ApiError ? err.message : undefined)
  }
}

function switchTab(id: string) {
  tab.value = id as any
  router.replace({ query: id === 'mine' ? {} : { tab: id } })
}

watch(tab, () => (document.title = 'พื้นที่ของฉัน · Lost & Found'))
onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <!-- profile strip -->
    <div class="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
      <div class="absolute -right-16 -top-16 size-48 rounded-full bg-bubble-500/20 blur-3xl animate-float" />
      <div class="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <span
          class="grid size-20 shrink-0 place-items-center rounded-[1.75rem] bg-gradient-to-br from-night-500 to-bubble-500 text-4xl shadow-glow ring-1 ring-line"
        >
          {{ auth.user?.avatar_emoji }}
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="font-display text-2xl font-black sm:text-3xl">
            พื้นที่ของ {{ auth.user?.display_name }}
          </h1>
          <p class="mt-1 text-sm text-muted-2">
            {{ auth.user?.campus ?? 'ไม่ระบุสถานที่ศึกษา' }} · เข้าร่วมเมื่อ
            {{ timeAgo(auth.user?.created_at) }}
          </p>
        </div>
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <div class="rounded-2xl bg-fill px-4 py-3 text-center ring-1 ring-line">
            <p class="font-display text-xl font-black">{{ myItems.length }}</p>
            <p class="text-[10px] text-muted-2">ประกาศ</p>
          </div>
          <div class="rounded-2xl bg-fill px-4 py-3 text-center ring-1 ring-line">
            <p class="font-display text-xl font-black text-lime-pop">{{ returnedCount }}</p>
            <p class="text-[10px] text-muted-2">คืนสำเร็จ</p>
          </div>
          <div class="rounded-2xl bg-fill px-4 py-3 text-center ring-1 ring-line">
            <p class="font-display text-xl font-black text-bubble-400">
              {{ social.incoming.length }}
            </p>
            <p class="text-[10px] text-muted-2">คำขอ</p>
          </div>
        </div>
        <RouterLink
          to="/report"
          class="shrink-0 rounded-2xl bg-title px-5 py-3 text-center text-sm font-extrabold text-paper transition hover:-translate-y-0.5"
        >
          ＋ ลงประกาศ
        </RouterLink>
      </div>
    </div>

    <!-- tabs -->
    <div class="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold ring-1 transition"
        :class="
          tab === t.id ? 'bg-title text-paper ring-line shadow-lg' : 'glass text-muted-1 ring-line hover:bg-fill'
        "
        @click="switchTab(t.id)"
      >
        {{ t.emoji }} {{ t.label }}
        <span
          class="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
          :class="tab === t.id ? 'bg-paper/15' : 'bg-fill-2'"
        >
          {{ t.count }}
        </span>
      </button>
    </div>

    <!-- MY ITEMS -->
    <section v-if="tab === 'mine'" class="mt-6">
      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ItemSkeleton v-for="i in 3" :key="i" />
      </div>
      <div v-else-if="myItems.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="item in myItems" :key="item.id" class="group relative">
          <ItemCard :item="item" />
          <div class="mt-2 flex flex-wrap items-center gap-2 rounded-2xl glass px-3 py-2.5 text-[11px]">
            <span
              class="rounded-full px-2 py-0.5 font-extrabold"
              :class="STATUS_META[item.status].chip"
            >
              {{ STATUS_META[item.status].emoji }} {{ STATUS_META[item.status].label }}
            </span>
            <select
              class="ml-auto rounded-xl bg-fill-2 px-2 py-1.5 text-[11px] font-bold text-muted-1 outline-none ring-1 ring-line"
              :value="item.status"
              @change="setStatus(item, ($event.target as HTMLSelectElement).value as ItemStatus)"
            >
              <option value="open" class="bg-veil-strong">กำลังตามหา</option>
              <option value="claimed" class="bg-veil-strong">มีคนอ้างแล้ว</option>
              <option value="returned" class="bg-veil-strong">คืนสำเร็จ</option>
              <option value="closed" class="bg-veil-strong">ปิดประกาศ</option>
            </select>
            <button
              class="rounded-xl bg-rose-400/12 px-2.5 py-1.5 font-bold text-rose-300 transition hover:bg-rose-400/20"
              @click="remove(item)"
            >
              ลบ
            </button>
          </div>
        </div>
      </div>
      <EmptyState
        v-else
        emoji="📭"
        title="ยังไม่มีประกาศเลย"
        body="ลองโพสต์ของที่ทำหาย หรือของที่เจอมาสักชิ้นดีกว่า"
      >
        <RouterLink
          to="/report"
          class="rounded-2xl bg-title px-5 py-2.5 text-sm font-extrabold text-paper transition hover:-translate-y-0.5"
        >
          ลงประกาศแรกของคุณ ✨
        </RouterLink>
      </EmptyState>
    </section>

    <!-- INCOMING CLAIMS -->
    <section v-else-if="tab === 'incoming'" class="mt-6 space-y-3">
      <div v-if="social.incoming.length" class="grid gap-3 md:grid-cols-2">
        <div
          v-for="c in social.incoming"
          :key="c.id"
          class="rounded-3xl glass p-5 transition hover:-translate-y-1"
        >
          <div class="flex items-start gap-3">
            <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-fill-2 text-xl">
              {{ c.claimant?.avatar_emoji ?? '👤' }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate font-display text-sm font-extrabold text-title">
                  {{ c.claimant?.display_name }}
                </p>
                <span
                  class="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                  :class="
                    c.status === 'approved'
                      ? 'bg-lime-pop/15 text-lime-pop'
                      : c.status === 'rejected'
                        ? 'bg-rose-400/15 text-rose-300'
                        : 'bg-mango-400/15 text-mango-300'
                  "
                >
                  {{
                    c.status === 'approved'
                      ? 'อนุมัติแล้ว'
                      : c.status === 'rejected'
                        ? 'ปฏิเสธแล้ว'
                        : 'รอตอบ'
                  }}
                </span>
              </div>
              <RouterLink
                :to="`/item/${c.item_id}`"
                class="mt-0.5 block truncate text-xs text-muted-2 transition hover:text-title"
              >
                ขอรับ “{{ c.item?.title }}” · {{ timeAgo(c.created_at) }}
              </RouterLink>
            </div>
          </div>
          <p
            v-if="c.message"
            class="mt-3 rounded-2xl bg-fill p-3.5 text-xs leading-relaxed text-muted-1"
          >
            “{{ c.message }}”
          </p>
          <div v-if="c.status === 'pending'" class="mt-3 flex gap-2">
            <button
              class="flex-1 rounded-2xl bg-lime-pop px-3 py-2.5 text-xs font-extrabold text-ink transition hover:brightness-110 active:scale-95"
              @click="decide(c.id, 'approved')"
            >
              ✓ ใช่ของเขา
            </button>
            <button
              class="flex-1 rounded-2xl bg-fill-2 px-3 py-2.5 text-xs font-bold text-muted-1 ring-1 ring-line transition hover:bg-fill"
              @click="decide(c.id, 'rejected')"
            >
              ✕ ไม่ใช่
            </button>
          </div>
        </div>
      </div>
      <EmptyState
        v-else
        emoji="📭"
        title="ยังไม่มีคำขอเข้ามา"
        body="เมื่อมีคนกดขอรับของคุณ จะมาโผล่ตรงนี้ทันที"
      />
    </section>

    <!-- CLAIMED BY ME -->
    <section v-else class="mt-6 space-y-3">
      <div v-if="social.mine.length" class="grid gap-3 md:grid-cols-2">
        <RouterLink
          v-for="c in social.mine"
          :key="c.id"
          :to="`/item/${c.item_id}`"
          class="group flex items-center gap-3 rounded-3xl glass p-5 transition hover:-translate-y-1 hover:shadow-glow"
        >
          <span
            class="grid size-11 shrink-0 place-items-center rounded-2xl text-lg ring-1"
            :class="
              c.item?.kind === 'found'
                ? 'bg-mint-pop/15 text-mint-pop ring-mint-pop/25'
                : 'bg-bubble-500/15 text-bubble-400 ring-bubble-500/25'
            "
          >
            {{ c.item?.kind === 'found' ? '🫶' : '🫥' }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-display text-sm font-extrabold text-title">
              {{ c.item?.title }}
            </p>
            <p class="truncate text-[11px] text-muted-2">
              เจ้าของ {{ c.claimant?.display_name }} · {{ timeAgo(c.created_at) }}
            </p>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
            :class="
              c.status === 'approved'
                ? 'bg-lime-pop/15 text-lime-pop'
                : c.status === 'rejected'
                  ? 'bg-rose-400/15 text-rose-300'
                  : 'bg-mango-400/15 text-mango-300'
            "
          >
            {{
              c.status === 'approved'
                ? 'ได้ของแล้ว 🎉'
                : c.status === 'rejected'
                  ? 'ไม่ใช่ของเรา'
                  : 'รอตอบ ⏳'
            }}
          </span>
        </RouterLink>
      </div>
      <EmptyState
        v-else
        emoji="🤲"
        title="ยังไม่เคยขอรับของ"
        body="เห็นของคนอื่นที่ดูเป็นของเรา? กดยืนยันได้เลย"
      >
        <RouterLink
          to="/browse"
          class="rounded-2xl bg-title px-5 py-2.5 text-sm font-extrabold text-paper transition hover:-translate-y-0.5"
        >
          ไปดูประกาศ →
        </RouterLink>
      </EmptyState>
    </section>
  </div>
</template>
