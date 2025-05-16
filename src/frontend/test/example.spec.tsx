import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Простой компонент для тестирования
const ExampleComponent = () => {
  return <div data-testid="example">Привет, мир!</div>;
};

describe('Example Component', () => {
  it('рендерится с текстом "Привет, мир!"', () => {
    render(<ExampleComponent />);
    const element = screen.getByTestId('example');
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe('Привет, мир!');
  });
}); 