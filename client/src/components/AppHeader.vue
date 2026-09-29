<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import LogoMark from './LogoMark.vue'
import NotificationBell from './NotificationBell.vue'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'

const auth = useAuthStore()
const social = useSocialStore()
const route = useRoute()
const router = useRouter()

const menu = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const mobileNav = ref<HTMLElement | null>(null)
const mobileOpen = ref(false)
onClickOutside(menu, () => (menuOpen.value = false))
onClickOutside(mobileNav, () => (mobileOpen.value = false))

const links = [
  { to: '/', label: 'หน้าแรก', emoji: '🏠' },
  { to: '/browse', label: 'ค้นหาของ', emoji: '🧭' },
  { to: '/report', label: 'ลงประกาศ', emoji: '📣' },
  { to: '/mine', label: 'พื้นที่ของฉัน', emoji: '🎒' },
]

function logout() {
  auth.logout()
  menuOpen.value = false
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-white/8 bg-ink/70 backdrop-blur-2xl">
    <div class="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 sm:px-6">
      <RouterLink to="/" class="shrink-0" aria-label="Lost & Found">
        <LogoMark />
      </RouterLink>

      <nav class="ml-4 hidden items-center gap-1 lg:flex">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded-2xl px-3.5 py-2 text-sm font-semibold text-night-200 transition hover:bg-white/8 hover:text-white"
          :class="route.path === l.to ? 'bg-white/10 text-white shadow-inner' : ''"
        >
          <span class="mr-1.5">{{ l.emoji }}</span>{{ l.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <RouterLink
          to="/report"
          class="hidden items-center gap-2 rounded-2xl bg-gradient-to-r from-bubble-500 via-night-500 to-night-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 active:scale-95 sm:inline-flex"
        >
          <span class="text-base leading-none">✨</span> ลงประกาศ
        </RouterLink>

        <template v-if="auth.isAuthed">
          <NotificationBell />
          <div ref="menu" class="relative">
            <button
              class="grid size-11 place-items-center rounded-2xl bg-white/8 text-lg ring-1 ring-white/10 transition hover:bg-white/14 active:scale-95"
              :aria-expanded="menuOpen"
              aria-label="เมนูผู้ใช้"
              @click="menuOpen = !menuOpen"
            >
              {{ auth.user?.avatar_emoji }}
            </button>

            <Transition name="pop">
              <div
                v-if="menuOpen"
                class="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-3xl glass-strong shadow-lift"
              >
                <div class="flex items-center gap-3 border-b border-white/8 p-4">
                  <span
                    class="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-night-500 to-bubble-500 text-xl"
                  >
                    {{ auth.user?.avatar_emoji }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-display text-sm font-extrabold">
                      {{ auth.user?.display_name }}
                    </p>
                    <p class="truncate text-[11px] text-night-300">{{ auth.user?.email }}</p>
                  </div>
                </div>
                <div class="p-2">
                  <RouterLink
                    to="/profile"
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-white/8"
                    @click="menuOpen = false"
                  >
                    🧑‍🎤 แก้ไขโปรไฟล์
                  </RouterLink>
                  <RouterLink
                    to="/mine"
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-white/8"
                    @click="menuOpen = false"
                  >
                    🎒 พื้นที่ของฉัน
                    <span
                      v-if="social.pendingIncoming > 0"
                      class="ml-auto rounded-full bg-bubble-500 px-2 py-0.5 text-[10px] font-extrabold"
                    >
                      {{ social.pendingIncoming }}
                    </span>
                  </RouterLink>
                  <RouterLink
                    to="/report"
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-white/8"
                    @click="menuOpen = false"
                  >
                    📣 ลงประกาศใหม่
                  </RouterLink>
                  <button
                    class="mt-1 flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10"
                    @click="logout"
                  >
                    🚪 ออกจากระบบ
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <template v-else>
          <RouterLink
            to="/login"
            class="rounded-2xl px-3.5 py-2.5 text-sm font-bold text-night-100 transition hover:bg-white/8"
          >
            เข้าสู่ระบบ
          </RouterLink>
          <RouterLink
            to="/register"
            class="rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-ink transition hover:-translate-y-0.5 active:scale-95"
          >
            สมัครสมาชิก
          </RouterLink>
        </template>
      </div>
    </div>

    <!-- mobile nav row -->
    <div ref="mobileNav" class="relative flex items-center gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
      <RouterLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="shrink-0 rounded-2xl px-3 py-1.5 text-xs font-bold text-night-200 ring-1 transition"
        :class="route.path === l.to ? 'bg-white/12 text-white ring-white/20' : 'ring-white/8'"
      >
        {{ l.emoji }} {{ l.label }}
      </RouterLink>
      <RouterLink
        to="/browse"
        class="ml-auto shrink-0 rounded-2xl bg-white px-3 py-1.5 text-xs font-extrabold text-ink"
      >
        🔍 ค้นหา
      </RouterLink>
    </div>
  </header>
</template>
