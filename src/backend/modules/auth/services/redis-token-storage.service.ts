import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../core/database/redis.module';
import { TokenStorageService } from './token-storage.service';
import { ITokenStorage } from '../interfaces/token-storage.interface';

/**
 * Сервис для хранения refresh токенов в Redis
 *
 * Реализует улучшенный механизм хранения с ограниченным периодом жизни
 * и автоматической очисткой истекших токенов.
 */
@Injectable()
export class RedisTokenStorageService implements ITokenStorage {
  private readonly logger = new Logger(RedisTokenStorageService.name);
  private readonly refreshTokenUsageLimit: number;
  private readonly maxUserSessions: number;
  private readonly prefix = 'token:';
  private readonly userPrefix = 'user:';

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly prismaTokenService: TokenStorageService
  ) {
    this.maxUserSessions = this.configService.get('MAX_USER_SESSIONS') || 5;
    this.refreshTokenUsageLimit = this.configService.get('REFRESH_TOKEN_USAGE_LIMIT') || 10;
  }

  /**
   * Сохраняет refresh токен в Redis
   *
   * @param userId ID пользователя
   * @param refreshToken Refresh токен
   * @param expiresAt Дата истечения токена
   */
  async saveRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<void> {
    try {
      const tokenId = this.hashToken(refreshToken);
      const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

      if (expiresIn <= 0) {
        this.logger.warn(`Попытка сохранить истекший токен для пользователя ${userId}`);
        return;
      }

      const tokenKey = this.getTokenKey(tokenId);
      const userTokensKey = this.getUserTokensKey(userId);

      // Формируем данные токена для сохранения
      const tokenData = JSON.stringify({
        id: tokenId,
        userId,
        token: refreshToken,
        expiresAt: expiresAt.toISOString(),
        usageCount: 0,
        isRevoked: false,
        createdAt: new Date().toISOString(),
      });

      // Используем транзакцию Redis для атомарных операций
      const multi = this.redis.multi();

      // Сохраняем токен с TTL равным времени его жизни
      multi.set(tokenKey, tokenData, 'EX', expiresIn);

      // Добавляем токен в список токенов пользователя
      multi.sadd(userTokensKey, tokenId);

      // Получаем количество активных токенов пользователя
      const userTokens = await this.redis.smembers(userTokensKey);

      // Если превышен лимит, удаляем самые старые токены
      if (userTokens.length >= this.maxUserSessions) {
        // В Redis нет прямого способа получить самые старые записи по времени создания
        // Поэтому получаем все токены и определяем самые старые
        const tokensData = await Promise.all(
          userTokens.map(async tId => {
            const data = await this.redis.get(this.getTokenKey(tId));
            return data ? JSON.parse(data) : null;
          })
        );

        // Фильтруем неактивные токены и сортируем по дате создания
        const validTokens = tokensData
          .filter(t => t && !t.isRevoked)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Удаляем старые токены, чтобы остаться в пределах лимита
        const tokensToDelete = validTokens.slice(0, validTokens.length - this.maxUserSessions + 1);

        for (const token of tokensToDelete) {
          multi.del(this.getTokenKey(token.id));
          multi.srem(userTokensKey, token.id);
        }
      }

      // Выполняем транзакцию
      await multi.exec();

      // Сохраняем в Prisma для обратной совместимости
      try {
        await this.prismaTokenService.saveRefreshToken(userId, refreshToken, expiresAt);
      } catch (error) {
        this.logger.warn('Не удалось сохранить токен в Prisma (fallback)', error.message);
      }
    } catch (error) {
      this.logger.error(`Ошибка сохранения токена в Redis`, error.stack);

      // В случае ошибки Redis используем Prisma в качестве fallback
      await this.prismaTokenService.saveRefreshToken(userId, refreshToken, expiresAt);
    }
  }

  /**
   * Находит и проверяет refresh токен
   *
   * @param refreshToken Refresh токен для проверки
   * @returns Информация о токене и пользователе или null
   */
  async findRefreshToken(refreshToken: string) {
    try {
      const tokenId = this.hashToken(refreshToken);
      const tokenKey = this.getTokenKey(tokenId);

      // Получаем данные токена из Redis
      const tokenData = await this.redis.get(tokenKey);

      if (!tokenData) {
        // Если токен не найден в Redis, пробуем найти в Prisma
        return await this.prismaTokenService.findRefreshToken(refreshToken);
      }

      const token = JSON.parse(tokenData);

      // Проверяем, что токен не отозван
      if (token.isRevoked) {
        return null;
      }

      // Обновляем инфо о токене в Redis для точности данных
      const now = new Date();
      const expiresAt = new Date(token.expiresAt);

      // Проверяем, что токен не истек
      if (expiresAt <= now) {
        await this.redis.del(tokenKey);
        return null;
      }

      // Получаем данные пользователя из Prisma
      // В реальном проекте желательно реализовать кэш пользователей в Redis
      try {
        const userWithToken = await this.prismaTokenService.findRefreshToken(refreshToken);

        if (!userWithToken) {
          return null;
        }

        // Объединяем данные токена из Redis и пользователя из Prisma
        return {
          ...userWithToken,
          id: token.id,
          token: token.token,
          expiresAt: new Date(token.expiresAt),
          usageCount: token.usageCount || 0,
          isRevoked: token.isRevoked,
        };
      } catch (error) {
        this.logger.error('Ошибка получения данных пользователя для токена', error.stack);
        return null;
      }
    } catch (error) {
      this.logger.error('Ошибка поиска refresh токена в Redis', error.stack);

      // Fallback на Prisma в случае ошибки Redis
      return await this.prismaTokenService.findRefreshToken(refreshToken);
    }
  }

  /**
   * Проверяет, нужно ли ротировать токен на основе количества использований
   */
  needsRotation(usageCount: number): boolean {
    return usageCount >= this.refreshTokenUsageLimit;
  }

  /**
   * Увеличивает счетчик использований токена
   *
   * @param tokenId ID токена
   * @returns Новое значение счетчика
   */
  async incrementUsageCount(tokenId: string): Promise<number> {
    try {
      const tokenKey = this.getTokenKey(tokenId);
      const tokenData = await this.redis.get(tokenKey);

      if (!tokenData) {
        // Если токен не найден в Redis, используем Prisma
        return await this.prismaTokenService.incrementUsageCount(tokenId);
      }

      const token = JSON.parse(tokenData);
      const newCount = (token.usageCount || 0) + 1;

      // Обновляем счетчик использований
      token.usageCount = newCount;

      // Вычисляем оставшееся время жизни токена
      const expiresAt = new Date(token.expiresAt);
      const now = new Date();
      const expiresIn = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

      if (expiresIn > 0) {
        // Обновляем данные токена с сохранением TTL
        await this.redis.set(tokenKey, JSON.stringify(token), 'EX', expiresIn);
      }

      // Также обновляем в Prisma для синхронизации
      try {
        await this.prismaTokenService.incrementUsageCount(tokenId);
      } catch (error) {
        this.logger.warn('Не удалось обновить счетчик использований в Prisma', error.message);
      }

      return newCount;
    } catch (error) {
      this.logger.error('Ошибка инкремента счетчика использований токена', error.stack);

      // Fallback на Prisma
      return await this.prismaTokenService.incrementUsageCount(tokenId);
    }
  }

  /**
   * Отзывает refresh токен, делая его недействительным
   *
   * @param refreshToken Токен для отзыва
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const tokenId = this.hashToken(refreshToken);
      const tokenKey = this.getTokenKey(tokenId);

      // Получаем данные токена
      const tokenData = await this.redis.get(tokenKey);

      if (tokenData) {
        const token = JSON.parse(tokenData);

        // Получаем ключ для списка токенов пользователя
        const userTokensKey = this.getUserTokensKey(token.userId);

        // Удаляем токен и его ссылку из списка пользователя
        await this.redis.del(tokenKey);
        await this.redis.srem(userTokensKey, tokenId);
      }

      // Отзываем также в Prisma
      await this.prismaTokenService.revokeRefreshToken(refreshToken);
    } catch (error) {
      this.logger.error('Ошибка отзыва refresh токена', error.stack);

      // Fallback
      await this.prismaTokenService.revokeRefreshToken(refreshToken);
    }
  }

  /**
   * Отзывает все токены пользователя
   *
   * @param userId ID пользователя
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const userTokensKey = this.getUserTokensKey(userId);

      // Получаем все токены пользователя
      const tokenIds = await this.redis.smembers(userTokensKey);

      if (tokenIds.length > 0) {
        // Формируем массив ключей токенов
        const tokenKeys = tokenIds.map(id => this.getTokenKey(id));

        // Удаляем все токены пользователя
        await this.redis.del(...tokenKeys);

        // Очищаем список токенов пользователя
        await this.redis.del(userTokensKey);
      }

      // Отзываем также в Prisma
      await this.prismaTokenService.revokeAllUserTokens(userId);
    } catch (error) {
      this.logger.error('Ошибка отзыва всех токенов пользователя', error.stack);

      // Fallback
      await this.prismaTokenService.revokeAllUserTokens(userId);
    }
  }

  /**
   * Очищает истекшие токены в Redis
   *
   * Не требуется явного вызова, так как Redis автоматически
   * удаляет записи с истекшим TTL
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // В Redis не требуется явная очистка истекших токенов,
      // так как они удаляются автоматически по истечении TTL

      // Очищаем в Prisma для синхронизации
      await this.prismaTokenService.cleanupExpiredTokens();
    } catch (error) {
      this.logger.error('Ошибка очистки истекших токенов', error.stack);
    }
  }

  // Вспомогательные методы

  /**
   * Создает хэш токена для использования в качестве ключа
   */
  private hashToken(token: string): string {
    // В реальном приложении здесь следовало бы использовать
    // более надежный алгоритм хеширования, например SHA-256
    return Buffer.from(token).toString('base64');
  }

  /**
   * Формирует ключ для хранения данных токена
   */
  private getTokenKey(tokenId: string): string {
    return `${this.prefix}${tokenId}`;
  }

  /**
   * Формирует ключ для хранения списка токенов пользователя
   */
  private getUserTokensKey(userId: string): string {
    return `${this.userPrefix}${userId}:tokens`;
  }
}
