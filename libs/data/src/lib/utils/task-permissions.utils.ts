import { RoleType } from '../models/role.model';

/**
 * Task CRUD permissions by org role. Mirrors backend:
 * - Create/delete: admin or owner only (RequireOrgAdminOrOwner / @Roles(ADMIN))
 * - Read/update: everyone with access (viewer, admin, owner). Viewers can view and update their own tasks; admin/owner can update any.
 */
export interface TaskPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const NO_TASK_PERMISSIONS: TaskPermissions = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
};

/**
 * Returns task CRUD permissions for a given org role.
 * Use with the current user's role in the current space (from org_roles or memberships).
 * Every role can read and update tasks (viewers update own only, enforced in backend); only admin/owner can create or delete.
 */
export function getTaskPermissionsByRole(
  role: RoleType | null | undefined
): TaskPermissions {
  if (role == null) return NO_TASK_PERMISSIONS;
  return {
    canCreate: role === RoleType.ADMIN || role === RoleType.OWNER,
    canRead: true,
    canUpdate: true, // everyone (viewer, admin, owner) can edit tasks
    canDelete: role === RoleType.ADMIN || role === RoleType.OWNER,
  };
}
