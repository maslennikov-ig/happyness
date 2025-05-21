import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация для Playwright E2E тестов
 * Документация: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Директория с тестами
  testDir: './src/frontend/test/e2e',

  // Максимальное время выполнения одного теста
  timeout: 30 * 1000,

  // Ожидание запуска всех тестов в выделенном процессе
  fullyParallel: true,

  // Не запускать тесты заново автоматически
  retries: process.env.CI ? 2 : 0,

  // Количество worker процессов для параллельного запуска тестов
  workers: process.env.CI ? 1 : undefined,

  // Имя теста-репортера для вывода информации о тестах
  reporter: 'html',

  // Использовать собственный тестовый воркер Playwright
  use: {
    // Трассировка для дебага
    trace: 'on-first-retry',

    // Базовый URL для всех относительных URL в тестах
    baseURL: 'http://localhost:3000',
  },

  // Конфигурация для разных браузеров
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Настройка веб-сервера, который будет запускаться перед тестами
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
