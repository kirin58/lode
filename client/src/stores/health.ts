import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_BASE } from '@/lib/api'

export const useHealthStore = defineStore('health', () => {
  const online = ref(true)
  const checking = ref(false)
  const driver = ref<string | null>(null)
  const lastChecked = ref<number | null>(null)
  let timer: ReturnType<typeof setInterval> | undefined

  const offline = computed(() => !online.value)

  async function check() {
    checking.value = true
    try {
      const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      driver.value = data.driver ?? null
      online.value = true
    } catch {
      online.value = false
    } finally {
      checking.value = false
      lastChecked.value = Date.now()
    }
  }

  function start(intervalMs = 10_000) {
    stop()
    void check()
    timer = setInterval(() => {
      // ตรวจทุกครั้งที่ออฟไลน์อยู่ เพื่อกลับมาออนไลน์เองเมื่อ API ฟื้น
      // (ถ้าออนไลน์อยู่ ให้ตรวจทุก ๆ 5 รอบ = ~50 วินาที เพื่อไม่เปลือง network)
      if (!online.value) void check()
    }, intervalMs)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = undefined
  }

  return { online, offline, checking, driver, lastChecked, check, start, stop }
})

