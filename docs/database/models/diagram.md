# Диаграмма базы данных

Эта диаграмма показывает основные сущности и связи между ними в базе данных проекта Happyness.

## Диаграмма ER

```mermaid
erDiagram
    User {
        string id PK
        string email
        string name
        string password
        enum role
        string phone
        string avatar
        boolean isActive
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Contractor {
        string id PK
        string userId FK
        string companyName
        string description
        string[] services
        string[] specializations
        int experience
        float rating
        int reviewCount
        boolean verified
        string contactEmail
        string contactPhone
        string website
        string address
        json socialLinks
        json availableHours
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Project {
        string id PK
        string title
        string description
        enum status
        float budget
        datetime startDate
        datetime endDate
        datetime completedAt
        enum priority
        string[] tags
        enum visibility
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
        string ownerId FK
        string contractorId FK
    }

    Request {
        string id PK
        string title
        string description
        float budget
        datetime deadline
        enum status
        string category
        string[] specializationTags
        string[] requiredSkills
        string location
        boolean isRemote
        boolean isUrgent
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
        string ownerId FK
        string projectId FK
        string contractorId FK
    }

    Proposal {
        string id PK
        string requestId FK
        string contractorId FK
        float price
        string description
        int estimatedDays
        enum status
        datetime createdAt
        datetime updatedAt
    }

    Milestone {
        string id PK
        string projectId FK
        string title
        string description
        datetime dueDate
        datetime completedAt
        enum status
        float amount
        int order
        datetime createdAt
        datetime updatedAt
    }

    Task {
        string id PK
        string milestoneId FK
        string title
        string description
        enum status
        datetime dueDate
        datetime completedAt
        string assignedTo
        enum priority
        datetime createdAt
        datetime updatedAt
    }

    Message {
        string id PK
        string content
        string senderId FK
        string receiverId FK
        string projectId FK
        string requestId FK
        string proposalId FK
        datetime readAt
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        string id PK
        string userId FK
        enum type
        string title
        string content
        boolean isRead
        string relatedEntityId
        string relatedEntityType
        datetime createdAt
    }

    Document {
        string id PK
        string title
        string description
        string fileUrl
        string fileType
        int fileSize
        string userId FK
        string projectId FK
        datetime createdAt
        datetime updatedAt
    }

    Attachment {
        string id PK
        string filename
        string fileUrl
        string fileType
        int fileSize
        string projectId FK
        string requestId FK
        datetime createdAt
    }

    Review {
        string id PK
        string authorId FK
        string targetId FK
        string projectId FK
        float rating
        string comment
        datetime createdAt
        datetime updatedAt
    }

    PortfolioItem {
        string id PK
        string title
        string description
        string imageUrl
        string projectUrl
        datetime completionDate
        string userId FK
        string contractorId FK
        string[] skills
        datetime createdAt
        datetime updatedAt
    }

    PaymentMethod {
        string id PK
        string userId FK
        enum type
        string provider
        string accountNumber
        datetime expiryDate
        boolean isDefault
        datetime createdAt
        datetime updatedAt
    }

    Transaction {
        string id PK
        string userId FK
        string projectId FK
        string paymentMethodId FK
        float amount
        string currency
        enum type
        enum status
        string description
        string externalId
        datetime createdAt
        datetime completedAt
    }

    ActivityLog {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        json details
        string projectId FK
        string requestId FK
        string ipAddress
        string userAgent
        datetime createdAt
    }

    Skill {
        string id PK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    Category {
        string id PK
        string name
        string description
        string parentId FK
        datetime createdAt
        datetime updatedAt
    }

    User ||--o{ Project : "creates"
    User ||--o{ Request : "creates"
    User ||--o{ Document : "uploads"
    User ||--o{ Review : "writes"
    User ||--o{ PortfolioItem : "has"
    User ||--o{ PaymentMethod : "has"
    User ||--o{ Transaction : "has"
    User ||--o{ ActivityLog : "generates"
    User ||--o{ Notification : "receives"
    User ||--o{ Message : "sends"
    User ||--o{ Message : "receives"
    User ||--|| Contractor : "has profile"

    Contractor ||--o{ Request : "handles"
    Contractor ||--o{ Project : "works on"
    Contractor ||--o{ Proposal : "submits"
    Contractor ||--o{ PortfolioItem : "has"
    Contractor }o--o{ Skill : "has"
    Contractor }o--o{ Category : "belongs to"

    Project ||--o{ Request : "contains"
    Project ||--o{ Milestone : "has"
    Project ||--o{ Document : "has"
    Project ||--o{ Attachment : "has"
    Project ||--o{ Review : "receives"
    Project ||--o{ Transaction : "involves"
    Project ||--o{ ActivityLog : "logs"
    Project ||--o{ Message : "related to"

    Request ||--o{ Proposal : "receives"
    Request ||--o{ Attachment : "has"
    Request ||--o{ ActivityLog : "logs"
    Request ||--o{ Message : "related to"

    Proposal ||--o{ Message : "related to"

    Milestone ||--o{ Task : "contains"

    Category ||--o{ Category : "has subcategories"
```

## Полные связи между сущностями

### Пользователи и аутентификация

- User 1:1 Contractor (один пользователь может иметь один профиль подрядчика)
- User 1:N Project (один пользователь может создать много проектов)
- User 1:N Request (один пользователь может создать много запросов)

### Коммуникации

- User 1:N Message (как отправитель)
- User 1:N Message (как получатель)
- User 1:N Notification (один пользователь может получать много уведомлений)

### Проекты и запросы

- Project N:1 User (проект принадлежит одному пользователю)
- Project N:1 Contractor (проект может выполняться одним подрядчиком)
- Project 1:N Request (проект может содержать много запросов)
- Project 1:N Milestone (проект может содержать много вех)
- Request N:1 User (запрос создается одним пользователем)
- Request N:1 Project (запрос может относиться к одному проекту)
- Request N:1 Contractor (запрос может быть назначен одному подрядчику)
- Request 1:N Proposal (запрос может получить много предложений)

### Документы и файлы

- User 1:N Document (пользователь может загружать много документов)
- Project 1:N Document (проект может содержать много документов)
- Project 1:N Attachment (проект может иметь много вложений)
- Request 1:N Attachment (запрос может иметь много вложений)

### Финансы

- User 1:N PaymentMethod (пользователь может иметь много методов оплаты)
- User 1:N Transaction (пользователь может совершать много транзакций)
- Project 1:N Transaction (проект может иметь много связанных транзакций)
- PaymentMethod 1:N Transaction (методом оплаты можно совершить много транзакций)

### Задачи и вехи

- Milestone N:1 Project (веха относится к одному проекту)
- Task N:1 Milestone (задача относится к одной вехе)

### Прочие связи

- Contractor M:N Skill (подрядчик может иметь много навыков)
- Contractor M:N Category (подрядчик может относиться к нескольким категориям)
- Category 1:N Category (категория может иметь подкатегории)
- User 1:N PortfolioItem (пользователь может иметь много элементов портфолио)
- Contractor 1:N PortfolioItem (подрядчик может иметь много элементов портфолио)
- User 1:N ActivityLog (действия пользователя логируются)
