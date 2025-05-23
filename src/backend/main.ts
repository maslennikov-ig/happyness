import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from './core/logger/logger.service';
import { HttpLoggerInterceptor } from './core/logger/http-logger.interceptor';

async function bootstrap() {
  // Создаем логгер для приложения
  const logger = new LoggerService();
  logger.setContext('Bootstrap');

  // Создаем приложение с настроенным логгером
  const app = await NestFactory.create(AppModule, {
    logger: logger,
    bufferLogs: true,
  });

  // Устанавливаем логгер как глобальный
  app.useLogger(logger);

  // Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Настройка CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3100',
    credentials: true,
  });

  // Префикс для всех API маршрутов
  app.setGlobalPrefix('api/v1');

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Happyness API')
    .setDescription('API для платформы Happyness')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Запуск сервера
  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Приложение Happyness успешно запущено на порту: ${port}`);
  logger.log(`Swagger документация доступна по адресу: http://localhost:${port}/api/docs`);
}

bootstrap();
