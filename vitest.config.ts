import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'tests/**/*.test.ts'],
  hookTimeout: 60000,
  testTimeout: 45000,
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
