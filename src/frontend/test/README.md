# Тесты frontend

## Структура

- Все unit- и интеграционные тесты для React-компонентов располагаются в этой папке.
- Используется Vitest + React Testing Library.
- Для E2E тестов рекомендуется Playwright (см. e2e/README.md).

## Пример запуска

```bash
npm run test:frontend
```

## Пример теста

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const ExampleComponent = () => <div data-testid="example">Привет, мир!</div>;

describe('ExampleComponent', () => {
  it('рендерит текст', () => {
    render(<ExampleComponent />);
    expect(screen.getByTestId('example')).toHaveTextContent('Привет, мир!');
  });
});
```

## Рекомендации

- Используйте AAA (Arrange-Act-Assert) подход.
- Для сложных компонентов используйте beforeEach для подготовки.
- Для моков используйте возможности Vitest и Testing Library.
- Все комментарии — на русском языке.
