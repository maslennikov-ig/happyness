import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Провайдер для инстанса Redis
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Глобальный модуль для Redis
 * Предоставляет доступ к клиенту Redis через инъекцию зависимостей
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD', '');
        const db = configService.get<number>('REDIS_DB', 0);

        // Создаем подключение к Redis
        const redis = new Redis({
          host,
          port,
          password: password || undefined,
          db,
          // На случай недоступности Redis предусматриваем повторное подключение
          retryStrategy: times => {
            // Повторная попытка каждую секунду до 10 попыток
            return times < 10 ? 1000 : null;
          },
        });

        // Поскольку возможен сценарий, когда Redis недоступен,
        // мы логируем ошибки, но не блокируем приложение
        redis.on('error', err => {
          console.warn('Redis connection error:', err.message);
        });

        redis.on('connect', () => {
          console.log(`Connected to Redis at ${host}:${port}`);
        });

        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(private readonly redis: Redis) {}

  /**
   * Закрываем подключение при остановке приложения
   */
  async onModuleDestroy() {
    await this.redis.quit();
  }
}
