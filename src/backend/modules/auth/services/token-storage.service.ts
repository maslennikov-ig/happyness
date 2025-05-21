import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ITokenStorage } from '../interfaces/token-storage.interface';

/**
 * Сервис для хранения и управления refresh токенами
 *
 * Реализует безопасное хранение токенов с ротацией для повышения безопасности.
 * В текущей версии использует базу данных Prisma для хранения,
 * но подготовлен для замены на Redis в будущем.
 */
@Injectable()
export class TokenStorageService implements ITokenStorage {
  // Максимальное количество одновременных сессий для пользователя
  private readonly maxUserSessions: number;

  // Максимальный лимит использования refresh токена до принудительной ротации
  private readonly refreshTokenUsageLimit: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.maxUserSessions = this.configService.get('MAX_USER_SESSIONS') || 5;
    this.refreshTokenUsageLimit = this.configService.get('REFRESH_TOKEN_USAGE_LIMIT') || 10;
  }

  /**
   * Создает новую запись о refresh токене
   */
  async saveRefreshToken(userId: string, refreshToken: string, expiresAt: Date): Promise<void> {
    const tokenId = uuidv4();

    await this.prisma.$transaction(async tx => {
      // Вставляем новый токен
      await tx.userRefreshToken.create({
        data: {
          id: tokenId,
          userId,
          token: refreshToken,
          expiresAt,
          usageCount: 0,
          isRevoked: false,
          createdAt: new Date(),
        },
      });

      // Проверяем количество активных токенов для пользователя
      const tokensCount = await tx.userRefreshToken.count({
        where: {
          userId,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // Если превышен лимит, удаляем самые старые токены
      if (tokensCount > this.maxUserSessions) {
        const tokensToDelete = await tx.userRefreshToken.findMany({
          where: {
            userId,
            isRevoked: false,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: tokensCount - this.maxUserSessions,
        });

        if (tokensToDelete.length > 0) {
          await tx.userRefreshToken.updateMany({
            where: {
              id: {
                in: tokensToDelete.map(token => token.id),
              },
            },
            data: {
              isRevoked: true,
            },
          });
        }
      }
    });
  }

  /**
   * Поиск и проверка refresh токена
   * Возвращает информацию о токене, если он валиден
   */
  async findRefreshToken(refreshToken: string) {
    return await this.prisma.userRefreshToken.findFirst({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Проверяет, нужно ли ротировать токен на основе количества использований
   */
  needsRotation(usageCount: number): boolean {
    return usageCount >= this.refreshTokenUsageLimit;
  }

  /**
   * Увеличивает счетчик использований токена
   */
  async incrementUsageCount(tokenId: string): Promise<number> {
    const updatedToken = await this.prisma.userRefreshToken.update({
      where: {
        id: tokenId,
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return updatedToken.usageCount;
  }

  /**
   * Отзывает refresh токен, делая его недействительным
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.userRefreshToken.updateMany({
      where: {
        token: refreshToken,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  /**
   * Отзывает все токены пользователя при выходе из системы или смене пароля
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.userRefreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  /**
   * Очищает истекшие и отозванные токены для оптимизации базы данных
   * Может вызываться по расписанию
   */
  async cleanupExpiredTokens(): Promise<void> {
    // Удаляем все токены, которые истекли или отозваны
    await this.prisma.userRefreshToken.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            isRevoked: true,
          },
        ],
      },
    });
  }
}
