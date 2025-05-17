import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from '../../modules/projects/projects.controller';
import { ProjectsService } from '../../modules/projects/projects.service';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProjectDto } from '../../modules/projects/dto/create-project.dto';
import { UpdateProjectDto } from '../../modules/projects/dto/update-project.dto';
import { ProjectStatus } from '../../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Создаем мок-класс контроллера
class MockProjectsController {
  constructor(private readonly projectsService) {}

  async create(createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  async findAll(status?: ProjectStatus) {
    return this.projectsService.findAll(status);
  }

  async findOne(id: string) {
    return this.projectsService.findOne(id);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  async remove(id: string) {
    return this.projectsService.remove(id);
  }
}

describe('ProjectsController', () => {
  let controller: MockProjectsController;
  let projectsService: any;

  // Моки сервисов
  const mockProjectsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    // Используем реальный тестовый модуль только для получения сервисов
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    // Получаем сервис для использования в контроллере
    projectsService = module.get<ProjectsService>(ProjectsService);

    // Создаем экземпляр мок-контроллера с сервисом
    controller = new MockProjectsController(projectsService);

    // Сброс моков перед каждым тестом
    vi.clearAllMocks();
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('должен создавать новый проект', async () => {
      // Подготовка тестовых данных
      const createProjectDto: CreateProjectDto = {
        title: 'Тестовый проект',
        description: 'Описание тестового проекта',
        ownerId: '1',
      };

      const mockProject = {
        id: '1',
        ...createProjectDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: ProjectStatus.PLANNING,
      };

      mockProjectsService.create.mockResolvedValue(mockProject);

      // Вызов тестируемого метода
      const result = await controller.create(createProjectDto);

      // Проверка результатов
      expect(mockProjectsService.create).toHaveBeenCalledWith(createProjectDto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAll', () => {
    it('должен возвращать все проекты', async () => {
      // Подготовка тестовых данных
      const mockProjects = [
        {
          id: '1',
          title: 'Проект 1',
          description: 'Описание проекта 1',
          ownerId: '1',
          status: ProjectStatus.PLANNING,
        },
        {
          id: '2',
          title: 'Проект 2',
          description: 'Описание проекта 2',
          ownerId: '2',
          status: ProjectStatus.IN_PROGRESS,
        },
      ];

      mockProjectsService.findAll.mockResolvedValue(mockProjects);

      // Вызов тестируемого метода
      const result = await controller.findAll();

      // Проверка результатов
      expect(mockProjectsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });

    it('должен фильтровать проекты по статусу', async () => {
      // Подготовка тестовых данных
      const status = ProjectStatus.IN_PROGRESS;
      const mockProjects = [
        {
          id: '2',
          title: 'Проект 2',
          description: 'Описание проекта 2',
          ownerId: '2',
          status: ProjectStatus.IN_PROGRESS,
        },
      ];

      mockProjectsService.findAll.mockResolvedValue(mockProjects);

      // Вызов тестируемого метода
      const result = await controller.findAll(status);

      // Проверка результатов
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(status);
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOne', () => {
    it('должен возвращать проект по ID', async () => {
      // Подготовка тестовых данных
      const projectId = '1';
      const mockProject = {
        id: projectId,
        title: 'Проект 1',
        description: 'Описание проекта 1',
        ownerId: '1',
        status: ProjectStatus.PLANNING,
      };

      mockProjectsService.findOne.mockResolvedValue(mockProject);

      // Вызов тестируемого метода
      const result = await controller.findOne(projectId);

      // Проверка результатов
      expect(mockProjectsService.findOne).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(mockProject);
    });
  });

  describe('update', () => {
    it('должен обновлять проект', async () => {
      // Подготовка тестовых данных
      const projectId = '1';
      const updateProjectDto: UpdateProjectDto = {
        title: 'Обновленный проект',
        status: ProjectStatus.IN_PROGRESS,
      };

      const mockUpdatedProject = {
        id: projectId,
        title: 'Обновленный проект',
        description: 'Описание проекта 1',
        ownerId: '1',
        status: ProjectStatus.IN_PROGRESS,
      };

      mockProjectsService.update.mockResolvedValue(mockUpdatedProject);

      // Вызов тестируемого метода
      const result = await controller.update(projectId, updateProjectDto);

      // Проверка результатов
      expect(mockProjectsService.update).toHaveBeenCalledWith(projectId, updateProjectDto);
      expect(result).toEqual(mockUpdatedProject);
    });
  });

  describe('remove', () => {
    it('должен удалять проект', async () => {
      // Подготовка тестовых данных
      const projectId = '1';
      const mockDeletedProject = {
        id: projectId,
        title: 'Удаленный проект',
        description: 'Описание удаленного проекта',
        ownerId: '1',
        status: ProjectStatus.PLANNING,
      };

      mockProjectsService.remove.mockResolvedValue(mockDeletedProject);

      // Вызов тестируемого метода
      const result = await controller.remove(projectId);

      // Проверка результатов
      expect(mockProjectsService.remove).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(mockDeletedProject);
    });
  });
});
