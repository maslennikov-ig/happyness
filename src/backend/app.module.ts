import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/module/core.module';
import { LoggerModule } from './core/logger/logger.module';
import { EventBusModule } from './core/events/event-bus.module';
import { HealthCheckModule } from './core/health/health-check.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RequestsModule } from './modules/requests/requests.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { TestModule } from './modules/test/test.module';
import { HttpLoggerInterceptor } from './core/logger/http-logger.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    // Загрузка переменных окружения
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Ядро приложения
    CoreModule.forRoot({
      isGlobal: true,
      coreVersion: '1.0.0',
      modulesPath: 'modules',
      autoloadModules: false,
    }),

    // Компоненты ядра
    LoggerModule,
    EventBusModule.forRoot(),
    HealthCheckModule.forRoot(),

    // Модули приложения
    AuthModule,
    UsersModule,
    ProjectsModule,
    RequestsModule,
    ContractorsModule,
    TestModule, // Модуль для тестирования обработки ошибок
  ],
  providers: [
    // Глобальный интерцептор для логирования HTTP-запросов
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Здесь можно добавить глобальные middleware
  }
}
