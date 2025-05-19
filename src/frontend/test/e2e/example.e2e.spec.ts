import { test, expect } from '@playwright/test';

test.describe('Главная страница (E2E)', () => {
  test('отображает заголовок', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
