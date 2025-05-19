import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { PrismaClient } from '@prisma/client';

let app: INestApplication;
let prisma: PrismaClient;

beforeAll(async () => {
  // Инициализация тестового приложения NestJS
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleRef.createNestApplication();
  await app.init();
  prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_TEST } } });
});

afterAll(async () => {
  // Завершение работы приложения после тестов
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Очистка всех таблиц перед каждым тестом (пример для PostgreSQL)
  // Можно расширить для конкретных таблиц
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

describe('API: Healthcheck (интеграционный)', () => {
  it('GET /api/health возвращает 200 и статус ok', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    // Assert
    expect(res.body.status).toBe('ok');
  });
});
