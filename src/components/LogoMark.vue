<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    emoji?: string
    from?: string
    to?: string
  }>(),
  {
    emoji: '✨',
    from: 'from-night-600',
    to: 'to-bubble-500',
  },
)
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span
      class="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg shadow-glow ring-1 ring-line"
      :class="[props.from, props.to]"
    >
      <span class="relative z-10">🔍</span>
      <span
        class="absolute inset-0 rounded-2xl bg-white/25 blur-md animate-pulse"
        aria-hidden="true"
      />
    </span>
    <span class="flex flex-col leading-none">
      <span class="font-display text-lg font-extrabold tracking-tight">
        Lost<span class="text-gradient-hot">&amp;Found</span>
      </span>
      <span class="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-2">
        bru lost &amp; found
      </span>
    </span>
  </div>
</template>
