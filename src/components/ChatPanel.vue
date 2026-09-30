<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useExtrasStore } from '@/stores/extras'
import { useAuthStore } from '@/stores/auth'
import { timeAgo } from '@/lib/format'

const props = defineProps<{ itemId: string; title: string }>()

const extras = useExtrasStore()
const auth = useAuthStore()
const body = ref('')
const sending = ref(false)
const scroller = ref<HTMLElement | null>(null)

async function submit() {
  const text = body.value.trim()
  if (!text || sending.value) return
  sending.value = true
  try {
    await extras.send(text)
    body.value = ''
    await scrollDown()
  } finally {
    sending.value = false
  }
}

async function scrollDown() {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })
}

watch(
  () => extras.messages.length,
  () => void scrollDown()
)

function close() {
  extras.closeChat()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="extras.chatOpen"
        class="fixed inset-0 z-[90] bg-scrim backdrop-blur-sm"
        @click.self="close"
      />
    </Transition>

    <Transition name="pop">
      <div
        v-if="extras.chatOpen"
        class="fixed inset-x-0 bottom-0 z-[95] flex max-h-[86dvh] flex-col rounded-t-[2rem] glass-strong shadow-lift sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-h-[36rem] sm:w-[24rem] sm:rounded-[2rem]"
      >
        <!-- header -->
        <div class="flex items-center gap-3 border-b border-line px-5 py-4">
          <span class="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-night-500 to-bubble-500 text-lg">
            💬
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="truncate font-display text-sm font-extrabold">{{ title }}</h3>
            <p class="text-[11px] text-muted-3">แชทส่วนตัวกับอีกฝั่ง</p>
          </div>
          <button
            class="grid size-9 place-items-center rounded-2xl bg-fill-2 text-sm transition hover:bg-fill-2"
            aria-label="ปิดแชท"
            @click="close"
          >
            ✕
          </button>
        </div>

        <!-- messages -->
        <div ref="scroller" class="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
          <p
            v-if="!extras.messages.length"
            class="py-10 text-center text-sm leading-relaxed text-muted-2"
          >
            ยังไม่มีข้อความ<br />
            <span class="text-[11px]">ลองบอกที่ไหน/เมื่อไหร่ที่เจอ หรือนัดเวลานัดเจอกันดีกว่า 😊</span>
          </p>

          <div
            v-for="m in extras.messages"
            :key="m.id"
            class="flex gap-2"
            :class="m.user_id === auth.user?.id ? 'flex-row-reverse' : ''"
          >
            <span class="grid size-7 shrink-0 place-items-center rounded-xl bg-fill-2 text-xs">
              {{ m.user?.avatar_emoji ?? '👤' }}
            </span>
            <div
              class="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              :class="
                m.user_id === auth.user?.id
                  ? 'bg-gradient-to-br from-bubble-500 to-night-500 text-white'
                  : 'bg-fill-2 text-title'
              "
            >
              <p class="whitespace-pre-line break-words">{{ m.body }}</p>
              <p
                class="mt-1 text-[10px]"
                :class="m.user_id === auth.user?.id ? 'text-white/60' : 'text-muted-3'"
              >
                {{ m.user?.display_name }} · {{ timeAgo(m.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- input -->
        <form class="flex items-center gap-2 border-t border-line p-3" @submit.prevent="submit">
          <input
            v-model="body"
            type="text"
            maxlength="800"
            placeholder="พิมพ์ข้อความ…"
            class="w-full rounded-2xl bg-fill px-4 py-3 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
          <button
            type="submit"
            :disabled="!body.trim() || sending"
            class="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-bubble-500 to-night-500 text-white shadow-glow transition active:scale-95 disabled:opacity-40"
            aria-label="ส่งข้อความ"
          >
            ➤
          </button>
        </form>

        <p class="pb-3 text-center text-[10px] text-title0">
          🔒 แชทนี้เห็นได้เฉพาะเจ้าของประกาศและคนที่ขอรับของ ·
          <RouterLink to="/browse" class="underline">ปิด</RouterLink>
        </p>
      </div>
    </Transition>
  </Teleport>
</template>
