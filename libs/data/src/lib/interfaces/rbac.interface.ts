import { RoleType } from '../models/role.model';
import {
  PermissionAction,
  PermissionResource,
} from '../models/permission.model';

// RBAC Permission Interface
export interface IPermission {
  id: string;
  name: string;
  resource: PermissionResource;
  action: PermissionAction;
  description?: string;
}

// RBAC Role Interface
export interface IRole {
  id: string;
  name: RoleType;
  description?: string;
  level: number;
  permissions: IPermission[];
}

// Permission Check Interface
export interface PermissionCheck {
  resource: PermissionResource;
  action: PermissionAction;
  organizationId?: string; // For organization-scoped checks
  resourceId?: string; // For specific resource checks (e.g., specific task)
}

// Access Control Context
export interface AccessControlContext {
  userId: string;
  role: RoleType;
  roleLevel: number;
  organizationId: string;
  permissions: string[]; // Array of permission strings like "task:create"
}

// RBAC Service Interface
export interface IRbacService {
  hasPermission(context: AccessControlContext, check: PermissionCheck): boolean;
  canAccessResource(
    context: AccessControlContext,
    resourceOrganizationId: string
  ): boolean;
  canAccessUser(
    context: AccessControlContext,
    targetUserId: string
  ): Promise<boolean>;
  canAccessTask(
    context: AccessControlContext,
    taskId: string
  ): Promise<boolean>;
}

// Permission Matrix Type
export type PermissionMatrix = {
  [K in RoleType]: string[];
};

// Organization Hierarchy Interface
export interface OrganizationHierarchy {
  parentId?: string;
  childOrganizations: string[];
  canAccessChildData: boolean;
}

// Access Scope Interface (for filtering data based on user permissions)
export interface AccessScope {
  organizationIds: string[]; // Organizations user can access
  userIds?: string[]; // Users they can manage (for admins)
  restrictToOwned: boolean; // Whether to restrict to only owned resources
}
