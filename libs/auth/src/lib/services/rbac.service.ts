import { Injectable } from '@nestjs/common';
import { RoleType } from '@data';

@Injectable()
export class RbacService {
  constructor() {}

  /**
   * Check if user has specific permission
   */
  hasPermission(user: any, permission: string): boolean {
    return user.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasRole(user: any, roles: RoleType[]): boolean {
    return roles.includes(user.role);
  }

  /**
   * Check if user has sufficient role level
   */
  hasRoleLevel(user: any, minimumLevel: number): boolean {
    return user.roleLevel >= minimumLevel;
  }

  /**
   * Check if user can access resource based on organization hierarchy
   */
  async canAccessOrganization(
    userId: string,
    targetOrgId: string,
    userRepository: any,
    organizationRepository: any
  ): Promise<boolean> {
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role'],
    });

    if (!user) return false;

    // Owner can access all organizations
    if (user.role.name === RoleType.OWNER) {
      return true;
    }

    // Users can access their own organization
    if (user.organizationId === targetOrgId) {
      return true;
    }

    // Check if user's organization is parent of target organization
    const targetOrg = await organizationRepository.findOne({
      where: { id: targetOrgId },
    });

    if (targetOrg?.parentId === user.organizationId) {
      return true;
    }

    return false;
  }

  /**
   * Get all accessible organization IDs for a user
   */
  async getAccessibleOrganizations(
    userId: string,
    userRepository: any,
    organizationRepository: any
  ): Promise<string[]> {
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'role'],
    });

    if (!user) return [];

    const accessibleOrgIds = [user.organizationId];

    // Owner can access all organizations
    if (user.role.name === RoleType.OWNER) {
      const allOrgs = await organizationRepository.find();
      return allOrgs.map((org: any) => org.id);
    }

    // Add child organizations if user is admin
    if (user.role.name === RoleType.ADMIN) {
      const childOrgs = await organizationRepository.find({
        where: { parentId: user.organizationId },
      });
      accessibleOrgIds.push(...childOrgs.map((org: any) => org.id));
    }

    return accessibleOrgIds;
  }

  /**
   * Check if user owns a resource
   */
  canModifyResource(
    user: any,
    resourceOwnerId: string,
    resourceOrgId: string
  ): boolean {
    // Owner can modify any resource
    if (user.role === RoleType.OWNER) {
      return true;
    }

    // User can modify their own resources
    if (user.id === resourceOwnerId) {
      return true;
    }

    // Admin can modify resources in their organization
    if (user.role === RoleType.ADMIN && user.organizationId === resourceOrgId) {
      return true;
    }

    return false;
  }

  /**
   * Validate role hierarchy (higher roles inherit lower role permissions)
   */
  validateRoleHierarchy(userRole: RoleType, requiredRole: RoleType): boolean {
    const roleHierarchy = {
      [RoleType.VIEWER]: 0,
      [RoleType.ADMIN]: 1,
      [RoleType.OWNER]: 2,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}
