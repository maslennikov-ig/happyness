# Руководство по тестированию Happyness

> **Навигация по документации**:
> [Главная документация](../README.md) |
> [Обзор документации проекта](./README.md) |
> [CI/CD интеграция](./ci-cd.md)

## Содержание

1. [Введение](#введение)
2. [Типы тестов](#типы-тестов)
3. [Настройка тестового окружения](#настройка-тестового-окружения)
4. [Модульные тесты](#модульные-тесты)
5. [Интеграционные тесты](#интеграционные-тесты)
6. [E2E-тесты](#e2e-тесты)
7. [MCP Playwright Server](#mcp-playwright-server)
8. [Тестовая база данных](#тестовая-база-данных)
9. [CI/CD интеграция](#cicd-интеграция)
10. [Лучшие практики](#лучшие-практики)
11. [Решение проблем](#решение-проблем)

## Введение

Данное руководство описывает подходы и инструменты для тестирования приложения Happyness.

### Используемые технологии

- **Тестовые фреймворки**: Vitest, Playwright
- **Библиотеки**: React Testing Library, Supertest
- **Автоматизация через AI**: MCP Playwright Server
- **БД для тестов**: PostgreSQL (изолированная)
- **CI/CD**: GitHub Actions

## Типы тестов

### Модульные тесты (Unit)

Проверяют отдельные компоненты/функции изолированно. Используют моки для внешних зависимостей.

### Интеграционные тесты

Проверяют взаимодействие компонентов:

- Backend: контроллеры + сервисы + репозитории
- Frontend: компоненты + состояние

### E2E-тесты

Проверяют приложение целиком, имитируя действия пользователя.

## Настройка тестового окружения

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/your-org/happyness.git
cd happyness

# Установка зависимостей
npm install

# Установка Playwright браузеров
npx playwright install
```

### Структура тестовых директорий

```
src/
├── backend/
│   └── test/
│       ├── api/         # API-интеграционные тесты
│       └── core/        # Модульные тесты
├── frontend/
│   └── test/
│       ├── e2e/         # E2E-тесты
│       └── components/  # Тесты компонентов
```

## Модульные тесты

### Запуск

```bash
# Backend unit-тесты
npm run test:backend

# Frontend unit-тесты
npm run test:frontend
```

### Пример теста сервиса

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../path/to/service';

// Моки зависимостей
vi.mock('@prisma/client');

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(/* моки */);
  });

  it('должен найти пользователя по ID', async () => {
    // Здесь код теста...
  });
});
```

### Пример теста React-компонента

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button';

describe('Button', () => {
  it('рендерит текст кнопки', () => {
    render(<Button>Текст</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Текст');
  });
});
```

## Интеграционные тесты

### Запуск API-тестов

```bash
# Запуск PostgreSQL для тестов
docker-compose up -d postgres-test

# Применение миграций к тестовой БД
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5434/happyness_test npx prisma migrate deploy

# Запуск тестов
npm run test:backend
```

### Пример API-теста

```typescript
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';

describe('AuthController (интеграционный)', () => {
  let app;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('POST /auth/login должен вернуть JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    expect(response.body.access_token).toBeDefined();
  });
});
```

## E2E-тесты

### Запуск

```bash
# Запуск E2E тестов (автоматический запуск приложения)
npm run test:e2e

# С UI для отладки
npx playwright test --ui
```

### Пример E2E-теста

```typescript
import { test, expect } from '@playwright/test';

test('пользователь может войти в систему', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Проверка, что пользователь попал на страницу дашборда
  await expect(page).toHaveURL(/dashboard/);
});
```

## MCP Playwright Server

### Описание

MCP (Model Context Protocol) Playwright Server - это инструмент, который позволяет использовать возможности Playwright через AI-ассистентов в IDE (например, через Claude в Cursor). Это позволяет автоматизировать взаимодействие с браузером, создавать тесты и выполнять скрапинг веб-страниц с помощью естественных языковых команд.

### Настройка

В проекте Happyness уже настроена интеграция MCP Playwright Server с Cursor IDE:

1. Установлен пакет `@executeautomation/playwright-mcp-server`:

   ```bash
   npm install --save-dev @executeautomation/playwright-mcp-server
   ```

2. Настроена конфигурация в `.cursor/mcp.json`:

   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "@executeautomation/playwright-mcp-server"]
       }
     },
     "env": {
       "NODE_ENV": "development"
     }
   }
   ```

3. Добавлены скрипты в `package.json`:
   ```json
   "scripts": {
     "test:mcp": "npx playwright test src/frontend/test/mcp-tests",
     "mcp:playwright": "npx @executeautomation/playwright-mcp-server"
   }
   ```

### Использование

#### Запуск MCP Playwright Server:

```bash
npm run mcp:playwright
```

#### Запуск тестов, созданных с помощью MCP:

```bash
npm run test:mcp
```

#### Примеры использования в Cursor IDE:

1. **Создание теста с помощью AI-ассистента:**

   - Опишите в диалоге с AI-ассистентом, что вы хотите проверить
   - Попросите сгенерировать тестовый код на основе вашего описания
   - AI создаст код на базе Playwright и сохранит его в директории `src/frontend/test/mcp-tests`

2. **Автоматизация скриншотов для документации:**

   - Попросите AI сделать скриншоты различных частей приложения
   - Используйте эти скриншоты для документации или дебага

3. **Скрапинг данных:**
   - Попросите AI собрать данные с определенных страниц
   - Анализируйте полученные данные для тестирования или разработки

### Пример MCP теста

```typescript
// src/frontend/test/mcp-tests/mcp-test-example.ts
import { test, expect } from '@playwright/test';

test('basic test using MCP server', async ({ page }) => {
  // Переходим на домашнюю страницу приложения
  await page.goto('http://localhost:3000');

  // Проверяем, что страница загрузилась и содержит ожидаемый заголовок
  await expect(page).toHaveTitle(/Happyness/);

  // Делаем скриншот для документации
  await page.screenshot({ path: 'test-results/homepage.png' });

  // Проверка элементов UI
  await expect(page.locator('header')).toBeVisible();
});
```

### Преимущества использования MCP Playwright Server

- **Быстрое создание тестов:** AI помогает генерировать код тестов на основе описания требуемого поведения
- **Автоматизация взаимодействия с браузером:** Возможность управлять браузером прямо из IDE через языковые команды
- **Упрощение отладки:** Легкое получение скриншотов и извлечение данных для анализа
- **Улучшение документации:** Автоматическое создание скриншотов для визуальной документации
- **Ускорение обучения:** Новым участникам проекта легче начать писать тесты с помощью AI-ассистента

## Тестовая база данных

### Настройка

Тестовая БД сконфигурирована в `docker-compose.yml` как отдельный сервис `postgres-test`,
запускающийся на порту 5434.

```bash
# Запуск только тестовой БД
docker-compose up -d postgres-test

# Применение миграций к тестовой БД
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5434/happyness_test npx prisma migrate deploy
```

### Подключение в тестах

```typescript
// Для интеграционных тестов
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST,
    },
  },
});
```

### Очистка данных

Примеры автоматической очистки перед каждым тестом:

**Метод 1: Сброс всех таблиц через SQL**

```typescript
beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);
});
```

**Метод 2: Очистка конкретных таблиц**

```typescript
beforeEach(async () => {
  await prisma.user.deleteMany({});
  await prisma.project.deleteMany({});
  // Другие таблицы...
});
```

### Наполнение тестовыми данными

Создайте утилиту для заполнения тестовой БД:

```typescript
// src/backend/test/utils/seed.ts
export async function seedTestDatabase(prisma: PrismaClient) {
  // Создание тестовых пользователей
  const user1 = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Тестовый Пользователь',
      passwordHash: 'хешированный_пароль',
      role: 'USER',
    },
  });

  // Создание тестовых проектов
  await prisma.project.create({
    data: {
      title: 'Тестовый проект',
      description: 'Описание тестового проекта',
      status: 'DRAFT',
      ownerId: user1.id,
    },
  });

  // Дополнительные тестовые данные
  // ...

  return { user1 };
}

// Использование в тестах
beforeEach(async () => {
  // Очистка БД
  // ...

  // Заполнение тестовыми данными
  const { user1 } = await seedTestDatabase(prisma);

  // Теперь user1 доступен для тестов
});
```

## CI/CD интеграция

Тесты автоматически запускаются в GitHub Actions workflow `.github/workflows/ci.yml` при каждом push/PR.

### Конфигурация CI для тестов

```yaml
# Часть .github/workflows/ci.yml
test:
  runs-on: ubuntu-latest
  services:
    postgres-test:
      image: postgres:16
      env:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: happyness_test
      ports:
        - 5434:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  steps:
    # Установка зависимостей
    # ...

    - name: Run tests with coverage
      run: npm run test -- --coverage

    - name: Upload coverage
      uses: actions/upload-artifact@v4
      with:
        name: coverage-reports
        path: coverage/
```

## Лучшие практики

### Общие принципы

1. **Используйте подход AAA** (Arrange-Act-Assert):

   - **Arrange**: подготовка данных/моков
   - **Act**: вызов тестируемой функциональности
   - **Assert**: проверка результатов

2. **Изолируйте тесты**:

   - Каждый тест должен быть независимым
   - Не должно быть зависимостей между тестами
   - Используйте beforeEach для настройки и afterEach для очистки

3. **Тестируйте поведение, а не реализацию**:

   - Сосредоточьтесь на том, что делает код, а не на том, как он это делает
   - Избегайте чрезмерного использования моков

4. **Разумное покрытие кода**:
   - Стремитесь к покрытию 80%+ для критичного кода
   - 100% покрытие не всегда оправдано

### Backend

1. **Моделируйте ошибки**:

   - Тестируйте как успешные, так и ошибочные сценарии
   - Проверяйте обработку исключений

2. **Используйте фабрики данных**:
   - Создавайте утилиты для генерации тестовых данных
   - Это делает тесты более читаемыми и поддерживаемыми

### Frontend

1. **Тестируйте пользовательские взаимодействия**:

   - Используйте fireEvent или userEvent для имитации действий пользователя
   - Проверяйте изменения UI в ответ на взаимодействия

2. **Избегайте тестирования деталей реализации**:
   - Тестируйте то, что пользователь видит и с чем взаимодействует
   - Используйте data-testid для элементов, которые трудно выбрать иначе

## Решение проблем

### Тесты не видят переменные окружения

**Решение**: Создайте `.env.test` или передайте переменные через командную строку:

```bash
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5434/happyness_test npm run test:backend
```

### Тесты с Prisma падают

**Проблема**: Ошибки подключения к БД или проблемы с миграциями.

**Решение**:

1. Убедитесь, что тестовая БД запущена
2. Проверьте URL подключения
3. Примените миграции к тестовой БД

```bash
docker-compose up -d postgres-test
npx prisma migrate deploy --preview-feature --schema=prisma/schema.prisma --url=$DATABASE_URL_TEST
```

### Flaky tests (нестабильные тесты)

**Решение**:

1. Исключите зависимости между тестами
2. Добавьте ожидания для асинхронных операций
3. Мокайте все внешние службы
4. Изолируйте состояние между тестами

### Таймауты в E2E тестах

**Проблема**: E2E тесты иногда падают по таймауту.

**Решение**:

1. Увеличьте таймауты для тестов в конфигурации Playwright:

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000, // 30 секунд для всех тестов
  expect: {
    timeout: 10000, // 10 секунд для ожиданий
  },
});
```

2. Используйте явные ожидания вместо фиксированных задержек:

```typescript
// ❌ Избегайте
await page.waitForTimeout(5000);

// ✅ Рекомендуется
await page.waitForSelector('.data-loaded', { state: 'visible', timeout: 10000 });
```

3. Проверяйте сетевые запросы:

```typescript
// Ожидание завершения сетевого запроса
const [response] = await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/users') && resp.status() === 200),
  page.click('#load-users-button'),
]);
```

## Расширенное использование MCP Playwright Server

### Создание шаблонов для тестов

MCP Playwright Server можно использовать для быстрого создания шаблонов типовых тестов. Пример интеграции с AI-ассистентом:

```typescript
// src/frontend/test/mcp-tests/templates/auth-test-template.ts
import { test, expect } from '@playwright/test';

/**
 * Шаблон для тестирования аутентификации
 *
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль пользователя
 * @param {boolean} shouldSucceed - Ожидаемый результат (успех/неудача)
 */
export async function runAuthTest(
  page,
  { email = 'user@example.com', password = 'password', shouldSucceed = true }
) {
  // Перейти на страницу логина
  await page.goto('/login');

  // Заполнить форму
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Отправить форму
  await page.click('button[type="submit"]');

  if (shouldSucceed) {
    // Проверить успешный вход
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('.user-profile')).toBeVisible();
  } else {
    // Проверить сообщение об ошибке
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('.error-message')).toBeVisible();
  }
}

// Пример использования шаблона
test('успешный вход в систему', async ({ page }) => {
  await runAuthTest(page, { email: 'admin@happyness.com', password: 'admin123' });
});

test('неудачный вход с неверным паролем', async ({ page }) => {
  await runAuthTest(page, {
    email: 'admin@happyness.com',
    password: 'неверный_пароль',
    shouldSucceed: false,
  });
});
```

### Использование MCP для генерации данных

AI-ассистент может генерировать тестовые данные на основе описания бизнес-правил:

```typescript
// src/frontend/test/mcp-tests/data-generators/projects-generator.ts
import { Project } from '@prisma/client';

/**
 * Генератор тестовых данных для проектов
 * Позволяет создавать разнообразные тестовые проекты
 * с различными состояниями и свойствами
 */
export function generateTestProjects(count = 5, options = {}): Partial<Project>[] {
  const statuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const projects = [];

  for (let i = 0; i < count; i++) {
    projects.push({
      title: `Тестовый проект ${i + 1}`,
      description: `Описание тестового проекта ${i + 1}`,
      status: statuses[i % statuses.length],
      budget: Math.floor(Math.random() * 10000) * 100,
      startDate: new Date(Date.now() + i * 86400000),
      endDate: new Date(Date.now() + (i + 30) * 86400000),
      ...options,
    });
  }

  return projects;
}

// Пример использования в тесте
test('отображение списка проектов', async ({ page }) => {
  // Генерация тестовых данных
  const testProjects = generateTestProjects(3, { ownerId: 'test-user-id' });

  // Мокирование API-запроса
  await page.route('**/api/projects', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testProjects),
    });
  });

  // Переход на страницу проектов
  await page.goto('/projects');

  // Проверка отображения проектов
  for (const project of testProjects) {
    await expect(page.locator(`text=${project.title}`)).toBeVisible();
  }
});
```

### Расширенные сценарии взаимодействия с MCP

AI-ассистент может помочь создать сложные тестовые сценарии для проверки потоков пользователей:

```typescript
// src/frontend/test/mcp-tests/user-flows/project-creation-flow.ts
import { test, expect } from '@playwright/test';

