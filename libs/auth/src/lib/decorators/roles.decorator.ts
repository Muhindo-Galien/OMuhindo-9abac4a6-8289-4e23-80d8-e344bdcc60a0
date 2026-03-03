import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@data';

/**
 * Decorator to set required roles for route access
 * @param roles - Array of roles that are allowed to access the route
 */
export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);

/**
 * Decorator to set minimum role level required for route access
 * @param level - Minimum role level (0: Viewer, 1: Admin, 2: Owner)
 */
export const MinimumRoleLevel = (level: number) =>
  SetMetadata('minimumRoleLevel', level);

/**
 * Decorator to mark routes as public (no authentication required)
 */
export const Public = () => SetMetadata('isPublic', true);
