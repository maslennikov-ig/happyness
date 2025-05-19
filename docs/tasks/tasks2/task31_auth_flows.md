# Потоки аутентификации

## Навигация по документам аутентификации

- [**Обзор системы аутентификации**](./task31.md) - основной документ с общим описанием задачи
- [**Компоненты системы аутентификации**](./task31_auth_components.md) - описание всех компонентов системы аутентификации на бэкенде и фронтенде, их ответственности и взаимосвязи
- [**Структура JWT-токенов**](./task31_jwt_structure.md) - спецификация структуры JWT-токенов, используемых в системе
- [**Механизм Refresh токенов**](./task31_refresh_tokens.md) - детальное описание механизма обновления токенов
- [**Хранение JWT на клиенте**](./task31_client_storage.md) - стратегия безопасного хранения JWT на клиентской стороне

В данном документе описаны основные потоки аутентификации в системе Happyness, реализованные с использованием JWT.

## 1. Регистрация пользователя

**Участники процесса:**

- Клиент (Frontend приложение)
- AuthController
- AuthService
- UsersService
- TokenService
- База данных

**Последовательность действий:**

1. Пользователь заполняет форму регистрации (email, пароль, имя, роль) на странице регистрации
2. Клиент отправляет POST запрос на `/api/v1/auth/register` с данными пользователя
3. AuthController принимает запрос и передает данные в AuthService
4. AuthService проверяет, не существует ли уже пользователь с таким email
5. AuthService хеширует пароль с использованием argon2
6. AuthService вызывает UsersService для создания нового пользователя в базе данных
7. AuthService генерирует пару токенов (access и refresh) с помощью TokenService
8. TokenService сохраняет информацию о refresh токене в базе данных
9. AuthService формирует и возвращает ответ с данными пользователя и токенами
10. Клиент получает ответ, сохраняет токены (access в памяти, refresh в HttpOnly куки) и данные пользователя
11. Клиент перенаправляет пользователя на защищенную страницу

**Диаграмма последовательности:**

```
+-------+     +---------------+     +------------+     +-------------+     +-------------+     +-------------+
|Клиент |     |AuthController |     |AuthService |     |UsersService |     |TokenService |     |   База данных|
+-------+     +---------------+     +------------+     +-------------+     +-------------+     +-------------+
    |                 |                   |                   |                   |                   |
    | 1. POST /register                   |                   |                   |                   |
    |---------------->|                   |                   |                   |                   |
    |                 | 2. register(dto)  |                   |                   |                   |
    |                 |------------------>|                   |                   |                   |
    |                 |                   | 3. findByEmail()  |                   |                   |
    |                 |                   |------------------>|                   |                   |
    |                 |                   |                   | 4. DB query       |                   |
    |                 |                   |                   |------------------>|                   |
    |                 |                   |                   |<------------------|                   |
    |                 |                   |<------------------|                   |                   |
    |                 |                   | 5. hash password  |                   |                   |
    |                 |                   |------------------>|                   |                   |
    |                 |                   | 6. create user    |                   |                   |
    |                 |                   |------------------>|                   |                   |
    |                 |                   |                   | 7. DB insert      |                   |
    |                 |                   |                   |------------------>|                   |
    |                 |                   |                   |<------------------|                   |
    |                 |                   |<------------------|                   |                   |
    |                 |                   | 8. generate tokens|                   |                   |
    |                 |                   |------------------>|                   |                   |
    |                 |                   |                   |                   | 9. save refresh   |
    |                 |                   |                   |                   |------------------>|
    |                 |                   |                   |                   |<------------------|
    |                 |                   |<------------------|                   |                   |
    |                 |<------------------|                   |                   |                   |
    | 10. Response    |                   |                   |                   |                   |
    |<----------------|                   |                   |                   |                   |
    |                 |                   |                   |                   |                   |
```

## 2. Вход пользователя

**Участники процесса:**

