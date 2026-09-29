<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useSocialStore } from '@/stores/social'
import { timeAgo } from '@/lib/format'

const social = useSocialStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

onClickOutside(root, () => (open.value = false))

function toggle() {
  open.value = !open.value
  if (open.value) void social.markRead()
}

const dot: Record<string, string> = {
  claim: 'from-bubble-500 to-night-500',
  approved: 'from-lime-pop to-mint-pop',
  rejected: 'from-rose-400 to-bubble-600',
}

onMounted(() => {
  void social.loadAll()
})
onUnmounted(() => {
  /* noop */
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      class="relative grid size-11 place-items-center rounded-2xl glass text-lg transition hover:bg-white/12 active:scale-95"
      :class="open ? 'bg-white/12' : ''"
      aria-label="การแจ้งเตือน"
      @click="toggle"
    >
      🔔
      <span
        v-if="social.unread > 0"
        class="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-bubble-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-ink"
      >
        {{ social.unread }}
      </span>
    </button>

    <Transition name="pop">
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl glass-strong shadow-lift"
      >
        <div class="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <h4 class="font-display text-sm font-extrabold">การแจ้งเตือน</h4>
          <button
            v-if="social.unread > 0"
            class="text-[11px] font-semibold text-lime-pop hover:underline"
            @click="social.markRead()"
          >
            อ่านแล้วทั้งหมด
          </button>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <p
            v-if="social.notifications.length === 0"
            class="px-4 py-10 text-center text-sm text-night-300"
          >
            ยังเงียบอยู่นะ 🤫
          </p>
          <ul v-else class="divide-y divide-white/6">
            <li
              v-for="n in social.notifications"
              :key="n.id"
              class="flex gap-3 px-4 py-3 transition hover:bg-white/5"
            >
              <span
                class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm"
                :class="dot[n.kind] ?? 'from-night-500 to-night-600'"
              >
                {{ n.kind === 'approved' ? '🎉' : n.kind === 'rejected' ? '🙃' : '🙋' }}
              </span>
              <div class="min-w-0">
                <p class="text-sm leading-snug text-night-50">{{ n.message }}</p>
                <p class="mt-0.5 text-[11px] text-night-400">{{ timeAgo(n.created_at) }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>
