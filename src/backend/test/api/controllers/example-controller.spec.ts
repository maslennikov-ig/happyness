import { describe, it, expect, vi, beforeEach } from 'vitest';

// Простая функция для тестирования в стиле контроллера
class ExampleController {
  constructor(private service: any) {}

  getAll() {
    return this.service.findAll();
  }

  getOne(id: number) {
    return this.service.findOne(id);
  }

  create(data: any) {
    return this.service.create(data);
  }
}

describe('ExampleController', () => {
  let controller: ExampleController;
  let mockService: any;

  beforeEach(() => {
    // Создаем мок сервиса с vi.fn() для каждого метода
    mockService = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
    };

    // Создаем контроллер с моком
    controller = new ExampleController(mockService);
  });

  it('должен вернуть список всех элементов', () => {
    // Arrange
    const mockItems = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];
    mockService.findAll.mockReturnValue(mockItems);

    // Act
    const result = controller.getAll();

    // Assert
    expect(result).toEqual(mockItems);
    expect(mockService.findAll).toHaveBeenCalled();
  });

  it('должен вернуть один элемент по ID', () => {
    // Arrange
    const mockItem = { id: 1, name: 'Item 1' };
    mockService.findOne.mockReturnValue(mockItem);

    // Act
    const result = controller.getOne(1);

    // Assert
    expect(result).toEqual(mockItem);
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('должен создать новый элемент', () => {
    // Arrange
    const newData = { name: 'New Item' };
    const mockCreatedItem = { id: 3, name: 'New Item' };
    mockService.create.mockReturnValue(mockCreatedItem);

    // Act
    const result = controller.create(newData);

    // Assert
    expect(result).toEqual(mockCreatedItem);
    expect(mockService.create).toHaveBeenCalledWith(newData);
  });
});