- Клиент (Frontend приложение)
- AuthController
- LocalAuthGuard
- LocalStrategy
- AuthService
- UsersService
- TokenService
- База данных

**Последовательность действий:**

1. Пользователь заполняет форму входа (email, пароль) на странице входа
2. Клиент отправляет POST запрос на `/api/v1/auth/login` с учетными данными
3. AuthController передает запрос в LocalAuthGuard
4. LocalAuthGuard использует LocalStrategy для валидации
5. LocalStrategy вызывает AuthService.validateUser
6. AuthService запрашивает пользователя из UsersService по email
7. AuthService проверяет пароль с использованием argon2
8. При успешной проверке AuthService генерирует пару токенов с помощью TokenService
9. TokenService сохраняет информацию о refresh токене в базе данных
10. AuthService формирует и возвращает ответ с данными пользователя и токенами
11. Клиент получает ответ, сохраняет токены (access в памяти, refresh в HttpOnly куки) и данные пользователя
12. Клиент перенаправляет пользователя на защищенную страницу

**Диаграмма последовательности:**

```
+-------+     +---------------+     +-------------+     +------------+     +------------+     +-------------+     +-------------+
|Клиент |     |AuthController |     |LocalAuthGuard|     |LocalStrategy|     |AuthService |     |UsersService |     |TokenService |
+-------+     +---------------+     +-------------+     +------------+     +------------+     +-------------+     +-------------+
    |                 |                   |                   |                   |                   |                 |
    | 1. POST /login  |                   |                   |                   |                   |                 |
    |---------------->|                   |                   |                   |                   |                 |
    |                 | 2. guard          |                   |                   |                   |                 |
    |                 |------------------>|                   |                   |                   |                 |
    |                 |                   | 3. validate       |                   |                   |                 |
    |                 |                   |------------------>|                   |                   |                 |
    |                 |                   |                   | 4. validateUser   |                   |                 |
    |                 |                   |                   |------------------>|                   |                 |
    |                 |                   |                   |                   | 5. findByEmail    |                 |
    |                 |                   |                   |                   |------------------>|                 |
    |                 |                   |                   |                   |<------------------|                 |
    |                 |                   |                   |                   | 6. compare pwd    |                 |
    |                 |                   |                   |<------------------|                   |                 |
    |                 |                   |<------------------|                   |                   |                 |
    |                 |<------------------|                   |                   |                   |                 |
    |                 | 7. login()        |                   |                   |                   |                 |
    |                 |---------------------------------------------------------->|                   |                 |
    |                 |                   |                   |                   | 8. generate tokens|                 |
    |                 |                   |                   |                   |------------------>|                 |
    |                 |                   |                   |                   |<------------------|                 |
    |                 |<----------------------------------------------------------|                   |                 |
    | 9. Response     |                   |                   |                   |                   |                 |
    |<----------------|                   |                   |                   |                   |                 |
    |                 |                   |                   |                   |                   |                 |
```

## 3. Доступ к защищенным ресурсам

**Участники процесса:**

- Клиент (Frontend приложение)
- ResourceController (любой защищенный контроллер)
- JwtAuthGuard
- JwtStrategy
- База данных

**Последовательность действий:**

1. Клиент делает запрос к защищенному ресурсу, добавляя access токен в заголовок `Authorization`
2. ResourceController передает запрос в JwtAuthGuard
3. JwtAuthGuard использует JwtStrategy для валидации токена
4. JwtStrategy проверяет подпись и срок действия токена
5. JwtStrategy извлекает данные пользователя из токена и добавляет их в запрос
6. ResourceController получает доступ к валидированным данным пользователя
7. ResourceController выполняет бизнес-логику и формирует ответ
8. Клиент получает ответ от ResourceController

**Диаграмма последовательности:**

