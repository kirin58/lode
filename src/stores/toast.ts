import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  title: string
  body?: string
  tone: 'success' | 'error' | 'info' | 'party'
  emoji?: string
}

let seq = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function push(input: Omit<Toast, 'id'>, ttl = 4200) {
    const id = ++seq
    toasts.value.push({ id, ...input })
    setTimeout(() => dismiss(id), ttl)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const success = (title: string, body?: string, emoji = '✅') =>
    push({ title, body, tone: 'success', emoji })
  const error = (title: string, body?: string, emoji = '😢') =>
    push({ title, body, tone: 'error', emoji })
  const info = (title: string, body?: string, emoji = '💬') =>
    push({ title, body, tone: 'info', emoji })
  const party = (title: string, body?: string, emoji = '🎉') =>
    push({ title, body, tone: 'party', emoji })

  return { toasts, push, dismiss, success, error, info, party }
})
