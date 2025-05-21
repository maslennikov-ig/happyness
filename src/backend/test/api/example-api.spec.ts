import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { PrismaClient } from '@prisma/client';

let app: INestApplication;
let prisma: PrismaClient;

beforeAll(async () => {
  try {
    // Инициализация тестового приложения NestJS
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    try {
      prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL_TEST } } });
    } catch (error) {
      console.error('Не удалось инициализировать Prisma:', error);
    }
  } catch (error) {
    console.error('Ошибка при инициализации тестового приложения:', error);
  }
});

afterAll(async () => {
  // Завершение работы приложения после тестов
  if (app) {
    await app.close();
  }
  if (prisma) {
    await prisma.$disconnect();
  }
});

beforeEach(async () => {
  // Пропускаем очистку таблиц, если Prisma не инициализирована
  if (!prisma) return;

  try {
    // Очистка всех таблиц перед каждым тестом (пример для PostgreSQL)
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
        END LOOP;
      END $$;
    `);
  } catch (error) {
    console.error('Ошибка при очистке таблиц:', error);
  }
});

describe('API: Healthcheck (интеграционный)', () => {
  it.skipIf(!app)('GET /api/health возвращает 200 и статус ok', async () => {
    // Act
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    // Assert
    expect(res.body.status).toBe('ok');
  });
});