/**
 * Комплексный тест, проверяющий поток создания проекта
 * от авторизации до заполнения всех данных проекта
 */
test('полный поток создания проекта', async ({ page }) => {
  // 1. Авторизация
  await page.goto('/login');
  await page.fill('input[name="email"]', 'manager@happyness.com');
  await page.fill('input[name="password"]', 'manager123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);

  // 2. Переход к созданию проекта
  await page.click('a:text("Новый проект")');
  await expect(page).toHaveURL(/projects\/create/);

  // 3. Заполнение формы проекта
  await page.fill('input[name="title"]', 'Тестирование MCP flow');
  await page.fill('textarea[name="description"]', 'Проект для демонстрации MCP Playwright');
  await page.selectOption('select[name="status"]', 'DRAFT');
  await page.fill('input[name="budget"]', '15000');

  // 4. Выбор даты с помощью календаря
  await page.click('input[name="startDate"]');
  await page.click('.calendar >> text=15'); // Выбор 15-го числа текущего месяца

  await page.click('input[name="endDate"]');
  await page.click('.calendar >> text=25'); // Выбор 25-го числа текущего месяца

  // 5. Добавление участников проекта
  await page.click('button:text("Добавить участника")');
  await page.fill('.participant-form input[name="name"]', 'Иван Иванов');
  await page.fill('.participant-form input[name="email"]', 'ivan@example.com');
  await page.click('.participant-form button:text("Добавить")');

  // Проверка, что участник добавлен
  await expect(page.locator('.participants-list >> text=Иван Иванов')).toBeVisible();

  // 6. Отправка формы
  await page.click('button[type="submit"]:text("Создать проект")');

  // 7. Проверка успешного создания
  await expect(page.locator('.toast-success')).toBeVisible();
  await expect(page).toHaveURL(/projects\/\d+/); // Редирект на страницу созданного проекта

  // 8. Проверка данных на странице проекта
  await expect(page.locator('h1')).toHaveText('Тестирование MCP flow');
  await expect(page.locator('.project-details')).toContainText('15000');
  await expect(page.locator('.project-team')).toContainText('Иван Иванов');
});
```

## Протоколирование и отчеты

### Настройка подробного протоколирования

```typescript
// playwright.config.ts
export default defineConfig({
  // ... другие настройки
  reporter: [
    ['html', { open: 'never' }], // HTML-отчет
    ['json', { outputFile: 'test-results/test-results.json' }], // JSON-отчет
    ['list'], // Вывод в консоль
  ],

  // Трассировка для отладки
  trace: {
    mode: 'retain-on-failure', // Сохранять только для упавших тестов
    screenshots: true,
    snapshots: true,
  },
});
```

### Интеграция с системами отчетности

```typescript
// Пример настройки Allure-отчета
// Требуется установка: npm install -D @playwright/test allure-playwright

// playwright.config.ts
export default defineConfig({
  // ... другие настройки
  reporter: [
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: false,
      },
    ],
  ],
});
```

Запуск с генерацией отчета:

```bash
# Запуск тестов с Allure
npx playwright test

