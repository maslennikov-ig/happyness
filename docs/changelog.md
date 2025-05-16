# Changelog

Все значимые изменения проекта будут документироваться в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Базовая настройка окружения разработки
- Docker-контейнеры для разработки (Next.js, NestJS, PostgreSQL, Redis)
- Конфигурационные файлы для TypeScript (frontend и backend)
- Шаблоны переменных окружения (.env.example)
- Настройка Vitest для тестирования вместо Jest
- Примеры тестов для frontend и backend
- Файлы с типами для Vitest в frontend и backend

### Changed
- Обновлены зависимости в package.json до последних версий
- Замена Jest на Vitest для тестирования
- Обновлены конфигурационные файлы Vitest с учетом типов
- Исправлены проблемы с типизацией в тестах

## [0.1.0] - 2025-05-15
### Added
- Инициализация проекта
- Базовая структура репозитория 