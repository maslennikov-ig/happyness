import { Request, Response } from 'express';
import { prisma } from '../core/database/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '@/config';
import { LoginRequest, RegisterRequest } from '../types';

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

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, config.security.saltRounds);

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
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Исключаем пароль из ответа
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

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Неверный email или пароль',
        });
      }

      // Создаем JWT токен
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Исключаем пароль из ответа
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