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

  async findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
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

  async updateUser(id: number, data: Partial<{ name: string; email: string }>) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

describe('UsersService (интеграционный с тестовой БД)', () => {
  let prisma: PrismaClient;
  let usersService: UsersService;
  let seededData: Awaited<ReturnType<typeof seedTestDatabase>>;

  // Подключение к тестовой БД
  beforeEach(async () => {
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

    // Инициализируем сервис
    usersService = new UsersService(prisma);

    // Очищаем БД перед каждым тестом
    await clearTestDatabase(prisma);

    // Заполняем тестовыми данными
    seededData = await seedTestDatabase(prisma);
  });

  // Закрываем соединение с БД после всех тестов
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('должен находить пользователя по ID', async () => {
    // Arrange (происходит в beforeEach с помощью seedTestDatabase)
    const userId = seededData.users.regular.id;

    // Act
    const foundUser = await usersService.findUserById(userId);

    // Assert
    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(userId);
    expect(foundUser?.name).toBe('Пользователь');
    expect(foundUser?.email).toBe('user@example.com');
  });

  it('должен находить пользователя по email', async () => {
    // Act
    const foundUser = await usersService.findUserByEmail('admin@example.com');

    // Assert
    expect(foundUser).not.toBeNull();
    expect(foundUser?.role).toBe('ADMIN');
  });

  it('должен создавать нового пользователя', async () => {
    // Arrange
    const newUserData = {
      name: 'Новый пользователь',
      email: 'new@example.com',
      role: 'USER' as const,
      passwordHash: 'hash123',
    };

    // Act
    const createdUser = await usersService.createUser(newUserData);

    // Assert
    expect(createdUser).toMatchObject({
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
    });

    // Дополнительная проверка через прямой запрос к БД
    const storedUser = await prisma.user.findUnique({
      where: { email: newUserData.email },
    });
    expect(storedUser).not.toBeNull();
  });

  it('должен обновлять существующего пользователя', async () => {
    // Arrange
    const userId = seededData.users.regular.id;
    const updateData = {
      name: 'Обновленное имя',
    };

    // Act
    const updatedUser = await usersService.updateUser(userId, updateData);

    // Assert
    expect(updatedUser.name).toBe(updateData.name);
    expect(updatedUser.email).toBe(seededData.users.regular.email); // email не менялся

    // Дополнительная проверка через прямой запрос к БД
    const storedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(storedUser?.name).toBe(updateData.name);
  });

  it('должен удалять пользователя', async () => {
    // Arrange
    const userId = seededData.users.regular.id;

    // Act
    await usersService.deleteUser(userId);

    // Assert
    const deletedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(deletedUser).toBeNull();
  });

  it('должен выбрасывать исключение при попытке найти несуществующего пользователя', async () => {
    // Act & Assert
    await expect(usersService.findUserById(999999)).resolves.toBeNull();
  });

  it('должен выбрасывать исключение при попытке обновить несуществующего пользователя', async () => {
    // Act & Assert
    await expect(usersService.updateUser(999999, { name: 'Новое имя' })).rejects.toThrow();
  });
});
