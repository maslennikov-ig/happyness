# Архитектурные диаграммы системы Happyness (модель C4)

## Уровень 1: Контекстная диаграмма (Context)

Контекстная диаграмма показывает систему Happyness в целом и её взаимодействие с внешними пользователями и системами.

```
+----------------------------------------------------------+
|                                                          |
|  +------------------+          +--------------------+    |
|  |                  |          |                    |    |
|  | Предприниматель  +--------->+                    |    |
|  |                  |          |                    |    |
|  +------------------+          |                    |    |
|                                |                    |    |
|  +------------------+          |                    |    |
|  |                  |          |                    |    |
|  | Сотрудник        +--------->+   Платформа        |    |
|  | компании         |          |   Happyness        |    |
|  +------------------+          |                    |    |
|                                |                    |    |
|  +------------------+          |                    |    |
|  |                  |          |                    |    |
|  | Консьерж-        +--------->+                    |    |
|  | менеджер         |          |                    |    |
|  +------------------+          |                    |    |
|                                |                    |    |
|  +------------------+          |                    |    |
|  |                  |          |                    |    |
|  | Администратор    +--------->+                    |    |
|  | платформы        |          |                    |    |
|  +------------------+          +----+---------------+    |
|                                     |                    |
|                                     v                    |
|  +------------------+          +--------------------+    |
|  |                  |          |                    |    |
|  | Платежная        |<---------+                    |    |
|  | система          |          |  Внешние системы   |    |
|  +------------------+          |                    |    |
|                                |                    |    |
|  +------------------+          |                    |    |
|  |                  |          |                    |    |
|  | Email-сервис     |<---------+                    |    |
|  |                  |          |                    |    |
|  +------------------+          +--------------------+    |
|                                                          |
+----------------------------------------------------------+
```

## Уровень 2: Контейнерная диаграмма (Containers)

Контейнерная диаграмма показывает высокоуровневую архитектуру системы Happyness, разделенную на основные технологические компоненты.

```
+------------------------------------------------------------------+
|                         Платформа Happyness                      |
|                                                                  |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  Frontend           |        |  Backend               |       |
|  |  (Next.js)          |<------>|  (NestJS)              |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------+-----------+       |
|                                              |                   |
|                                              v                   |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  База данных        |<------>|  Кеш                  |       |
|  |  (PostgreSQL)       |        |  (Redis)              |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------------------+       |
|                                                                  |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  Файловое           |        |  Мониторинг и         |       |
|  |  хранилище          |        |  логирование          |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------------------+       |
|                                                                  |
+------------------------------------------------------------------+
```

## Уровень 3: Компонентная диаграмма (Components)

### Компонентная диаграмма Frontend

```
+------------------------------------------------------------------+
|                         Frontend (Next.js)                       |
|                                                                  |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  Core               |        |  UI Components         |       |
|  |  - Auth             |        |  - shadcn/ui           |       |
|  |  - Routing          |        |  - Custom components   |       |
|  |  - State Management |        |  - Forms               |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------------------+       |
|                                                                  |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  API Client         |        |  Module System         |       |
|  |  - HTTP client      |        |  - Module registry     |       |
|  |  - WebSocket client |        |  - Module loader       |       |
|  |  - API hooks        |        |  - Module interfaces   |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------------------+       |
|                                                                  |
|  +------------------------------------------------------------------+
|  |                         Функциональные модули                    |
|  |                                                                  |
|  |  +---------------------+        +------------------------+       |
|  |  |                     |        |                        |       |
|  |  |  Консьерж-сервис    |        |  Чат                  |       |
|  |  |  - Формы запросов   |        |  - Интерфейс чата     |       |
|  |  |  - Отслеживание     |        |  - История сообщений  |       |
|  |  |  - Статусы          |        |  - Уведомления        |       |
|  |  |                     |        |                        |       |
|  |  +---------------------+        +------------------------+       |
|  |                                                                  |
|  |  +---------------------+        +------------------------+       |
|  |  |                     |        |                        |       |
|  |  |  База подрядчиков   |        |  Шаблоны и база знаний|       |
|  |  |  - Каталог          |        |  - Библиотека         |       |
|  |  |  - Поиск            |        |  - Поиск              |       |
|  |  |  - Фильтры          |        |  - Категории          |       |
|  |  |                     |        |                        |       |
|  |  +---------------------+        +------------------------+       |
|  |                                                                  |
|  +------------------------------------------------------------------+
|                                                                  |
+------------------------------------------------------------------+
```

### Компонентная диаграмма Backend

