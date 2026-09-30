import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import { useAuthStore } from './auth'
import type { Claim, NotificationRow } from '@/types'

export const useSocialStore = defineStore('social', () => {
  const incoming = ref<Claim[]>([])
  const mine = ref<Claim[]>([])
  const notifications = ref<NotificationRow[]>([])
  const loading = ref(false)

  const unread = computed(() => notifications.value.filter((n) => !n.read_at).length)
  const pendingIncoming = computed(() => incoming.value.filter((c) => c.status === 'pending').length)

  async function loadAll() {
    const auth = useAuthStore()
    if (!auth.isAuthed) {
      incoming.value = []
      mine.value = []
      notifications.value = []
      return
    }
    loading.value = true
    try {
      const [inc, my, notif] = await Promise.all([
        api.get<{ claims: Claim[] }>('/claims/incoming'),
        api.get<{ claims: Claim[] }>('/claims/mine'),
        api.get<{ notifications: NotificationRow[] }>('/notifications'),
      ])
      incoming.value = inc.claims
      mine.value = my.claims
      notifications.value = notif.notifications
    } finally {
      loading.value = false
    }
  }

  async function claim(itemId: string, message: string) {
    const res = await api.post<{ claim: Claim }>(`/claims/${itemId}`, { message })
    mine.value = [res.claim, ...mine.value]
    return res.claim
  }

  async function decide(claimId: string, status: 'approved' | 'rejected') {
    const res = await api.patch<{ claim: Claim }>(`/claims/${claimId}`, { status })
    incoming.value = incoming.value.map((c) => (c.id === claimId ? { ...c, status } : c))
    return res.claim
  }

  async function markRead() {
    if (!unread.value) return
    await api.post('/notifications/read')
    const now = new Date().toISOString()
    notifications.value = notifications.value.map((n) => ({ ...n, read_at: n.read_at ?? now }))
  }

  return { incoming, mine, notifications, unread, pendingIncoming, loading, loadAll, claim, decide, markRead }
})
