<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { AVATAR_POOL } from '@/lib/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const name = ref('')
const email = ref('')
const password = ref('')
const campus = ref('')
const avatar = ref('🕶️')
const agreed = ref(false)
const error = ref('')
const shake = ref(false)

const strength = computed(() => {
  let s = 0
  if (password.value.length >= 8) s++
  if (password.value.length >= 12) s++
  if (/[A-Z]/.test(password.value) && /[a-z]/.test(password.value)) s++
  if (/\d/.test(password.value)) s++
  if (/[^\w\s]/.test(password.value)) s++
  return s
})

const strengthMeta = computed(() => {
  const map = [
    { label: 'อ่อนมาก', color: 'bg-rose-400', width: 'w-1/5' },
    { label: 'ยังไม่น่าเชื่อถือ', color: 'bg-orange-400', width: 'w-2/5' },
    { label: 'พอใช้ได้', color: 'bg-mango-400', width: 'w-3/5' },
    { label: 'ดี', color: 'bg-lime-pop', width: 'w-4/5' },
    { label: 'แข็งแรงมาก 🔐', color: 'bg-mint-pop', width: 'w-full' },
  ]
  return map[Math.min(strength.value, 4)]
})

const perks = [
  { emoji: '✨', title: 'ลงประกาศได้ทันที', body: 'ทำหาย หรือเจอของ — โพสต์ฟรี' },
  { emoji: '🔔', title: 'แจ้งเตือนทันที', body: 'มีคนอ้างของคุณ รู้ในพริบตา' },
  { emoji: '💚', title: 'ดูสถิติความดี', body: 'เท่าไรก็ตาม แอปจะจดจำไว้' },
  { emoji: '🚫', title: 'ไม่มีโฆษณา', body: 'ไม่ขายข้อมูล ไม่มีสปอน' },
]

async function submit() {
  error.value = ''
  if (name.value.trim().length < 2) return fail('ใส่ชื่อที่เรียกได้หน่อยนะ')
  if (!/^\S+@\S+\.\S+$/.test(email.value)) return fail('อีเมลดูไม่ถูกนะ')
  if (password.value.length < 8) return fail('รหัสผ่านต้องยาวอย่างน้อย 8 ตัว')
  if (!agreed.value) return fail('ต้องกดยอมรับเงื่อนไขก่อนนะ')

  try {
    const user = await auth.register({
      email: email.value.trim(),
      password: password.value,
      display_name: name.value.trim(),
      avatar_emoji: avatar.value,
      campus: campus.value.trim() || null,
    })
    toast.party('ยินดีต้อนรับ!', `สวัสดี ${user.display_name} เข้าสู่โลกการคืนของแล้ว 🎉`)
    router.push((route.query.redirect as string) ?? '/browse')
  } catch (err) {
    fail(err instanceof ApiError ? err.message : 'สมัครไม่สำเร็จ ลองใหม่นะ')
  }
}

function fail(msg: string) {
  error.value = msg
  shake.value = true
  setTimeout(() => (shake.value = false), 500)
}

onMounted(() => {
  avatar.value = AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)]
})
</script>

