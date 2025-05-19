import { test, expect, Page } from '@playwright/test';

/**
 * Расширенный пример использования MCP Playwright Server
 *
 * Демонстрирует более сложные сценарии взаимодействия, генерацию данных и работу
 * с компонентами UI.
 */

// Вспомогательная функция для генерации тестовых данных проекта
function generateProject(customProps = {}) {
  return {
    title: `Тестовый проект ${Date.now()}`,
    description: 'Проект для демонстрации возможностей MCP Playwright',
    status: 'DRAFT',
    budget: Math.floor(Math.random() * 100000),
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...customProps,
  };
}

// Вспомогательная функция для авторизации
async function login(page: Page, { email = 'admin@happyness.com', password = 'admin123' } = {}) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Ожидаем успешной авторизации и перехода на дашборд
  await expect(page).toHaveURL(/dashboard/);
}

test.describe('Расширенные тесты MCP для модуля проектов', () => {
  test('создание проекта и проверка всех полей', async ({ page }) => {
    // Генерируем тестовые данные
    const projectData = generateProject();

    // Авторизуемся в системе
    await login(page);

    // Переходим на страницу создания проекта
    await page.click('text=Проекты');
    await page.click('text=Новый проект');

    // Заполняем форму проекта
    await page.fill('input[name="title"]', projectData.title);
    await page.fill('textarea[name="description"]', projectData.description);
    await page.selectOption('select[name="status"]', projectData.status);
    await page.fill('input[name="budget"]', projectData.budget.toString());

    // Форматируем даты для ввода
    const formatDate = (date: Date): string => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    await page.fill('input[name="startDate"]', formatDate(projectData.startDate));
    await page.fill('input[name="endDate"]', formatDate(projectData.endDate));

    // Отправляем форму
    await page.click('button[type="submit"]');

    // Проверяем, что появилось уведомление об успешном создании
    await expect(page.locator('.toast-success')).toBeVisible();

    // Проверяем, что мы перешли на страницу проекта
    await expect(page).toHaveURL(/projects\/\d+/);

    // Проверяем данные проекта на странице
    await expect(page.locator('h1')).toHaveText(projectData.title);
    await expect(page.locator('.project-description')).toContainText(projectData.description);
    await expect(page.locator('.project-status')).toContainText(projectData.status);
    await expect(page.locator('.project-budget')).toContainText(projectData.budget.toString());

    // Делаем скриншот для документации
    await page.screenshot({ path: 'test-results/project-created.png' });
  });

  test('поиск и фильтрация проектов', async ({ page }) => {
    // Авторизуемся в системе
    await login(page);

    // Переходим на страницу проектов
    await page.goto('/projects');

    // Проверяем, что элементы фильтрации доступны
    await expect(page.locator('input[placeholder="Поиск по названию"]')).toBeVisible();
    await expect(page.locator('select[aria-label="Статус проекта"]')).toBeVisible();

    // Создаем два проекта с разными статусами через API-моки
    await page.route('**/api/projects', route => {
      // Мокируем ответ API со списком проектов
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          generateProject({ title: 'Проект в разработке', status: 'IN_PROGRESS' }),
          generateProject({ title: 'Завершенный проект', status: 'COMPLETED' }),
        ]),
      });
    });

    // Перезагружаем страницу для применения моков
    await page.reload();

    // Проверяем отображение обоих проектов
    await expect(page.locator('text=Проект в разработке')).toBeVisible();
    await expect(page.locator('text=Завершенный проект')).toBeVisible();

    // Фильтруем по статусу "В разработке"
    await page.selectOption('select[aria-label="Статус проекта"]', 'IN_PROGRESS');

    // Перенастраиваем мок для отфильтрованных данных
    await page.route('**/api/projects**', route => {
      if (route.request().url().includes('status=IN_PROGRESS')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            generateProject({ title: 'Проект в разработке', status: 'IN_PROGRESS' }),
          ]),
        });
      }
    });

    // Проверяем, что отображается только проект со статусом "В разработке"
    await expect(page.locator('text=Проект в разработке')).toBeVisible();
    await expect(page.locator('text=Завершенный проект')).not.toBeVisible();

    // Поиск по названию
    await page.fill('input[placeholder="Поиск по названию"]', 'разработке');

    // Перенастраиваем мок для поисковых данных
    await page.route('**/api/projects**', route => {
      if (route.request().url().includes('search=разработке')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            generateProject({ title: 'Проект в разработке', status: 'IN_PROGRESS' }),
          ]),
        });
      }
    });

    // Проверяем результаты поиска
    await expect(page.locator('text=Проект в разработке')).toBeVisible();

    // Делаем скриншот результатов фильтрации
    await page.screenshot({ path: 'test-results/projects-filtered.png' });
  });

  test('обработка пустых результатов поиска', async ({ page }) => {
    // Авторизуемся в системе
    await login(page);

    // Переходим на страницу проектов
    await page.goto('/projects');

    // Мокируем пустой ответ при поиске
    await page.route('**/api/projects**', route => {
      if (route.request().url().includes('search=несуществующий')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // Вводим поисковой запрос, который не даст результатов
    await page.fill('input[placeholder="Поиск по названию"]', 'несуществующий');
    await page.press('input[placeholder="Поиск по названию"]', 'Enter');

    // Проверяем отображение сообщения об отсутствии результатов
    await expect(page.locator('text=Проекты не найдены')).toBeVisible();

    // Делаем скриншот для документации
    await page.screenshot({ path: 'test-results/no-search-results.png' });
  });

  test('интерактивное редактирование проекта', async ({ page }) => {
    // Авторизуемся в системе
    await login(page);

    const projectId = 123; // Предполагаемый ID проекта
    const projectData = generateProject({ title: 'Проект для редактирования' });

    // Мокируем получение данных проекта
    await page.route(`**/api/projects/${projectId}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(projectData),
      });
    });

    // Переходим на страницу проекта
    await page.goto(`/projects/${projectId}`);

    // Проверяем загрузку данных проекта
    await expect(page.locator('h1')).toHaveText(projectData.title);

    // Нажимаем кнопку редактирования
    await page.click('text=Редактировать');

    // Изменяем название проекта
    const newTitle = 'Обновленный проект ' + Date.now();
    await page.fill('input[name="title"]', newTitle);

    // Мокируем API-запрос на обновление проекта
    await page.route(`**/api/projects/${projectId}`, route => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...projectData,
            title: newTitle,
          }),
        });
      }
    });

    // Отправляем форму
    await page.click('button[type="submit"]');

    // Проверяем успешное обновление
    await expect(page.locator('.toast-success')).toBeVisible();

    // Перезагружаем страницу, чтобы проверить сохранение изменений
    await page.reload();

    // Проверяем обновленное название
    await expect(page.locator('h1')).toHaveText(newTitle);

    // Делаем скриншот для документации
    await page.screenshot({ path: 'test-results/project-updated.png' });
  });

  test('проверка адаптивного дизайна на разных устройствах', async ({ page }) => {
    // Авторизуемся в системе
    await login(page);

    // Список устройств для проверки
    const devices = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 },
    ];

    // Переходим на страницу проектов
    await page.goto('/projects');

    // Проверяем отображение на разных размерах экрана
    for (const device of devices) {
      // Устанавливаем размер вьюпорта
      await page.setViewportSize({ width: device.width, height: device.height });

      // Делаем скриншот для документации
      await page.screenshot({
        path: `test-results/projects-${device.name}.png`,
        fullPage: true,
      });

      // Проверяем специфичные для устройства элементы
      if (device.name === 'mobile') {
        // На мобильных устройствах должна быть кнопка мобильного меню
        await expect(page.locator('.mobile-menu-button')).toBeVisible();
      } else if (device.name === 'desktop') {
        // На десктопе должно быть полное меню
        await expect(page.locator('nav.desktop-menu')).toBeVisible();
      }
    }
  });
});

// Пример теста для проверки доступности
test('проверка доступности (a11y) на странице проектов', async ({ page }) => {
  // Авторизуемся в системе
  await login(page);

  // Переходим на страницу проектов
  await page.goto('/projects');

  // Проверяем, что все интерактивные элементы имеют достаточный контраст
  const buttons = await page.locator('button, a[role="button"]').all();
  for (const button of buttons) {
    // Проверяем, что у кнопки есть текст или aria-label
    const hasText = (await button.textContent()) !== '';
    const hasAriaLabel = (await button.getAttribute('aria-label')) !== null;

    expect(hasText || hasAriaLabel).toBeTruthy();
  }

  // Проверяем, что все изображения имеют alt-атрибуты
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    expect(alt).not.toBeNull();
  }

  // Проверяем структуру заголовков
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  // Проверяем порядок заголовков
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  let prevLevel = 0;

  for (const heading of headings) {
    const tagName = await heading.evaluate(node => node.tagName.toLowerCase());
    const level = parseInt(tagName.substring(1));

    // Проверяем, что уровень заголовка не более чем на 1 больше предыдущего
    if (prevLevel > 0) {
      expect(level - prevLevel).toBeLessThanOrEqual(1);
    }

    prevLevel = level;
  }
});
