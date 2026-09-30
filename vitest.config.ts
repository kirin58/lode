import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/**/*.test.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['api/_lib/**/*.ts'],
      exclude: ['api/**/*.test.ts', 'api/_lib/data/demo.ts'],
    },
  },
})
