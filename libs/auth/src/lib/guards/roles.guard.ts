import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@data';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<RoleType[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles) {
      return true; // No role requirement, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check role inheritance - higher roles inherit lower role permissions
    const hasRole = requiredRoles.some(requiredRole =>
      this.validateRoleHierarchy(user.role, requiredRole)
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Validate role hierarchy. Global role "user" is treated as viewer-level for route access.
   */
  private validateRoleHierarchy(
    userRole: string | RoleType,
    requiredRole: RoleType
  ): boolean {
    const roleHierarchy: Record<string, number> = {
      [RoleType.VIEWER]: 0,
      [RoleType.ADMIN]: 1,
      [RoleType.OWNER]: 2,
      user: 0, // global role "user" satisfies viewer
    };
    const userLevel = roleHierarchy[userRole] ?? -1;
    const requiredLevel = roleHierarchy[requiredRole] ?? 0;
    return userLevel >= requiredLevel;
  }
}
