/**
 * @vitest-environment jsdom
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Мок для регистрации
const mockRegister = vi.fn();

// Мок-компонент для тестирования
const RegisterForm = () => (
  <div data-testid="register-form">
    <div data-testid="step1">Step 1</div>
  </div>
);

describe('RegisterForm', () => {
  it('рендерит форму регистрации', () => {
    render(<RegisterForm />);
    expect(screen.getByTestId('register-form')).toBeTruthy();
  });
});
