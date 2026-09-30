<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'

const route = useRoute()
const auth = useAuthStore()
const social = useSocialStore()

const tabs = computed(() => {
  const base = [
    { to: '/', label: 'หน้าแรก', emoji: '🏠' },
    { to: '/browse', label: 'ค้นหา', emoji: '🧭' },
  ]
  if (auth.isAuthed) {
    base.push({ to: '/report', label: 'ลงประกาศ', emoji: '✨' })
    base.push({ to: '/mine', label: 'ของฉัน', emoji: '🎒' })
  } else {
    base.push({ to: '/register', label: 'สมัครสมาชิก', emoji: '✨' })
  }
  return base
})

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-veil pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl sm:hidden"
  >
    <div class="grid grid-cols-4">
      <RouterLink
        v-for="(t, i) in tabs"
        :key="t.to"
        :to="t.to"
        class="relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition"
        :class="isActive(t.to) ? 'text-title' : 'text-muted-3'"
      >
        <span
          v-if="i === 2"
          class="absolute -top-4 grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-bubble-500 via-night-500 to-night-600 text-2xl shadow-glow ring-2 ring-page"
        >
          {{ t.emoji }}
        </span>
        <span :class="i === 2 ? 'mt-6' : 'text-xl leading-none'">
          <template v-if="i === 2">＋</template>
          <template v-else>{{ t.emoji }}</template>
        </span>
        <span>{{ t.label }}</span>
        <span
          v-if="t.to === '/mine' && social.pendingIncoming > 0"
          class="absolute right-[22%] top-1.5 grid size-4 place-items-center rounded-full bg-bubble-500 text-[9px] font-extrabold text-white"
        >
          {{ social.pendingIncoming }}
        </span>
        <span
          v-if="isActive(t.to) && i !== 2"
          class="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-lime-pop to-mint-pop"
        />
      </RouterLink>
    </div>
  </nav>
</template>