<template>
  <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
    <!-- art panel -->
    <aside class="relative hidden overflow-hidden rounded-[2.5rem] glass-strong p-10 lg:block">
      <div class="absolute -left-16 -top-16 size-56 rounded-full bg-bubble-500/25 blur-3xl animate-float" />
      <div class="absolute -bottom-20 -right-10 size-64 rounded-full bg-night-500/30 blur-3xl animate-float-slow" />
      <div class="absolute inset-0 dotgrid opacity-25" />

      <div class="relative">
        <span
          class="inline-flex items-center gap-2 rounded-full bg-fill-2 px-3 py-1.5 text-xs font-bold ring-1 ring-line"
        >
          🎟️ เข้าร่วมชุมชนคืนของ
        </span>
        <h2 class="mt-6 font-display text-4xl font-black leading-[1.05]">
          เข้ามาแล้ว<br />
          <span class="text-gradient">ช่วยกัน</span> คืนของได้เลย 💜
        </h2>
        <p class="mt-4 max-w-sm text-sm leading-relaxed text-muted-1">
          สมัครฟรี ใช้เวลาไม่ถึง 20 วินาที แล้วคุณจะได้รับการแจ้งเตือนทุกครั้งที่มีคน
          เจอของของคุณ
        </p>

        <div class="mt-10 space-y-3">
          <div
            v-for="p in perks"
            :key="p.title"
            class="flex items-start gap-3 rounded-2xl bg-fill p-4 ring-1 ring-line transition hover:-translate-y-0.5 hover:bg-fill-2"
          >
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-fill-2 text-lg">
              {{ p.emoji }}
            </span>
            <div>
              <p class="text-sm font-bold">{{ p.title }}</p>
              <p class="text-xs text-muted-2">{{ p.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- form panel -->
    <div class="rounded-[2.5rem] glass-strong p-6 sm:p-10">
      <div class="mb-8">
        <h1 class="font-display text-3xl font-black sm:text-4xl">
          สมัครสมาชิก <span class="text-gradient-hot">ฟรี</span> ✨
        </h1>
        <p class="mt-2 text-sm text-muted-2">
          มีบัญชีแล้ว?
          <RouterLink to="/login" class="font-bold text-lime-pop hover:underline">เข้าสู่ระบบ</RouterLink>
        </p>
      </div>

      <form class="space-y-4" :class="shake ? 'animate-wiggle' : ''" @submit.prevent="submit">
        <!-- avatar picker -->
        <div>
          <span class="mb-2.5 block text-xs font-bold text-muted-1">เลือกอวตารของคุณ</span>
          <div class="flex items-center gap-4">
            <span
              class="grid size-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-night-500 to-bubble-500 text-3xl shadow-glow ring-1 ring-line transition"
            >
              {{ avatar }}
            </span>
            <div class="grid flex-1 grid-cols-6 gap-1.5 sm:grid-cols-8">
              <button
                v-for="a in AVATAR_POOL"
                :key="a"
                type="button"
                class="grid aspect-square place-items-center rounded-xl text-lg transition hover:scale-110"
                :class="avatar === a ? 'bg-white/20 ring-2 ring-lime-pop' : 'bg-fill ring-1 ring-line'"
                @click="avatar = a"
              >
                {{ a }}
              </button>
            </div>
          </div>
        </div>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">ชื่อเล่น / ชื่อจริง</span>
          <input
            v-model="name"
            type="text"
            placeholder="เช่น โจ้ หรือ น้องฟ้า"
            maxlength="40"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">อีเมล</span>
          <input
            v-model="email"
            type="email"
            placeholder="you@campus.ac.th"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">รหัสผ่าน</span>
          <input
            v-model="password"
            type="password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
          <div v-if="password" class="mt-2.5 flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-fill-2">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="strengthMeta.color"
                :style="{ width: strengthMeta.width }"
              />
            </div>
            <span class="shrink-0 text-[10px] font-bold text-muted-2">
              {{ strengthMeta.label }}
            </span>
          </div>
        </label>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">
            สถานที่ศึกษา <span class="text-title0">(ไม่บังคับ)</span>
          </span>
          <input
            v-model="campus"
            type="text"
            placeholder="เช่น มหาวิทยาลัยบูรพาา"
            maxlength="80"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>

        <label class="flex cursor-pointer items-start gap-2.5 pt-1">
          <input v-model="agreed" type="checkbox" class="mt-0.5 size-4 accent-lime-pop" />
          <span class="text-[11px] leading-relaxed text-muted-2">
            ยอมรับว่าจะไม่เอาของที่ไม่ใช่ของตัวเอง และยินดีช่วยคนอื่นคืนของ
            💛
          </span>
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
          {{ auth.loading ? 'กำลังสร้างบัญชี…' : 'สร้างบัญชีแล้วเริ่มค้นหา 🚀' }}
        </button>
      </form>

      <p class="mt-5 text-center text-[11px] text-title0">
        🔒 ข้อมูลถูกเก็บบน Neon Postgres แบบเข้ารหัสรหัสผ่าน (bcrypt)
      </p>
    </div>
  </div>
</template>
