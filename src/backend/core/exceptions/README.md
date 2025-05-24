# Система обработки ошибок API

Centralized error handling system for API responses, providing consistent error formats, localization, and integration with Swagger documentation.

## Содержание

1. [Возможности](#возможности)
2. [Использование](#использование)
3. [Компоненты системы](#компоненты-системы)
4. [Типы ошибок](#типы-ошибок)
5. [Фильтры исключений](#фильтры-исключений)
6. [Локализация сообщений](#локализация-сообщений)
7. [Интеграция со Swagger](#интеграция-со-swagger)
8. [Добавление новых типов ошибок](#добавление-новых-типов-ошибок)
9. [Рекомендации по обработке ошибок](#рекомендации-по-обработке-ошибок)

## Возможности

- Единый формат ответов об ошибках в соответствии с RFC 7807
- Иерархия классов ошибок для разных типов ошибок
- Глобальные перехватчики исключений для NestJS
- Маппинг ошибок ORM, валидации и системных ошибок
- Поддержка локализации сообщений об ошибках
- Интеграция с документацией Swagger/OpenAPI
- Контекстно-зависимая обработка ошибок
- Защита от утечки чувствительной информации

## Использование

### Регистрация модуля

Модуль уже зарегистрирован в Core Module и доступен глобально. Если нужны кастомные настройки локализации, можно использовать:

```typescript
import { ExceptionsModule } from '@app/core/exceptions';

@Module({
  imports: [
    ExceptionsModule.register({
      localization: {
        defaultLocale: 'ru',
        availableLocales: ['ru', 'en'],
        fallbackToDefault: true,
      },
    }),
  ],
})
export class AppModule {}
```

### Создание ошибки

```typescript
import { ResourceNotFoundError, BadRequestError } from '@app/core/exceptions';

// В сервисе или контроллере
async findUser(id: string) {
  const user = await this.userRepository.findById(id);

  if (!user) {
    throw new ResourceNotFoundError('User', id);
  }

  return user;
}

// С дополнительным контекстом
async createUser(data: CreateUserDto) {
  try {
    // Проверка существования
    const existing = await this.userRepository.findByEmail(data.email);

    if (existing) {
      throw new BadRequestError(
        'User with this email already exists',
        { email: data.email }
      );
    }

    // Создание пользователя
    return await this.userRepository.create(data);
  } catch (error) {
    // Перехват и маппинг ошибок ORM
    if (error instanceof PrismaClientKnownRequestError) {
      throw mapPrismaError(error, { path: '/users', operation: 'create' });
    }
    throw error;
  }
}
```

### Использование локализации

```typescript
import { ErrorLocalizationService } from '@app/core/exceptions';

@Injectable()
export class UsersService {
  constructor(private readonly errorLocalization: ErrorLocalizationService) {}

  async findUser(id: string, req: Request) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      // Получаем предпочитаемый язык из заголовка Accept-Language
      const locale = this.errorLocalization.getPreferredLocale(req);

      // Получаем локализованное сообщение с дополнительными данными
      const message = this.errorLocalization.getMessage('RESOURCE_NOT_FOUND', locale, {
        resource: 'User',
        id,
      });

      throw new ResourceNotFoundError('User', id);
    }

    return user;
  }
}
```

### Документирование API ошибок

```typescript
import {
  ApiNotFoundResponse,
  ApiValidationErrorResponse,
  ApiCommonResponses,
} from '@app/core/exceptions';

@Controller('users')
export class UsersController {
  @Get(':id')
  @ApiNotFoundResponse('User not found')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiValidationErrorResponse('Invalid user data')
  @ApiCommonResponses() // Добавляет стандартные ответы 400, 401, 403, 422, 500
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

## Компоненты системы

### Интерфейсы и типы

- `ApiError` - интерфейс для структуры API-ошибки
- `ValidationError` - интерфейс для ошибок валидации
- `ErrorResponse` - интерфейс для структуры ответа с ошибкой
- `ErrorContext` - интерфейс для контекстной информации об ошибке
- `LocalizedErrorMessages` - интерфейс для локализованных сообщений

### Классы ошибок

- `AppError` - базовый класс ошибки
- `ValidationError` - ошибка валидации
- `AuthenticationError` - ошибка аутентификации
- `AuthorizationError` - ошибка авторизации
- `ResourceNotFoundError` - ресурс не найден
- `ConflictError` - конфликт (например, дублирование)
- `ExternalServiceError` - ошибка внешнего сервиса
- `UnexpectedError` - непредвиденная ошибка
- `BadRequestError` - некорректный запрос
- `RateLimitError` - превышен лимит запросов

### Фильтры исключений

- `AllExceptionsFilter` - перехват всех исключений
- `HttpExceptionsFilter` - перехват HTTP-исключений NestJS
- `ValidationExceptionsFilter` - перехват ошибок валидации

### Утилиты маппинга

- `mapPrismaError` - маппинг ошибок Prisma ORM
- `mapSystemError` - маппинг системных ошибок Node.js
- `mapValidationErrors` - маппинг ошибок валидации
- `mapJwtError` - маппинг ошибок JWT
- `createRequestContext` - создание контекста из запроса

### Локализация

- `ErrorLocalizationService` - сервис локализации сообщений
- `ErrorLocalizationOptions` - опции локализации

### Интеграция со Swagger

- Декораторы для документирования ответов с ошибками
- Модели для Swagger документации

## Типы ошибок

| Класс ошибки          | HTTP-код | Error Code             | Описание                    |
| --------------------- | -------- | ---------------------- | --------------------------- |
| ValidationError       | 422      | VALIDATION_ERROR       | Ошибки валидации данных     |
| AuthenticationError   | 401      | UNAUTHORIZED           | Аутентификация не выполнена |
| AuthorizationError    | 403      | FORBIDDEN              | Недостаточно прав           |
| ResourceNotFoundError | 404      | RESOURCE_NOT_FOUND     | Ресурс не найден            |
| ConflictError         | 409      | CONFLICT               | Конфликт данных             |
| ExternalServiceError  | 502      | EXTERNAL_SERVICE_ERROR | Ошибка внешнего сервиса     |
| UnexpectedError       | 500      | INTERNAL_SERVER_ERROR  | Непредвиденная ошибка       |
| BadRequestError       | 400      | BAD_REQUEST            | Некорректный запрос         |
| RateLimitError        | 429      | RATE_LIMIT_EXCEEDED    | Превышен лимит запросов     |

## Фильтры исключений

Фильтры исключений перехватывают ошибки, преобразуют их в стандартный формат и возвращают клиенту. Они интегрированы с системой логирования для отслеживания ошибок.

### AllExceptionsFilter

Перехватывает все необработанные исключения, включая нативные JavaScript ошибки, и преобразует их в стандартный формат. Фильтрует чувствительную информацию в production-окружении.

### HttpExceptionsFilter

Обрабатывает исключения NestJS (HttpException) и преобразует их в наши стандартные типы ошибок.

### ValidationExceptionsFilter

Специализированная обработка ошибок валидации для улучшенного форматирования и локализации.

## Локализация сообщений

Система поддерживает локализацию сообщений об ошибках с помощью `ErrorLocalizationService`. Локализация основана на заголовке `Accept-Language` и поддерживает:

- Определение предпочитаемого языка пользователя
- Запасные варианты при отсутствии перевода
- Параметризованные сообщения с подстановкой значений

По умолчанию система настроена на поддержку русского и английского языков.

## Интеграция со Swagger

Система предоставляет набор декораторов для документирования ответов с ошибками в Swagger/OpenAPI:

- `ApiErrorResponse` - базовый декоратор для ответов с ошибками
- `ApiValidationErrorResponse` - ошибки валидации
- `ApiNotFoundResponse` - ресурс не найден
- `ApiAuthenticationErrorResponse` - ошибки аутентификации
- `ApiAuthorizationErrorResponse` - ошибки авторизации
- `ApiConflictResponse` - конфликт данных
- `ApiInternalServerErrorResponse` - внутренняя ошибка
- `ApiBadRequestResponse` - некорректный запрос
- `ApiCommonResponses` - комбинация основных типов ошибок

## Добавление новых типов ошибок

Для добавления нового типа ошибок:

1. Создайте новый класс, наследующий от `AppError`:

```typescript
export class PaymentFailedError extends AppError {
  constructor(
    message: string = 'Payment processing failed',
    paymentId?: string,
    context?: ErrorContext
  ) {
    super(message, 'PAYMENT_FAILED', HttpStatus.BAD_GATEWAY, { ...context, paymentId });
  }
}
```

2. Добавьте локализованные сообщения:

```typescript
errorLocalization.registerMessage('PAYMENT_FAILED', {
  default: 'Ошибка при обработке платежа',
  translations: {
    en: 'Payment processing failed',
    ru: 'Ошибка при обработке платежа',
  },
});
```

3. Добавьте декоратор для Swagger (опционально):

```typescript
export function ApiPaymentErrorResponse(
  description: string = 'Payment processing error'
): MethodDecorator {
  return ApiErrorResponse(description, 502, 'PAYMENT_FAILED');
}
```

## Рекомендации по обработке ошибок

1. Используйте специфические классы ошибок вместо общих HttpException
2. Добавляйте контекст к ошибкам для улучшения отладки
3. Реализуйте маппинг ошибок из внешних сервисов и библиотек
4. Локализуйте сообщения об ошибках для улучшения пользовательского опыта
5. Документируйте возможные ошибки в Swagger
6. Никогда не включайте чувствительную информацию в сообщения об ошибках
7. Настройте соответствующее логирование для разных типов ошибок
8. Обрабатывайте ошибки на клиенте на основе кода ошибки, а не сообщения
