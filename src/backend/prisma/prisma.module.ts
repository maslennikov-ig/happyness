import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../core/database/prisma.service';

/**
 * Глобальный модуль для работы с Prisma ORM
 * Предоставляет PrismaService как глобальный сервис для всего приложения
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
