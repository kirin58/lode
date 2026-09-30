<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useHealthStore } from '@/stores/health'

const health = useHealthStore()

onMounted(() => health.start())
onUnmounted(() => health.stop())
</script>

<template>
  <Transition name="drop">
    <div
      v-if="health.offline"
      class="sticky top-18 z-[80] border-b border-rose-400/25 bg-rose-500/15 backdrop-blur-xl"
    >
      <div class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p class="flex items-start gap-2 text-xs leading-relaxed text-rose-100 sm:text-sm">
          <span class="text-base leading-none">🔌</span>
          <span>
            <strong class="font-extrabold">เชื่อมต่อ API ไม่ได้</strong> — หน้าเว็บเปิดได้แต่ข้อมูลโหลดไม่ขึ้น
            <span class="hidden sm:inline">ลองรันคำสั่งนี้ในโปรเจกต์:</span>
            <code class="rounded-lg bg-black/30 px-2 py-0.5 font-mono text-[11px]">npm run dev</code>
            <span v-if="health.lastChecked" class="ml-1 text-[11px] text-rose-200/70">
              (ตรวจล่าสุด {{ new Date(health.lastChecked).toLocaleTimeString('th-TH') }})
            </span>
          </span>
        </p>
        <button
          class="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-rose-400 px-4 py-2 text-xs font-extrabold text-ink transition hover:brightness-110 active:scale-95 disabled:opacity-60"
          :disabled="health.checking"
          @click="health.check()"
        >
          <span :class="health.checking ? 'animate-spin' : ''">⟳</span>
          {{ health.checking ? 'กำลังลอง…' : 'ลองใหม่' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
