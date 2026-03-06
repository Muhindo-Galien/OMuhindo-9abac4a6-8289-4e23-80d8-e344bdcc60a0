import { Injectable, inject } from '@angular/core';
import { RoleType, getTaskPermissionsByRole, TaskPermissions } from '@data';
import { AuthService } from './auth.service';

/**
 * Resolves task CRUD permissions from the current user's org role.
 * Mirrors backend: permissions.decorator + tasks.controller (RequireOrgAdminOrOwner, Roles).
 */
@Injectable({
  providedIn: 'root',
})
export class TaskPermissionService {
  private auth = inject(AuthService);

  /**
   * Get the user's effective role for an org (from org_roles or memberships).
   */
  getRoleForOrg(orgId: string | null): RoleType | null {
    if (!orgId) return null;
    const user = this.auth.getCurrentUser();
    const role =
      user?.org_roles?.[orgId] ??
      user?.memberships?.find(m => m.organizationId === orgId)?.role;
    return role ?? null;
  }

  /**
   * Task CRUD permissions for the given org (e.g. current space).
   * Use with org context: only in spaces (child orgs) do tasks exist; role is for that org.
   */
  getTaskPermissions(orgId: string | null): TaskPermissions {
    const role = this.getRoleForOrg(orgId);
    return getTaskPermissionsByRole(role);
  }
}
