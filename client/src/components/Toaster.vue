<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const tone: Record<string, string> = {
  success: 'from-emerald-400/25 to-emerald-500/10 ring-emerald-400/30',
  error: 'from-rose-400/25 to-rose-500/10 ring-rose-400/30',
  info: 'from-night-400/25 to-night-500/10 ring-night-400/30',
  party: 'from-lime-pop/25 to-mint-pop/10 ring-lime-pop/30',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed bottom-24 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 sm:bottom-6 sm:right-6"
      role="status"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <button
          v-for="t in toast.toasts"
          :key="t.id"
          class="pointer-events-auto flex w-full items-start gap-3 rounded-3xl bg-ink-soft/90 p-3.5 text-left shadow-lift ring-1 backdrop-blur-2xl transition hover:-translate-y-0.5"
          :class="tone[t.tone]"
          @click="toast.dismiss(t.id)"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg">
            {{ t.emoji }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-display text-sm font-bold leading-snug">{{ t.title }}</span>
            <span v-if="t.body" class="mt-0.5 block text-xs leading-relaxed text-night-200">
              {{ t.body }}
            </span>
          </span>
          <span class="mt-0.5 text-night-400">✕</span>
        </button>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
