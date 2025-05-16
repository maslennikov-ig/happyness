# Примеры реализации API

В данном документе представлены примеры реализации API-контрактов для основных сущностей системы Happyness. Эти примеры демонстрируют, как применять стандарты API-контрактов на практике.

## 1. Реализация эндпоинтов для работы с пользователями

### 1.1. Контроллер пользователей

```typescript
// src/backend/modules/users/users.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { PaginationDto } from '../../core/dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение списка пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей получен успешно',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() pagination: PaginationDto) {
    const { data, meta } = await this.usersService.findAll(pagination);
    return {
      status: 'success',
      data,
      meta,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение данных конкретного пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя получены успешно',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
            message: { type: 'string', example: 'Пользователь не найден' },
            timestamp: { type: 'string' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
  })
  async findOne(@Param('id') id: string, @User() user) {
    // Проверка прав доступа: администратор или сам пользователь
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'У вас нет доступа к данному ресурсу',
        },
      });
    }

    const data = await this.usersService.findOne(id);
    return {
      status: 'success',
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Создание нового пользователя (регистрация)' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно создан',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        message: { type: 'string', example: 'Пользователь успешно зарегистрирован' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'RESOURCE_ALREADY_EXISTS' },
            message: { type: 'string', example: 'Пользователь с таким email уже существует' },
            timestamp: { type: 'string' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return {
      status: 'success',
      data,
      message: 'Пользователь успешно зарегистрирован',
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление данных пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя успешно обновлены',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
        message: { type: 'string', example: 'Данные пользователя успешно обновлены' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @User() user) {
    // Проверка прав доступа: администратор или сам пользователь
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'У вас нет доступа к данному ресурсу',
        },
      });
    }

    const data = await this.usersService.update(id, updateUserDto);
    return {
      status: 'success',
      data,
      message: 'Данные пользователя успешно обновлены',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Деактивация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно деактивирован',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Пользователь успешно деактивирован' },
      },
    },
  })
  async remove(@Param('id') id: string, @User() user) {
    // Проверка прав доступа: администратор или сам пользователь
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new ForbiddenException({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'У вас нет доступа к данному ресурсу',
        },
      });
    }

    await this.usersService.remove(id);
    return {
      status: 'success',
      message: 'Пользователь успешно деактивирован',
    };
  }
}
```

### 1.2. DTO для пользователей

```typescript
// src/backend/modules/users/dto/create-user.dto.ts

import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
    minimum: 2,
    maximum: 50,
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Имя должно содержать максимум 50 символов' })
  name: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'StrongP@ssw0rd',
    minimum: 8,
    maximum: 30,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(30, { message: 'Пароль должен содержать максимум 30 символов' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Пароль должен содержать заглавные и строчные буквы, цифры или специальные символы',
  })
  password: string;
}
```

## 2. Реализация эндпоинтов для аутентификации

### 2.1. Контроллер аутентификации

```typescript
// src/backend/modules/auth/auth.controller.ts

import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        message: { type: 'string', example: 'Пользователь успешно зарегистрирован' },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return {
      status: 'success',
      data,
      message: 'Пользователь успешно зарегистрирован',
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Аутентификация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно аутентифицирован',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неверные учетные данные',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_CREDENTIALS' },
            message: { type: 'string', example: 'Неверный email или пароль' },
            timestamp: { type: 'string' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return {
      status: 'success',
      data,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Обновление токена доступа' })
  @ApiResponse({
    status: 200,
    description: 'Токен доступа успешно обновлен',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Недействительный refresh-токен',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_TOKEN' },
            message: { type: 'string', example: 'Недействительный refresh-токен' },
            timestamp: { type: 'string' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
  })
  async refresh(@Body('refreshToken') refreshToken: string) {
    const data = await this.authService.refreshTokens(refreshToken);
    return {
      status: 'success',
      data,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение данных текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя получены успешно',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  })
  async me(@User() user) {
    return {
      status: 'success',
      data: user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выход из системы' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно вышел из системы',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Выход выполнен успешно' },
      },
    },
  })
  async logout(@User() user, @Body('refreshToken') refreshToken: string) {
    await this.authService.logout(user.id, refreshToken);
    return {
      status: 'success',
      message: 'Выход выполнен успешно',
    };
  }
}
```

## 3. Реализация глобального обработчика исключений

