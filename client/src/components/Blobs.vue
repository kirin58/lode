<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
    <!-- gradient blobs -->
    <div
      class="absolute -left-32 -top-40 size-[34rem] rounded-full bg-night-500/25 blur-[110px] animate-float-slow"
    />
    <div
      class="absolute -right-24 top-10 size-[26rem] rounded-full bg-bubble-500/20 blur-[100px] animate-float"
    />
    <div
      class="absolute bottom-0 left-1/3 size-[30rem] rounded-full bg-mint-pop/10 blur-[120px] animate-float-slow"
    />
    <!-- dot grid -->
    <div class="absolute inset-0 dotgrid opacity-40" />
    <!-- grain -->
    <div
      class="absolute inset-0 opacity-[0.035] mix-blend-overlay"
      style="
        background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E&quot;);
      "
    />
  </div>
</template>
