import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@/backend/types';

/**
 * Декоратор для определения ролей, которым разрешён доступ к эндпоинту
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => {
  return (target: any, key?: string, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(ROLES_KEY, roles, target);
    return target;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Если роли не определены, разрешаем доступ
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Проверяем, что пользователь аутентифицирован
    if (!user) {
      throw new UnauthorizedException('Пользователь не аутентифицирован');
    }

    // Проверяем, что у пользователя есть требуемая роль
    const hasRequiredRole = requiredRoles.some(role => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException('У вас нет доступа к этому ресурсу');
    }

    return true;
  }
}
