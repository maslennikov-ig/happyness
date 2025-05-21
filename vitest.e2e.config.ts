import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/backend/test/setup-e2e.ts'],
    include: ['src/backend/**/*.e2e-spec.ts'],
    exclude: ['node_modules/**', 'src/frontend/test/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/backend/test/'],
    },
  },
});
