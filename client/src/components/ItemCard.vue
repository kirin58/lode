<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Item } from '@/types'
import { KIND_META, STATUS_META, CATEGORY_CHIP, timeAgo, baht } from '@/lib/format'

const props = defineProps<{ item: Item }>()

const kind = computed(() => KIND_META[props.item.kind])
const status = computed(() => STATUS_META[props.item.status])
const catChip = computed(() => CATEGORY_CHIP[props.item.category?.color ?? 'slate'])
const emoji = computed(() => props.item.category?.emoji ?? '✨')
</script>

<template>
  <RouterLink
    :to="`/item/${item.id}`"
    class="group relative flex flex-col overflow-hidden rounded-[1.75rem] glass transition duration-300 hover:-translate-y-1.5 hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-pop"
  >
    <!-- cover -->
    <div class="relative aspect-4/3 overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-br transition duration-500 group-hover:scale-110"
        :class="kind.gradient"
      />
      <div class="absolute inset-0 dotgrid opacity-30" />
      <img
        v-if="item.image_url"
        :src="item.image_url"
        :alt="item.title"
        loading="lazy"
        class="relative h-full w-full object-cover transition duration-500 group-hover:scale-110"
      />
      <span
        class="absolute inset-0 grid place-items-center text-6xl drop-shadow-lg transition duration-500 group-hover:scale-125 group-hover:-rotate-6"
        :class="item.image_url ? 'opacity-0' : 'opacity-90'"
        aria-hidden="true"
      >
        {{ emoji }}
      </span>
      <div
        class="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent"
      />

      <!-- top badges -->
      <div class="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ring-1"
          :class="kind.chip"
        >
          <span>{{ kind.emoji }}</span>{{ kind.label }}
        </span>
        <span
          v-if="item.reward > 0"
          class="animate-ring rounded-full bg-lime-pop/90 px-2.5 py-1 text-[11px] font-extrabold text-ink"
        >
          {{ baht(item.reward) }}
        </span>
      </div>

      <!-- status -->
      <span
        class="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-night-50 ring-1 ring-white/15 backdrop-blur-md"
      >
        <span class="size-1.5 rounded-full" :class="status.dot" />
        {{ status.emoji }} {{ status.label }}
      </span>
    </div>

    <!-- body -->
    <div class="flex flex-1 flex-col gap-2.5 p-4">
      <div class="flex items-center gap-2 text-[11px] text-night-300">
        <span class="rounded-full px-2 py-0.5 font-semibold ring-1" :class="catChip">
          {{ item.category?.emoji }} {{ item.category?.label ?? 'อื่น ๆ' }}
        </span>
        <span class="ml-auto shrink-0">{{ timeAgo(item.created_at) }}</span>
      </div>

      <h3 class="line-clamp-2 font-display text-[15px] font-bold leading-snug text-white">
        {{ item.title }}
      </h3>

      <p class="line-clamp-1 flex items-center gap-1.5 text-xs text-night-300">
        <span>📍</span>{{ item.location || 'ไม่ระบุสถานที่' }}
      </p>

      <div class="mt-auto flex items-center gap-2 border-t border-white/8 pt-3">
        <span
          class="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-sm ring-1 ring-white/15"
        >
          {{ item.owner?.avatar_emoji ?? '👤' }}
        </span>
        <span class="truncate text-xs font-medium text-night-200">
          {{ item.owner?.display_name ?? 'ไม่ระบุ' }}
        </span>
        <span
          v-if="item.claim_count > 0"
          class="ml-auto shrink-0 rounded-full bg-bubble-500/15 px-2 py-0.5 text-[11px] font-bold text-bubble-400"
        >
          🙋 {{ item.claim_count }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
