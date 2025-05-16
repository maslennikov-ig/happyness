# Стандарты форматов ответов API и обработки ошибок

В данном документе описываются стандарты форматов ответов API и обработки ошибок для системы Happyness. Эти стандарты обеспечивают единообразие, предсказуемость и удобство использования API.

## Общие принципы

1. **Согласованность**: все ответы API должны следовать единому формату
2. **Информативность**: ответы должны содержать достаточно информации для понимания результата запроса
3. **Полезность**: сообщения об ошибках должны помогать в диагностике и исправлении проблем
4. **Безопасность**: ответы не должны раскрывать чувствительную информацию о системе

## Форматы успешных ответов

### 1. Получение одиночного ресурса

```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "role": "ENTREPRENEUR",
    "createdAt": "2025-01-15T12:00:00Z",
    "updatedAt": "2025-01-20T14:30:00Z"
  }
}
```

### 2. Получение списка ресурсов

```json
{
  "status": "success",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Проект А",
      "status": "IN_PROGRESS"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174000",
      "name": "Проект Б",
      "status": "PLANNING"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 42,
    "totalPages": 5
  },
  "links": {
    "self": "/v1/projects?page=1&limit=10",
    "first": "/v1/projects?page=1&limit=10",
    "prev": null,
    "next": "/v1/projects?page=2&limit=10",
    "last": "/v1/projects?page=5&limit=10"
  }
}
```

### 3. Создание ресурса

```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Новый проект",
    "description": "Описание проекта",
    "createdAt": "2025-01-20T14:30:00Z"
  },
  "message": "Проект успешно создан"
}
```

### 4. Обновление ресурса

```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Обновленный проект",
    "description": "Новое описание проекта",
    "updatedAt": "2025-01-20T15:45:00Z"
  },
  "message": "Проект успешно обновлен"
}
```

### 5. Удаление ресурса

```json
{
  "status": "success",
  "message": "Проект успешно удален",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 6. Операции без возвращаемых данных

```json
{
  "status": "success",
  "message": "Операция выполнена успешно"
}
```

## Форматы ответов с ошибками

### 1. Общая структура ответа с ошибкой

```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Запрашиваемый ресурс не найден",
    "details": "Проект с ID '123e4567-e89b-12d3-a456-426614174000' не существует",
    "timestamp": "2025-01-20T15:45:00Z",
    "path": "/v1/projects/123e4567-e89b-12d3-a456-426614174000",
    "requestId": "req-abc123"
  }
}
```

### 2. Ошибки валидации

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации данных",
    "timestamp": "2025-01-20T15:45:00Z",
    "path": "/v1/projects",
    "requestId": "req-abc123",
    "validationErrors": [
      {
        "field": "name",
        "message": "Название проекта обязательно",
        "value": null
      },
      {
        "field": "budget",
        "message": "Бюджет должен быть положительным числом",
        "value": -1000
      }
    ]
  }
}
```

### 3. Ошибки авторизации

```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Требуется аутентификация",
    "timestamp": "2025-01-20T15:45:00Z",
    "path": "/v1/projects",
    "requestId": "req-abc123"
  }
}
```

### 4. Ошибки доступа

```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "Недостаточно прав для выполнения операции",
    "details": "Требуется роль ADMIN или PROJECT_OWNER",
    "timestamp": "2025-01-20T15:45:00Z",
    "path": "/v1/projects/123e4567-e89b-12d3-a456-426614174000",
    "requestId": "req-abc123"
  }
}
```

### 5. Внутренние ошибки сервера

```json
{
  "status": "error",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Внутренняя ошибка сервера",
    "timestamp": "2025-01-20T15:45:00Z",
    "path": "/v1/projects",
    "requestId": "req-abc123"
  }
}
```

## HTTP-коды состояния

API должен использовать соответствующие HTTP-коды состояния:

| Код | Описание              | Использование                                           |
| --- | --------------------- | ------------------------------------------------------- |
| 200 | OK                    | Успешный запрос с возвращаемыми данными                 |
| 201 | Created               | Успешное создание ресурса                               |
| 204 | No Content            | Успешный запрос без возвращаемых данных                 |
| 400 | Bad Request           | Ошибка в запросе клиента (например, неверные параметры) |
| 401 | Unauthorized          | Требуется аутентификация                                |
| 403 | Forbidden             | Недостаточно прав для выполнения операции               |
| 404 | Not Found             | Запрашиваемый ресурс не найден                          |
| 422 | Unprocessable Entity  | Ошибки валидации данных                                 |
| 429 | Too Many Requests     | Превышен лимит запросов                                 |
| 500 | Internal Server Error | Внутренняя ошибка сервера                               |
| 503 | Service Unavailable   | Сервис временно недоступен                              |

## Коды ошибок

Система должна использовать стандартизированные коды ошибок для облегчения обработки на стороне клиента:

### 1. Общие ошибки

