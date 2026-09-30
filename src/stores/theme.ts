import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export type Theme = 'dark' | 'light'

const KEY = 'lf_theme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(
    (localStorage.getItem(KEY) as Theme) ??
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  )

  watchEffect(() => {
    document.documentElement.classList.toggle('light', theme.value === 'light')
    localStorage.setItem(KEY, theme.value)
  })

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
})