```
+-------+     +------------------+     +------------+     +------------+
|Клиент |     |ResourceController|     |JwtAuthGuard|     |JwtStrategy |
+-------+     +------------------+     +------------+     +------------+
    |                 |                      |                   |
    | 1. GET /resource                       |                   |
    | Authorization: Bearer {token}          |                   |
    |---------------->|                      |                   |
    |                 | 2. Проверка авторизации                  |
    |                 |--------------------->|                   |
    |                 |                      | 3. Валидация JWT  |
    |                 |                      |------------------>|
    |                 |                      |                   |
    |                 |                      |<------------------|
    |                 |<---------------------|                   |
    |                 | 4. Обработка запроса |                   |
    |                 |----------------------|                   |
    | 5. Response     |                      |                   |
    |<----------------|                      |                   |
    |                 |                      |                   |
```

## 4. Обновление токена

**Участники процесса:**

- Клиент (Frontend приложение)
- AuthController
- AuthService
- TokenService
- База данных

**Последовательность действий:**

1. Клиент обнаруживает, что access токен истек или скоро истечет
2. Клиент отправляет POST запрос на `/api/v1/auth/refresh` с refresh токеном, который отправляется автоматически в куки
3. AuthController принимает запрос и передает refresh токен в AuthService
4. AuthService вызывает TokenService для проверки refresh токена
5. TokenService проверяет наличие и валидность refresh токена в базе данных
6. TokenService создает новую пару токенов (access и refresh)
7. TokenService обновляет информацию о refresh токене в базе данных
8. TokenService возвращает новую пару токенов в AuthService
9. AuthService формирует и возвращает ответ с новыми токенами
10. Клиент получает ответ, обновляет токены (access в памяти, refresh в HttpOnly куки)
11. Клиент продолжает использование приложения без необходимости повторного входа

**Диаграмма последовательности:**

```
+-------+     +---------------+     +------------+     +-------------+     +-------------+
|Клиент |     |AuthController |     |AuthService |     |TokenService |     |   База данных|
+-------+     +---------------+     +------------+     +-------------+     +-------------+
    |                 |                   |                   |                   |
    | 1. POST /refresh                    |                   |                   |
    | Cookie: refresh_token={token}       |                   |                   |
    |---------------->|                   |                   |                   |
    |                 | 2. refresh(token) |                   |                   |
    |                 |------------------>|                   |                   |
    |                 |                   | 3. validateRefreshToken               |
    |                 |                   |------------------>|                   |
    |                 |                   |                   | 4. DB query       |
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |                   |                   | 5. generate tokens|
    |                 |                   |                   |------------------>|
    |                 |                   |                   | 6. Update DB      |
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |                   |<------------------|                   |
    |                 |<------------------|                   |                   |
    | 7. Response     |                   |                   |                   |
    | Set-Cookie: refresh_token={new}     |                   |                   |
    |<----------------|                   |                   |                   |
    |                 |                   |                   |                   |
```

## 5. Выход из системы

**Участники процесса:**

- Клиент (Frontend приложение)
- AuthController
- AuthService
- TokenService
- База данных

**Последовательность действий:**

1. Пользователь нажимает на кнопку "Выход" в интерфейсе
2. Клиент отправляет POST запрос на `/api/v1/auth/logout` с refresh токеном в куки
3. AuthController принимает запрос и передает refresh токен в AuthService
4. AuthService вызывает TokenService для инвалидации refresh токена
5. TokenService удаляет refresh токен из базы данных
6. AuthService формирует и возвращает успешный ответ
7. Клиент удаляет токены и данные пользователя из хранилища
8. Клиент перенаправляет пользователя на страницу входа

**Диаграмма последовательности:**

