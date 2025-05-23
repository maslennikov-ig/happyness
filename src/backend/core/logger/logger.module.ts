import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { ConfigModule } from '../config/config.module';

/**
 * Глобальный модуль логирования
 * Предоставляет сервис логирования для всего приложения
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
