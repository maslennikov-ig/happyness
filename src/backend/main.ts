import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Глобальная валидация DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Настройка CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Приложение запущено на порту: ${port}`);
}

bootstrap(); 