# Руководство по тестированию в проекте Happyness

> **Навигация по документации**:
> [Главная документация](../README.md) |
> [Обзор документации проекта](./README.md) |
> [CI/CD интеграция](./ci-cd.md)

## Содержание

1. [Введение](#введение)
2. [Типы тестов](#типы-тестов)
3. [Технологии и инструменты](#технологии-и-инструменты)
4. [Настройка тестового окружения](#настройка-тестового-окружения)
5. [Запуск тестов](#запуск-тестов)
6. [Модульные тесты](#модульные-тесты)
7. [Интеграционные тесты](#интеграционные-тесты)
8. [E2E-тесты](#e2e-тесты)
9. [MCP Playwright Server](#mcp-playwright-server)
10. [Тестовая база данных](#тестовая-база-данных)
11. [CI/CD интеграция](#cicd-интеграция)
12. [Лучшие практики](#лучшие-практики)
13. [Утилиты для тестирования](#утилиты-для-тестирования)
14. [Решение проблем](#решение-проблем)

## Введение

Данное руководство описывает подходы и инструменты для тестирования приложения Happyness. Тесты в проекте разделены на две основные части:

1. **Backend тесты** (`src/backend/test/`) - тесты для серверной части приложения
2. **Frontend тесты** (`src/frontend/test/`) - тесты для клиентской части приложения

### Используемые технологии

- **Тестовые фреймворки**: Vitest, Playwright
- **Библиотеки**: React Testing Library, Supertest
- **Автоматизация через AI**: MCP Playwright Server
- **БД для тестов**: PostgreSQL (изолированная)
- **CI/CD**: GitHub Actions

## Типы тестов

### Модульные тесты (Unit)

Проверяют отдельные компоненты/функции изолированно:

- Изолируют тестируемый код от зависимостей через моки
- Проверяют узкую функциональность
- Быстро выполняются

### Интеграционные тесты

Проверяют взаимодействие компонентов:

- **Backend**: контроллеры + сервисы + репозитории
- **Frontend**: компоненты + состояние
- Используются для проверки корректности взаимодействия между компонентами системы, включая HTTP-запросы

### E2E-тесты

Проверяют приложение целиком, имитируя действия пользователя с использованием Playwright.

## Технологии и инструменты

- **Vitest** - основной фреймворк для запуска тестов
- **Testing Library** - библиотека для тестирования React компонентов
- **JSDOM** - эмуляция браузерного окружения для тестов фронтенда
- **Supertest** - библиотека для тестирования HTTP-запросов в интеграционных тестах бекенда
- **Playwright** - инструмент для E2E-тестирования
- **MSW (Mock Service Worker)** - инструмент для мокирования API-запросов

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
│       ├── components/  # Тесты компонентов
│       └── mcp-tests/   # Тесты, созданные с помощью MCP
```

## Запуск тестов

### Все тесты

```bash
npm test
```

### Тесты бекенда

```bash
npx vitest run
```

### Тесты фронтенда

```bash
npx vitest run frontend
```

### Отдельный тестовый файл

```bash
npx vitest run src/path/to/test/file.spec.tsx
```

### E2E тесты

```bash
# Запуск E2E тестов (автоматический запуск приложения)
npm run test:e2e

# С UI для отладки
npx playwright test --ui
```

## Модульные тесты

### Frontend

Используются для тестирования отдельных компонентов React.

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button компонент', () => {
  it('должен правильно рендериться и обрабатывать клики', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Нажать</Button>);

    fireEvent.click(screen.getByText('Нажать'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Backend

Используются для тестирования логики сервисов, репозиториев и других модулей.

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

## Интеграционные тесты

### Backend API-тесты

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

### Frontend интеграционные тесты

Пример теста формы логина с мокированием API:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/app/(auth)/login/login-form';
import { authApi } from '@/lib/api/auth';

// Мокируем API
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

describe('LoginForm', () => {
  it('вызывает API при корректном заполнении формы', async () => {
    // Мокируем успешный ответ API
    vi.mocked(authApi.login).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'token',
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    // Заполняем форму
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');

    // Отправляем форму
    await user.click(screen.getByRole('button', { name: /Войти/i }));

    // Проверяем вызов API
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

## E2E-тесты

Пример E2E-теста с Playwright:

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

### Пример MCP теста

```typescript
// src/frontend/test/mcp-tests/mcp-test-example.ts
import { test, expect } from '@playwright/test';

test('basic test using MCP server', async ({ page }) => {
  // Переходим на домашнюю страницу приложения
  await page.goto('http://localhost:3100');

  // Проверяем, что страница загрузилась и содержит ожидаемый заголовок
  await expect(page).toHaveTitle(/Happyness/);

  // Делаем скриншот для документации
  await page.screenshot({ path: 'test-results/homepage.png' });

  // Проверка элементов UI
  await expect(page.locator('header')).toBeVisible();
});
```

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

  return { user1 };
}
```

## CI/CD интеграция

Интеграция тестов с CI/CD позволяет автоматически запускать тесты при каждом коммите или пул-реквесте.

### GitHub Actions

```yaml
name: Tests

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: happyness_test
        ports:
          - 5434:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Database
        run: |
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5434/happyness_test

      - name: Run backend tests
        run: npm run test:backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5434/happyness_test

      - name: Run frontend tests
        run: npm run test:frontend
```

## Утилиты для тестирования

### Моки

В проекте есть несколько утилит для создания моков:

```typescript
// Создание мока PrismaClient для тестов
import { createMockPrismaClient } from '../utils/mocks';
const mockPrisma = createMockPrismaClient();
```

### Очистка базы данных

Для интеграционных тестов с реальной БД:

```typescript
import { clearTestDatabase } from '../utils/cleanup';
await clearTestDatabase(prisma);
```

## Лучшие практики

1. **Структура теста (AAA):**

   - **Arrange**: подготовка данных и окружения
   - **Act**: выполнение тестируемого действия
   - **Assert**: проверка результата

2. **Изоляция тестов:**

   - Каждый тест должен быть независимым
   - Используйте `beforeEach` для сброса состояния
   - Не полагайтесь на порядок выполнения тестов

3. **Именование тестов:**

   - Используйте описательные имена тестов
   - Предпочтительный формат: "должен делать что-то при каких-то условиях"

4. **Моки и стабы:**

   - Используйте моки для внешних зависимостей
   - Избегайте сложной логики в моках
   - Используйте `vi.fn()` для создания простых моков функций

5. **Тестирование асинхронного кода:**

   - Не забывайте про `async/await` в асинхронных тестах
   - При необходимости используйте `vi.useFakeTimers()` для тестирования таймеров

6. **Фронтенд-тесты:**
   - Предпочитайте тестировать поведение, а не реализацию
   - Используйте семантические селекторы (например, `getByRole`, `getByText`)
   - Избегайте использования `data-testid` везде, где это возможно

## Решение проблем

### JSDOM ограничения

JSDOM имеет ограничения по сравнению с реальным браузером:

- Не поддерживает все браузерные API
- Может возникать сложность с тестированием CSS-анимаций и переходов
- Для таких случаев лучше использовать E2E-тесты с Playwright

### Проблемы с матчерами jest-dom

При проблемах с матчерами jest-dom (например, `toBeInTheDocument`), используйте базовые утверждения:

```typescript
// Вместо
expect(element).toBeInTheDocument();

// Используйте
expect(element).toBeDefined();
```

### Мокирование модулей Next.js

Для тестирования компонентов, использующих хуки Next.js:

```typescript
// Мок для useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

// Мок для useParams
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useParams: () => ({
      id: '123',
    }),
  };
});
```

### Тестирование защищенных роутов

Для тестирования компонентов, требующих аутентификации:

```typescript
// Создайте custom render
const renderWithAuth = (ui, { user = mockUser, ...options } = {}) => {
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: true }}>
      {ui}
    </AuthContext.Provider>,
    options
  );
};

test('показывает контент для авторизованного пользователя', () => {
  renderWithAuth(<ProtectedComponent />);
  expect(screen.getByText('Секретный контент')).toBeInTheDocument();
});
```
