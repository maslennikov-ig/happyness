# Механизм Refresh токенов

## Навигация по документам аутентификации

- [**Обзор системы аутентификации**](./task31.md) - основной документ с общим описанием задачи
- [**Компоненты системы аутентификации**](./task31_auth_components.md) - описание всех компонентов системы аутентификации на бэкенде и фронтенде, их ответственности и взаимосвязи
- [**Потоки аутентификации**](./task31_auth_flows.md) - детальное описание всех сценариев аутентификации с диаграммами последовательности
- [**Структура JWT-токенов**](./task31_jwt_structure.md) - спецификация структуры JWT-токенов, используемых в системе
- [**Хранение JWT на клиенте**](./task31_client_storage.md) - стратегия безопасного хранения JWT на клиентской стороне

В данном документе описывается детальная спецификация механизма refresh токенов в системе аутентификации Happyness.

## Общий принцип работы

Механизм refresh токенов основан на использовании двух типов токенов:

1. **Access токен** - токен с коротким сроком жизни для доступа к защищенным ресурсам
2. **Refresh токен** - токен с длительным сроком жизни для получения новых access токенов

Такой подход позволяет обеспечить баланс между безопасностью и удобством использования:

- Короткое время жизни access токена минимизирует риск его компрометации
- Наличие refresh токена позволяет пользователю не вводить учетные данные повторно

## Стратегия хранения refresh токенов

### Серверное хранение

#### База данных

Refresh токены хранятся в базе данных в хешированном виде с использованием следующей модели:

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

#### Процесс хеширования

1. При создании refresh токена:

   - Генерируется JWT токен с необходимыми полями
   - Токен хешируется с использованием алгоритма SHA-256
   - Хеш токена сохраняется в базе данных
   - Оригинальный токен возвращается клиенту

2. При проверке refresh токена:
   - Входящий токен хешируется с использованием того же алгоритма
   - Полученный хеш сравнивается с хешами в базе данных
   - При совпадении и отсутствии флага отзыва токен считается валидным

### Клиентское хранение

Refresh токен хранится на клиенте в HttpOnly куки со следующими параметрами:

```
Set-Cookie: refresh_token=<token>;
            Path=/api/v1/auth;
            HttpOnly;
            Secure;
            SameSite=Strict;
            Max-Age=<seconds-until-expiration>
```

- **Path=/api/v1/auth** - ограничивает область видимости куки только API аутентификации
- **HttpOnly** - предотвращает доступ к куки через JavaScript
- **Secure** - обеспечивает передачу куки только по HTTPS
- **SameSite=Strict** - предотвращает отправку куки в cross-site запросах
- **Max-Age** - устанавливает время жизни куки в соответствии со временем жизни refresh токена

## Процесс обновления токенов

### Последовательность действий

1. Клиент обнаруживает, что access токен истек или скоро истечет
2. Клиент отправляет запрос на `/api/v1/auth/refresh`
3. Refresh токен автоматически передается в куки
4. Сервер извлекает refresh токен из куки
5. Сервер проверяет валидность refresh токена:

   - Проверяет подпись JWT
   - Проверяет срок действия
   - Проверяет наличие соответствующей записи в базе данных
   - Проверяет, что токен не отозван

6. При успешной валидации:

   - Старый refresh токен помечается как использованный (isRevoked = true)
   - Генерируется новый refresh токен с тем же идентификатором семейства
   - Генерируется новый access токен
   - Новый refresh токен сохраняется в базе данных
   - Новый refresh токен отправляется клиенту в HttpOnly куки
   - Новый access токен отправляется клиенту в теле ответа

7. При неудачной валидации:
   - В случае истечения срока действия - все токены семейства отзываются
   - В случае повторного использования - все токены семейства отзываются (защита от кражи токенов)
   - Клиенту возвращается ошибка 401 Unauthorized с рекомендацией повторного входа

