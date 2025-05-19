# E2E тесты (Playwright)

## Структура

- Все E2E тесты располагаются в этой папке.
- Используется Playwright.

## Пример запуска

```bash
npx playwright test src/frontend/test/e2e
```

## Пример теста

```typescript
import { test, expect } from '@playwright/test';

test('отображает заголовок', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.locator('h1')).toBeVisible();
});
```

## Рекомендации

- Используйте AAA (Arrange-Act-Assert) подход.
- Для сложных сценариев используйте beforeEach для подготовки.
- Для моков используйте возможности Playwright.
- Все комментарии — на русском языке.
