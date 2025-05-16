# Happyness

Happyness - это современная система управления проектами и подрядчиками, разработанная для эффективного взаимодействия между клиентами и исполнителями.

## Функциональные возможности

- **Управление пользователями**: регистрация, аутентификация, управление профилями
- **Управление проектами**: создание, редактирование, удаление проектов
- **Управление подрядчиками**: поиск, оценка, найм подрядчиков
- **Управление запросами**: создание запросов на выполнение работ
- **Коммуникация**: встроенная система обмена сообщениями
- **Отчетность**: генерация отчетов о выполненных работах

## Установка и запуск

### Предварительные требования

- Node.js 18+
- Docker и Docker Compose
- Git

### Установка

1. Клонируйте репозиторий:

   ```bash
   git clone https://github.com/yourusername/happyness.git
   cd happyness
   ```

2. Установите зависимости:

   ```bash
   npm install
   ```

3. Создайте файл .env на основе .env.example:

   ```bash
   cp .env.example .env
   ```

4. Запустите базы данных с помощью Docker Compose:

   ```bash
   docker-compose up -d
   ```

5. Примените миграции базы данных:
   ```bash
   npx prisma migrate deploy
   ```

### Запуск

#### Режим разработки

```bash
npm run dev
```

#### Режим production

```bash
npm run build
npm start
```

## Структура проекта

```
Happyness/
├── .github/                # GitHub Actions workflows
├── config/                 # Конфигурационные файлы
├── docker/                 # Docker-конфигурации
├── docs/                   # Документация проекта
│   ├── database/           # Документация по базе данных
│   ├── sprints/            # Документация по спринтам
│   └── tasks/              # Детальное описание задач
│       ├── tasks1/         # Задачи первого спринта
│       │   ├── task21_modular_architecture.md  # Документация по модульной архитектуре
│       │   ├── task21_components.md            # Описание компонентов системы
│       │   ├── task21_interactions.md          # Описание взаимодействия компонентов
│       │   ├── task23.md                       # Задача по определению API-контрактов
│       │   ├── task23_api_contracts.md         # Главный документ API-контрактов
│       │   ├── task23_api_versioning.md        # Стратегия версионирования API
│       │   ├── task23_endpoints.md             # Структура эндпоинтов для ключевых сущностей
│       │   ├── task23_naming_standards.md      # Стандарты именования эндпоинтов
│       │   ├── task23_response_formats.md      # Форматы ответов API и обработка ошибок
│       │   ├── task23_error_codes.md           # Коды ошибок и их описания
│       │   ├── task23_api_implementation.md    # Примеры реализации API
│       │   ├── task23_integration.md           # Интеграция API-контрактов с компонентами проекта
│       │   └── task23_summary.md               # Резюме выполненной работы по определению API-контрактов
│       └── tasks2/         # Задачи второго спринта (будет добавлено позже)
├── prisma/                 # Prisma ORM
│   ├── migrations/         # Миграции базы данных
│   └── schema.prisma       # Схема базы данных
├── src/                    # Исходный код
│   ├── backend/            # Бэкенд (NestJS)
│   │   ├── controllers/    # Контроллеры
│   │   ├── core/           # Ядро приложения
│   │   ├── modules/        # Модули
│   │   └── test/           # Тесты
│   └── frontend/           # Фронтенд (Next.js)
│       ├── app/            # Next.js App Router
│       ├── components/     # React-компоненты
│       ├── hooks/          # React-хуки
│       ├── lib/            # Утилиты и хелперы
│       ├── styles/         # Стили
│       └── test/           # Тесты
├── .env.example            # Пример файла переменных окружения
├── .eslintrc.js           # Конфигурация ESLint
├── .gitignore             # Игнорируемые файлы и директории для Git
├── .prettierrc            # Конфигурация Prettier
├── changelog.md           # История изменений
├── docker-compose.yml     # Docker Compose конфигурация
├── nest-cli.json          # Конфигурация NestJS CLI
├── next.config.js         # Конфигурация Next.js
├── package.json           # Зависимости и скрипты
├── tsconfig.json          # Конфигурация TypeScript
└── README.md              # Этот файл
```

## Документация

Более подробная документация доступна в директории [docs/](./docs/):

- [Документация по архитектуре](./docs/tasks/tasks1/task21_modular_architecture.md)
- [Документация по API-контрактам](./docs/tasks/tasks1/task23_api_contracts.md)
- [Документация по базе данных](./docs/database/schema.md)

## Разработка

### Стиль кода

Проект использует ESLint и Prettier для обеспечения единообразия стиля кода. Запустите линтеры перед коммитом:

```bash
npm run lint
```

### Тестирование

```bash
# Запуск тестов бэкенда
npm run test:backend

# Запуск тестов фронтенда
npm run test:frontend

# Запуск e2e-тестов
npm run test:e2e

# Запуск всех тестов
npm run test
```

## Лицензия

[MIT](LICENSE)

## Контакты

Для вопросов и предложений, пожалуйста, создайте issue в репозитории или свяжитесь с нами по электронной почте: example@example.com
