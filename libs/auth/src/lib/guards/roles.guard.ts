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
   * Validate role hierarchy (higher roles inherit lower role permissions)
   */
  private validateRoleHierarchy(
    userRole: RoleType,
    requiredRole: RoleType
  ): boolean {
    const roleHierarchy = {
      [RoleType.VIEWER]: 0,
      [RoleType.ADMIN]: 1,
      [RoleType.OWNER]: 2,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}
