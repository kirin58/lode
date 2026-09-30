<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  text?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  emoji?: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const show = ref(false)

function open() {
  show.value = true
}

function close() {
  show.value = false
  emit('cancel')
}

function confirm() {
  show.value = false
  emit('confirm')
}

defineExpose({
  open,
  close,
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-[150] grid place-items-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" @click="close"></div>
        
        <!-- Modal Content -->
        <div class="relative z-10 w-full max-w-sm animate-pop-in overflow-hidden rounded-[2.5rem] bg-veil-strong p-8 text-center ring-1 ring-white/10 shadow-glow">
          
          <!-- Gen Z flair: floating emoji -->
          <div class="mb-4 inline-block animate-float text-7xl drop-shadow-2xl">
            {{ emoji || (danger ? '🚨' : '🤔') }}
          </div>
          
          <h3 class="mb-2 font-display text-2xl font-bold text-title">
            {{ title }}
          </h3>
          
          <p v-if="text" class="mb-8 text-sm leading-relaxed text-muted-2">
            {{ text }}
          </p>
          
          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <button
              class="btn rounded-full px-8 py-3.5 text-base font-bold shadow-lg transition-transform active:scale-95"
              :class="danger ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-500/30' : 'bg-gradient-to-r from-night-500 to-night-400 text-white shadow-night-500/30'"
              @click="confirm"
            >
              {{ confirmText || 'ตกลง' }}
            </button>
            
            <button
              class="rounded-full px-8 py-3 text-sm font-semibold text-muted-2 transition-colors hover:bg-white/5 active:bg-white/10"
              @click="close"
            >
              {{ cancelText || 'ยกเลิก' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
