# Рекомендации по структуре проекта Happyness

## Общая структура проекта

```
Happyness/
├── .github/                  # GitHub конфигурация (CI/CD, workflows)
├── config/                   # Конфигурационные файлы
├── docker/                   # Docker-конфигурация для разработки
│   ├── postgres/             # Конфигурация PostgreSQL
│   └── redis/                # Конфигурация Redis
├── docs/                     # Документация проекта
├── prisma/                   # Prisma схемы и миграции
├── src/                      # Исходный код приложения
│   ├── backend/              # Код серверной части (NestJS)
│   │   ├── core/             # Ядро системы
│   │   ├── modules/          # Функциональные модули
│   │   ├── common/           # Общие компоненты
│   │   └── test/             # Тесты
│   ├── frontend/             # Код клиентской части (Next.js)
│   │   ├── core/             # Ядро клиентской части
│   │   ├── modules/          # Функциональные модули
│   │   ├── components/       # UI компоненты
│   │   └── test/             # Тесты
│   └── config/               # Общие конфигурации
├── scripts/                  # Скрипты для разработки и деплоя
├── .env.example              # Пример переменных окружения
├── .eslintrc.js              # Конфигурация ESLint
├── .prettierrc               # Конфигурация Prettier
├── docker-compose.yml        # Docker Compose конфигурация
├── package.json              # Зависимости и скрипты
├── README.md                 # Документация проекта
└── tsconfig.json             # Конфигурация TypeScript
```

## Структура Backend (NestJS)

```
src/backend/
├── core/                     # Ядро системы
│   ├── app.module.ts         # Корневой модуль приложения
│   ├── config/               # Конфигурация приложения
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   ├── database/             # Работа с базой данных
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   ├── auth/                 # Аутентификация и авторизация
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/       # Стратегии аутентификации
│   │   └── guards/           # Guards для защиты маршрутов
│   ├── users/                # Управление пользователями
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.controller.ts
│   ├── companies/            # Управление компаниями
│   │   ├── companies.module.ts
│   │   ├── companies.service.ts
│   │   └── companies.controller.ts
│   ├── module-system/        # Система модулей
│   │   ├── module.interface.ts
│   │   ├── base-module.ts
│   │   ├── module-registry.ts
│   │   └── module-loader.ts
│   └── events/               # Система событий
│       ├── event-bus.ts
│       └── event-types.ts
├── common/                   # Общие компоненты
│   ├── decorators/           # Пользовательские декораторы
│   ├── filters/              # Фильтры исключений
│   ├── guards/               # Общие guards
│   ├── interceptors/         # Перехватчики
│   ├── pipes/                # Пайпы для валидации
│   ├── dto/                  # Общие DTO
│   └── utils/                # Утилиты
├── modules/                  # Функциональные модули
│   ├── requests/             # Модуль запросов
│   │   ├── requests.module.ts
│   │   ├── requests.service.ts
│   │   ├── requests.controller.ts
│   │   ├── dto/              # DTO для запросов
│   │   ├── entities/         # Модели данных
│   │   └── repositories/     # Репозитории
│   ├── chat/                 # Модуль чата
│   │   ├── chat.module.ts
│   │   ├── chat.service.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.gateway.ts   # WebSocket шлюз
│   │   ├── dto/
│   │   └── entities/
│   ├── contractors/          # Модуль подрядчиков
│   │   ├── contractors.module.ts
│   │   ├── contractors.service.ts
│   │   ├── contractors.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── templates/            # Модуль шаблонов
│   │   ├── templates.module.ts
│   │   ├── templates.service.ts
│   │   ├── templates.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── payments/             # Модуль платежей
│   │   ├── payments.module.ts
│   │   ├── payments.service.ts
│   │   ├── payments.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   └── analytics/            # Модуль аналитики
│       ├── analytics.module.ts
│       ├── analytics.service.ts
│       ├── analytics.controller.ts
│       ├── dto/
│       └── entities/
├── shared/                   # Общие сервисы
│   ├── notification/         # Сервис уведомлений
│   │   ├── notification.module.ts
│   │   └── notification.service.ts
│   ├── file/                 # Сервис работы с файлами
│   │   ├── file.module.ts
│   │   └── file.service.ts
│   └── cache/                # Сервис кеширования
│       ├── cache.module.ts
│       └── cache.service.ts
├── main.ts                   # Точка входа приложения
└── types/                    # Типы и интерфейсы
    ├── common.types.ts
    └── module.types.ts
```

