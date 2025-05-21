import { PrismaClient } from '@prisma/client';

/**
 * Очищает тестовую базу данных
 * @param prisma PrismaClient экземпляр
 */
export async function clearTestDatabase(prisma: PrismaClient): Promise<void> {
  if (!prisma) {
    console.warn('Prisma не инициализирована, пропускаем очистку базы данных');
    return;
  }

  try {
    // Удаляем все данные из таблиц в определенном порядке
    // (с учетом внешних ключей)
    await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
        -- Отключаем проверку внешних ключей во время очистки
      SET CONSTRAINTS ALL DEFERRED;

        -- Очищаем все таблицы (за исключением системных)
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND 
                 tablename NOT LIKE 'pg_%' AND tablename NOT LIKE '_prisma_%') LOOP
          EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" RESTART IDENTITY CASCADE';
      END LOOP;
      
        -- Включаем проверку внешних ключей
      SET CONSTRAINTS ALL IMMEDIATE;
    END $$;
    `);
  } catch (error) {
    console.error('Ошибка при очистке тестовой базы данных:', error);
    // Если не удалось очистить через SQL, попробуем удалить записи по отдельности
    try {
      await prisma.user.deleteMany();
      // Добавьте другие таблицы здесь по мере необходимости
    } catch (innerError) {
      console.error('Ошибка при удалении записей:', innerError);
    }
  }
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
