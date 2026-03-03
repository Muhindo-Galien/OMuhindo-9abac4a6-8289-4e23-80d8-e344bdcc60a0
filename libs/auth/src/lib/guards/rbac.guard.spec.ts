import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

// Import the guard and service under test
import { RbacGuard } from './rbac.guard';
import { RbacService } from '../services/rbac.service';

// Import types and fixtures
import { RoleType } from '@data';
import { mockUsers, cloneFixture, createCustomFixture } from '@data';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let rbacService: jest.Mocked<RbacService>;
  let reflector: jest.Mocked<Reflector>;

  // Mock execution context
  const createMockContext = (user: any): ExecutionContext => {
    const mockRequest = {
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  // Test users based on fixtures
  const ownerUser = {
    ...cloneFixture(mockUsers.owner),
    permissions: ['task:read', 'task:write', 'task:delete', 'audit:read'],
    roleLevel: 2,
  };

  const adminUser = {
    ...cloneFixture(mockUsers.admin),
    permissions: ['task:read', 'task:write', 'audit:read'],
    roleLevel: 1,
  };

  const viewerUser = {
    ...cloneFixture(mockUsers.viewer),
    permissions: ['task:read'],
    roleLevel: 0,
  };

  beforeEach(async () => {
    // Create mocked services
    const mockRbacService = {
      hasPermission: jest.fn(),
      hasRole: jest.fn(),
      hasRoleLevel: jest.fn(),
      canAccessOrganization: jest.fn(),
      getAccessibleOrganizations: jest.fn(),
      canModifyResource: jest.fn(),
      validateRoleHierarchy: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        {
          provide: RbacService,
          useValue: mockRbacService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    rbacService = module.get(RbacService);
    reflector = module.get(Reflector);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    describe('authentication checks', () => {
      it('should throw ForbiddenException when user is not authenticated', async () => {
        // Arrange
        const context = createMockContext(null);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('User not authenticated')
        );
      });

      it('should throw ForbiddenException when user is undefined', async () => {
        // Arrange
        const context = createMockContext(undefined);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('User not authenticated')
        );
      });
    });

    describe('role-based access control', () => {
      it('should allow access when user has required role - Owner', async () => {
        // Arrange
        const context = createMockContext(ownerUser);
        reflector.get.mockReturnValueOnce([RoleType.OWNER]); // Required roles
        rbacService.hasRole.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRole).toHaveBeenCalledWith(ownerUser, [
          RoleType.OWNER,
        ]);
      });

      it('should allow access when user has required role - Admin', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get.mockReturnValueOnce([RoleType.ADMIN]); // Required roles
        rbacService.hasRole.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRole).toHaveBeenCalledWith(adminUser, [
          RoleType.ADMIN,
        ]);
      });

      it('should allow access when user has required role - Viewer', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get.mockReturnValueOnce([RoleType.VIEWER]); // Required roles
        rbacService.hasRole.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRole).toHaveBeenCalledWith(viewerUser, [
          RoleType.VIEWER,
        ]);
      });

      it('should deny access when user lacks required role', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get.mockReturnValueOnce([RoleType.OWNER]); // Required roles
        rbacService.hasRole.mockReturnValue(false);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient role privileges')
        );
        expect(rbacService.hasRole).toHaveBeenCalledWith(viewerUser, [
          RoleType.OWNER,
        ]);
      });

      it('should allow access when user has one of multiple required roles', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get.mockReturnValueOnce([RoleType.OWNER, RoleType.ADMIN]); // Required roles
        rbacService.hasRole.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRole).toHaveBeenCalledWith(adminUser, [
          RoleType.OWNER,
          RoleType.ADMIN,
        ]);
      });
    });

    describe('permission-based access control', () => {
      it('should allow access when user has all required permissions', async () => {
        // Arrange
        const context = createMockContext(ownerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(['task:read', 'task:write']); // Required permissions
        rbacService.hasPermission.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasPermission).toHaveBeenCalledWith(
          ownerUser,
          'task:read'
        );
        expect(rbacService.hasPermission).toHaveBeenCalledWith(
          ownerUser,
          'task:write'
        );
      });

      it('should deny access when user lacks required permissions', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(['task:write', 'task:delete']); // Required permissions
        rbacService.hasPermission
          .mockReturnValueOnce(false) // task:write
          .mockReturnValueOnce(false); // task:delete

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient permissions')
        );
        expect(rbacService.hasPermission).toHaveBeenCalledWith(
          viewerUser,
          'task:write'
        );
      });

      it('should deny access when user has some but not all required permissions', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(['task:read', 'task:delete']); // Required permissions
        rbacService.hasPermission
          .mockReturnValueOnce(true) // task:read
          .mockReturnValueOnce(false); // task:delete

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient permissions')
        );
        expect(rbacService.hasPermission).toHaveBeenCalledWith(
          adminUser,
          'task:read'
        );
        expect(rbacService.hasPermission).toHaveBeenCalledWith(
          adminUser,
          'task:delete'
        );
      });
    });

    describe('role level access control', () => {
      it('should allow access when user meets minimum role level - Owner', async () => {
        // Arrange
        const context = createMockContext(ownerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(2); // Minimum role level
        rbacService.hasRoleLevel.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRoleLevel).toHaveBeenCalledWith(ownerUser, 2);
      });

      it('should allow access when user exceeds minimum role level', async () => {
        // Arrange
        const context = createMockContext(ownerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(1); // Minimum role level (Admin)
        rbacService.hasRoleLevel.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRoleLevel).toHaveBeenCalledWith(ownerUser, 1);
      });

      it('should deny access when user lacks minimum role level', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(1); // Minimum role level (Admin)
        rbacService.hasRoleLevel.mockReturnValue(false);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient role level')
        );
        expect(rbacService.hasRoleLevel).toHaveBeenCalledWith(viewerUser, 1);
      });

      it('should handle zero role level requirement (minimum)', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(0); // Minimum role level (Viewer)
        rbacService.hasRoleLevel.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRoleLevel).toHaveBeenCalledWith(viewerUser, 0);
      });
    });

    describe('combined access control checks', () => {
      it('should require all checks to pass when multiple requirements exist', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get
          .mockReturnValueOnce([RoleType.ADMIN]) // Required roles
          .mockReturnValueOnce(['task:read']) // Required permissions
          .mockReturnValueOnce(1); // Minimum role level
        rbacService.hasRole.mockReturnValue(true);
        rbacService.hasPermission.mockReturnValue(true);
        rbacService.hasRoleLevel.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRole).toHaveBeenCalledWith(adminUser, [
          RoleType.ADMIN,
        ]);
        expect(rbacService.hasPermission).toHaveBeenCalledWith(
          adminUser,
          'task:read'
        );
        expect(rbacService.hasRoleLevel).toHaveBeenCalledWith(adminUser, 1);
      });

      it('should fail if role check passes but permission check fails', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get
          .mockReturnValueOnce([RoleType.ADMIN]) // Required roles
          .mockReturnValueOnce(['task:delete']); // Required permissions
        rbacService.hasRole.mockReturnValue(true);
        rbacService.hasPermission.mockReturnValue(false);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient permissions')
        );
      });

      it('should fail if permission check passes but role level check fails', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(['task:read']) // Required permissions
          .mockReturnValueOnce(2); // Minimum role level (Owner)
        rbacService.hasPermission.mockReturnValue(true);
        rbacService.hasRoleLevel.mockReturnValue(false);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient role level')
        );
      });
    });

    describe('organization hierarchy access control', () => {
      it('should allow Owner to access all organizations', async () => {
        // Arrange
        const ownerFromDifferentOrg = createCustomFixture(ownerUser, {
          organizationId: 'org-different',
        });
        const context = createMockContext(ownerFromDifferentOrg);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(undefined); // No minimum role level

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('should allow Admin to access their organization and child organizations', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(undefined); // No minimum role level

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('should allow Viewer to access only their organization', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(undefined); // No minimum role level

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('no requirements scenario', () => {
      it('should allow access when no requirements are specified', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(undefined); // No minimum role level

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRole).not.toHaveBeenCalled();
        expect(rbacService.hasPermission).not.toHaveBeenCalled();
        expect(rbacService.hasRoleLevel).not.toHaveBeenCalled();
      });
    });

    describe('edge cases and security validations', () => {
      it('should handle malformed user object gracefully', async () => {
        // Arrange
        const malformedUser = { id: 'test' }; // Missing role, permissions, etc.
        const context = createMockContext(malformedUser);
        reflector.get.mockReturnValueOnce([RoleType.VIEWER]);
        rbacService.hasRole.mockReturnValue(false);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient role privileges')
        );
      });

      it('should handle empty permission arrays', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce([]); // Empty permissions array

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasPermission).not.toHaveBeenCalled();
      });

      it('should handle empty role arrays', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get
          .mockReturnValueOnce([]) // Empty roles array
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(undefined); // No minimum role level
        rbacService.hasRole.mockReturnValue(true); // Empty array should pass validation

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRole).toHaveBeenCalledWith(adminUser, []);
      });

      it('should handle role level of undefined', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get
          .mockReturnValueOnce(null) // No role requirements
          .mockReturnValueOnce(null) // No permission requirements
          .mockReturnValueOnce(undefined); // Undefined role level

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
        expect(rbacService.hasRoleLevel).not.toHaveBeenCalled();
      });
    });

    describe('role inheritance logic', () => {
      it('should validate that Owner role has highest privileges', async () => {
        // Arrange
        const context = createMockContext(ownerUser);
        reflector.get.mockReturnValueOnce([RoleType.ADMIN, RoleType.VIEWER]); // Lower roles should be allowed
        rbacService.hasRole.mockReturnValue(true); // Owner should have access

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('should validate that Admin role has higher privileges than Viewer', async () => {
        // Arrange
        const context = createMockContext(adminUser);
        reflector.get.mockReturnValueOnce([RoleType.VIEWER]); // Lower role should be allowed
        rbacService.hasRole.mockReturnValue(true);

        // Act
        const result = await guard.canActivate(context);

        // Assert
        expect(result).toBe(true);
      });

      it('should deny access when Viewer tries to access Admin-only resource', async () => {
        // Arrange
        const context = createMockContext(viewerUser);
        reflector.get.mockReturnValueOnce([RoleType.ADMIN]);
        rbacService.hasRole.mockReturnValue(false);

        // Act & Assert
        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Insufficient role privileges')
        );
      });
    });
  });

  describe('error handling', () => {
    it('should propagate errors from RbacService', async () => {
      // Arrange
      const context = createMockContext(adminUser);
      reflector.get.mockReturnValueOnce([RoleType.ADMIN]);
      rbacService.hasRole.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle null reflector responses gracefully', async () => {
      // Arrange
      const context = createMockContext(viewerUser);
      reflector.get
        .mockReturnValueOnce(null) // No role requirements
        .mockReturnValueOnce(null) // No permission requirements
        .mockReturnValueOnce(undefined); // No minimum role level

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });
  });
});
