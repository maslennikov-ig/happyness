import { PrismaClient } from '@prisma/client';

/**
 * Очищает все таблицы в тестовой базе данных
 * Рекомендуется использовать в beforeEach или beforeAll для изоляции тестов
 */
export async function clearTestDatabase(prisma: PrismaClient) {
  // SQL-запрос для полной очистки всех таблиц с каскадным сбросом
  const truncateAllTables = `
    DO $$ DECLARE
      r RECORD;
    BEGIN
      -- Отключаем проверку внешних ключей на время очистки
      SET CONSTRAINTS ALL DEFERRED;

      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
      
      -- Включаем обратно проверку внешних ключей
      SET CONSTRAINTS ALL IMMEDIATE;
    END $$;
  `;

  await prisma.$executeRawUnsafe(truncateAllTables);
}

/**
 * Очищает только определенные таблицы
 * Более быстрый вариант, если не нужно очищать все таблицы
 */
export async function clearSpecificTables(prisma: PrismaClient, tables: string[]) {
  // Отключаем внешние ключи для надежности
  await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
  }

  // Включаем обратно
  await prisma.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
}

/**
 * Примеры использования в тестах:
 *
 * // Полная очистка всех таблиц
 * beforeEach(async () => {
 *   await clearTestDatabase(prisma);
 * });
 *
 * // Очистка только определенных таблиц
 * beforeEach(async () => {
 *   await clearSpecificTables(prisma, ['User', 'Project', 'Request']);
 * });
 */
