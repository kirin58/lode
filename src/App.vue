<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { watch, onMounted } from 'vue'
import { useIntervalFn, useDocumentVisibility } from '@vueuse/core'
import { useSocialStore } from '@/stores/social'
import { useAuthStore } from '@/stores/auth'
import { useItemsStore } from '@/stores/items'
import Blobs from '@/components/Blobs.vue'
import AppHeader from '@/components/AppHeader.vue'
import ApiOfflineBanner from '@/components/ApiOfflineBanner.vue'
import MobileTabBar from '@/components/MobileTabBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import Toaster from '@/components/Toaster.vue'

const route = useRoute()
const social = useSocialStore()
const auth = useAuthStore()
const items = useItemsStore()
const visibility = useDocumentVisibility()

async function poll() {
  if (visibility.value === 'visible') {
    items.load().catch(() => {})
    if (auth.isAuthed) {
      await social.loadAll().catch(() => {})
    }
  }
}

useIntervalFn(poll, 4000)
watch(visibility, (v) => { if (v === 'visible') poll() })
onMounted(() => { if (auth.isAuthed) poll() })
</script>

<template>
  <Blobs />
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <ApiOfflineBanner />

    <main class="flex-1 pb-28 sm:pb-16">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />
    <MobileTabBar />
  </div>
  <Toaster />
</template>
