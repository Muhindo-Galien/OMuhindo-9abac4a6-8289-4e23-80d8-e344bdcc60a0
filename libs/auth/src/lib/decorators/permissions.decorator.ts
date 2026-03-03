import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to set required permissions for route access
 * @param permissions - Array of permissions that are required to access the route
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

/**
 * Decorator to require specific resource permissions
 * @param resource - The resource type (e.g., 'task', 'user')
 * @param actions - Array of actions (e.g., 'read', 'create', 'update', 'delete')
 */
export const RequirePermissions = (resource: string, ...actions: string[]) => {
  const permissions = actions.map(action => `${resource}:${action}`);
  return SetMetadata('permissions', permissions);
};

/**
 * Common permission decorators for convenience
 */
export const CanCreateTasks = () => SetMetadata('permissions', ['task:create']);
export const CanReadTasks = () => SetMetadata('permissions', ['task:read']);
export const CanUpdateTasks = () => SetMetadata('permissions', ['task:update']);
export const CanDeleteTasks = () => SetMetadata('permissions', ['task:delete']);
export const CanViewAuditLog = () =>
  SetMetadata('permissions', ['audit_log:read']);
