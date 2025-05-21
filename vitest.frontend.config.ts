import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'frontend',
    root: './',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/frontend/test/setup.ts'],
    include: ['./src/frontend/test/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      './src/frontend/test/e2e/**/*',
      './src/frontend/test/mcp-tests/**/*',
      '**/*.e2e.spec.ts',
      '**/*.e2e.test.ts',
    ],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    deps: {
      optimizer: {
        web: {
          include: ['react', 'react-dom', 'react-hook-form'],
        },
      },
    },
    mockReset: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend'),
      '@/app/(auth)': path.resolve(__dirname, './src/frontend/app/(auth)'),
      '@/lib/validations': path.resolve(__dirname, './src/frontend/lib/validations'),
      '@/lib/api': path.resolve(__dirname, './src/frontend/lib/api'),
      '@/components': path.resolve(__dirname, './src/frontend/components'),
    },
  },
});