```typescript
// src/backend/core/filters/http-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = uuidv4();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'Внутренняя ошибка сервера';
    let errorDetails = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const exceptionObj = exceptionResponse as any;

        // Если это наш собственный формат ошибки
        if (exceptionObj.status === 'error' && exceptionObj.error) {
          return response.status(statusCode).json(exceptionObj);
        }

        // Если это ошибка валидации
        if (exceptionObj.message && Array.isArray(exceptionObj.message)) {
          errorCode = 'VALIDATION_ERROR';
          errorMessage = 'Ошибка валидации данных';
          errorDetails = exceptionObj.message;
        } else if (exceptionObj.message) {
          errorMessage = exceptionObj.message;
        }
      }
    }

    // Определение кода ошибки на основе статус-кода
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        errorCode = 'INVALID_REQUEST';
        if (errorMessage === 'Внутренняя ошибка сервера') {
          errorMessage = 'Некорректный запрос';
        }
        break;
      case HttpStatus.UNAUTHORIZED:
        errorCode = 'UNAUTHORIZED';
        if (errorMessage === 'Внутренняя ошибка сервера') {
          errorMessage = 'Необходима аутентификация';
        }
        break;
      case HttpStatus.FORBIDDEN:
        errorCode = 'FORBIDDEN';
        if (errorMessage === 'Внутренняя ошибка сервера') {
          errorMessage = 'Доступ запрещен';
        }
        break;
      case HttpStatus.NOT_FOUND:
        errorCode = 'RESOURCE_NOT_FOUND';
        if (errorMessage === 'Внутренняя ошибка сервера') {
          errorMessage = 'Ресурс не найден';
        }
        break;
      case HttpStatus.CONFLICT:
        errorCode = 'RESOURCE_ALREADY_EXISTS';
        if (errorMessage === 'Внутренняя ошибка сервера') {
          errorMessage = 'Ресурс уже существует';
        }
        break;
    }

    // Формирование ответа в соответствии со стандартом
    const responseBody = {
      status: 'error',
      error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: requestId,
      },
    };

    // Если это ошибка валидации, добавляем список ошибок
    if (errorCode === 'VALIDATION_ERROR' && errorDetails) {
      responseBody.error['validationErrors'] = errorDetails;
    }

    // В продакшн режиме скрываем детали ошибок сервера
    if (process.env.NODE_ENV === 'production' && statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      responseBody.error.details = null;
    } else if (exception instanceof Error) {
      // В режиме разработки добавляем стек ошибки для отладки
      if (process.env.NODE_ENV !== 'production') {
        responseBody.error.stack = exception.stack;
      }
    }

    response.status(statusCode).json(responseBody);
  }
}
```

## 4. Регистрация модулей и настройка API

```typescript
// src/backend/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './core/filters/http-exception.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Настройка глобального префикса API
  app.setGlobalPrefix('api');

  // Настройка CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Настройка валидации DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Настройка глобального обработчика исключений
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Настройка глобального интерсептора для логирования
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('Happyness API')
    .setDescription('API для системы Happyness')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Сервер запущен на порту ${port}`);
}
bootstrap();
```

## 5. Пример пользовательского декоратора

```typescript
// src/backend/modules/auth/decorators/user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
```

## 6. Пример guard для проверки ролей

```typescript
// src/backend/modules/auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'У вас нет доступа к данному ресурсу',
        },
      });
    }

    return true;
  }
}
```

## 7. Пример middleware для добавления requestId

```typescript
// src/backend/core/middleware/request-id.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req['requestId'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
```

## 8. Заключение

Представленные примеры демонстрируют, как реализовать API в соответствии с определенными API-контрактами, используя NestJS. Основные принципы, которые следует соблюдать:

1. **Единообразие ответов**: все ответы следуют стандартному формату с полями `status`, `data` (для успешных ответов) и `error` (для ошибок).
2. **Документирование API**: использование Swagger для автоматической генерации документации.
3. **Валидация данных**: использование DTO и встроенных механизмов валидации.
4. **Обработка ошибок**: централизованная обработка ошибок с единым форматом ответов.
5. **Авторизация и аутентификация**: использование guards для защиты эндпоинтов.
6. **Версионирование API**: включение версии в URL-путь.

Соблюдение этих принципов обеспечивает создание единообразного, предсказуемого и удобного в использовании API для системы Happyness.