```
+-------+     +---------------+     +------------+     +-------------+     +-------------+
|Клиент |     |AuthController |     |AuthService |     |TokenService |     |   База данных|
+-------+     +---------------+     +------------+     +-------------+     +-------------+
    |                 |                   |                   |                   |
    | 1. POST /logout                     |                   |                   |
    | Cookie: refresh_token={token}       |                   |                   |
    |---------------->|                   |                   |                   |
    |                 | 2. logout(token)  |                   |                   |
    |                 |------------------>|                   |                   |
    |                 |                   | 3. removeToken    |                   |
    |                 |                   |------------------>|                   |
    |                 |                   |                   | 4. DB delete      |
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |                   |<------------------|                   |
    |                 |<------------------|                   |                   |
    | 5. Response     |                   |                   |                   |
    | Set-Cookie: refresh_token=; expires=...|                |                   |
    |<----------------|                   |                   |                   |
    | 6. Очистка локального хранилища     |                   |                   |
    |----------------X|                   |                   |                   |
    |                 |                   |                   |                   |
```

## 6. Смена пароля

**Участники процесса:**

- Клиент (Frontend приложение)
- AuthController
- AuthService
- UsersService
- JwtAuthGuard
- База данных

**Последовательность действий:**

1. Пользователь заполняет форму смены пароля (текущий пароль, новый пароль)
2. Клиент отправляет POST запрос на `/api/v1/auth/change-password` с данными и токеном
3. JwtAuthGuard проверяет токен и добавляет информацию о пользователе в запрос
4. AuthController принимает запрос и передает данные в AuthService
5. AuthService получает пользователя из UsersService
6. AuthService проверяет текущий пароль
7. AuthService хеширует новый пароль
8. AuthService обновляет пароль пользователя через UsersService
9. AuthService возвращает успешный ответ
10. Клиент уведомляет пользователя об успешной смене пароля

**Диаграмма последовательности:**

```
+-------+     +---------------+     +------------+     +-------------+     +-------------+
|Клиент |     |AuthController |     |JwtAuthGuard|     |AuthService  |     |UsersService |
+-------+     +---------------+     +------------+     +-------------+     +-------------+
    |                 |                   |                   |                   |
    | 1. POST /change-password            |                   |                   |
    | Authorization: Bearer {token}       |                   |                   |
    |---------------->|                   |                   |                   |
    |                 | 2. Проверка токена|                   |                   |
    |                 |------------------>|                   |                   |
    |                 |<------------------|                   |                   |
    |                 | 3. changePassword(dto)                |                   |
    |                 |---------------------------------------->|                   |
    |                 |                   |                   | 4. findById      |
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |                   |                   | 5. Проверка текущего пароля
    |                 |                   |                   |------------------>|
    |                 |                   |                   | 6. Хеширование нового пароля
    |                 |                   |                   |------------------>|
    |                 |                   |                   | 7. updateUser    |
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |<----------------------------------------|                   |
    | 8. Response     |                   |                   |                   |
    |<----------------|                   |                   |                   |
    |                 |                   |                   |                   |
```

## 7. Rate Limiting (ограничение частоты запросов)

Система аутентификации включает механизмы ограничения частоты запросов для защиты от автоматизированных атак, таких как brute force, credential stuffing и denial of service.

### Ограничения по эндпоинтам

| Эндпоинт                       | Лимит        | Период   | Действие при превышении |
| ------------------------------ | ------------ | -------- | ----------------------- |
| `/api/v1/auth/login`           | 5 запросов   | 1 минута | 429 Too Many Requests   |
| `/api/v1/auth/register`        | 3 запроса    | 10 минут | 429 Too Many Requests   |
| `/api/v1/auth/refresh`         | 10 запросов  | 1 час    | 429 Too Many Requests   |
| `/api/v1/auth/forgot-password` | 3 запроса    | 1 час    | 429 Too Many Requests   |
| `/api/v1/auth/reset-password`  | 3 запроса    | 1 час    | 429 Too Many Requests   |
| `/api/v1/auth/change-password` | 5 запросов   | 1 час    | 429 Too Many Requests   |
| Любой защищенный API           | 100 запросов | 1 минута | 429 Too Many Requests   |

### Уровни ограничения

Ограничения применяются на нескольких уровнях:

1. **По IP-адресу** - базовая защита от массовых атак
2. **По учетной записи** - защита конкретных аккаунтов
3. **По комбинации IP + учетная запись** - более точное обнаружение атак