# Генерация отчета
npx allure generate ./allure-results --clean

# Открытие отчета
npx allure open ./allure-report
```

## Интеграция с TMS и системами отслеживания ошибок

### Связывание тестов с тест-кейсами

```typescript
// src/frontend/test/mcp-tests/integration/tms-integration.ts
import { test, expect } from '@playwright/test';

/**
 * @testcase TC-123
 * @description Проверка успешной авторизации пользователя
 * @severity critical
 */
test('пользователь может войти в систему', async ({ page }) => {
  // Тест авторизации...
});

/**
 * @testcase TC-124
 * @description Проверка выхода из системы
 * @severity medium
 */
test('пользователь может выйти из системы', async ({ page }) => {
  // Тест выхода...
});
```

### Автоматизация создания тикетов при падении тестов

```typescript
// src/frontend/test/utils/bug-reporter.ts
import { TestInfo } from '@playwright/test';

/**
 * Утилита для автоматизации создания тикетов в системе отслеживания ошибок
 * при падении тестов
 */
export async function reportFailure(testInfo: TestInfo): Promise<void> {
  if (testInfo.status !== 'failed') {
    return;
  }

  // Пример интеграции с API системы отслеживания ошибок
  try {
    const response = await fetch('https://your-issue-tracker.com/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ISSUE_TRACKER_TOKEN}`,
      },
      body: JSON.stringify({
        title: `[Automated Test Failure] ${testInfo.title}`,
        description: `
          Тест: ${testInfo.title}
          Файл: ${testInfo.file}
          Ошибка: ${testInfo.error?.message || 'Неизвестная ошибка'}
          
          Подробности:
          ${testInfo.error?.stack || ''}
        `,
        priority: 'medium',
        labels: ['test-failure', 'automated'],
        assignee: 'qa-team',
      }),
    });

    const data = await response.json();
    console.log(`Создан тикет: ${data.issueKey}`);
  } catch (error) {
    console.error('Ошибка при создании тикета:', error);
  }
}

