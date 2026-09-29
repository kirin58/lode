import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, ApiError } from '@/lib/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('lf_token'))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const ready = ref(false)

  const isAuthed = computed(() => Boolean(token.value && user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setSession(t: string, u: User) {
    token.value = t
    user.value = u
    localStorage.setItem('lf_token', t)
  }

  function clear() {
    token.value = null
    user.value = null
    localStorage.removeItem('lf_token')
  }

  async function fetchMe() {
    if (!token.value) {
      ready.value = true
      return
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me')
      user.value = res.user
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) clear()
    } finally {
      ready.value = true
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      setSession(res.token, res.user)
      return res.user
    } finally {
      loading.value = false
    }
  }

  async function register(payload: {
    email: string
    password: string
    display_name: string
    avatar_emoji?: string
    campus?: string | null
  }) {
    loading.value = true
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/register', payload)
      setSession(res.token, res.user)
      return res.user
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(patch: Partial<Pick<User, 'display_name' | 'avatar_emoji' | 'campus' | 'bio'>>) {
    const res = await api.patch<{ user: User }>('/auth/me', patch)
    user.value = res.user
    return res.user
  }

  async function init() {
    if (ready.value) return
    await fetchMe()
  }

  return { token, user, loading, ready, isAuthed, isAdmin, login, register, logout: clear, fetchMe, updateProfile, init }
})
