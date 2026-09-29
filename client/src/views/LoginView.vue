<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const email = ref('')
const password = ref('')
const show = ref(false)
const error = ref('')
const shake = ref(false)

const highlights = [
  { emoji: '🎧', title: 'AirPods ที่เจอเมื่อวาน', status: 'คืนให้เจ้าของแล้ว', tone: 'lime' },
  { emoji: '🔑', title: 'กุญแจรถยนต์', status: 'เจ้าของยืนยันแล้ว', tone: 'bubble' },
  { emoji: '🎒', title: 'กระเป๋าผ้าใบชาแพนซา', status: 'กำลังตามหาอยู่', tone: 'mango' },
]

async function submit() {
  error.value = ''
  if (!email.value || !password.value) return fail('ใส่อีเมลกับรหัสผ่านด้วยนะ')
  try {
    const user = await auth.login(email.value.trim(), password.value)
    toast.party('ยินดีต้อนรับกลับ!', `สวัสดี ${user.display_name} 👋`)
    router.push((route.query.redirect as string) ?? '/browse')
  } catch (err) {
    fail(err instanceof ApiError ? err.message : 'เข้าสู่ระบบไม่สำเร็จ')
  }
}

function fail(msg: string) {
  error.value = msg
  shake.value = true
  setTimeout(() => (shake.value = false), 500)
}

function useDemo() {
  email.value = 'demo@lostfound.app'
  password.value = 'demo1234'
}

onMounted(() => {
  if (route.query.registered) {
    toast.party('สมัครสำเร็จแล้ว!', 'ลองกดยืนยันว่าเป็นของคุณดูสิ 🎉')
  }
})
</script>

<template>
  <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
    <!-- form panel -->
    <div class="order-2 rounded-[2.5rem] glass-strong p-6 sm:p-10 lg:order-1">
      <span
        class="inline-flex items-center gap-2 rounded-full bg-fill-2 px-3 py-1.5 text-xs font-bold ring-1 ring-line"
      >
        👋 ยินดีต้อนรับกลับ
      </span>
      <h1 class="mt-5 font-display text-3xl font-black sm:text-4xl">
        เข้าสู่ระบบ <span class="text-gradient-hot">Lost&Found</span>
      </h1>
      <p class="mt-2 text-sm text-muted-2">
        ยังไม่มีบัญชี?
        <RouterLink to="/register" class="font-bold text-lime-pop hover:underline">
          สมัครฟรี 20 วินาที
        </RouterLink>
      </p>

      <form class="mt-8 space-y-4" :class="shake ? 'animate-wiggle' : ''" @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">อีเมล</span>
          <input
            v-model="email"
            type="email"
            placeholder="you@campus.ac.th"
            autocomplete="email"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">รหัสผ่าน</span>
          <div class="relative">
            <input
              v-model="password"
              :type="show ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full rounded-2xl bg-fill px-4 py-3.5 pr-12 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-muted-3 transition hover:text-title"
              :aria-label="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
              @click="show = !show"
            >
              {{ show ? '🙈' : '👁️' }}
            </button>
          </div>
        </label>

        <p
          v-if="error"
          class="rounded-2xl bg-rose-400/12 px-4 py-3 text-xs font-bold text-rose-200 ring-1 ring-rose-400/25"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full rounded-2xl bg-gradient-to-r from-bubble-500 via-night-500 to-night-600 px-5 py-4 text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-1 active:scale-95 disabled:opacity-60"
        >
          {{ auth.loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ 🚀' }}
        </button>

        <div class="flex items-center gap-3 pt-1">
          <span class="h-px flex-1 bg-fill-2" />
          <span class="text-[11px] font-bold text-title0">หรือ</span>
          <span class="h-px flex-1 bg-fill-2" />
        </div>

        <button
          type="button"
          class="w-full rounded-2xl bg-fill-2 px-5 py-3.5 text-sm font-bold ring-1 ring-line transition hover:bg-fill-2"
          @click="useDemo"
        >
          🧪 ใช้บัญชีเดโม (คลิกเพื่อกรอกให้)
        </button>
      </form>
    </div>

    <!-- art panel -->
    <aside class="relative order-1 overflow-hidden rounded-[2.5rem] glass-strong p-8 sm:p-10 lg:order-2">
      <div class="absolute -right-16 -top-16 size-56 rounded-full bg-mint-pop/20 blur-3xl animate-float" />
      <div class="absolute -bottom-16 -left-10 size-64 rounded-full bg-night-500/30 blur-3xl animate-float-slow" />
      <div class="absolute inset-0 dotgrid opacity-25" />

      <div class="relative">
        <h2 class="font-display text-3xl font-black leading-tight sm:text-4xl">
          วันนี้มีคน<br />
          <span class="text-gradient">คืนของ</span> สำเร็จแล้ว
        </h2>

        <div class="mt-8 space-y-3">
          <div
            v-for="(h, i) in highlights"
            :key="h.title"
            class="flex items-center gap-3 rounded-2xl bg-fill p-4 ring-1 ring-line transition hover:-translate-y-1 hover:bg-fill-2"
            :style="{ animation: `rise .5s ${i * 120}ms both` }"
          >
            <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-fill-2 text-xl">
              {{ h.emoji }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{{ h.title }}</p>
              <p class="text-[11px] text-muted-2">{{ h.status }}</p>
            </div>
            <span
              class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
              :class="
                h.tone === 'lime'
                  ? 'bg-lime-pop/15 text-lime-pop'
                  : h.tone === 'bubble'
                    ? 'bg-bubble-500/15 text-bubble-400'
                    : 'bg-mango-400/15 text-mango-300'
              "
            >
              {{ h.tone === 'lime' ? 'สำเร็จ' : h.tone === 'bubble' ? 'ยืนยันแล้ว' : 'กำลังหา' }}
            </span>
          </div>
        </div>

        <p class="mt-8 text-xs leading-relaxed text-muted-3">
          💜 ทุกชิ้นที่กลับคืนคือหนึ่งคนที่ได้เดินกลับบ้านสบาย ๆ เหมือนกัน
        </p>
      </div>
    </aside>
  </div>
</template>
