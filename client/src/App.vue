<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Blobs from '@/components/Blobs.vue'
import AppHeader from '@/components/AppHeader.vue'
import MobileTabBar from '@/components/MobileTabBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import Toaster from '@/components/Toaster.vue'

const route = useRoute()
</script>

<template>
  <Blobs />
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

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