| Код                     | Описание                   |
| ----------------------- | -------------------------- |
| `INTERNAL_SERVER_ERROR` | Внутренняя ошибка сервера  |
| `SERVICE_UNAVAILABLE`   | Сервис временно недоступен |
| `INVALID_REQUEST`       | Некорректный запрос        |
| `RATE_LIMIT_EXCEEDED`   | Превышен лимит запросов    |

### 2. Ошибки аутентификации и авторизации

| Код                   | Описание                                  |
| --------------------- | ----------------------------------------- |
| `UNAUTHORIZED`        | Требуется аутентификация                  |
| `INVALID_CREDENTIALS` | Неверные учетные данные                   |
| `FORBIDDEN`           | Недостаточно прав для выполнения операции |
| `TOKEN_EXPIRED`       | Истек срок действия токена                |
| `INVALID_TOKEN`       | Недействительный токен                    |

### 3. Ошибки ресурсов

| Код                       | Описание                    |
| ------------------------- | --------------------------- |
| `RESOURCE_NOT_FOUND`      | Ресурс не найден            |
| `RESOURCE_ALREADY_EXISTS` | Ресурс уже существует       |
| `RESOURCE_DELETED`        | Ресурс удален               |
| `RESOURCE_EXPIRED`        | Истек срок действия ресурса |

### 4. Ошибки валидации

| Код                      | Описание                      |
| ------------------------ | ----------------------------- |
| `VALIDATION_ERROR`       | Ошибка валидации данных       |
| `INVALID_PARAMETER`      | Некорректный параметр         |
| `MISSING_REQUIRED_FIELD` | Отсутствует обязательное поле |
| `INVALID_FORMAT`         | Некорректный формат данных    |

### 5. Ошибки бизнес-логики

| Код                       | Описание                 |
| ------------------------- | ------------------------ |
| `BUSINESS_RULE_VIOLATION` | Нарушение бизнес-правила |
| `INSUFFICIENT_FUNDS`      | Недостаточно средств     |
| `QUOTA_EXCEEDED`          | Превышена квота          |
| `OPERATION_NOT_ALLOWED`   | Операция не разрешена    |
| `DEPENDENCY_CONFLICT`     | Конфликт зависимостей    |

## Обработка ошибок на стороне сервера

### 1. Централизованная обработка ошибок

В NestJS следует использовать глобальный обработчик исключений:

```typescript
// src/backend/core/exceptions/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] || uuid();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      status: 'error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Внутренняя ошибка сервера',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // Обработка различных типов исключений
      if (exception instanceof ValidationException) {
        errorResponse.error.code = 'VALIDATION_ERROR';
        errorResponse.error.message = 'Ошибка валидации данных';
        errorResponse.error.validationErrors = exceptionResponse.validationErrors;
      } else if (exception instanceof UnauthorizedException) {
        errorResponse.error.code = 'UNAUTHORIZED';
        errorResponse.error.message = exceptionResponse.message || 'Требуется аутентификация';
      }
      // ... другие типы исключений
    }

    // Логирование ошибки
    this.logger.error({
      message: `Ошибка при обработке запроса: ${errorResponse.error.message}`,
      exception,
      requestId,
      path: request.url,
      method: request.method,
    });

    response.status(status).json(errorResponse);
  }
}
```

### 2. Пользовательские исключения

Для различных типов ошибок следует создать специализированные классы исключений:

```typescript
// src/backend/core/exceptions/validation.exception.ts
export class ValidationException extends HttpException {
  constructor(validationErrors: ValidationError[]) {
    super(
      {
        message: 'Ошибка валидации данных',
        validationErrors,
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
}

// src/backend/core/exceptions/resource-not-found.exception.ts
export class ResourceNotFoundException extends HttpException {
  constructor(resourceType: string, resourceId: string) {
    super(
      {
        message: `${resourceType} с ID '${resourceId}' не найден`,
        resourceType,
        resourceId,
      },
      HttpStatus.NOT_FOUND
    );
  }
}
```

## Обработка ошибок на стороне клиента

### 1. Перехват ошибок в Next.js

```typescript
// src/frontend/lib/api/client.ts
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Обработка ошибки API
      throw new ApiError(
        data.error.code,
        data.error.message,
        response.status,
        data.error.validationErrors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Обработка сетевых ошибок или ошибок парсинга
    throw new ApiError('NETWORK_ERROR', 'Ошибка сети или сервер недоступен', 0);
  }
}
```

### 2. Класс ошибки API

```typescript
// src/frontend/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public validationErrors?: ValidationError[]
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  isAuthError(): boolean {
    return ['UNAUTHORIZED', 'INVALID_CREDENTIALS', 'TOKEN_EXPIRED'].includes(this.code);
  }

  isNotFoundError(): boolean {
    return this.code === 'RESOURCE_NOT_FOUND';
  }
}
```

## Заключение

Следование этим стандартам форматов ответов API и обработки ошибок обеспечит:

- Единообразие и предсказуемость API
- Удобство использования для клиентских приложений
- Эффективную диагностику и отладку проблем
- Безопасность и надежность системы

Все эндпоинты системы Happyness должны соответствовать описанным здесь стандартам форматов ответов и обработки ошибок.
