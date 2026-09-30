import { createApp, h } from 'vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

export interface ConfirmOptions {
  title: string
  text?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  emoji?: string
}

export function confirmPop(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const root = document.createElement('div')
    document.body.appendChild(root)

    const app = createApp({
      render() {
        return h(ConfirmModal, {
          ref: 'modal',
          ...options,
          onConfirm: () => {
            resolve(true)
            setTimeout(cleanup, 500) // wait for leave transition
          },
          onCancel: () => {
            resolve(false)
            setTimeout(cleanup, 500)
          }
        })
      },
      mounted() {
        // Need to trigger 'open' after mount so the enter transition plays
        requestAnimationFrame(() => {
          ;(this.$refs.modal as any).open()
        })
      }
    })

    app.mount(root)

    function cleanup() {
      app.unmount()
      root.remove()
    }
  })
}
