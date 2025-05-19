# Модели данных проекта Happyness

## Обзор модели данных

База данных проекта Happyness построена на PostgreSQL и использует Prisma ORM для доступа к данным. Модель данных разработана с учетом требований к масштабируемости, производительности и удобству использования.

## Основные сущности

### Пользователи и аутентификация

- **User**: Базовая модель пользователя с поддержкой ролей (администратор, предприниматель, подрядчик).
- **Contractor**: Расширенный профиль для пользователей-подрядчиков с дополнительными атрибутами.

### Бизнес-сущности

- **Project**: Проекты, создаваемые предпринимателями или администраторами.
- **Request**: Запросы на выполнение работ, связанные или не связанные с проектами.
- **Proposal**: Предложения от подрядчиков на выполнение запросов.
- **Milestone**: Вехи проекта, используемые для отслеживания прогресса.
- **Task**: Задачи в рамках вех проекта.

### Коммуникации

- **Message**: Система сообщений между пользователями.
- **Notification**: Система уведомлений о событиях в системе.

### Документы и файлы

- **Document**: Документы, связанные с пользователями и проектами.
- **Attachment**: Вложения к проектам и запросам.

### Финансы

- **PaymentMethod**: Методы оплаты, привязанные к пользователям.
- **Transaction**: Транзакции, связанные с проектами и пользователями.

### Профессиональная информация

- **Review**: Отзывы о работе подрядчиков.
- **PortfolioItem**: Элементы портфолио подрядчиков.
- **Skill**: Навыки подрядчиков.
- **Category**: Категории специализаций.

### Аудит и логирование

- **ActivityLog**: Журнал активности пользователей в системе.

## Диаграмма связей

```
User <-- 1:1 --> Contractor
User <-- 1:N --> Project
User <-- 1:N --> Request
User <-- 1:N --> Message (sender)
User <-- 1:N --> Message (receiver)
User <-- 1:N --> Document
User <-- 1:N --> Review (author)
User <-- 1:N --> Review (target)
User <-- 1:N --> PortfolioItem
User <-- 1:N --> PaymentMethod
User <-- 1:N --> Transaction
User <-- 1:N --> ActivityLog
User <-- 1:N --> Notification

Contractor <-- 1:N --> Request
Contractor <-- 1:N --> Project
Contractor <-- 1:N --> Proposal
Contractor <-- 1:N --> PortfolioItem
Contractor <-- M:N --> Skill
Contractor <-- M:N --> Category

Project <-- 1:N --> Request
Project <-- 1:N --> Milestone
Project <-- 1:N --> Message
Project <-- 1:N --> Document
Project <-- 1:N --> Attachment
Project <-- 1:N --> Review
Project <-- 1:N --> Transaction
Project <-- 1:N --> ActivityLog

Request <-- 1:N --> Proposal
Request <-- 1:N --> Message
Request <-- 1:N --> Attachment
Request <-- 1:N --> ActivityLog

Proposal <-- 1:N --> Message

Milestone <-- 1:N --> Task

PaymentMethod <-- 1:N --> Transaction

Category <-- 1:N --> Category (parent-child)
```

## Индексация и производительность

Для обеспечения высокой производительности запросов в базе данных созданы следующие индексы:

1. **Индексы по внешним ключам**: на всех полях, используемых для связей между таблицами
2. **Индексы по часто используемым полям поиска**: email, роли, статусы, категории
3. **Индексы по полям сортировки**: даты создания, рейтинги, приоритеты
4. **Составные индексы**: для специфических запросов, например, (entityType, entityId)

## Стратегии Soft Delete

Для критичных сущностей (User, Contractor, Project, Request) реализована стратегия мягкого удаления через поле `deletedAt`. Это позволяет не терять данные при удалении и восстанавливать их при необходимости.

## Расширенные типы данных

1. **JSON/JSONB**: для хранения гибких структурированных данных (socialLinks, availableHours, details)
2. **Массивы**: для хранения списков (services, tags, skills)
3. **Перечисления (ENUM)**: для статусов и типов

## Изменения в расширенной схеме

В рамках задачи 1.3 (Улучшение базовых моделей данных) были внесены следующие изменения:

### Новые сущности

1. Proposal - предложения подрядчиков
2. Milestone - вехи проектов
3. Task - задачи
4. Message - сообщения
5. Notification - уведомления
6. Document - документы
7. Attachment - вложения
8. Review - отзывы
9. PortfolioItem - элементы портфолио
10. PaymentMethod - методы оплаты
11. Transaction - транзакции
12. ActivityLog - журнал активности
13. Skill - навыки
14. Category - категории

### Расширенные атрибуты существующих сущностей

1. **User**:

   - Добавлены поля phone, avatar, isActive, lastLoginAt, deletedAt
   - Добавлены новые связи с созданными сущностями

2. **Contractor**:

   - Добавлены поля specializations, experience, reviewCount, contactEmail, contactPhone, website, address, socialLinks, availableHours, deletedAt
   - Добавлены связи с Skill, Category, Proposal, PortfolioItem

3. **Project**:

   - Добавлены поля completedAt, priority, tags, visibility, deletedAt
   - Добавлены связи с Milestone, Attachment, Document, Review, Transaction, ActivityLog, Message

4. **Request**:
   - Добавлены поля category, specializationTags, requiredSkills, location, isRemote, isUrgent, deletedAt
   - Добавлены связи с Proposal, Attachment, ActivityLog, Message

### Новые перечисления (ENUM)

1. Priority - приоритеты (LOW, MEDIUM, HIGH, URGENT)
2. Visibility - видимость (PUBLIC, PRIVATE, INVITATION_ONLY)
3. ProposalStatus - статусы предложений (PENDING, ACCEPTED, REJECTED, WITHDRAWN)
4. MilestoneStatus - статусы вех (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
5. TaskStatus - статусы задач (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
6. NotificationType - типы уведомлений (INFO, WARNING, SUCCESS, ERROR)
7. PaymentType - типы платежных методов (CREDIT_CARD, BANK_ACCOUNT, ELECTRONIC_WALLET, CRYPTOCURRENCY)
8. TransactionType - типы транзакций (DEPOSIT, WITHDRAWAL, PAYMENT, REFUND, FEE)
9. TransactionStatus - статусы транзакций (PENDING, COMPLETED, FAILED, CANCELLED)

### Расширение существующих перечислений

1. **ProjectStatus**: добавлены значения ON_HOLD, REVIEW
2. **RequestStatus**: добавлены значения PENDING, REJECTED

### Индексы

Добавлены индексы для оптимизации наиболее часто используемых запросов по всем сущностям.

## Обработка зависимостей

Для всех связей между сущностями определены правила каскадного удаления или установки NULL:

1. **Cascade**: для тесно связанных сущностей (например, при удалении User удаляются все его Notification)
2. **SetNull**: для слабо связанных сущностей (например, при удалении Project поле в Message устанавливается в NULL)

## Рекомендации по работе с данными

1. **Использование транзакций**: для операций, затрагивающих несколько сущностей
2. **Пагинация**: для запросов, возвращающих большие наборы данных
3. **Фильтрация на уровне БД**: использование WHERE, а не фильтрация на уровне приложения
4. **Оптимизация запросов**: использование JOIN вместо множественных запросов
