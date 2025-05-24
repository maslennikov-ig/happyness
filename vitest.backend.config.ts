import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/backend/test/setup.ts'],
    include: ['src/backend/**/*.{test,spec}.{js,ts}', 'src/backend/test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/backend/test/setup.ts', 'src/backend/test/mocks/**'],
    },
  },
});
