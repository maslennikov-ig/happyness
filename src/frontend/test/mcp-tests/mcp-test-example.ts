import { test, expect } from '@playwright/test';

/**
 * Базовый тестовый сценарий с использованием MCP Playwright Server
 *
 * Этот тест демонстрирует интеграцию MCP Playwright Server с существующей конфигурацией Playwright
 */
test('basic test using MCP server', async ({ page }) => {
  // Переходим на домашнюю страницу приложения
  await page.goto('http://localhost:3000');

  // Проверяем, что страница загрузилась и содержит ожидаемый заголовок
  await expect(page).toHaveTitle(/Happyness/);

  // Делаем скриншот для документации
  await page.screenshot({ path: 'test-results/homepage.png' });

  // Можно добавить дополнительные проверки для элементов UI
  // Например, проверка наличия логотипа или навигационного меню
  await expect(page.locator('header')).toBeVisible();
});