### Реализация

Для реализации Rate Limiting используется комбинация Redis и NestJS guard:

```typescript
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const endpoint = request.route.path;
    const email = request.body.email || 'anonymous';

    // Определяем лимиты на основе эндпоинта
    const limits = this.getLimits(endpoint);

    // Генерируем ключи для проверки лимитов
    const ipKey = `rate:ip:${ip}:${endpoint}`;
    const userKey = `rate:user:${email}:${endpoint}`;
    const combinedKey = `rate:combined:${ip}:${email}:${endpoint}`;

    // Проверяем все уровни лимитов
    const [ipCount, userCount, combinedCount] = await Promise.all([
      this.increment(ipKey, limits.ttl),
      this.increment(userKey, limits.ttl),
      this.increment(combinedKey, limits.ttl),
    ]);

    // Логируем попытки, приближающиеся к лимиту
    if (ipCount > limits.max * 0.7 || userCount > limits.max * 0.7) {
      this.logger.warn(
        `Rate limit approaching: IP=${ip}, Email=${email}, Endpoint=${endpoint}, 
         IP count=${ipCount}, User count=${userCount}`
      );
    }

    // Проверяем, не превышен ли лимит
    if (ipCount > limits.max || userCount > limits.max || combinedCount > limits.max) {
      // При превышении лимита логируем событие
      this.logger.warn(`Rate limit exceeded: IP=${ip}, Email=${email}, Endpoint=${endpoint}`);

      // Блокируем запрос и выбрасываем исключение
      throw new ThrottlerException('Слишком много запросов, попробуйте позже');
    }

    return true;
  }

  // Увеличиваем счетчик запросов и возвращаем текущее значение
  private async increment(key: string, ttl: number): Promise<number> {
    const count = await this.redisService.incr(key);
    // Если это первый запрос, устанавливаем TTL
    if (count === 1) {
      await this.redisService.expire(key, ttl);
    }
    return count;
  }

  // Определяем лимиты на основе эндпоинта
  private getLimits(endpoint: string): { max: number; ttl: number } {
    switch (endpoint) {
      case '/api/v1/auth/login':
        return { max: 5, ttl: 60 }; // 5 запросов в минуту
      case '/api/v1/auth/register':
        return { max: 3, ttl: 600 }; // 3 запроса в 10 минут
      case '/api/v1/auth/refresh':
        return { max: 10, ttl: 3600 }; // 10 запросов в час
      case '/api/v1/auth/forgot-password':
      case '/api/v1/auth/reset-password':
        return { max: 3, ttl: 3600 }; // 3 запроса в час
      case '/api/v1/auth/change-password':
        return { max: 5, ttl: 3600 }; // 5 запросов в час
      default:
        return { max: 100, ttl: 60 }; // 100 запросов в минуту для других эндпоинтов
    }
  }
}
```

### Интеграция с NestJS

Guard регистрируется для конкретных эндпоинтов в модуле аутентификации:

```typescript
@Module({
  imports: [
    // ...
  ],
  controllers: [AuthController],
  providers: [
    // ...
    AuthRateLimitGuard,
  ],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthRateLimitMiddleware)
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'auth/forgot-password', method: RequestMethod.POST },
        { path: 'auth/reset-password', method: RequestMethod.POST },
        { path: 'auth/change-password', method: RequestMethod.POST }
      );
  }
}
```

### Прогрессивная блокировка

Для дополнительной защиты от автоматизированных атак реализована стратегия прогрессивной блокировки:

1. При первом превышении лимита - блокировка на 1 минуту
2. При повторном превышении в течение часа - блокировка на 10 минут
3. При третьем превышении в течение часа - блокировка на 1 час
4. При постоянных попытках - блокировка на 24 часа и уведомление администратора

Такой подход обеспечивает баланс между безопасностью и удобством использования для легитимных пользователей, делая атаки brute force неэффективными.
