# Структура JWT-токенов

## Навигация по документам аутентификации

- [**Обзор системы аутентификации**](./task31.md) - основной документ с общим описанием задачи
- [**Компоненты системы аутентификации**](./task31_auth_components.md) - описание всех компонентов системы аутентификации на бэкенде и фронтенде, их ответственности и взаимосвязи
- [**Потоки аутентификации**](./task31_auth_flows.md) - детальное описание всех сценариев аутентификации с диаграммами последовательности
- [**Механизм Refresh токенов**](./task31_refresh_tokens.md) - детальное описание механизма обновления токенов
- [**Хранение JWT на клиенте**](./task31_client_storage.md) - стратегия безопасного хранения JWT на клиентской стороне

В данном документе описывается структура JWT-токенов, используемых в системе аутентификации Happyness.

## Общая структура JWT

JWT (JSON Web Token) состоит из трех частей, разделенных точками:

1. **Header** (заголовок) - содержит тип токена и алгоритм шифрования
2. **Payload** (полезная нагрузка) - содержит утверждения (claims)
3. **Signature** (подпись) - обеспечивает целостность и аутентичность токена

Формат токена: `xxxxx.yyyyy.zzzzz`

## Структура Access токена

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg` - алгоритм шифрования (HS256 - HMAC SHA-256)
- `typ` - тип токена (JWT)

### Payload

```json
{
  "sub": "1234567890", // Subject - ID пользователя
  "email": "user@example.com", // Email пользователя
  "role": "ENTREPRENEUR", // Роль пользователя
  "iat": 1516239022, // Issued At - время выдачи токена (unix timestamp)
  "exp": 1516242622, // Expiration Time - время истечения токена (unix timestamp)
  "jti": "abcdef123456", // JWT ID - уникальный идентификатор токена
  "type": "access" // Тип токена (access)
}
```

#### Стандартные поля (RFC 7519)

- `sub` (subject) - идентификатор пользователя (UUID)
- `iat` (issued at) - время выдачи токена
- `exp` (expiration time) - время истечения токена
- `jti` (JWT ID) - уникальный идентификатор токена для предотвращения повторного использования

#### Кастомные поля

- `email` - электронная почта пользователя
- `role` - роль пользователя (`ADMIN`, `ENTREPRENEUR`, `CONTRACTOR`)
- `type` - тип токена (`access`)

### Signature

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

Подпись создается с использованием алгоритма HMAC SHA-256 и секретного ключа, доступного только серверу.

## Структура Refresh токена

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload

```json
{
  "sub": "1234567890", // Subject - ID пользователя
  "iat": 1516239022, // Issued At - время выдачи токена
  "exp": 1516275022, // Expiration Time - время истечения токена
  "jti": "xyz789012345", // JWT ID - уникальный идентификатор токена
  "type": "refresh", // Тип токена (refresh)
  "family": "fam123456" // Идентификатор семейства токенов для ротации
}
```

#### Дополнительные поля для Refresh токена

- `type` - тип токена (`refresh`)
- `family` - идентификатор семейства токенов для реализации механизма ротации

### Signature

Аналогично access токену, но может использоваться отдельный секретный ключ.

## Время жизни токенов

- **Access токен**: короткое время жизни (15-30 минут)
- **Refresh токен**: более длительное время жизни (7-30 дней)

## Хранение информации о токенах

### Модель данных RefreshToken

```typescript
// Модель для хранения refresh токенов
model RefreshToken {
  id          String    @id @default(uuid())
  token       String    @unique // Хеш токена
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  family      String    // Идентификатор семейства для ротации токенов
  expiresAt   DateTime  // Дата истечения токена
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  isRevoked   Boolean   @default(false) // Флаг отзыва токена
  deviceInfo  String?   // Информация об устройстве пользователя
  ipAddress   String?   // IP-адрес, с которого был получен токен
  lastUsedAt  DateTime? // Время последнего использования

  @@index([userId])
  @@index([family])
  @@index([expiresAt])
  @@index([isRevoked])
}
```

## Механизм ротации токенов

Для повышения безопасности и удобства использования в системе реализован механизм ротации токенов:

1. При использовании refresh токена для получения новой пары токенов:

   - Старый refresh токен инвалидируется
   - Создается новый refresh токен с тем же идентификатором семейства
   - Создается новый access токен

2. При обнаружении использования уже использованного refresh токена:
   - Все токены с тем же идентификатором семейства инвалидируются
   - Пользователю потребуется повторная аутентификация

Такой подход реализует принцип "обнаруживаемого хищения токена" и позволяет минимизировать риски в случае компрометации refresh токена.

## Безопасность токенов

1. **Подпись**: Все токены подписываются с использованием секретного ключа
2. **Хеширование**: Refresh токены хранятся в базе данных в хешированном виде
3. **Ограниченное время жизни**: Access токены имеют короткое время жизни
4. **Механизм ротации**: Refresh токены используют систему ротации для обнаружения хищения
5. **Контроль валидности**: Поддерживается инвалидация токенов при выходе из системы или смене пароля

## Пример реализации JwtStrategy

JwtStrategy - это класс, который определяет, как будут извлекаться и проверяться JWT токены в запросах. В NestJS, JwtStrategy использует библиотеку Passport:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Структура полезной нагрузки JWT токена
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: string;
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Указываем, как извлекать токен из запроса - из заголовка Authorization
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Игнорировать истекшие токены - проверка срока действия
      ignoreExpiration: false,
      // Секретный ключ для проверки подписи
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Метод validate вызывается после проверки JWT токена
  // Результат этого метода становится доступен в Request.user
  async validate(payload: JwtPayload) {
    // Проверяем, что токен имеет правильный тип
    if (payload.type !== 'access') {
      throw new Error('Неверный тип токена');
    }

    // Возвращаем объект, который будет доступен в Request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenId: payload.jti,
    };
  }
}
```

Этот стратегия используется JwtAuthGuard для защиты маршрутов:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Можно переопределить handleRequest для дополнительной обработки ошибок
  handleRequest(err, user, info) {
    if (err || !user) {
      // Кастомная обработка ошибок аутентификации
      throw err || new UnauthorizedException('Ошибка аутентификации');
    }
    return user;
  }
}
```

## Преимущества используемой структуры

1. **Безопасность**: Короткое время жизни access токенов и механизм ротации refresh токенов минимизируют риски
2. **Производительность**: Валидация access токенов не требует обращения к базе данных
3. **Удобство использования**: Пользователям не нужно часто повторно входить в систему
4. **Масштабируемость**: Система аутентификации легко масштабируется горизонтально
5. **Гибкость**: Структура токенов может быть расширена для поддержки дополнительных функций
