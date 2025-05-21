import { test, expect } from '@playwright/test';

test('загружает главную страницу и проверяет заголовок', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Happyness/);
});

test('отображает главную навигацию', async ({ page }) => {
  await page.goto('/');

  // Проверяем наличие основных элементов навигации
  await expect(page.getByRole('navigation')).toBeVisible();

  // Проверяем наличие ссылок в меню
  const navLinks = page.getByRole('navigation').getByRole('link');
  await expect(navLinks).toHaveCount(3); // Примерное количество ссылок
});

test('переход по ссылке в навигации', async ({ page }) => {
  await page.goto('/');

  // Кликаем по ссылке в навигации (например, "О нас")
  await page.getByRole('link', { name: /о нас/i }).click();

  // Проверяем URL после перехода
  await expect(page).toHaveURL(/about/);

  // Проверяем, что страница загрузилась
  await expect(page.getByRole('heading')).toBeVisible();
});
