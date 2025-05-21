import React from 'react';

/**
 * Размеры спиннера
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Свойства компонента Spinner
 */
export interface SpinnerProps {
  /**
   * Размер спиннера
   * @default "md"
   */
  size?: SpinnerSize;

  /**
   * Дополнительные CSS классы
   */
  className?: string;
}

/**
 * Спиннер для отображения состояния загрузки
 *
 * @example
 * <Spinner />
 * <Spinner size="lg" />
 */
export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  // Определяем размеры в пикселях на основе переданного размера
  const sizeInPixels = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeInPixels} animate-spin rounded-full border-4 border-gray-200 border-t-primary`}
        role="status"
        aria-label="Загрузка"
      />
      <span className="sr-only">Загрузка...</span>
    </div>
  );
}
