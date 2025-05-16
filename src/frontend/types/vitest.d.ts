/// <reference types="vitest" />
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

// Расширение типов для глобальных объектов
interface Window {
  ResizeObserver: any;
}

// Дополнительные типы для тестов
declare namespace Vi {
  interface Assertion {
    // Добавляем кастомные матчеры, если потребуются
  }
} 