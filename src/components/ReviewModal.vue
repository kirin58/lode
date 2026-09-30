<script setup lang="ts">
import { ref, watch } from 'vue'
import { useExtrasStore } from '@/stores/extras'
import { useToastStore } from '@/stores/toast'
import { ApiError } from '@/lib/api'

const props = defineProps<{
  open: boolean
  itemId: string
  itemTitle: string
  targetId: string
  targetName: string
  targetEmoji: string
}>()
const emit = defineEmits<{ close: []; done: [] }>()

const extras = useExtrasStore()
const toast = useToastStore()
const rating = ref(5)
const comment = ref('')
const sending = ref(false)

watch(
  () => props.open,
  (v) => {
    if (v) {
      rating.value = 5
      comment.value = ''
    }
  }
)

async function submit() {
  sending.value = true
  try {
    await extras.review({
      item_id: props.itemId,
      target_id: props.targetId,
      rating: rating.value,
      comment: comment.value.trim(),
    })
    toast.party('ขอบคุณสำหรับรีวิว!', '⭐ คะแนนความน่าเชื่อถือเพิ่มแล้ว')
    emit('done')
    emit('close')
  } catch (err) {
    toast.error('ให้คะแนนไม่สำเร็จ', err instanceof ApiError ? err.message : undefined)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[110] grid place-items-center bg-scrim p-4 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="w-full max-w-md rounded-[2rem] glass-strong p-6 shadow-lift animate-pop-in"
        >
          <div class="flex items-center gap-3">
            <span
              class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mango-400 to-bubble-500 text-2xl"
            >
              {{ targetEmoji }}
            </span>
            <div class="min-w-0">
              <h3 class="font-display text-base font-extrabold">ให้คะแนน {{ targetName }}</h3>
              <p class="truncate text-[11px] text-muted-3">“{{ itemTitle }}”</p>
            </div>
            <button
              class="ml-auto grid size-9 shrink-0 place-items-center rounded-2xl bg-fill-2 transition hover:bg-fill-2"
              aria-label="ปิด"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>

          <p class="mt-5 text-sm text-muted-1">
            เคสนี้คืนสำเร็จแล้ว — คะแนนจะช่วยให้คนอื่นรู้ว่าใครไว้ใจได้ 💛
          </p>

          <div class="mt-4 flex justify-center gap-2">
            <button
              v-for="n in 5"
              :key="n"
              class="text-4xl transition hover:scale-125"
              :class="n <= rating ? 'text-mango-400' : 'text-muted-3'"
              :aria-label="`${n} ดาว`"
              @click="rating = n"
            >
              ⭐
            </button>
          </div>
          <p class="mt-1 text-center text-xs font-bold text-mango-300">
            {{ ['', 'แย่มาก', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก!'][rating] }}
          </p>

          <textarea
            v-model="comment"
            rows="3"
            maxlength="300"
            placeholder="ฝากคำชมไว้ด้ๆ เช่น นัดเจอไวมากสุด ๆ"
            class="mt-4 w-full resize-none rounded-2xl bg-fill px-4 py-3 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-mango-400/60"
          />

          <div class="mt-5 flex gap-2">
            <button
              class="flex-1 rounded-2xl bg-fill-2 px-4 py-3 text-sm font-bold ring-1 ring-line transition hover:bg-fill-2"
              @click="emit('close')"
            >
              ยกเลิก
            </button>
            <button
              :disabled="sending"
              class="flex-1 rounded-2xl bg-gradient-to-r from-mango-400 to-bubble-500 px-4 py-3 text-sm font-extrabold text-paper transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              @click="submit"
            >
              {{ sending ? 'ส่ง…' : `ส่ง ${rating} ดาว` }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
