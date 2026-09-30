<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import LogoMark from './LogoMark.vue'
import NotificationBell from './NotificationBell.vue'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { useExtrasStore } from '@/stores/extras'
import { useThemeStore } from '@/stores/theme'

const auth = useAuthStore()
const social = useSocialStore()
const extras = useExtrasStore()
const theme = useThemeStore()
const route = useRoute()
const router = useRouter()

const menu = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const mobileNav = ref<HTMLElement | null>(null)
const mobileOpen = ref(false)
onClickOutside(menu, () => (menuOpen.value = false))
onClickOutside(mobileNav, () => (mobileOpen.value = false))

const links = computed(() => {
  const base = [
    { to: '/', label: 'หน้าแรก', emoji: '🏠' },
    { to: '/browse', label: 'ค้นหาของ', emoji: '🧭' },
    { to: '/report', label: 'ลงประกาศ', emoji: '📣' },
  ]
  if (auth.isAuthed) {
    base.push({ to: '/watch', label: 'ติดตาม', emoji: '🔔' })
    base.push({ to: '/mine', label: 'พื้นที่ของฉัน', emoji: '🎒' })
  }
  if (auth.isAdmin) base.push({ to: '/admin', label: 'สถิติ', emoji: '👑' })
  return base
})

function logout() {
  auth.logout()
  menuOpen.value = false
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-veil backdrop-blur-2xl">
    <div class="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 sm:px-6">
      <RouterLink to="/" class="shrink-0" aria-label="Lost & Found">
        <LogoMark />
      </RouterLink>

      <nav class="ml-4 hidden items-center gap-1 lg:flex">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded-2xl px-3.5 py-2 text-sm font-semibold text-muted-1 transition hover:bg-fill-2 hover:text-title"
          :class="route.path === l.to ? 'bg-fill-2 text-title shadow-inner' : ''"
        >
          <span class="mr-1.5">{{ l.emoji }}</span>{{ l.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <button
          class="grid size-11 place-items-center rounded-2xl glass text-lg transition hover:bg-fill-2 active:scale-95"
          :aria-label="theme.theme === 'dark' ? 'เปิดโหมดสว่าง' : 'เปิดโหมดมืด'"
          @click="theme.toggle()"
        >
          {{ theme.theme === 'dark' ? '🌙' : '☀️' }}
        </button>

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
              class="grid size-11 place-items-center rounded-2xl bg-fill-2 text-lg ring-1 ring-line transition hover:bg-fill-2 active:scale-95"
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
                <div class="flex items-center gap-3 border-b border-line p-4">
                  <span
                    class="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-night-500 to-bubble-500 text-xl"
                  >
                    {{ auth.user?.avatar_emoji }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-display text-sm font-extrabold">
                      {{ auth.user?.display_name }}
                    </p>
                    <p class="truncate text-[11px] text-muted-2">{{ auth.user?.email }}</p>
                  </div>
                </div>
                <div class="p-2">
                  <RouterLink
                    to="/watch"
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-fill-2"
                    @click="menuOpen = false"
                  >
                    🔔 ติดตามสิ่งที่สนใจ
                    <span
                      v-if="extras.watchCount"
                      class="ml-auto rounded-full bg-mint-pop/15 px-2 py-0.5 text-[10px] font-extrabold text-mint-pop"
                    >
                      {{ extras.watchCount }}
                    </span>
                  </RouterLink>
                  <RouterLink
                    v-if="auth.isAdmin"
                    to="/admin"
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-fill-2"
                    @click="menuOpen = false"
                  >
                    👑 สถิติทั้งระบบ
                  </RouterLink>
                  <RouterLink
                    to="/profile"
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-fill-2"
                    @click="menuOpen = false"
                  >
                    🧑‍🎤 แก้ไขโปรไฟล์
                  </RouterLink>
                  <RouterLink
                    to="/mine"
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-fill-2"
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
                    class="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition hover:bg-fill-2"
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
            class="rounded-2xl px-3.5 py-2.5 text-sm font-bold text-night-100 transition hover:bg-fill-2"
          >
            เข้าสู่ระบบ
          </RouterLink>
          <RouterLink
            to="/register"
            class="rounded-2xl bg-title px-4 py-2.5 text-sm font-extrabold text-paper transition hover:-translate-y-0.5 active:scale-95"
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
        class="shrink-0 rounded-2xl px-3 py-1.5 text-xs font-bold text-muted-1 ring-1 transition"
        :class="route.path === l.to ? 'bg-fill-2 text-title ring-line' : 'ring-line'"
      >
        {{ l.emoji }} {{ l.label }}
      </RouterLink>
      <RouterLink
        to="/browse"
        class="ml-auto shrink-0 rounded-2xl bg-title px-3 py-1.5 text-xs font-extrabold text-paper"
      >
        🔍 ค้นหา
      </RouterLink>
    </div>
  </header>
</template>
