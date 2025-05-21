import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

interface TestData {
  users: {
    admin: any;
    regular: any;
    contractor: any;
  };
  projects: any[];
}

/**
 * Заполняет тестовую базу данных начальными тестовыми данными
 * @param prisma PrismaClient экземпляр
 */
export async function seedTestDatabase(prisma: PrismaClient): Promise<TestData> {
  if (!prisma) {
    console.warn('Prisma не инициализирована, пропускаем заполнение тестовой БД');
    return {
      users: {
        admin: null,
        regular: null,
        contractor: null,
      },
      projects: [],
    };
  }

  try {
    // Хешируем пароли для тестовых пользователей
    const passwordHash = await argon2.hash('password123');

    // Создаем тестовых пользователей
    const admin = await prisma.user.create({
      data: {
        name: 'Администратор',
        email: 'admin@example.com',
        passwordHash,
        role: 'ADMIN',
      },
    });

    const regularUser = await prisma.user.create({
      data: {
        name: 'Пользователь',
        email: 'user@example.com',
        passwordHash,
        role: 'USER',
      },
    });

    const contractor = await prisma.user.create({
      data: {
        name: 'Подрядчик',
        email: 'contractor@example.com',
        passwordHash,
        role: 'CONTRACTOR',
      },
    });

    // Создаем тестовые проекты
    const project1 = await prisma.project.create({
      data: {
        title: 'Тестовый проект 1',
        description: 'Описание тестового проекта 1',
        status: 'DRAFT',
        ownerId: regularUser.id,
      },
    });

    const project2 = await prisma.project.create({
      data: {
        title: 'Тестовый проект 2',
        description: 'Описание тестового проекта 2',
        status: 'IN_PROGRESS',
        ownerId: regularUser.id,
      },
    });

    return {
      users: {
        admin,
        regular: regularUser,
        contractor,
      },
      projects: [project1, project2],
    };
  } catch (error) {
    console.error('Ошибка при заполнении тестовой базы данных:', error);
    return {
      users: {
        admin: null,
        regular: null,
        contractor: null,
      },
      projects: [],
    };
  }
}
