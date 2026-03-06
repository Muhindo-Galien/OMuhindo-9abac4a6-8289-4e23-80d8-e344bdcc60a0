import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType, getRoleLevel } from '@data';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<RoleType[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles?.length) {
      return true; // No role requirement, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Minimum level needed: e.g. [ADMIN] => 1, so OWNER (2) or ADMIN (1) pass
    const minRequiredLevel = Math.min(
      ...requiredRoles.map(r => getRoleLevel(r))
    );

    // 1) Check global user.role (JWT often has role: 'user' = viewer level)
    const globalLevel = this.getRoleLevelFromRole(user.role);
    if (globalLevel >= minRequiredLevel) return true;

    // 2) Org-scoped: user may have no global role but have admin/owner in org_roles (set by EnrichOrgRolesGuard).
    //    Owner/Admin in any org satisfies "admin or higher" for task/organization operations.
    const orgRoles = user.org_roles as Record<string, RoleType> | undefined;
    if (orgRoles && typeof orgRoles === 'object') {
      const maxOrgLevel = Math.max(
        -1,
        ...Object.values(orgRoles).map(r => getRoleLevel(r))
      );
      if (maxOrgLevel >= minRequiredLevel) return true;
    }

    throw new ForbiddenException(
      `Access denied. Required roles: ${requiredRoles.join(', ')}`
    );
  }

  /**
   * Map role to level. Global "user" is viewer-level (0).
   */
  private getRoleLevelFromRole(role: string | RoleType | undefined): number {
    if (role == null) return -1;
    const level = getRoleLevel(role as RoleType);
    if (level >= 0) return level;
    // JWT may send role "user" for any authenticated user
    if (role === 'user') return 0; // viewer level
    return -1;
  }
}