```
+------------------------------------------------------------------+
|                         Backend (NestJS)                         |
|                                                                  |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  Core               |        |  Common                |       |
|  |  - AppModule        |        |  - Guards              |       |
|  |  - ConfigModule     |        |  - Filters             |       |
|  |  - LoggerModule     |        |  - Interceptors        |       |
|  |  - DatabaseModule   |        |  - Pipes               |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------------------+       |
|                                                                  |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  Auth               |        |  Users & Companies     |       |
|  |  - AuthService      |        |  - UserService         |       |
|  |  - AuthController   |        |  - CompanyService      |       |
|  |  - Strategies       |        |  - RoleService         |       |
|  |  - Guards           |        |                        |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------------------+       |
|                                                                  |
|  +---------------------+        +------------------------+       |
|  |                     |        |                        |       |
|  |  Module System      |        |  Shared Services       |       |
|  |  - ModuleLoader     |        |  - NotificationService |       |
|  |  - ModuleRegistry   |        |  - FileService         |       |
|  |  - EventBus         |        |  - CacheService        |       |
|  |                     |        |                        |       |
|  +---------------------+        +------------------------+       |
|                                                                  |
|  +------------------------------------------------------------------+
|  |                         Функциональные модули                    |
|  |                                                                  |
|  |  +---------------------+        +------------------------+       |
|  |  |                     |        |                        |       |
|  |  |  RequestsModule     |        |  ChatModule            |       |
|  |  |  - RequestService   |        |  - ChatService         |       |
|  |  |  - RequestController|        |  - ChatController      |       |
|  |  |  - RequestRepository|        |  - MessageRepository   |       |
|  |  |                     |        |  - WebSocketGateway    |       |
|  |  +---------------------+        +------------------------+       |
|  |                                                                  |
|  |  +---------------------+        +------------------------+       |
|  |  |                     |        |                        |       |
|  |  |  ContractorsModule  |        |  TemplatesModule       |       |
|  |  |  - ContractorService|        |  - TemplateService     |       |
|  |  |  - ContractorCtrl   |        |  - TemplateController  |       |
|  |  |  - ContractorRepo   |        |  - TemplateRepository  |       |
|  |  |                     |        |                        |       |
|  |  +---------------------+        +------------------------+       |
|  |                                                                  |
|  |  +---------------------+        +------------------------+       |
|  |  |                     |        |                        |       |
|  |  |  PaymentsModule     |        |  AnalyticsModule       |       |
|  |  |  - PaymentService   |        |  - AnalyticsService    |       |
|  |  |  - PaymentController|        |  - AnalyticsController |       |
|  |  |  - TariffService    |        |  - ReportService       |       |
|  |  |                     |        |                        |       |
|  |  +---------------------+        +------------------------+       |
|  |                                                                  |
|  +------------------------------------------------------------------+
|                                                                  |
+------------------------------------------------------------------+
```

## Уровень 4: Код (Code)

На этом уровне представлены ключевые классы и интерфейсы системы. Ниже приведены примеры для некоторых компонентов.

### Пример для модульной системы

```typescript
// Интерфейс модуля
interface IModule {
  name: string;
  version: string;
  initialize(): Promise<void>;
  getPublicServices(): Record<string, any>;
  getEventSubscriptions(): Record<string, Function>;
  shutdown(): Promise<void>;
}

// Базовый класс модуля
abstract class BaseModule implements IModule {
  constructor(
    protected readonly name: string,
    protected readonly version: string,
    protected readonly eventBus: EventBus,
    protected readonly logger: LoggerService
  ) {}

  abstract initialize(): Promise<void>;
  abstract getPublicServices(): Record<string, any>;
  abstract getEventSubscriptions(): Record<string, Function>;
  
  async shutdown(): Promise<void> {
    this.logger.log(`Shutting down module: ${this.name}`);
  }
}

// Реестр модулей
class ModuleRegistry {
  private modules: Map<string, IModule> = new Map();

  registerModule(module: IModule): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }
    this.modules.set(module.name, module);
  }

  getModule<T extends IModule>(name: string): T {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module ${name} not found`);
    }
    return module as T;
  }

  getAllModules(): IModule[] {
    return Array.from(this.modules.values());
  }
}
```

### Пример для системы аутентификации

```typescript
// Сервис аутентификации
class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.verifyPassword(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.generateRefreshToken(user.id),
    };
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // Реализация проверки пароля
  }

  private generateRefreshToken(userId: number): string {
    // Реализация генерации refresh token
  }
}

// Стратегия JWT аутентификации
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, email: payload.email, roles: payload.roles };
  }
}
```

## Дополнительные диаграммы

### Диаграмма потока данных для создания запроса

```
+-------------+         +-------------+         +-------------+
|             |         |             |         |             |
|  Frontend   +-------->+  Backend    +-------->+  Database   |
|  (Next.js)  |  HTTP   |  (NestJS)   |  SQL    |  (Postgres) |
|             |  POST   |             |  INSERT |             |
+-------------+         +------+------+         +-------------+
                               |
                               | Event
                               v
+-------------+         +-------------+         +-------------+
|             |         |             |         |             |
|  WebSocket  |<--------+  EventBus   |-------->+  Analytics  |
|  Clients    |  Push   |  (Redis)    |  Event  |  Service    |
|             |         |             |         |             |
+-------------+         +------+------+         +-------------+
                               |
                               | Event
                               v
                        +-------------+
                        |             |
                        |  Email      |
                        |  Service    |
                        |             |
                        +-------------+
```

### Диаграмма последовательности для процесса аутентификации

```
+-------------+         +-------------+         +-------------+         +-------------+
|             |         |             |         |             |         |             |
|  Client     |         |  Auth       |         |  Users      |         |  JWT        |
|  Browser    |         |  Controller |         |  Service    |         |  Service    |
|             |         |             |         |             |         |             |
+------+------+         +------+------+         +------+------+         +------+------+
       |                       |                       |                       |
       | Login Request         |                       |                       |
       +---------------------->|                       |                       |
       |                       | Validate Credentials  |                       |
       |                       +---------------------->|                       |
       |                       |                       |                       |
       |                       |<----------------------+                       |
       |                       | Generate JWT         |                       |
       |                       +--------------------------------------------->|
       |                       |                       |                       |
       |                       |<---------------------------------------------+
       | Return Tokens         |                       |                       |
       |<----------------------+                       |                       |
       |                       |                       |                       |
       | Request with JWT      |                       |                       |
       +---------------------->|                       |                       |
       |                       | Validate JWT          |                       |
       |                       +--------------------------------------------->|
       |                       |                       |                       |
       |                       |<---------------------------------------------+
       | Return Protected Data |                       |                       |
       |<----------------------+                       |                       |
       |                       |                       |                       |
+------+------+         +------+------+         +------+------+         +------+------+
``` 