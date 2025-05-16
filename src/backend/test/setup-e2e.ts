// Глобальные настройки для E2E тестов
// Этот файл будет автоматически загружен перед запуском E2E тестов

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { beforeAll, afterAll } from 'vitest';

// Создаем уникальное имя базы данных для тестов
const dbName = `test_${randomUUID().replace(/-/g, '')}`;
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${dbName}`;

// Инициализация Prisma клиента для тестов
const prisma = new PrismaClient();

// Глобальные переменные для тестов
let testApp;
let testDb;

// Функция для настройки тестовой базы данных
async function setupDatabase() {
  try {
    // Создаем тестовую базу данных
    execSync(`createdb -h localhost -U postgres -p 5432 ${dbName}`);
    
    // Применяем миграции
    execSync('npx prisma migrate deploy');
    
    console.log(`Test database created: ${dbName}`);
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

// Функция для очистки тестовой базы данных
async function teardownDatabase() {
  try {
    await prisma.$disconnect();
    execSync(`dropdb -h localhost -U postgres -p 5432 ${dbName}`);
    console.log(`Test database dropped: ${dbName}`);
  } catch (error) {
    console.error('Error tearing down test database:', error);
  }
}

// Настройка перед всеми тестами
beforeAll(async () => {
  await setupDatabase();
  // Здесь можно добавить код для настройки тестовой базы данных
  // и запуска тестового приложения
});

// Очистка после всех тестов
afterAll(async () => {
  await teardownDatabase();
  // Здесь можно добавить код для очистки тестовой базы данных
  // и остановки тестового приложения
}); 