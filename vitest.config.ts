import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['api/_lib/**/*.ts', 'src/lib/**/*.ts', 'src/stores/**/*.ts'],
      exclude: ['**/*.test.ts', 'api/_lib/data/demo.ts'],
    },
    projects: [
      {
        test: {
          name: 'api',
          environment: 'node',
          include: ['api/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.test.ts'],
        },
      },
    ],
  },
})