## Структура Frontend (Next.js)

```
src/frontend/
├── core/                     # Ядро клиентской части
│   ├── auth/                 # Аутентификация
│   │   ├── auth-provider.tsx
│   │   ├── use-auth.ts
│   │   └── auth-utils.ts
│   ├── api/                  # API клиент
│   │   ├── api-client.ts
│   │   ├── hooks/            # React Query хуки
│   │   └── websocket-client.ts
│   ├── state/                # Управление состоянием
│   │   ├── store.ts
│   │   └── slices/
│   └── module-system/        # Система модулей
│       ├── module-registry.ts
│       ├── module-loader.ts
│       └── module-context.tsx
├── components/               # UI компоненты
│   ├── ui/                   # Базовые UI компоненты
│   │   ├── button/
│   │   ├── input/
│   │   ├── modal/
│   │   └── ...
│   ├── layout/               # Компоненты макета
│   │   ├── header/
│   │   ├── sidebar/
│   │   ├── footer/
│   │   └── ...
│   ├── forms/                # Компоненты форм
│   │   ├── form-field/
│   │   ├── form-select/
│   │   └── ...
│   └── shared/               # Общие компоненты
│       ├── loading/
│       ├── error/
│       └── ...
├── modules/                  # Функциональные модули
│   ├── requests/             # Модуль запросов
│   │   ├── components/       # Компоненты модуля
│   │   ├── hooks/            # Хуки модуля
│   │   ├── types/            # Типы модуля
│   │   └── index.ts          # Точка входа модуля
│   ├── chat/                 # Модуль чата
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── contractors/          # Модуль подрядчиков
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── templates/            # Модуль шаблонов
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   └── ...
├── pages/                    # Страницы Next.js
│   ├── _app.tsx              # Корневой компонент
│   ├── _document.tsx         # Документ HTML
│   ├── index.tsx             # Главная страница
│   ├── auth/                 # Страницы аутентификации
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── dashboard/            # Страницы дашборда
│   │   ├── index.tsx
│   │   └── [...path].tsx
│   └── ...
├── public/                   # Статические файлы
│   ├── images/
│   ├── fonts/
│   └── ...
├── styles/                   # Стили
│   ├── globals.css
│   ├── theme.ts
│   └── ...
├── utils/                    # Утилиты
│   ├── date.ts
│   ├── format.ts
│   ├── validation.ts
│   └── ...
└── types/                    # Типы и интерфейсы
    ├── common.types.ts
    └── api.types.ts
```

## Структура Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Модели аутентификации и пользователей
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  firstName     String?
  lastName      String?
  role          Role      @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  company       Company?  @relation(fields: [companyId], references: [id])
  companyId     String?
  
  // Связи с другими моделями
  requests      Request[]
  messages      Message[]
  notifications Notification[]
}

model Company {
  id            String    @id @default(uuid())
  name          String
  description   String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Связи с другими моделями
  users         User[]
  requests      Request[]
}

enum Role {
  ADMIN
  MANAGER
  USER
  CONTRACTOR
}

// Модели функциональных модулей
model Request {
  id            String    @id @default(uuid())
  title         String
  description   String
  status        RequestStatus
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  user          User      @relation(fields: [userId], references: [id])
  userId        String
  company       Company   @relation(fields: [companyId], references: [id])
  companyId     String
  
  // Связи с другими моделями
  messages      Message[]
  contractors   ContractorRequest[]
}

enum RequestStatus {
  NEW
  IN_PROGRESS
  WAITING_APPROVAL
  COMPLETED
  CANCELLED
}

model Message {
  id            String    @id @default(uuid())
  content       String
  createdAt     DateTime  @default(now())
  user          User      @relation(fields: [userId], references: [id])
  userId        String
  request       Request   @relation(fields: [requestId], references: [id])
  requestId     String
}

