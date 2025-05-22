# Документация проекта Happyness

В данной директории содержится документация проекта Happyness, включая техническую документацию, документацию по архитектуре, API-контракты, спринты и задачи.

## Структура документации

### Спринты и задачи

- [**sprints/**](./sprints/) - Документация по спринтам
  - [sprint1.md](./sprints/sprint1.md) - Описание задач первого спринта
  - [sprint2.md](./sprints/sprint2.md) - Описание задач второго спринта
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
  - [**tasks2/**](./tasks/tasks2/) - Задачи второго спринта
    - [task13.md](./tasks/tasks2/task13.md) - Улучшение базовых моделей данных
    - [task31.md](./tasks/tasks2/task31.md) - Задача проектирования системы аутентификации
    - [task31_auth_components.md](./tasks/tasks2/task31_auth_components.md) - Компоненты системы аутентификации
    - [task31_auth_flows.md](./tasks/tasks2/task31_auth_flows.md) - Потоки аутентификации с диаграммами последовательности
    - [task31_jwt_structure.md](./tasks/tasks2/task31_jwt_structure.md) - Структура JWT-токенов
    - [task31_refresh_tokens.md](./tasks/tasks2/task31_refresh_tokens.md) - Механизм Refresh токенов
    - [task31_client_storage.md](./tasks/tasks2/task31_client_storage.md) - Стратегия безопасного хранения JWT на клиентской стороне

### База данных

- [**database/**](./database/) - Документация по базе данных
  - [README.md](./database/README.md) - Обзор документации по базе данных
  - [**models/**](./database/models/) - Документация по моделям данных
    - [README.md](./database/models/README.md) - Обзор моделей данных
    - [diagram.md](./database/models/diagram.md) - Диаграмма ER в формате Mermaid

### Инструменты

- [**context7.md**](./context7.md) - Руководство по использованию Context7 для доступа к документации библиотек:
  - NestJS - документация по серверному фреймворку
  - Next.js - документация по клиентскому фреймворку
  - Prisma ORM - документация по работе с базой данных

## Навигация по документации

### Основные документы

- [**Архитектура**](./architecture.md) - обзор архитектуры и ссылки на детальные документы
- [**Модули**](./modules.md) - руководство по модульной системе
- [**База данных**](./database/README.md) - документация по моделям данных и схеме
- [**Context7**](./context7.md) - руководство по использованию Context7 для доступа к документации библиотек
- [**CI/CD**](./ci-cd.md) - настройка рабочих процессов
- [**Git Workflow**](./git-workflow.md) - правила ветвления и коммитов
- [**Roadmap**](./Roadmap.md) - план развития проекта
- [**Changelog**](../changelog.md) - история изменений (весь changelog теперь хранится в корне проекта)
- [**Тестирование**](./test-guide.md) - руководство по тестированию приложения
- [**Аутентификация**](./authentication.md) - документация по системе аутентификации с JWT

Этот файл — index по внутренней документации. Основная информация по установке, структуре и функциональности находится в [корневом README](../README.md).
