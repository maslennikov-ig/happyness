import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { clearTestDatabase } from '../../utils/cleanup';
import { seedTestDatabase } from '../../utils/seed';

/**
 * Пример тестирования сервиса с использованием реальной тестовой БД
 * Демонстрирует подход к интеграционному тестированию с Prisma
 */

// Простой сервис для примера
class UsersService {
  constructor(private prisma: PrismaClient) {}

  async findUserById(id: string | number) {
    // Преобразуем id в строку, если он передан как число
    const idStr = typeof id === 'number' ? String(id) : id;
    return this.prisma.user.findUnique({
      where: { id: idStr },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    role: 'ADMIN' | 'USER' | 'CONTRACTOR';
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(id: string | number, data: Partial<{ name: string; email: string }>) {
    // Преобразуем id в строку, если он передан как число
    const idStr = typeof id === 'number' ? String(id) : id;
    return this.prisma.user.update({
      where: { id: idStr },
      data,
    });
  }

  async deleteUser(id: string | number) {
    // Преобразуем id в строку, если он передан как число
    const idStr = typeof id === 'number' ? String(id) : id;
    return this.prisma.user.delete({
      where: { id: idStr },
    });
  }
}

describe('UsersService (интеграционный с тестовой БД)', () => {
  let prisma: PrismaClient | null = null;
  let usersService: UsersService | null = null;
  let seededData: Awaited<ReturnType<typeof seedTestDatabase>> | null = null;
  let prismaInitialized = false;

  // Подключение к тестовой БД
  beforeEach(async () => {
    try {
      // Создаем новый экземпляр Prisma для каждого теста
      prisma = new PrismaClient({
        datasources: {
          db: {
            url:
              process.env.DATABASE_URL_TEST ||
              'postgresql://postgres:postgres@localhost:5434/happyness_test?schema=public',
          },
        },
      });
      prismaInitialized = true;

      // Инициализируем сервис
      usersService = new UsersService(prisma);

      // Очищаем БД перед каждым тестом
      await clearTestDatabase(prisma);

      // Заполняем тестовыми данными
      seededData = await seedTestDatabase(prisma);
    } catch (error) {
      console.error('Ошибка при инициализации тестовой БД:', error);
      prismaInitialized = false;
    }
  });

  // Закрываем соединение с БД после всех тестов
  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it.skipIf(!prismaInitialized)('должен находить пользователя по ID', async () => {
    // Arrange (происходит в beforeEach с помощью seedTestDatabase)
    const userId = seededData?.users.regular.id as number;

    // Act
    const foundUser = await usersService?.findUserById(userId);

    // Assert
    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(userId);
    expect(foundUser?.name).toBe('Пользователь');
    expect(foundUser?.email).toBe('user@example.com');
  });

  it.skipIf(!prismaInitialized)('должен находить пользователя по email', async () => {
    // Act
    const foundUser = await usersService?.findUserByEmail('admin@example.com');

    // Assert
    expect(foundUser).not.toBeNull();
    expect(foundUser?.role).toBe('ADMIN');
  });

  it.skipIf(!prismaInitialized)('должен создавать нового пользователя', async () => {
    // Arrange
    const newUserData = {
      name: 'Новый пользователь',
      email: 'new@example.com',
      role: 'USER' as const,
      passwordHash: 'hash123',
    };

    // Act
    const createdUser = await usersService?.createUser(newUserData);

    // Assert
    expect(createdUser).toMatchObject({
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
    });

    // Дополнительная проверка через прямой запрос к БД
    const storedUser = await prisma?.user.findUnique({
      where: { email: newUserData.email },
    });
    expect(storedUser).not.toBeNull();
  });

  it.skipIf(!prismaInitialized)('должен обновлять существующего пользователя', async () => {
    // Arrange
    const userId = seededData?.users.regular.id as number;
    const updateData = {
      name: 'Обновленное имя',
    };

    // Act
    const updatedUser = await usersService?.updateUser(userId, updateData);

    // Assert
    expect(updatedUser?.name).toBe(updateData.name);
    expect(updatedUser?.email).toBe(seededData?.users.regular.email); // email не менялся

    // Дополнительная проверка через прямой запрос к БД
    const storedUser = await prisma?.user.findUnique({ where: { id: userId } });
    expect(storedUser?.name).toBe(updateData.name);
  });

  it.skipIf(!prismaInitialized)('должен удалять пользователя', async () => {
    // Arrange
    const userId = seededData?.users.regular.id as number;

    // Act
    await usersService?.deleteUser(userId);

    // Assert
    const deletedUser = await prisma?.user.findUnique({ where: { id: userId } });
    expect(deletedUser).toBeNull();
  });

  it.skipIf(!prismaInitialized)(
    'должен выбрасывать исключение при попытке найти несуществующего пользователя',
    async () => {
      // Act & Assert
      await expect(usersService?.findUserById(999999)).resolves.toBeNull();
    }
  );

  it.skipIf(!prismaInitialized)(
    'должен выбрасывать исключение при попытке обновить несуществующего пользователя',
    async () => {
      // Act & Assert
      if (usersService) {
        await expect(usersService.updateUser(999999, { name: 'Новое имя' })).rejects.toThrow();
      }
    }
  );
});
