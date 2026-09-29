<script setup lang="ts">
import { computed } from 'vue'
import type { Reputation } from '@/types'

const props = withDefaults(defineProps<{ rep: Reputation | null; compact?: boolean }>(), {
  compact: false,
})

const BADGES: Record<string, { label: string; emoji: string; chip: string; ring: string }> = {
  newbie: {
    label: 'มือใหม่',
    emoji: '🌱',
    chip: 'bg-fill-2 text-muted-1',
    ring: 'ring-line',
  },
  trusted: {
    label: 'คนน่าเชื่อถือ',
    emoji: '✅',
    chip: 'bg-mint-pop/15 text-mint-pop',
    ring: 'ring-mint-pop/25',
  },
  hero: {
    label: 'ฮีโร่คืนของ',
    emoji: '🦸',
    chip: 'bg-bubble-500/18 text-bubble-400',
    ring: 'ring-bubble-500/30',
  },
  legend: {
    label: 'ตำนาน',
    emoji: '👑',
    chip: 'bg-lime-pop/18 text-lime-pop',
    ring: 'ring-lime-pop/30',
  },
}

const badge = computed(() => BADGES[props.rep?.badge ?? 'newbie'])
const stars = computed(() => {
  const avg = props.rep?.avg_rating ?? 0
  return [1, 2, 3, 4, 5].map((i) => (i <= Math.round(avg) ? 'text-mango-400' : 'text-muted-3'))
})
</script>

<template>
  <div v-if="rep" class="flex items-center gap-3">
    <div
      class="flex items-center gap-2 rounded-2xl px-3 py-1.5 text-[11px] font-extrabold ring-1"
      :class="[badge.chip, badge.ring]"
    >
      <span class="text-sm leading-none">{{ badge.emoji }}</span>
      {{ badge.label }}
    </div>

    <template v-if="!compact">
      <span class="flex items-center gap-0.5 text-sm">
        <span v-for="(c, i) in stars" :key="i" :class="c">★</span>
      </span>
      <span class="text-[11px] text-muted-2">
        {{ rep.avg_rating.toFixed(1) }} · {{ rep.reviews_count }} รีวิว
      </span>
      <span class="ml-auto font-mono text-sm font-extrabold text-lime-pop">
        {{ rep.score }} คะแนน
      </span>
    </template>
  </div>
</template>
