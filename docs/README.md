# Документация проекта Happyness

В данной директории содержится документация проекта Happyness, включая техническую документацию, документацию по архитектуре, API-контракты, спринты и задачи.

## Структура документации

### Спринты и задачи

- [**sprints/**](./sprints/) - Документация по спринтам

  - [sprint1.md](./sprints/sprint1.md) - Описание задач первого спринта
  - [sprint2.md](./sprints/sprint2.md) - Описание задач второго спринта (будет добавлено позже)

- [**tasks/**](./tasks/) - Детальное описание задач
  - [**tasks1/**](./tasks/tasks1/) - Задачи первого спринта
    - [task21_modular_architecture.md](./tasks/tasks1/task21_modular_architecture.md) - Документация по модульной архитектуре
    - [task21_components.md](./tasks/tasks1/task21_components.md) - Описание компонентов системы
    - [task21_interactions.md](./tasks/tasks1/task21_interactions.md) - Описание взаимодействия компонентов
    - [task23.md](./tasks/tasks1/task23.md) - Задача по определению API-контрактов
    - [task23_api_contracts.md](./tasks/tasks1/task23_api_contracts.md) - Главный документ API-контрактов
    - [task23_api_versioning.md](./tasks/tasks1/task23_api_versioning.md) - Стратегия версионирования API
    - [task23_endpoints.md](./tasks/tasks1/task23_endpoints.md) - Структура эндпоинтов для ключевых сущностей
    - [task23_naming_standards.md](./tasks/tasks1/task23_naming_standards.md) - Стандарты именования эндпоинтов
    - [task23_response_formats.md](./tasks/tasks1/task23_response_formats.md) - Форматы ответов API и обработка ошибок
    - [task23_error_codes.md](./tasks/tasks1/task23_error_codes.md) - Коды ошибок и их описания
    - [task23_api_implementation.md](./tasks/tasks1/task23_api_implementation.md) - Примеры реализации API
    - [task23_integration.md](./tasks/tasks1/task23_integration.md) - Интеграция API-контрактов с компонентами проекта
    - [task23_summary.md](./tasks/tasks1/task23_summary.md) - Резюме выполненной работы по определению API-контрактов
  - [**tasks2/**](./tasks/tasks2/) - Задачи второго спринта (будет добавлено позже)

### База данных

- [**database/**](./database/) - Документация по базе данных
  - [schema.md](./database/schema.md) - Описание схемы базы данных
  - [migrations.md](./database/migrations.md) - Информация о миграциях базы данных

## Навигация по документации

### Архитектура

Для ознакомления с архитектурой системы рекомендуется начать с документа [task21_modular_architecture.md](./tasks/tasks1/task21_modular_architecture.md), который описывает модульную архитектуру системы. Затем можно перейти к документам [task21_components.md](./tasks/tasks1/task21_components.md) и [task21_interactions.md](./tasks/tasks1/task21_interactions.md) для более детального ознакомления с компонентами системы и их взаимодействием.

### API-контракты

Для ознакомления с API-контрактами системы рекомендуется начать с документа [task23_api_contracts.md](./tasks/tasks1/task23_api_contracts.md), который является главным документом API-контрактов и содержит ссылки на все остальные документы по API-контрактам.

### База данных

Для ознакомления с базой данных рекомендуется начать с документа [schema.md](./database/schema.md), который описывает схему базы данных.

## Технологии

В проекте используются следующие технологии:

- **Фронтенд**: Next.js 14, React 18, TypeScript 5
- **Бэкенд**: NestJS 10, TypeScript 5
- **База данных**: PostgreSQL 16, Prisma ORM
- **Кеширование**: Redis 7
- **Контейнеризация**: Docker, Docker Compose
- **Тестирование**: Vitest, Testing Library
- **CI/CD**: GitHub Actions

## Связь с корневым README.md

Данный README.md является дополнением к [корневому README.md](../README.md) и содержит более подробную информацию о структуре документации проекта. Корневой README.md содержит общую информацию о проекте, инструкции по установке и запуску, а также базовую структуру проекта.

## Обновление документации

При обновлении документации необходимо:

1. Обновить соответствующие документы в директории docs/
2. При необходимости обновить данный README.md
3. Проверить необходимость обновления корневого README.md
4. Обновить changelog.md в корне проекта
