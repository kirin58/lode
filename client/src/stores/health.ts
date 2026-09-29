import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useHealthStore = defineStore('health', () => {
  const online = ref(true)
  const checking = ref(false)
  const driver = ref<string | null>(null)
  const lastChecked = ref<number | null>(null)
  let timer: ReturnType<typeof setInterval> | undefined

  const offline = computed(() => !online.value)

  async function check(silent = true) {
    checking.value = true
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      driver.value = data.driver ?? null
      online.value = true
    } catch {
      online.value = false
    } finally {
      checking.value = false
      lastChecked.value = Date.now()
      if (!silent) return
    }
  }

  function start(intervalMs = 10_000) {
    stop()
    void check()
    timer = setInterval(() => {
      // ตรวจเฉพาะตอนออฟไลน์อยู่ หรือทุก ๆ 5 รอบ เพื่อไม่เปลือง network
      if (!online.value) void check()
    }, intervalMs)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = undefined
  }

  return { online, offline, checking, driver, lastChecked, check, start, stop }
})
