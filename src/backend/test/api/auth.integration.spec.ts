import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../core/database/prisma.service';
import { UserRole } from '../../types';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;
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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    // Настраиваем глобальные пайпы для валидации
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    );

    await app.init();

    // Очищаем тестовую БД перед тестами
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    // Очищаем БД после тестов
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('должен успешно регистрировать нового пользователя', async () => {
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
    });

    it('должен возвращать ошибку при регистрации с существующим email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUsers.entrepreneur)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('уже существует');
    });

    it('должен возвращать ошибку при регистрации с недостаточно надежным паролем', async () => {
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
    });
  });

  describe('POST /auth/login', () => {
    it('должен успешно выполнять вход с правильными учетными данными', async () => {
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
    });

    it('должен возвращать ошибку при входе с неправильным паролем', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUsers.entrepreneur.email,
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Неверный email или пароль');
    });
  });

  describe('GET /auth/me', () => {
    it('должен возвращать данные пользователя с валидным токеном', async () => {
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
    });

    it('должен возвращать ошибку без токена', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('должен обновлять токены с валидным refresh токеном', async () => {
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
    });

    it('должен возвращать ошибку с невалидным refresh токеном', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Недействительный refresh токен');
    });
  });

  describe('POST /auth/logout', () => {
    it('должен успешно выполнять выход', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it('должен возвращать ошибку без токена', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('GET /auth/verify', () => {
    it('должен подтверждать валидность токена', async () => {
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

    it('должен возвращать ошибку с невалидным токеном', async () => {
      await request(app.getHttpServer())
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/change-password', () => {
    it('должен изменять пароль с валидными данными', async () => {
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

    it('должен возвращать ошибку при неверном текущем пароле', async () => {
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
    });
  });

  describe('GET /auth/admin', () => {
    let adminToken: string;

    beforeEach(async () => {
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

    it('должен разрешать доступ администратору', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('защищенный маршрут для администраторов');
    });

    it('должен запрещать доступ неадминистратору', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${accessToken}`) // Используем токен предпринимателя
        .expect(403);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('У вас нет доступа к этому ресурсу');
    });
  });
});

// Вспомогательная функция для очистки базы данных
async function cleanDatabase(prisma: PrismaService) {
  try {
    // Очистка таблиц, сброс автоинкремента
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
  }
}
