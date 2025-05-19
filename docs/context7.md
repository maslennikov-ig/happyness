# Использование Context7 в проекте Happyness

## Что такое Context7

Context7 - это инструмент, который обеспечивает доступ к актуальной документации популярных библиотек и фреймворков прямо в процессе разработки через AI-ассистентов (например, Claude). Это позволяет получать точные ответы на вопросы о API, методах и лучших практиках без необходимости постоянно переключаться между средой разработки и браузером.

## Интегрированные библиотеки

В проект Happyness были интегрированы следующие библиотеки через Context7:

1. **NestJS** (`/nestjs/docs.nestjs.com`) - фреймворк для серверной части приложения
2. **Next.js** (`/vercel/next.js`) - фреймворк для клиентской части приложения
3. **Prisma ORM** (`/prisma/docs`) - ORM для работы с базой данных

## Как использовать Context7

### В Cursor

Если вы используете IDE Cursor с встроенной поддержкой AI, вы можете обращаться к документации следующим образом:

1. Укажите AI-ассистенту, что вы хотите использовать Context7:

   ```
   use context7
   ```

2. Задайте вопрос, связанный с одной из интегрированных библиотек, например:

   ```
   Как правильно настроить модуль NestJS с зависимостями от других модулей?
   ```

3. AI-ассистент автоматически обратится к документации NestJS и предоставит актуальный ответ с примерами кода.

### Для конкретных библиотек

#### NestJS

Документация NestJS содержит информацию о:

- Модульной архитектуре
- Контроллерах и маршрутизации
- Провайдерах и сервисах
- Инъекции зависимостей
- Middleware и Guards
- Валидации данных
- Работе с базами данных

Например, чтобы узнать о динамических модулях, спросите:

```
Как создать динамический модуль в NestJS, который можно конфигурировать при импорте?
```

#### Next.js App Router

Документация Next.js содержит информацию о:

- Структуре проекта App Router
- Серверных и клиентских компонентах
- Маршрутизации и навигации
- Данных и кэшировании
- Метаданных и SEO
- Стилизации и CSS
- Оптимизации

Например, чтобы узнать о серверных компонентах, спросите:

```
Как правильно создать серверный компонент в Next.js App Router, который будет получать данные?
```

#### Prisma ORM

Документация Prisma содержит информацию о:

- Настройке и конфигурации
- Моделях данных и схемах
- CRUD-операциях
- Отношениях между моделями
- Транзакциях
- Миграциях
- Типизации в TypeScript

Например, чтобы узнать о транзакциях, спросите:

```
Как использовать транзакции в Prisma при создании связанных сущностей?
```

## Примеры использования

### NestJS: Настройка модуля с зависимостями

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

### Next.js: Серверный компонент с получением данных

```typescript
// app/projects/page.tsx
import { prisma } from '@/lib/prisma';
import ProjectsList from '@/components/ProjectsList';

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    include: { owner: true },
  });

  return <ProjectsList projects={projects} />;
}
```

### Prisma: Транзакции для связанных сущностей

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createProjectWithRequests() {
  const result = await prisma.$transaction(async tx => {
    const project = await tx.project.create({
      data: {
        title: 'New Project',
        description: 'Project description',
        status: 'PENDING',
        ownerId: 1,
      },
    });

    const request = await tx.request.create({
      data: {
        title: 'Initial Request',
        description: 'Request description',
        status: 'PENDING',
        projectId: project.id,
      },
    });

    return { project, request };
  });

  return result;
}
```

## Рекомендации по использованию

1. **Задавайте конкретные вопросы**: Чем более конкретен ваш вопрос, тем более точный ответ вы получите.

2. **Указывайте контекст**: Если ваш вопрос связан с конкретной частью проекта, укажите это, например, "как использовать Prisma в контроллере NestJS для добавления пользователя".

3. **Запрашивайте примеры**: Всегда полезно попросить примеры кода, которые можно адаптировать для вашего случая.

4. **Уточняйте версию**: Если вы сомневаетесь, что документация может различаться между версиями, укажите версию библиотеки, которую используете в проекте.

## Заключение

Context7 значительно упрощает процесс разработки, предоставляя мгновенный доступ к документации прямо в среде разработки. Это особенно полезно при работе с комплексными архитектурами, такими как у Happyness, где взаимодействуют несколько фреймворков и библиотек.

Используйте Context7 для ускорения разработки, соблюдения лучших практик и получения актуальных решений ваших задач.
