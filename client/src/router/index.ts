import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 90 }
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { title: 'Lost & Found · คืนของดี ๆ กันนะ' },
    },
    {
      path: '/browse',
      name: 'browse',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'ค้นหาของ · Lost & Found' },
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('@/views/ItemDetailView.vue'),
      meta: { title: 'รายละเอียด · Lost & Found' },
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('@/views/ReportView.vue'),
      meta: { title: 'ลงประกาศ · Lost & Found', requiresAuth: true },
    },
    {
      path: '/mine',
      name: 'mine',
      component: () => import('@/views/MySpaceView.vue'),
      meta: { title: 'พื้นที่ของฉัน · Lost & Found', requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { title: 'โปรไฟล์ · Lost & Found', requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'เข้าสู่ระบบ · Lost & Found', guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { title: 'สมัครสมาชิก · Lost & Found', guestOnly: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notfound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'หาไม่เจอ · Lost & Found' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  document.title = (to.meta.title as string) ?? 'Lost & Found'
  if (to.meta.requiresAuth && !auth.isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthed) {
    return { name: 'browse' }
  }
  return true
})

export default router
