import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@/backend/types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.accessTokenExpiration = configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    this.refreshTokenExpiration = configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    this.accessTokenSecret =
      configService.get<string>('JWT_ACCESS_SECRET') ||
      configService.get<string>('JWT_SECRET') ||
      'your-access-secret-key-change-in-production';
    this.refreshTokenSecret =
      configService.get<string>('JWT_REFRESH_SECRET') ||
      'your-refresh-secret-key-change-in-production';
  }

  /**
   * Создаёт JWT токен доступа
   */
  generateAccessToken(user: Partial<User>): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiration,
    });
  }

  /**
   * Создаёт JWT refresh токен
   */
  generateRefreshToken(user: Partial<User>): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiration,
    });
  }

  /**
   * Генерирует пару токенов (access и refresh)
   */
  generateTokens(user: Partial<User>): TokenResponse {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresIn: this.getExpirationTime(this.accessTokenExpiration),
    };
  }

  /**
   * Верифицирует refresh токен и возвращает payload
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      return null;
    }
  }

  /**
   * Вычисляет время истечения срока действия токена в секундах
   */
  private getExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // По умолчанию 15 минут в секундах

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
      default:
        return 900;
    }
  }
}
