import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

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
  // Базовый тест на рендеринг
  it('корректно рендерится с дефолтным текстом', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    render(<ExampleButton onClick={handleClick} />);

    // Assert
    expect(screen.getByTestId('example-button')).toBeInTheDocument();
    expect(screen.getByText('Нажать')).toBeInTheDocument();
  });

  // Тест с пользовательским текстом
  it('корректно рендерится с пользовательским текстом', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    render(<ExampleButton onClick={handleClick}>Отправить</ExampleButton>);

    // Assert
    expect(screen.getByText('Отправить')).toBeInTheDocument();
  });

  // Тест на обработку клика
  it('вызывает функцию onClick при клике', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    render(<ExampleButton onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('example-button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Тест на disabled состояние
  it('не вызывает функцию onClick если кнопка disabled', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    render(<ExampleButton onClick={handleClick} disabled={true} />);
    fireEvent.click(screen.getByTestId('example-button'));

    // Assert
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByTestId('example-button')).toBeDisabled();
  });
});
