import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RolesGuard, ROLES_KEY, Roles } from '../../../modules/auth/guards/roles.guard';
import { UserRole } from '../../../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
        {
          provide: RolesGuard,
          useFactory: reflector => new RolesGuard(reflector),
          inject: [Reflector],
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('должен быть определен', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('должен разрешать доступ, если роли не определены', () => {
      // Подготовка моков
      const context = createMockExecutionContext({});
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // Вызов тестируемого метода
      const result = guard.canActivate(context);

      // Проверка результатов
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('должен разрешать доступ, если у пользователя есть требуемая роль', () => {
      // Подготовка моков
      const user = { id: '1', email: 'admin@example.com', role: UserRole.ADMIN };
      const context = createMockExecutionContext({ user });
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      // Вызов тестируемого метода
      const result = guard.canActivate(context);

      // Проверка результатов
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('должен выбрасывать UnauthorizedException, если пользователь не аутентифицирован', () => {
      // Подготовка моков
      const context = createMockExecutionContext({ user: undefined });
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      // Проверка на выброс исключения
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Пользователь не аутентифицирован');

      // Проверка вызова методов
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('должен выбрасывать ForbiddenException, если у пользователя нет требуемой роли', () => {
      // Подготовка моков
      const user = { id: '1', email: 'user@example.com', role: UserRole.ENTREPRENEUR };
      const context = createMockExecutionContext({ user });
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      // Проверка на выброс исключения
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('У вас нет доступа к этому ресурсу');

      // Проверка вызова методов
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('Roles decorator', () => {
    it('должен устанавливать метаданные на метод', () => {
      // Создаем класс с декорированным методом
      class TestClass {
        @Roles(UserRole.ADMIN)
        testMethod() {}
      }

      // Проверяем, что метаданные установлены
      const metadata = Reflect.getMetadata(ROLES_KEY, TestClass.prototype.testMethod);
      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('должен устанавливать метаданные на класс', () => {
      // Создаем декорированный класс
      @Roles(UserRole.ADMIN, UserRole.CONTRACTOR)
      class TestClass {}

      // Проверяем, что метаданные установлены
      const metadata = Reflect.getMetadata(ROLES_KEY, TestClass);
      expect(metadata).toEqual([UserRole.ADMIN, UserRole.CONTRACTOR]);
    });
  });
});

// Вспомогательная функция для создания мока ExecutionContext
function createMockExecutionContext(data: { user?: any }) {
  const context = {
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue({
        user: data.user,
      }),
    }),
    getHandler: vi.fn(),
    getClass: vi.fn(),
  } as unknown as ExecutionContext;

  return context;
}
