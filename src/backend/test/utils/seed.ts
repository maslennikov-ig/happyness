import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Утилита для наполнения тестовой базы данных предсказуемыми тестовыми данными
 * Необходимо запускать после очистки БД
 */
export async function seedTestDatabase(prisma: PrismaClient) {
  // Создаем тестовых пользователей с разными ролями
  const testUserPassword = await argon2.hash('password123');

  const adminUser = await prisma.user.create({
    data: {
      name: 'Администратор',
      email: 'admin@example.com',
      passwordHash: testUserPassword,
      role: 'ADMIN',
      phone: '+79991112233',
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Пользователь',
      email: 'user@example.com',
      passwordHash: testUserPassword,
      role: 'USER',
      phone: '+79991112244',
    },
  });

  const contractorUser = await prisma.user.create({
    data: {
      name: 'Подрядчик',
      email: 'contractor@example.com',
      passwordHash: testUserPassword,
      role: 'CONTRACTOR',
      phone: '+79991112255',
    },
  });

  // Создаем профиль подрядчика
  const contractor = await prisma.contractor.create({
    data: {
      userId: contractorUser.id,
      name: 'ООО "ТестСтрой"',
      description: 'Тестовая строительная компания для тестирования',
      specializations: ['Ремонт', 'Строительство'],
      experience: 5,
      contactEmail: 'info@teststroy.example',
      contactPhone: '+79995556677',
    },
  });

  // Создаем тестовые проекты
  const project1 = await prisma.project.create({
    data: {
      title: 'Тестовый проект #1',
      description: 'Описание тестового проекта для тестирования',
      status: 'ACTIVE',
      ownerId: regularUser.id,
      budget: 100000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Тестовый проект #2',
      description: 'Второй тестовый проект, находящийся в черновике',
      status: 'DRAFT',
      ownerId: regularUser.id,
      budget: 50000,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // +15 дней
    },
  });

  // Создаем тестовые запросы
  const request1 = await prisma.request.create({
    data: {
      title: 'Тестовый запрос на работу #1',
      description: 'Описание тестового запроса для интеграционных тестов',
      status: 'OPEN',
      ownerId: regularUser.id,
      budget: 75000,
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // +20 дней
    },
  });

  // Создаем тестовое предложение от подрядчика
  const proposal = await prisma.proposal.create({
    data: {
      requestId: request1.id,
      contractorId: contractor.id,
      price: 70000,
      description: 'Тестовое предложение для запроса #1',
      estimatedDuration: 15, // дней
      status: 'PENDING',
    },
  });

  // Возвращаем созданные объекты для использования в тестах
  return {
    users: {
      admin: adminUser,
      regular: regularUser,
      contractor: contractorUser,
    },
    contractors: {
      main: contractor,
    },
    projects: {
      active: project1,
      draft: project2,
    },
    requests: {
      open: request1,
    },
    proposals: {
      pending: proposal,
    },
    // Вспомогательная информация для тестов
    testPassword: 'password123',
  };
}
