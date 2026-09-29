<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{ value: number; suffix?: string; duration?: number }>(),
  { suffix: '', duration: 1400 },
)

const display = ref(0)
let raf = 0

onMounted(() => {
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    display.value = Math.round(props.value * eased)
    if (p < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
})

onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="font-mono tabular-nums">{{ display.toLocaleString('th-TH') }}{{ suffix }}</span>
</template>
