import type { Store } from '../types.js'
import { createNeonStore } from './store.neon.js'
import { createMemoryStore } from './store.memory.js'

let store: Store | null = null

export function getStore(): Store {
  if (store) return store
  const url = process.env.DATABASE_URL
  if (url) {
    store = createNeonStore(url)
    console.log('🟣 [db] เชื่อมต่อ Neon เรียบร้อย')
  } else {
    store = createMemoryStore()
    console.log('🟡 [db] ไม่พบ DATABASE_URL → ใช้ DEMO MODE (ข้อมูลชั่วคราวใน memory)')
  }
  return store
}
