import { Module, Global } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { ModuleRegistry } from './module/module-registry';

/**
 * Глобальный модуль ядра приложения
 * Предоставляет основные сервисы для всего приложения
 */
@Global()
@Module({
  providers: [PrismaService, ModuleRegistry],
  exports: [PrismaService, ModuleRegistry],
})
export class CoreModule {}
