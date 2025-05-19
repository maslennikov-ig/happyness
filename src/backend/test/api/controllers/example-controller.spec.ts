import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Param, Body, Post, Injectable } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Пример сервиса для тестирования
@Injectable()
class ExampleService {
  private users = [
    { id: 1, name: 'Иван', email: 'ivan@example.com' },
    { id: 2, name: 'Мария', email: 'maria@example.com' },
  ];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find(user => user.id === id);
  }

  create(userData: { name: string; email: string }) {
    const newUser = {
      id: this.users.length + 1,
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }
}

// Пример контроллера для тестирования
@Controller('users')
class UsersController {
  constructor(private readonly exampleService: ExampleService) {}

  @Get()
  findAll() {
    return this.exampleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exampleService.findOne(parseInt(id, 10));
  }

  @Post()
  create(@Body() userData: { name: string; email: string }) {
    return this.exampleService.create(userData);
  }
}

describe('UsersController (интеграционный)', () => {
  let controller: UsersController;
  let service: ExampleService;
  let module: TestingModule;

  beforeEach(async () => {
    // Создаем тестовый модуль с контроллером и сервисом
    module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [ExampleService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<ExampleService>(ExampleService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('должен вернуть список всех пользователей', () => {
    // Arrange
    const mockUsers = [
      { id: 1, name: 'Иван', email: 'ivan@example.com' },
      { id: 2, name: 'Мария', email: 'maria@example.com' },
    ];
    vi.spyOn(service, 'findAll').mockImplementation(() => mockUsers);

    // Act
    const result = controller.findAll();

    // Assert
    expect(result).toEqual(mockUsers);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('должен вернуть пользователя по ID', () => {
    // Arrange
    const mockUser = { id: 1, name: 'Иван', email: 'ivan@example.com' };
    vi.spyOn(service, 'findOne').mockImplementation(() => mockUser);

    // Act
    const result = controller.findOne('1');

    // Assert
    expect(result).toEqual(mockUser);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('должен создать нового пользователя', () => {
    // Arrange
    const userData = { name: 'Новый', email: 'new@example.com' };
    const mockNewUser = { id: 3, ...userData };
    vi.spyOn(service, 'create').mockImplementation(() => mockNewUser);

    // Act
    const result = controller.create(userData);

    // Assert
    expect(result).toEqual(mockNewUser);
    expect(service.create).toHaveBeenCalledWith(userData);
  });
});
