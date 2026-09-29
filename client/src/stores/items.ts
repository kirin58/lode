import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import type { Category, Item, ListItemsParams, Stats } from '@/types'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const categories = ref<Category[]>([])
  const stats = ref<Stats | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const filters = ref<ListItemsParams>({ kind: 'all', category: 'all', status: 'all', sort: 'new' })

  const query = computed(() => {
    const f = filters.value
    const p = new URLSearchParams()
    if (f.q) p.set('q', f.q)
    if (f.kind && f.kind !== 'all') p.set('kind', f.kind)
    if (f.category && f.category !== 'all') p.set('category', f.category)
    if (f.status && f.status !== 'all') p.set('status', f.status)
    if (f.sort) p.set('sort', f.sort)
    if (f.mine) p.set('mine', f.mine)
    if (f.claimed) p.set('claimed', f.claimed)
    p.set('limit', String(f.limit ?? 60))
    p.set('offset', String(f.offset ?? 0))
    return p.toString()
  })

  async function load() {
    loading.value = true
    try {
      const res = await api.get<{ items: Item[]; total: number }>(`/items?${query.value}`)
      items.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function loadMeta() {
    const [cats, st] = await Promise.all([
      api.get<{ categories: Category[] }>('/items/categories'),
      api.get<{ stats: Stats }>('/items/stats'),
    ])
    categories.value = cats.categories
    stats.value = st.stats
  }

  function setFilter<K extends keyof ListItemsParams>(key: K, value: ListItemsParams[K]) {
    filters.value = { ...filters.value, [key]: value, offset: 0 }
    return load()
  }

  function resetFilters() {
    filters.value = { kind: 'all', category: 'all', status: 'all', sort: 'new' }
    return load()
  }

  return { items, categories, stats, total, loading, filters, load, loadMeta, setFilter, resetFilters }
})
