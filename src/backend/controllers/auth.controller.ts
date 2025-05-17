import { Request, Response } from 'express';
import { prisma } from '../core/database/prisma';
import * as argon2 from 'argon2';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { LoginRequest, RegisterRequest } from '../types';

// Локальная копия настроек конфигурации
const config = {
  security: {
    argon2: {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3, // 3 итерации
      parallelism: 1, // 1 поток
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

/**
 * Контроллер для аутентификации пользователей
 */
export class AuthController {
  /**
   * Регистрация нового пользователя
   */
  async register(req: Request<{}, {}, RegisterRequest>, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      // Проверяем, существует ли пользователь с таким email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Пользователь с таким email уже существует',
        });
      }

      // Хешируем пароль с использованием Argon2
      const hashedPassword = await argon2.hash(password, config.security.argon2);

      // Создаем нового пользователя
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
      });

      // Создаем JWT токен
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret as Secret,
        { expiresIn: config.jwt.expiresIn } as SignOptions
      );

      // Исключаем пароль из ответа
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
      });
    }
  }

  /**
   * Вход пользователя
   */
  async login(req: Request<{}, {}, LoginRequest>, res: Response) {
    try {
      const { email, password } = req.body;

      // Ищем пользователя по email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Неверный email или пароль',
        });
      }

      // Проверяем пароль с использованием Argon2
      const isPasswordValid = await argon2.verify(user.password, password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Неверный email или пароль',
        });
      }

      // Создаем JWT токен
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret as Secret,
        { expiresIn: config.jwt.expiresIn } as SignOptions
      );

      // Исключаем пароль из ответа
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
      });
    }
  }

  /**
   * Получение данных текущего пользователя
   */
  async me(req: Request, res: Response) {
    try {
      // В реальном приложении здесь будет извлечение ID пользователя из JWT токена
      // и получение данных из базы
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Не авторизован',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден',
        });
      }

      // Исключаем пароль из ответа
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      return res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
      });
    }
  }
}
