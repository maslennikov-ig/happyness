/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Пример простого компонента для тестирования
const ExampleButton = ({
  onClick,
  children = 'Нажать',
  disabled = false,
}: {
  onClick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}) => (
  <button onClick={onClick} disabled={disabled} data-testid="example-button">
    {children}
  </button>
);

describe('ExampleButton компонент (модульный)', () => {
  // Очищаем DOM после каждого теста
  afterEach(() => {
    cleanup();
  });

  // Базовый тест на рендеринг
  it('корректно рендерится с дефолтным текстом', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    const { getByTestId, getByText } = render(<ExampleButton onClick={handleClick} />);

    // Assert
    expect(getByTestId('example-button')).toBeDefined();
    expect(getByText('Нажать')).toBeDefined();
  });

  // Тест с пользовательским текстом
  it('корректно рендерится с пользовательским текстом', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    const { getByText } = render(<ExampleButton onClick={handleClick}>Отправить</ExampleButton>);

    // Assert
    expect(getByText('Отправить')).toBeDefined();
  });

  // Тест на обработку клика
  it('вызывает функцию onClick при клике', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    const { getByTestId } = render(<ExampleButton onClick={handleClick} />);
    fireEvent.click(getByTestId('example-button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Тест на disabled состояние
  it('не вызывает функцию onClick если кнопка disabled', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    const { getByTestId } = render(<ExampleButton onClick={handleClick} disabled={true} />);
    fireEvent.click(getByTestId('example-button'));

    // Assert
    expect(handleClick).not.toHaveBeenCalled();
    expect(getByTestId('example-button').hasAttribute('disabled')).toBe(true);
  });
});
