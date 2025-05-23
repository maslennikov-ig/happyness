import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenStorageService } from './token-storage.service';

type UserPayload = {
  id: string;
  email: string;
  role?: string;
};

/**
 * Сервис для работы с JWT токенами авторизации
 */
@Injectable()
export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenStorage: TokenStorageService
  ) {
    this.accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    this.accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    this.refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  /**
   * Генерирует пару токенов (access + refresh) для пользователя
   */
  generateTokens(user: UserPayload) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const expiresIn = this.parseExpiresIn(this.accessTokenExpiresIn);
    const expiresAt = this.calculateExpiresAt(this.refreshTokenExpiresIn);

    // Сохраняем refresh токен в хранилище
    this.tokenStorage.saveRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Генерирует access токен для пользователя
   */
  generateAccessToken(user: UserPayload): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiresIn,
    });

    return token;
  }

  /**
   * Генерирует refresh токен для пользователя
   */
  generateRefreshToken(user: UserPayload): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });

    return token;
  }

  /**
   * Проверяет валидность refresh токена
   * Возвращает payload токена или null, если токен невалиден
   */
  verifyRefreshToken(token: string): { sub: string; email: string; role: string } | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.refreshTokenSecret,
      });

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Обновляет токены с учетом ротации refresh-токенов
   */
  async refreshTokens(oldRefreshToken: string) {
    // Проверяем валидность токена на уровне JWT
    const payload = this.verifyRefreshToken(oldRefreshToken);
    if (!payload) {
      return null;
    }

    // Проверяем существование токена в хранилище
    const tokenRecord = await this.tokenStorage.findRefreshToken(oldRefreshToken);
    if (!tokenRecord) {
      return null;
    }

    // Увеличиваем счетчик использования токена
    const usageCount = await this.tokenStorage.incrementUsageCount(tokenRecord.id);

    // Проверяем, нужно ли ротировать токен
    const needsRotation = this.tokenStorage.needsRotation(usageCount);

    // Генерируем новый access token
    const accessToken = this.generateAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    // Если ротация не требуется, возвращаем тот же refresh token
    if (!needsRotation) {
      return {
        accessToken,
        refreshToken: oldRefreshToken,
        expiresIn: this.parseExpiresIn(this.accessTokenExpiresIn),
      };
    }

    // Если ротация нужна, отзываем старый токен и создаем новый
    await this.tokenStorage.revokeRefreshToken(oldRefreshToken);

    // Генерируем новый refresh token
    const refreshToken = this.generateRefreshToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    // Сохраняем новый refresh token
    const expiresAt = this.calculateExpiresAt(this.refreshTokenExpiresIn);
    await this.tokenStorage.saveRefreshToken(tokenRecord.user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(this.accessTokenExpiresIn),
    };
  }

  /**
   * Отзывает все токены пользователя
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenStorage.revokeAllUserTokens(userId);
  }

  /**
   * Парсит строку с временем истечения токена в секунды
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    if (!match) {
      return 900; // Возвращаем значение по умолчанию (15 минут)
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      case 'w':
        return value * 60 * 60 * 24 * 7;
      default:
        return 900;
    }
  }

  /**
   * Вычисляет дату истечения токена на основе строки expiresIn
   */
  private calculateExpiresAt(expiresIn: string): Date {
    const seconds = this.parseExpiresIn(expiresIn);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + seconds);
    return expiresAt;
  }
}
