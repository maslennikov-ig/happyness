// setup-dom.ts - настройка DOM окружения для тестов
import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

// Создаем JSDOM окружение
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true, // Эмулируем визуальный браузер
  runScripts: 'dangerously',
});

// Устанавливаем глобальные переменные из JSDOM
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = {
  userAgent: 'node.js',
} as Navigator;

// Копируем все свойства из window в global
Object.keys(dom.window).forEach(property => {
  const key = property as keyof typeof globalThis;
  if (typeof global[key] === 'undefined') {
    (global[key] as any) = dom.window[property as keyof typeof Window];
  }
});

// Мокируем методы, которые не реализованы в JSDOM
global.HTMLElement.prototype.scrollIntoView = vi.fn();
global.HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
}));

// Исправления для ResizeObserver и IntersectionObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];

  constructor(callback: IntersectionObserverCallback) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Необходимо добавить тип для IntersectionObserver
declare global {
  interface Window {
    IntersectionObserver: typeof IntersectionObserver;
  }
}

// Реализация window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Реализация requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
};

// Остальные DOM-специфичные методы и объекты, которые могут понадобиться
