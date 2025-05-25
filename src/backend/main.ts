import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from './core/logger/logger.service';
import { HttpLoggerInterceptor } from './core/logger/http-logger.interceptor';
import * as cookieParser from 'cookie-parser';

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

  // Подключаем middleware для парсинга cookies
  app.use(cookieParser(process.env.COOKIE_SECRET || 'your-cookie-secret'));

  // Настройка CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3100',
    credentials: true,
  });

  // Префикс для всех API маршрутов
  app.setGlobalPrefix('api');

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Happyness API')
    .setDescription('API для системы управления проектами и подрядчиками Happyness')
    .setVersion('1.0')
    .addTag('auth', 'Операции аутентификации и управления пользователями')
    .addTag('projects', 'Операции управления проектами')
    .addTag('contractors', 'Операции управления подрядчиками')
    .addTag('requests', 'Операции управления запросами')
    .addTag('users', 'Операции управления пользователями')
    .addTag('users-legacy', 'Устаревшие операции управления пользователями')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Введите JWT токен',
      in: 'header',
    })
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description: 'Refresh токен для обновления JWT',
    })
    .setContact('Happyness Team', 'https://happyness.example.com', 'dev@happyness.example.com')
    .setExternalDoc('JSON документация', '/api/docs-json')
    .build();

  // Загрузка статической документации из файла
  const fs = require('fs');
  const path = require('path');
  const swaggerJsonPath = path.resolve(__dirname, 'swagger.json');

  let document;
  try {
    if (fs.existsSync(swaggerJsonPath)) {
      // Если файл swagger.json существует, используем его
      const swaggerJson = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));
      document = swaggerJson;
      logger.log('Загружена статическая Swagger документация из файла');
    } else {
      // Иначе генерируем документацию динамически
      document = SwaggerModule.createDocument(app, config);
      logger.log('Сгенерирована динамическая Swagger документация');

      // Сохраняем сгенерированную документацию в файл для будущего использования
      if (process.env.NODE_ENV === 'development') {
        try {
          fs.writeFileSync(swaggerJsonPath, JSON.stringify(document, null, 2));
          logger.log('Сохранена Swagger документация в файл swagger.json');
        } catch (error) {
          logger.error(`Ошибка при сохранении Swagger документации: ${error.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Ошибка при работе с Swagger документацией: ${error.message}`);
    // Если возникла ошибка, генерируем документацию динамически
    document = SwaggerModule.createDocument(app, config);
  }

  // Настройка основного Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      deepLinking: true,
    },
    customSiteTitle: 'Happyness API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: 'https://happyness.example.com/favicon.ico',
  });

  // Настройка дополнительного эндпоинта для JSON документации
  SwaggerModule.setup('api/docs-json', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  // Запуск сервера
  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Приложение Happyness успешно запущено на порту: ${port}`);
  logger.log(`Swagger документация доступна по адресу: http://localhost:${port}/api/docs`);
}

bootstrap();
