# Интеграционные тесты API (backend)

## Структура

- Все интеграционные тесты для API располагаются в этой папке.
- Используется Vitest + Supertest.
- Каждый тестовый файл должен быть максимально изолированным и очищать состояние после себя.

## Пример запуска

```bash
npm run test:backend
```

## Пример теста

```typescript
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';

let app: INestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('API: Healthcheck', () => {
  it('GET /api/health', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
```

## Рекомендации

- Используйте AAA (Arrange-Act-Assert) подход.
- Для сложных сценариев используйте beforeEach/afterEach для подготовки/очистки данных.
- Для моков используйте встроенные возможности Vitest.
- Все комментарии — на русском языке.

## Тестовая база данных

- Для интеграционных тестов используется отдельная тестовая БД (postgres-test в docker-compose).
- Переменная окружения: `DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5434/happyness_test?schema=public`
- Перед запуском тестов убедитесь, что контейнер postgres-test запущен:
  ```bash
  docker-compose up -d postgres-test
  ```
- Миграции применяются отдельно:
  ```bash
  npx prisma migrate deploy --preview-feature --schema=prisma/schema.prisma --url=$DATABASE_URL_TEST
  ```
- Для очистки данных используйте beforeEach/afterEach с транзакциями или truncate (см. пример ниже).