// Использование в глобальной настройке тестов
// src/frontend/test/global-setup.ts
export const reporter = {
  onTestEnd: async (test, result) => {
    if (result.status === 'failed') {
      await reportFailure(test);
    }
  },
};
```

## Заключение

Тестирование — критически важная часть процесса разработки Happyness. Правильное и регулярное применение описанных инструментов и методик позволит:

1. **Улучшить качество** кода и продукта в целом
2. **Ускорить разработку** за счет раннего обнаружения ошибок
3. **Упростить рефакторинг** благодаря уверенности в корректной работе после изменений
4. **Улучшить документацию** через автоматизацию создания скриншотов и наглядные примеры использования

Для максимальной эффективности рекомендуется:

- Писать тесты одновременно с кодом или даже до кода (TDD)
- Регулярно запускать тесты перед коммитом и во время разработки
- Использовать MCP Playwright Server для быстрого создания и поддержки тестов
- Анализировать отчеты о покрытии кода и уделять внимание критичным участкам
- Поддерживать тестовые данные и моки в актуальном состоянии

### Полезные ресурсы

- [Официальная документация Vitest](https://vitest.dev/guide/)
- [Официальная документация Playwright](https://playwright.dev/docs/intro)
- [Документация MCP Playwright Server](https://github.com/executeautomation/playwright-mcp-server)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Тестирование NestJS](https://docs.nestjs.com/fundamentals/testing)
