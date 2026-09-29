<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="mx-auto grid max-w-2xl place-items-center px-4 py-24 text-center sm:px-6">
    <div class="animate-pop-in">
      <div
        class="mx-auto grid size-28 place-items-center rounded-[2.5rem] bg-gradient-to-br from-night-500 to-bubble-500 text-6xl shadow-glow ring-1 ring-line animate-float"
      >
        🕳️
      </div>
      <h1 class="mt-8 font-display text-5xl font-black sm:text-6xl">
        404<span class="text-gradient-hot">?</span>
      </h1>
      <p class="mt-4 text-base text-muted-1">
        หน้านี้หายไปตามของที่คนอื่นไปลองตามแล้ว 😅
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <RouterLink
          to="/"
          class="rounded-2xl bg-title px-5 py-3 text-sm font-extrabold text-paper transition hover:-translate-y-0.5"
        >
          กลับหน้าแรก
        </RouterLink>
        <RouterLink
          to="/browse"
          class="rounded-2xl glass px-5 py-3 text-sm font-bold text-title transition hover:bg-fill-2"
        >
          ค้นหาของ →
        </RouterLink>
      </div>
    </div>
  </div>
</template>
