import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from './auth'
import type { Message, Reputation, Review, Watch } from '@/types'

export const useExtrasStore = defineStore('extras', () => {
  const watches = ref<Watch[]>([])
  const messages = ref<Message[]>([])
  const chatItemId = ref<string | null>(null)
  const reputation = ref<Reputation | null>(null)
  const reviews = ref<Review[]>([])
  const loadingWatches = ref(false)
  const chatOpen = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  const watchCount = computed(() => watches.value.length)

  async function loadWatches() {
    const auth = useAuthStore()
    if (!auth.isAuthed) {
      watches.value = []
      return
    }
    loadingWatches.value = true
    try {
      const res = await api.get<{ watches: Watch[] }>('/watches')
      watches.value = res.watches
    } catch (err) {
      if (!(err instanceof ApiError)) throw err
    } finally {
      loadingWatches.value = false
    }
  }

  async function addWatch(payload: { keyword: string; category_id: string | null; kind: any }) {
    const res = await api.post<{ watch: Watch }>('/watches', payload)
    const idx = watches.value.findIndex((w) => w.id === res.watch.id)
    if (idx >= 0) watches.value[idx] = res.watch
    else watches.value.unshift(res.watch)
    return res.watch
  }

  async function removeWatch(id: string) {
    await api.del(`/watches/${id}`)
    watches.value = watches.value.filter((w) => w.id !== id)
  }

  async function loadReputation(userId: string) {
    const res = await api.get<{ reputation: Reputation; reviews: Review[] }>(
      `/reputation/${userId}`
    )
    reputation.value = res.reputation
    reviews.value = res.reviews
    return res
  }

  async function loadChat(itemId: string) {
    chatItemId.value = itemId
    try {
      const res = await api.get<{ messages: Message[] }>(`/items/${itemId}/messages`)
      messages.value = res.messages
    } catch (err) {
      messages.value = []
      if (err instanceof ApiError && err.status === 403) chatOpen.value = false
    }
  }

  async function send(body: string) {
    if (!chatItemId.value) return
    const res = await api.post<{ message: Message }>(
      `/items/${chatItemId.value}/messages`,
      { body }
    )
    messages.value.push(res.message)
    return res.message
  }

  function startPolling(itemId: string) {
    stopPolling()
    void loadChat(itemId)
    timer = setInterval(() => {
      if (chatOpen.value) void loadChat(itemId)
    }, 3000)
  }

  function stopPolling() {
    if (timer) clearInterval(timer)
    timer = undefined
  }

  function openChat(itemId: string) {
    chatOpen.value = true
    startPolling(itemId)
  }

  function closeChat() {
    chatOpen.value = false
    stopPolling()
  }

  async function review(payload: {
    item_id: string
    target_id: string
    rating: number
    comment: string
  }) {
    const res = await api.post<{ review: Review; target: any }>('/reviews', payload)
    return res
  }

  return {
    watches,
    messages,
    chatItemId,
    reputation,
    reviews,
    loadingWatches,
    watchCount,
    chatOpen,
    loadWatches,
    addWatch,
    removeWatch,
    loadReputation,
    loadChat,
    send,
    startPolling,
    stopPolling,
    openChat,
    closeChat,
    review,
  }
})
