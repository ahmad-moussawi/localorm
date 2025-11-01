import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    testTimeout: 300,
    hookTimeout: 300,
    setupFiles: ['./vitest.setup.ts'],
  },
});