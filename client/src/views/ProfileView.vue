<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useSocialStore } from '@/stores/social'
import { AVATAR_POOL } from '@/lib/format'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const toast = useToastStore()
const social = useSocialStore()
const router = useRouter()

const name = ref(auth.user?.display_name ?? '')
const campus = ref(auth.user?.campus ?? '')
const bio = ref(auth.user?.bio ?? '')
const avatar = ref(auth.user?.avatar_emoji ?? '🕶️')
const saving = ref(false)

const isDirty = computed(
  () =>
    name.value !== auth.user?.display_name ||
    campus.value !== (auth.user?.campus ?? '') ||
    bio.value !== (auth.user?.bio ?? '') ||
    avatar.value !== auth.user?.avatar_emoji
)

async function save() {
  saving.value = true
  try {
    await auth.updateProfile({
      display_name: name.value.trim(),
      campus: campus.value.trim() || null,
      bio: bio.value.trim(),
      avatar_emoji: avatar.value,
    })
    toast.success('บันทึกโปรไฟล์แล้ว', 'หน้าตาใหม่พร้อมใช้งาน ✨')
    await social.loadAll()
  } catch {
    toast.error('บันทึกไม่สำเร็จ', 'ลองอีกครั้งนะ')
  } finally {
    saving.value = false
  }
}

function logout() {
  auth.logout()
  toast.info('ออกจากระบบแล้ว', 'แล้วเจอกันใหม่นะ 👋')
  router.push('/')
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
    <div
      class="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-night-500/30 via-bubble-500/20 to-transparent p-8 sm:p-10"
    >
      <div class="absolute -right-20 -top-20 size-64 rounded-full bg-lime-pop/15 blur-3xl animate-float" />
      <div class="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <span
          class="grid size-24 shrink-0 place-items-center rounded-[2rem] bg-gradient-to-br from-night-500 to-bubble-500 text-5xl shadow-glow ring-1 ring-line"
        >
          {{ avatar }}
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="font-display text-2xl font-black sm:text-3xl">{{ name || 'ยังไม่ตั้งชื่อ' }}</h1>
          <p class="mt-1 text-sm text-muted-2">{{ auth.user?.email }}</p>
          <div class="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span class="rounded-full bg-fill-2 px-3 py-1 text-[11px] font-bold ring-1 ring-line">
              📍 {{ campus || 'ไม่ระบุคณะ' }}
            </span>
            <span class="rounded-full bg-fill-2 px-3 py-1 text-[11px] font-bold ring-1 ring-line">
              💚 {{ social.mine.length }} ครั้งที่ช่วยคนอื่น
            </span>
            <span
              v-if="auth.isAdmin"
              class="rounded-full bg-lime-pop/15 px-3 py-1 text-[11px] font-extrabold text-lime-pop"
            >
              👑 แอดมิน
            </span>
          </div>
        </div>
      </div>
    </div>

    <form class="mt-6 space-y-5 rounded-[2.5rem] glass-strong p-6 sm:p-10" @submit.prevent="save">
      <div>
        <span class="mb-2.5 block text-xs font-bold text-muted-1">อวตาร</span>
        <div class="grid grid-cols-8 gap-2">
          <button
            v-for="a in AVATAR_POOL"
            :key="a"
            type="button"
            class="grid aspect-square place-items-center rounded-2xl text-xl transition hover:scale-110"
            :class="avatar === a ? 'bg-white/20 ring-2 ring-lime-pop' : 'bg-fill ring-1 ring-line'"
            @click="avatar = a"
          >
            {{ a }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">ชื่อที่แสดง</span>
          <input
            v-model="name"
            type="text"
            maxlength="40"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>
        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">คณะ / สถานที่ศึกษา</span>
          <input
            v-model="campus"
            type="text"
            maxlength="80"
            placeholder="เช่น มหาวิทยาลัยบูรพา"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>
      </div>

      <label class="block">
        <span class="mb-2 block text-xs font-bold text-muted-1">แนะนำตัวสั้น ๆ</span>
        <textarea
          v-model="bio"
          rows="3"
          maxlength="280"
          placeholder="เช่น ช่วยเรื่องหาของได้ทุกที่ แลกกับกาแฟเก้าห้อง ☕"
          class="w-full resize-none rounded-2xl bg-fill px-4 py-3.5 text-sm leading-relaxed outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
        />
        <span class="mt-1 block text-right text-[11px] text-muted-3">
          {{ bio.length }}/280
        </span>
      </label>

      <div class="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          :disabled="saving || !isDirty"
          class="flex-1 rounded-2xl bg-gradient-to-r from-bubble-500 to-night-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {{ saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง' }}
        </button>
        <button
          type="button"
          class="rounded-2xl bg-fill-2 px-5 py-3.5 text-sm font-bold text-rose-300 ring-1 ring-line transition hover:bg-rose-400/12"
          @click="logout"
        >
          ออกจากระบบ
        </button>
      </div>
    </form>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <RouterLink
        to="/mine"
        class="rounded-3xl glass p-5 transition hover:-translate-y-1 hover:shadow-glow"
      >
        <p class="text-2xl">🎒</p>
        <p class="mt-2 font-display text-sm font-extrabold">พื้นที่ของฉัน</p>
        <p class="text-[11px] text-muted-2">จัดการประกาศและคำขอ</p>
      </RouterLink>
      <RouterLink
        to="/browse"
        class="rounded-3xl glass p-5 transition hover:-translate-y-1 hover:shadow-glow"
      >
        <p class="text-2xl">🧭</p>
        <p class="mt-2 font-display text-sm font-extrabold">ค้นหาของ</p>
        <p class="text-[11px] text-muted-2">ดูประกาศทั้งหมด</p>
      </RouterLink>
      <RouterLink
        to="/report"
        class="rounded-3xl glass p-5 transition hover:-translate-y-1 hover:shadow-glow"
      >
        <p class="text-2xl">✨</p>
        <p class="mt-2 font-display text-sm font-extrabold">ลงประกาศใหม่</p>
        <p class="text-[11px] text-muted-2">ใช้เวลาแค่ 10 วิ</p>
      </RouterLink>
    </div>

    <p class="mt-8 text-center text-[11px] text-title0">
      ข้อมูลทั้งหมดของคุณถูกเก็บบน 🟣 Neon Postgres · ลบบัญชีได้โดยแจ้งทีมงาน
    </p>
  </div>
</template>
