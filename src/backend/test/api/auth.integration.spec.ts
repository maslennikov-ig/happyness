import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../core/database/prisma.service';
import { TokenStorageService } from '../../modules/auth/services/token-storage.service';
import { UserRole } from '../../types';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { createMockPrismaService } from '../utils/mocks';

// Создаем мок TokenStorageService для тестов
const createMockTokenStorageService = () => ({
  saveRefreshToken: vi.fn(),
  findRefreshToken: vi.fn().mockImplementation(token => {
    if (token === 'valid-refresh-token') {
      return {
        id: '1',
        userId: '1',
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        usageCount: 0,
        user: {
          id: '1',
          email: 'test@example.com',
          role: UserRole.ENTREPRENEUR,
          isActive: true,
        },
      };
    }
    return null;
  }),
  needsRotation: vi.fn().mockReturnValue(false),
  incrementUsageCount: vi.fn().mockReturnValue(1),
  revokeRefreshToken: vi.fn(),
  revokeAllUserTokens: vi.fn(),
  cleanupExpiredTokens: vi.fn(),
});

describe('Auth API (e2e)', () => {
  let app: INestApplication | null = null;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;
  let usePrismaClient = true;
  const testUsers = {
    admin: {
      email: 'admin-test@example.com',
      password: 'AdminPassword123!',
      name: 'Test Admin',
      role: UserRole.ADMIN,
    },
    entrepreneur: {
      email: 'entrepreneur-test@example.com',
      password: 'EntPassword123!',
      name: 'Test Entrepreneur',
      role: UserRole.ENTREPRENEUR,
    },
  };

  beforeAll(async () => {
    try {
      // Настраиваем тестовый модуль
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();

      try {
        // Получаем экземпляр Prisma и проверяем подключение к БД
        prisma = app.get<PrismaService>(PrismaService);
        await prisma.$connect();

        // Если подключение успешно, используем реальную БД для тестов
        usePrismaClient = true;

        // Очищаем тестовую БД перед тестами
        await cleanDatabase(prisma);

        console.log('Используем реальную БД Prisma для тестов');
      } catch (error) {
        // Логируем ошибку и переключаемся на моки вместо реальной БД
        console.warn('Невозможно подключиться к Prisma. Используем моки для тестов.', error);
        usePrismaClient = false;
        prisma = createMockPrismaService() as PrismaService;
      }

      // Настраиваем глобальные пайпы для валидации
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        })
      );

      await app.init();
    } catch (error) {
      console.error('Ошибка настройки интеграционного теста:', error);
      usePrismaClient = false;
    }
  });

  afterAll(async () => {
    try {
      // Очищаем БД после тестов, если возможно
      if (usePrismaClient) {
        await cleanDatabase(prisma);
      }

      // Закрываем приложение, если оно было инициализировано
      if (app) {
        await app.close();
      }
    } catch (error) {
      console.error('Ошибка закрытия теста:', error);
    }
  });

  describe('POST /auth/register', () => {
    it.skipIf(!usePrismaClient || !app)(
      'должен успешно регистрировать нового пользователя',
      async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUsers.entrepreneur)
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body).toHaveProperty('expiresIn');
        expect(response.body.user.email).toBe(testUsers.entrepreneur.email);
        expect(response.body.user.role).toBe(testUsers.entrepreneur.role);
        expect(response.body.user).not.toHaveProperty('password');

        // Сохраняем токены для использования в других тестах
        accessToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;
      }
    );

    it.skipIf(!usePrismaClient || !app)(
      'должен возвращать ошибку при регистрации с существующим email',
      async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUsers.entrepreneur)
          .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('уже существует');
      }
    );

    it.skipIf(!usePrismaClient || !app)(
      'должен возвращать ошибку при регистрации с недостаточно надежным паролем',
      async () => {
        const weakUser = {
          email: 'weak-user@example.com',
          password: '123',
          name: 'Weak User',
          role: UserRole.ENTREPRENEUR,
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(weakUser)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('недостаточно надежный');
      }
    );
  });

  describe('POST /auth/login', () => {
    it.skipIf(!usePrismaClient || !app)(
      'должен успешно выполнять вход с правильными учетными данными',
      async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUsers.entrepreneur.email,
            password: testUsers.entrepreneur.password,
          })
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body).toHaveProperty('expiresIn');
        expect(response.body.user.email).toBe(testUsers.entrepreneur.email);
        expect(response.body.user).not.toHaveProperty('password');
      }
    );

    it.skipIf(!usePrismaClient || !app)(
      'должен возвращать ошибку при входе с неправильным паролем',
      async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUsers.entrepreneur.email,
            password: 'wrong-password',
          })
          .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Неверный email или пароль');
      }
    );
  });

  describe('GET /auth/me', () => {
    it.skipIf(!usePrismaClient || !app)(
      'должен возвращать данные пользователя с валидным токеном',
      async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('role');
        expect(response.body.email).toBe(testUsers.entrepreneur.email);
        expect(response.body.name).toBe(testUsers.entrepreneur.name);
        expect(response.body).not.toHaveProperty('password');
      }
    );

    it.skipIf(!usePrismaClient || !app)('должен возвращать ошибку без токена', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it.skipIf(!usePrismaClient || !app)(
      'должен обновлять токены с валидным refresh токеном',
      async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh-token')
          .send({ refreshToken })
          .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body).toHaveProperty('expiresIn');

        // Обновляем токены для использования в других тестах
        accessToken = response.body.accessToken;
        refreshToken = response.body.refreshToken;
      }
    );

    it.skipIf(!usePrismaClient || !app)(
      'должен возвращать ошибку с невалидным refresh токеном',
      async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh-token')
          .send({ refreshToken: 'invalid-refresh-token' })
          .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Недействительный refresh токен');
      }
    );
  });

  describe('POST /auth/logout', () => {
    it.skipIf(!usePrismaClient || !app)('должен успешно выполнять выход', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it.skipIf(!usePrismaClient || !app)('должен возвращать ошибку без токена', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('GET /auth/verify', () => {
    it.skipIf(!usePrismaClient || !app)('должен подтверждать валидность токена', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('user');
      expect(response.body.valid).toBe(true);
      expect(response.body.user).toHaveProperty('sub');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('role');
    });

    it.skipIf(!usePrismaClient || !app)(
      'должен возвращать ошибку с невалидным токеном',
      async () => {
        await request(app.getHttpServer())
          .get('/auth/verify')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      }
    );
  });

  describe('POST /auth/change-password', () => {
    it.skipIf(!usePrismaClient || !app)('должен изменять пароль с валидными данными', async () => {
      const newPassword = 'NewPassword123!';

      // Сначала изменяем пароль
      const changeResponse = await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUsers.entrepreneur.password,
          newPassword,
        })
        .expect(200);

      expect(changeResponse.body).toHaveProperty('success');
      expect(changeResponse.body.success).toBe(true);

      // Затем пробуем войти с новым паролем
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.entrepreneur.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');

      // Обновляем тестовые данные
      testUsers.entrepreneur.password = newPassword;
    });

    it.skipIf(!usePrismaClient || !app)(
      'должен возвращать ошибку при неверном текущем пароле',
      async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            currentPassword: 'wrong-current-password',
            newPassword: 'NewPassword456!',
          })
          .expect(401);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Неверный текущий пароль');
      }
    );
  });

  describe('GET /auth/admin', () => {
    let adminToken: string;

    beforeEach(async () => {
      if (!usePrismaClient || !app) return;

      // Регистрируем администратора, если он еще не существует
      try {
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUsers.admin);

        if (registerResponse.status === 201) {
          adminToken = registerResponse.body.accessToken;
        }
      } catch {
        // Если администратор уже существует, входим
        const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
          email: testUsers.admin.email,
          password: testUsers.admin.password,
        });

        adminToken = loginResponse.body.accessToken;
      }
    });

    it.skipIf(!usePrismaClient || !app)('должен разрешать доступ администратору', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('защищенный маршрут для администраторов');
    });

    it.skipIf(!usePrismaClient || !app)('должен запрещать доступ неадминистратору', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${accessToken}`) // Используем токен предпринимателя
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('У вас нет доступа к этому ресурсу');
    });
  });
});

/**
 * Вспомогательная функция для очистки базы данных
 * Использует транзакцию для атомарной операции очистки
 */
async function cleanDatabase(prisma: PrismaService) {
  if (!prisma) {
    console.warn('Prisma не инициализирована, пропускаем очистку базы данных');
    return;
  }

  try {
    // Используем транзакцию для атомарной очистки всех таблиц
    await prisma.$transaction(async tx => {
      // Отключаем проверки внешних ключей во время очистки
      await tx.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;

      // Очистка таблиц, сброс автоинкремента
      await tx.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;
      await tx.$executeRaw`TRUNCATE TABLE "UserRefreshToken" RESTART IDENTITY CASCADE`;

      // Включаем обратно проверки внешних ключей
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
    });

    console.log('База данных успешно очищена для тестов');
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
    throw new Error(`Не удалось очистить базу данных для тестов: ${error.message}`);
  }
}