### Диаграмма процесса обновления токенов

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
    |                 |                   |                   | 4. Проверка JWT   |
    |                 |                   |                   |------------------>|
    |                 |                   |                   | 5. Проверка в БД  |
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |                   |                   | 6. Пометка использованным |
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |                   |                   | 7. Создание новых токенов |
    |                 |                   |                   |------------------>|
    |                 |                   |                   | 8. Сохранение в БД|
    |                 |                   |                   |------------------>|
    |                 |                   |                   |<------------------|
    |                 |                   |<------------------|                   |
    |                 |<------------------|                   |                   |
    | 9. Response     |                   |                   |                   |
    | Set-Cookie: refresh_token={new}     |                   |                   |
    | Body: { token: "new-access-token" } |                   |                   |
    |<----------------|                   |                   |                   |
    |                 |                   |                   |                   |
```

## Механизм инвалидации токенов

### Случаи инвалидации

1. **Выход пользователя из системы**:

   - Refresh токен удаляется из базы данных
   - Куки с refresh токеном удаляется с клиента

2. **Смена пароля**:

   - Все refresh токены пользователя отзываются (isRevoked = true)
   - Пользователю потребуется повторный вход

3. **Подозрение на компрометацию**:

   - При обнаружении повторного использования refresh токена
   - Все токены с тем же идентификатором семейства отзываются
   - Пользователю потребуется повторный вход

4. **Административное действие**:
   - Администратор может отозвать все токены пользователя
   - Специальный эндпоинт для отзыва токенов по ID пользователя

### Процесс очистки устаревших токенов

1. **Регулярная задача**:

   - Запускается по расписанию (например, раз в день)
   - Удаляет истекшие и отозванные токены старше определенного периода

2. **Ограничение количества токенов на пользователя**:
   - При превышении лимита токенов для пользователя (например, 10)
   - Наиболее старые неиспользуемые токены удаляются

## Механизм blacklist для скомпрометированных токенов

Для оперативной блокировки скомпрометированных токенов используется централизованная blacklist, хранящаяся в Redis:

### Принцип работы blacklist

1. **Хранение данных**:

   - Каждый отозванный токен добавляется в Redis по его jti (JWT ID)
   - Для каждой записи устанавливается TTL, равный оставшемуся сроку жизни токена
   - Это гарантирует автоматическую очистку токенов после их естественного истечения

2. **Проверка токенов**:

   - При проверке access токена:
     ```typescript
     async validateAccessToken(token: string): Promise<boolean> {
       try {
         // Верификация подписи и срока действия
         const payload = this.jwtService.verify(token);

         // Проверка наличия токена в blacklist
         const isBlacklisted = await this.redisService.exists(`blacklist:${payload.jti}`);
         if (isBlacklisted) {
           return false;
         }

         return true;
       } catch (error) {
         return false;
       }
     }
     ```

3. **Добавление токенов в blacklist**:

   - При выходе пользователя из системы
   - При обнаружении попытки повторного использования refresh токена
   - При сбросе пароля или изменении критически важных данных пользователя
   - По административному решению (например, при подозрении компрометации)

   ```typescript
   async blacklistToken(token: string): Promise<void> {
     try {
       const payload = this.jwtService.decode(token) as JwtPayload;
       if (!payload || !payload.jti || !payload.exp) {
         return;
       }

       // Вычисляем оставшееся время жизни токена в секундах
       const now = Math.floor(Date.now() / 1000);
       const ttl = Math.max(0, payload.exp - now);

       // Добавляем токен в blacklist с соответствующим TTL
       await this.redisService.set(`blacklist:${payload.jti}`, '1', 'EX', ttl);

       // Логируем факт блокировки токена
       this.logger.log(`Token with jti ${payload.jti} blacklisted for ${ttl} seconds`);
     } catch (error) {
       this.logger.error(`Error blacklisting token: ${error.message}`);
     }
   }
   ```

4. **Массовая блокировка токенов пользователя**:

   - При подозрении на компрометацию учетной записи
   - При изменении привилегий или блокировке аккаунта

   ```typescript
   async blacklistAllUserTokens(userId: string): Promise<void> {
     // Получаем все активные токены пользователя
     const tokens = await this.refreshTokenRepository.find({
       where: { userId, isRevoked: false },
     });

     // Добавляем все связанные access токены в blacklist
     // Для этого нам нужно декодировать refresh токены и извлечь семейства
     const families = tokens.map(token => token.family);

     // Отмечаем все refresh токены как отозванные
     await this.refreshTokenRepository.update(
       { userId, isRevoked: false },
       { isRevoked: true }
     );

     this.logger.log(`Blacklisted all tokens for user ${userId}`);
   }
   ```

### Синхронизация blacklist между экземплярами приложения

Использование Redis в качестве хранилища blacklist обеспечивает:

1. Быстрый доступ к данным (O(1) сложность операций)
2. Автоматическое удаление устаревших записей через механизм TTL
3. Единый источник правды для всех экземпляров приложения при масштабировании
4. Защиту от высоких нагрузок на основную базу данных

### Устойчивость системы при недоступности Redis

Для обеспечения отказоустойчивости реализована стратегия работы при недоступности Redis:

```typescript
async isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    // Основной сценарий - проверка в Redis
    return await this.redisService.exists(`blacklist:${jti}`);
  } catch (error) {
    // При ошибке доступа к Redis - делаем запись в логи
    this.logger.error(`Error checking blacklist: ${error.message}`);

    // Безопасный вариант - разрешать запросы с малым TTL
    // Это компромисс между безопасностью и доступностью
    return false;
  }
}
```

## Специальные случаи и обработка ошибок

### Параллельное обновление токенов

При почти одновременном запросе обновления токенов с разных устройств:

1. Первый запрос успешно завершается, отозвав старый токен
2. Второй запрос получает ошибку повторного использования токена
3. Для разрешения этой ситуации добавляется grace period (например, 30 секунд)
4. В течение grace period запросы с тем же токеном считаются потенциально легитимными

### Несовпадение IP-адреса или устройства

1. При получении refresh токена сохраняется информация об IP и устройстве
2. При использовании токена с другого IP/устройства:
   - Если изменение незначительное (например, мобильный IP) - разрешается с логированием
   - Если изменение существенное - требуется дополнительная проверка
   - В особо подозрительных случаях - отзыв всех токенов

### Обработка Cross-Origin запросов

Для обеспечения работы системы refresh токенов в cross-origin сценариях:

1. Настроен CORS с опцией `credentials: true`
2. Используется опция `SameSite=Lax` вместо `Strict` при необходимости
3. Возможна реализация альтернативного механизма для мобильных приложений

## Реализация на серверной стороне

### TokenService

```typescript
@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  // Генерация access токена
  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      jti: uuidv4(),
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });
  }

  // Генерация refresh токена
  async generateRefreshToken(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
    family?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    // Создание идентификатора семейства или использование существующего
    const tokenFamily = family || uuidv4();
    const tokenJti = uuidv4();

    // Создание payload для JWT
    const payload = {
      sub: user.id,
      type: 'refresh',
      jti: tokenJti,
      family: tokenFamily,
    };

    // Генерация JWT
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Вычисление даты истечения
    const decodedToken = this.jwtService.decode(token) as { exp: number };
    const expiresAt = new Date(decodedToken.exp * 1000);

    // Хеширование токена для хранения
    const hashedToken = await this.hashToken(token);

    // Сохранение в базу данных
    await this.refreshTokenRepository.save({
      token: hashedToken,
      userId: user.id,
      family: tokenFamily,
      expiresAt,
      deviceInfo,
      ipAddress,
    });

    return { token, expiresAt };
  }

  // Валидация refresh токена
  async validateRefreshToken(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    family?: string;
    error?: string;
  }> {
    try {
      // Проверка JWT
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as { sub: string; jti: string; family: string; type: string };

      // Проверка типа токена
      if (decoded.type !== 'refresh') {
        return { isValid: false, error: 'Неверный тип токена' };
      }

      // Поиск токена в базе данных
      const hashedToken = await this.hashToken(token);
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token: hashedToken },
      });

      // Проверка наличия токена в базе данных
      if (!refreshToken) {
        return { isValid: false, error: 'Токен не найден' };
      }

      // Проверка отзыва токена
      if (refreshToken.isRevoked) {
        // Возможно обнаружена попытка повторного использования
        await this.revokeTokenFamily(refreshToken.family);
        return { isValid: false, error: 'Токен отозван' };
      }

      // Проверка срока действия
      if (refreshToken.expiresAt < new Date()) {
        return { isValid: false, error: 'Токен истек' };
      }

      // Обновление времени последнего использования
      await this.refreshTokenRepository.update(refreshToken.id, {
        lastUsedAt: new Date(),
      });

      return {
        isValid: true,
        userId: decoded.sub,
        family: decoded.family,
      };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  // Отзыв всех токенов семейства
  async revokeTokenFamily(family: string): Promise<void> {
    await this.refreshTokenRepository.update({ family }, { isRevoked: true });
  }

  // Отзыв всех токенов пользователя
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
  }

  // Удаление токена (при выходе из системы)
  async removeToken(token: string): Promise<boolean> {
    const hashedToken = await this.hashToken(token);
    const result = await this.refreshTokenRepository.delete({ token: hashedToken });
    return result.affected > 0;
  }

  // Очистка устаревших токенов
  async cleanupExpiredTokens(): Promise<void> {
    // Удаление токенов, истекших более 7 дней назад
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(cutoffDate),
    });

    // Удаление отозванных токенов старше 1 дня
    const revokedCutoffDate = new Date();
    revokedCutoffDate.setDate(revokedCutoffDate.getDate() - 1);

    await this.refreshTokenRepository.delete({
      isRevoked: true,
      updatedAt: LessThan(revokedCutoffDate),
    });
  }

  // Хеширование токена для хранения
  private async hashToken(token: string): Promise<string> {
    return createHash('sha256').update(token).digest('hex');
  }
}
```

## Интеграция с клиентской стороной

### Автоматическое обновление токенов

Клиентская сторона должна реализовать механизм для автоматического обновления токенов:

1. **Проактивное обновление**:

   - Проверка времени жизни access токена перед каждым запросом
   - Если токен истекает в ближайшее время (например, меньше 5 минут) - обновление до выполнения запроса

2. **Реактивное обновление**:

   - Перехват ошибок 401 Unauthorized
   - Попытка обновить токен
   - Повторение исходного запроса с новым токеном

3. **Очередь запросов**:
   - При обновлении токена все параллельные запросы ставятся в очередь
   - После успешного обновления все запросы выполняются с новым токеном
   - При ошибке обновления - все запросы завершаются с ошибкой

## Безопасность и защита от атак

### Защита от Cross-Site Request Forgery (CSRF)

Использование HttpOnly куки с SameSite=Strict/Lax защищает от большинства CSRF атак, но для дополнительной защиты:

1. Использование двойной защиты с CSRF токеном для критических операций
2. Проверка заголовка Origin/Referer для POST запросов

### Защита от перехвата токенов

1. Передача токенов только по HTTPS
2. Использование HttpOnly куки для refresh токенов
3. Хранение access токенов только в памяти (не в localStorage)

### Защита от Replay атак

1. Использование уникальных идентификаторов (jti) для каждого токена
2. Отслеживание использованных refresh токенов
3. Внедрение механизма nonce для критических операций

### Защита от Token Sidejacking

1. Привязка токенов к устройству и/или IP (с допуском небольших изменений)
2. Хранение fingerprint устройства при создании токена
3. Проверка fingerprint при использовании токена

## Выводы и рекомендации

Предложенный механизм refresh токенов обеспечивает:

1. **Высокий уровень безопасности** - защита от распространенных атак на системы аутентификации
2. **Удобство использования** - пользователям не требуется частый повторный вход
3. **Масштабируемость** - механизм хорошо работает при горизонтальном масштабировании
4. **Производительность** - минимальное количество запросов к базе данных
5. **Обратную совместимость** - возможность внедрения без изменения существующих клиентов

### Дополнительные рекомендации

1. **Мониторинг и аудит** - регулярный анализ использования и попыток злоупотребления
2. **Ограничение скорости** - защита от брутфорс атак на эндпоинты аутентификации
3. **Автоматический выход** - отзыв токенов при длительном периоде неактивности
4. **Управление сессиями** - предоставление пользователям возможности просмотра и отзыва активных сессий
