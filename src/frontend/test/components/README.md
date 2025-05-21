# Тесты компонентов UI авторизации

В этой директории находятся тесты для компонентов UI авторизации проекта Happyness.

## Структура тестов

- `login-form.test.tsx` - Тесты для компонента формы авторизации
- `register-form.test.tsx` - Тесты для компонента формы регистрации
- `register-form-step1.test.tsx` - Тесты для первого шага формы регистрации

## Запуск тестов

```bash
# Запуск тестов компонентов фронтенда
npm run test:frontend

# Запуск конкретного теста
npm run test:frontend -- components/login-form.test.tsx
```

## Подход к тестированию

Для тестирования компонентов UI используются следующие инструменты:

- **Vitest** - фреймворк тестирования
- **React Testing Library** - библиотека для тестирования React-компонентов
- **Testing Library User Event** - библиотека для симуляции взаимодействия пользователя

Тесты проверяют:

1. **Корректный рендеринг** компонентов и их элементов
2. **Валидацию форм** - проверка всех правил валидации
3. **Взаимодействие с пользователем** - клики, ввод данных, отправка форм
4. **Обработку ошибок** - правильное отображение сообщений при ошибках
5. **Интеграцию с API** - корректные вызовы API с правильными параметрами
6. **Состояние загрузки** - корректное отображение состояния загрузки
7. **Работу с localStorage** - проверка сохранения refresh-токена

## Паттерны тестирования

### AAA (Arrange-Act-Assert)

Тесты следуют паттерну AAA:

1. **Arrange** - настройка начального состояния (рендеринг компонента, мокирование зависимостей)
2. **Act** - выполнение действия (клик по кнопке, ввод текста)
3. **Assert** - проверка результата (наличие элементов, проверка вызовов API)

### Мокирование

Тесты используют мокирование для:

- API-вызовов (`authApi`)
- Навигации (`useRouter`)
- Хранилища (`localStorage`)

## Пример теста

```typescript
it('вызывает API при корректном заполнении формы', async () => {
  // Arrange - мокирование и рендеринг
  const mockLoginResponse = { /* ... */ };
  (authApi.login as any).mockResolvedValue(mockLoginResponse);
  render(<LoginForm />);

  // Act - заполнение и отправка формы
  await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/Пароль/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /Войти/i }));

  // Assert - проверка вызова API
  await waitFor(() => {
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    });
  });
});
```
