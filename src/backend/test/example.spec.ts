import { describe, it, expect } from 'vitest';

// Простая функция для тестирования
function sum(a: number, b: number): number {
  return a + b;
}

describe('Sum function', () => {
  it('корректно складывает два положительных числа', () => {
    expect(sum(2, 3)).toBe(5);
  });

  it('корректно складывает положительное и отрицательное число', () => {
    expect(sum(5, -3)).toBe(2);
  });

  it('корректно складывает два отрицательных числа', () => {
    expect(sum(-2, -3)).toBe(-5);
  });
}); 