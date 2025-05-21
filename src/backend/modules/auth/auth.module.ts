import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { TokenStorageService } from './services/token-storage.service';
import { RedisTokenStorageService } from './services/redis-token-storage.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../core/database/redis.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    PasswordService,
    TokenService,
    TokenStorageService,
    RedisTokenStorageService,
  ],
  exports: [
    AuthService,
    PasswordService,
    TokenService,
    TokenStorageService,
    RedisTokenStorageService,
  ],
})
export class AuthModule {}
