import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../services/rbac.service';
import { RoleType } from '@data';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check for required roles
    const requiredRoles = this.reflector.get<RoleType[]>(
      'roles',
      context.getHandler()
    );
    if (requiredRoles) {
      const hasRole = this.rbacService.hasRole(user, requiredRoles);
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role privileges');
      }
    }

    // Check for required permissions
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );
    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        this.rbacService.hasPermission(user, permission)
      );
      if (!hasAllPermissions) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // Check for minimum role level
    const minimumRoleLevel = this.reflector.get<number>(
      'minimumRoleLevel',
      context.getHandler()
    );
    if (minimumRoleLevel !== undefined) {
      const hasRoleLevel = this.rbacService.hasRoleLevel(
        user,
        minimumRoleLevel
      );
      if (!hasRoleLevel) {
        throw new ForbiddenException('Insufficient role level');
      }
    }

    return true;
  }
}