model Contractor {
  id            String    @id @default(uuid())
  name          String
  description   String?
  specialization String[]
  rating        Float     @default(0)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Связи с другими моделями
  requests      ContractorRequest[]
}

model ContractorRequest {
  contractor    Contractor @relation(fields: [contractorId], references: [id])
  contractorId  String
  request       Request    @relation(fields: [requestId], references: [id])
  requestId     String
  status        ContractorRequestStatus
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  @@id([contractorId, requestId])
}

enum ContractorRequestStatus {
  INVITED
  ACCEPTED
  DECLINED
  COMPLETED
}

model Template {
  id            String    @id @default(uuid())
  title         String
  content       String
  category      String
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Notification {
  id            String    @id @default(uuid())
  title         String
  content       String
  isRead        Boolean   @default(false)
  createdAt     DateTime  @default(now())
  user          User      @relation(fields: [userId], references: [id])
  userId        String
}

model Payment {
  id            String    @id @default(uuid())
  amount        Float
  currency      String    @default("RUB")
  status        PaymentStatus
  externalId    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

## Рекомендации по организации кода

### Общие принципы

1. **Монорепозиторий**
   - Хранить frontend и backend в одном репозитории
   - Использовать общие типы и интерфейсы
   - Обеспечить согласованность версий

2. **Модульная структура**
   - Организовать код по функциональным модулям
   - Каждый модуль должен быть самодостаточным
   - Минимизировать зависимости между модулями

3. **Типизация**
   - Использовать TypeScript для всех компонентов
   - Определять четкие интерфейсы между модулями
   - Избегать использования `any`

4. **Тестирование**
   - Писать модульные тесты для каждого компонента
   - Создавать интеграционные тесты для проверки взаимодействия модулей
   - Использовать E2E тесты для критических путей

### Backend (NestJS)

1. **Модульная организация**
   - Использовать модульную систему NestJS
   - Каждый функциональный модуль в отдельной директории
   - Четко определять публичные API модулей

2. **Слоистая архитектура**
   - Controller -> Service -> Repository
   - Контроллеры отвечают только за обработку HTTP-запросов
   - Сервисы содержат бизнес-логику
   - Репозитории отвечают за доступ к данным

3. **Dependency Injection**
   - Использовать DI для слабого связывания компонентов
   - Инжектировать зависимости через конструкторы
   - Использовать абстракции вместо конкретных реализаций

4. **Обработка ошибок**
   - Создать единую систему обработки ошибок
   - Использовать фильтры исключений
   - Стандартизировать формат ответов об ошибках

5. **Валидация**
   - Использовать DTO для валидации входных данных
   - Применять пайпы для преобразования данных
   - Добавить документацию API с помощью Swagger

### Frontend (Next.js)

1. **Компонентный подход**
   - Разделять компоненты по ответственности
   - Использовать атомарный дизайн (атомы, молекулы, организмы)
   - Создавать переиспользуемые компоненты

2. **Управление состоянием**
   - Использовать React Query для серверного состояния
   - Применять Redux/Context API для глобального состояния
   - Локальное состояние хранить в компонентах

3. **Стилизация**
   - Использовать Tailwind CSS для стилизации
   - Создать систему дизайна с переменными
   - Обеспечить консистентность UI

4. **Маршрутизация**
   - Использовать файловую систему маршрутизации Next.js
   - Организовать страницы логически
   - Реализовать защищенные маршруты

5. **Производительность**
   - Оптимизировать загрузку изображений
   - Использовать Server Components где возможно
   - Применять кеширование и мемоизацию

### Общие рекомендации

1. **Документация**
   - Документировать архитектуру и компоненты
   - Добавлять JSDoc комментарии к функциям
   - Поддерживать README в актуальном состоянии

2. **Код-стайл**
   - Использовать ESLint и Prettier
   - Следовать единому стилю кода
   - Проводить код-ревью

3. **CI/CD**
   - Настроить автоматические тесты
   - Использовать линтеры в пайплайне
   - Автоматизировать деплой

4. **Мониторинг и логирование**
   - Внедрить систему логирования
   - Настроить мониторинг производительности
   - Отслеживать ошибки в production 