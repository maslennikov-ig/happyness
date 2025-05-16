# Стандарты именования эндпоинтов API

В данном документе описываются стандарты именования эндпоинтов RESTful API для системы Happyness. Следование этим стандартам обеспечит единообразие, понятность и предсказуемость API для разработчиков и интеграторов.

## Общие принципы

1. **Ресурсно-ориентированный подход**: API строится вокруг ресурсов, а не действий
2. **Использование существительных во множественном числе**: для именования ресурсов
3. **Иерархическая структура**: для представления отношений между ресурсами
4. **Последовательность**: единообразие в именовании и структуре по всему API
5. **Простота и интуитивность**: понятные и предсказуемые имена ресурсов и эндпоинтов

## Правила именования ресурсов

### 1. Имена ресурсов

- **Используйте существительные во множественном числе** для основных ресурсов:

  - ✅ `/users`, `/projects`, `/contractors`
  - ❌ `/user`, `/project`, `/contractor`

- **Используйте kebab-case** для составных имен ресурсов:
  - ✅ `/project-templates`, `/payment-methods`
  - ❌ `/projectTemplates`, `/paymentMethods`, `/project_templates`

### 2. Идентификаторы ресурсов

- **Используйте параметры пути** для идентификации конкретных ресурсов:

  - ✅ `/users/:id`, `/projects/:projectId/requests/:requestId`
  - ❌ `/getUser?id=123`, `/project?id=456`

- **Используйте описательные имена** для параметров пути в документации:
  - ✅ `/users/:userId`, `/projects/:projectId`
  - ❌ `/users/:id1`, `/projects/:id2`

### 3. Вложенные ресурсы

- **Используйте вложенные пути** для представления отношений принадлежности:

  - ✅ `/projects/:projectId/requests`
  - ❌ `/requests?projectId=123`

- **Ограничивайте глубину вложенности** до 2-3 уровней:

  - ✅ `/projects/:projectId/requests/:requestId/messages`
  - ❌ `/users/:userId/projects/:projectId/requests/:requestId/messages/:messageId/attachments`

- **Для глубоких иерархий** используйте плоские структуры с параметрами запроса:
  - ✅ `/messages/:messageId/attachments` с параметром `?requestId=123&projectId=456`
  - ❌ `/users/:userId/projects/:projectId/requests/:requestId/messages/:messageId/attachments`

### 4. Действия над ресурсами

- **Используйте HTTP-методы** для стандартных операций CRUD:

  - `GET` - получение ресурса(ов)
  - `POST` - создание ресурса
  - `PUT` - полное обновление ресурса
  - `PATCH` - частичное обновление ресурса
  - `DELETE` - удаление ресурса

- **Для нестандартных действий** используйте подресурсы с глаголами:
  - ✅ `/users/:userId/activate`, `/projects/:projectId/archive`
  - ❌ `/activateUser/:userId`, `/archiveProject/:projectId`

## Примеры именования эндпоинтов

### Правильное именование

```
GET    /users                   # Получение списка пользователей
GET    /users/:userId           # Получение конкретного пользователя
POST   /users                   # Создание пользователя
PUT    /users/:userId           # Обновление пользователя
DELETE /users/:userId           # Удаление пользователя

GET    /projects                # Получение списка проектов
POST   /projects                # Создание проекта
GET    /projects/:projectId     # Получение конкретного проекта

GET    /projects/:projectId/requests        # Получение запросов проекта
POST   /projects/:projectId/requests        # Создание запроса в проекте
GET    /projects/:projectId/requests/:requestId  # Получение конкретного запроса

POST   /auth/login              # Аутентификация
POST   /auth/logout             # Выход из системы
POST   /auth/refresh            # Обновление токена
```

### Неправильное именование

```
GET    /getUsers                # ❌ Используется глагол
GET    /user/:userId            # ❌ Единственное число
POST   /createUser              # ❌ Используется глагол
PUT    /updateUser/:userId      # ❌ Используется глагол
DELETE /deleteUser/:userId      # ❌ Используется глагол

GET    /projectsList            # ❌ Избыточное слово "List"
POST   /addProject              # ❌ Используется глагол
GET    /project?id=123          # ❌ Использование параметра запроса вместо пути

GET    /getProjectRequests/:projectId       # ❌ Используется глагол
POST   /projects/:projectId/addRequest      # ❌ Используется глагол
GET    /getRequestById/:requestId           # ❌ Используется глагол и отсутствует иерархия
```

## Параметры запросов

### 1. Фильтрация

- **Используйте простые параметры запроса** для базовой фильтрации:

  - ✅ `/users?role=ADMIN`
  - ✅ `/projects?status=IN_PROGRESS`

- **Для сложной фильтрации** используйте префиксы или JSON-структуры:
  - ✅ `/users?filter[role]=ADMIN&filter[createdAt][gte]=2025-01-01`
  - ✅ `/projects?filter={"status":"IN_PROGRESS","budget":{"gte":10000}}`

### 2. Сортировка

- **Используйте параметр `sort`** для указания полей и направления сортировки:
  - ✅ `/users?sort=name` (по умолчанию по возрастанию)
  - ✅ `/users?sort=-createdAt` (по убыванию)
  - ✅ `/projects?sort=status,-createdAt` (множественная сортировка)

### 3. Пагинация

- **Используйте параметры `page` и `limit`** для постраничной навигации:

  - ✅ `/users?page=2&limit=20`

- **Альтернативно, используйте `offset` и `limit`** для более гибкой пагинации:
  - ✅ `/users?offset=40&limit=20`

### 4. Поиск

- **Используйте параметр `search` или `q`** для полнотекстового поиска:
  - ✅ `/users?search=john`
  - ✅ `/projects?q=website`

### 5. Расширение ответа

- **Используйте параметр `expand` или `include`** для включения связанных данных:
  - ✅ `/projects?expand=owner,requests`
  - ✅ `/users?include=projects,contractor`

## Версионирование в URL

- **Включайте версию API** в начало пути:

  - ✅ `/v1/users`, `/v2/projects`

- **Используйте целые числа** для основных версий:
  - ✅ `/v1/`, `/v2/`
  - ❌ `/v1.2/`, `/v2.3/`

## Заключение

Следование этим стандартам именования обеспечит создание интуитивно понятного, последовательного и удобного в использовании API. Это упростит как разработку клиентских приложений, так и поддержку самого API в долгосрочной перспективе.

Все эндпоинты системы Happyness должны соответствовать описанным здесь стандартам именования.
