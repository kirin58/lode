<script setup lang="ts">
withDefaults(
  defineProps<{
    emoji?: string
    title?: string
    body?: string
  }>(),
  {
    emoji: '🫥',
    title: 'ยังไม่มีอะไรตรงนี้',
    body: 'ลองเปลี่ยนคำค้นหาหรือตัวกรองดูนะ',
  },
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-4 rounded-[2rem] glass px-6 py-16 text-center animate-rise"
  >
    <div
      class="grid size-20 animate-float place-items-center rounded-[1.75rem] bg-gradient-to-br from-night-500/40 to-bubble-500/30 text-4xl ring-1 ring-line"
    >
      {{ emoji }}
    </div>
    <div class="space-y-1.5">
      <h3 class="font-display text-xl font-extrabold">{{ title }}</h3>
      <p class="max-w-sm text-sm leading-relaxed text-muted-2">{{ body }}</p>
    </div>
    <slot />
  </div>
</template>
