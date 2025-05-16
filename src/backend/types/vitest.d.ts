/// <reference types="vitest" />
/// <reference types="vitest/globals" />

// Дополнительные типы для тестов
declare namespace Vi {
  interface Assertion {
    // Добавляем кастомные матчеры, если потребуются
  }
}

// Глобальные типы для тестов
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      // Другие переменные окружения, используемые в тестах
    }
  }
} 