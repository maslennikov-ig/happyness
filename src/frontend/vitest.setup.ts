// Глобальные настройки для тестов Vitest
// Этот файл будет автоматически загружен перед запуском тестов

// Импортируем необходимые библиотеки для тестирования
import '@testing-library/jest-dom';

// Глобальные моки или переопределения
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Подавление консольных предупреждений во время тестов
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React does not recognize the') ||
      args[0].includes('Warning:') ||
      args[0].includes('Invalid prop'))
  ) {
    return;
  }
  originalConsoleError(...args);
}; 