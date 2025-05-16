import dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config();

const config = {
  // Основные настройки приложения
  app: {
    name: 'Happyness API',
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: '/api/v1',
  },

  // Настройки базы данных
  database: {
    url: process.env.DATABASE_URL,
  },

  // Настройки JWT токенов
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Настройки CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Настройки Redis (для кэширования и сессий)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Настройки безопасности
  security: {
    saltRounds: 10, // Для хеширования паролей
    rateLimitWindow: 15 * 60 * 1000, // 15 минут
    rateLimitMax: 100, // Максимальное количество запросов
  },
};

export default config; 