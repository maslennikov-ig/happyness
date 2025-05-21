import { test, expect } from '@playwright/test';

test('пользователь может перейти на страницу входа', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /войти/i }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: /вход в аккаунт/i })).toBeVisible();
});

test('пользователь может перейти на страницу регистрации', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /регистрация/i }).click();
  await expect(page).toHaveURL('/register');
  await expect(page.getByRole('heading', { name: /создание аккаунта/i })).toBeVisible();
});

test('пользователь может перейти со страницы логина на страницу регистрации', async ({ page }) => {
  await page.goto('/login');

  // Кликаем на ссылку "Зарегистрироваться"
  await page.getByText('Зарегистрироваться').click();

  // Проверяем, что перешли на страницу регистрации
  await expect(page).toHaveURL(/register/);
  await expect(page.getByText('Создать аккаунт')).toBeVisible();
});

test('пользователь может перейти со страницы регистрации на страницу логина', async ({ page }) => {
  await page.goto('/register');

  // Кликаем на ссылку "Назад ко входу"
  await page.getByRole('button', { name: /Назад ко входу/i }).click();

  // Проверяем, что перешли на страницу логина
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText('Вход в аккаунт')).toBeVisible();
});

test('форма входа показывает ошибку при некорректных данных', async ({ page }) => {
  await page.goto('/login');

  // Вводим некорректный email
  await page.getByLabel('Email').fill('invalid-email');
  await page.getByLabel('Пароль').fill('password123');
  await page.getByRole('button', { name: /войти/i }).click();

  // Проверяем сообщение об ошибке
  await expect(page.getByText(/введите корректный email/i)).toBeVisible();
});

test('форма регистрации показывает ошибку при некорректных данных', async ({ page }) => {
  await page.goto('/register');

  // Пытаемся отправить пустую форму
  await page.getByRole('button', { name: /далее/i }).click();

  // Проверяем сообщения об ошибках
  await expect(page.getByText(/email не может быть пустым/i)).toBeVisible();
  await expect(page.getByText(/пароль не может быть пустым/i)).toBeVisible();
});

test('пользователь может заполнить форму регистрации и перейти к следующему шагу', async ({
  page,
}) => {
  await page.goto('/register');

  // Заполняем форму первого шага
  await page.getByLabel(/Email/i).fill('test@example.com');
  await page.getByLabel(/^Пароль$/i).fill('Password123');
  await page.getByLabel(/Подтвердите пароль/i).fill('Password123');

  // Нажимаем кнопку "Далее"
  await page.getByRole('button', { name: /Далее/i }).click();

  // Проверяем, что перешли ко второму шагу
  await expect(page.getByText('Шаг 2 из 3: Личная информация')).toBeVisible();
});

test('пользователь может заполнить все шаги регистрации', async ({ page }) => {
  await page.goto('/register');

  // Заполняем форму первого шага
  await page.getByLabel(/Email/i).fill('test@example.com');
  await page.getByLabel(/^Пароль$/i).fill('Password123');
  await page.getByLabel(/Подтвердите пароль/i).fill('Password123');
  await page.getByRole('button', { name: /Далее/i }).click();

  // Заполняем форму второго шага
  await expect(page.getByText('Шаг 2 из 3: Личная информация')).toBeVisible();
  await page.getByLabel(/Ваше имя/i).fill('Иван Иванов');
  await page.getByRole('button', { name: /Выберите вашу роль/i }).click();
  await page.getByText('Предприниматель').click();
  await page.getByRole('button', { name: /Далее/i }).click();

  // Проверяем, что перешли к третьему шагу
  await expect(page.getByText('Шаг 3 из 3: Завершение регистрации')).toBeVisible();

  // Отмечаем чекбокс и нажимаем кнопку "Зарегистрироваться"
  await page.getByRole('checkbox').check();

  // Примечание: мы не нажимаем кнопку "Зарегистрироваться" в E2E тесте,
  // чтобы не создавать реальных пользователей в базе данных.
  // В реальном сценарии мы бы мокировали API или использовали тестовую БД.
});

test('пользователь может вернуться на предыдущий шаг регистрации', async ({ page }) => {
  await page.goto('/register');

  // Заполняем форму первого шага и переходим ко второму
  await page.getByLabel(/Email/i).fill('test@example.com');
  await page.getByLabel(/^Пароль$/i).fill('Password123');
  await page.getByLabel(/Подтвердите пароль/i).fill('Password123');
  await page.getByRole('button', { name: /Далее/i }).click();

  // Проверяем, что перешли ко второму шагу
  await expect(page.getByText('Шаг 2 из 3: Личная информация')).toBeVisible();

  // Нажимаем кнопку "Назад"
  await page.getByRole('button', { name: /Назад/i }).click();

  // Проверяем, что вернулись к первому шагу
  await expect(page.getByText('Шаг 1 из 3: Основная информация')).toBeVisible();

  // Проверяем, что данные сохранились
  await expect(page.getByLabel(/Email/i)).toHaveValue('test@example.com');
  await expect(page.getByLabel(/^Пароль$/i)).toHaveValue('Password123');
  await expect(page.getByLabel(/Подтвердите пароль/i)).toHaveValue('Password123');
});
