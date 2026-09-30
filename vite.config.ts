import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// ให้ย้ายปลายทาง proxy ได้ (E2E ใช้ API คนละพอร์ต เพื่อไม่ชนกับ dev server ของผู้ใช้)
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:8787'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: false,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    port: Number(process.env.VITE_PORT ?? 4173),
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
})
