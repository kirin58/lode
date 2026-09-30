import { defineStore } from 'pinia'
import { ref } from 'vue'
import Swal from 'sweetalert2'

export interface Toast {
  id: number
  title: string
  body?: string
  tone: 'success' | 'error' | 'info' | 'party'
  emoji?: string
}

export const useToastStore = defineStore('toast', () => {
  const ToastMixin = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: {
      popup: '!rounded-2xl',
      title: '!font-display',
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })

  // To not break existing components that might read toasts.length
  const toasts = ref<Toast[]>([])

  function push(input: Omit<Toast, 'id'>, ttl = 3500) {
    let icon: 'success' | 'error' | 'info' | 'warning' | 'question' = 'info'
    if (input.tone === 'success' || input.tone === 'party') icon = 'success'
    if (input.tone === 'error') icon = 'error'

    ToastMixin.fire({
      icon,
      title: input.title,
      text: input.body,
      timer: ttl,
    })
  }

  function dismiss(_id?: number) {
    Swal.close()
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
