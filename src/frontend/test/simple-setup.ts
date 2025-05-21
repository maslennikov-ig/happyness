import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Добавляем jest-dom матчеры к Vitest expect
expect.extend(matchers);

// Очищаем после каждого теста
afterEach(() => {
  cleanup();
});
