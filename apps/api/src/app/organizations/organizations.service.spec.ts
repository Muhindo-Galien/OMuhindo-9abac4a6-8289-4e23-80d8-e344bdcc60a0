import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Organization, OrganizationMember, User, RoleType } from '@data';
import { AuditService } from '../audit/audit.service';
import { OrganizationMembershipService } from './organization-membership.service';
import {
  EffectiveRoleService,
  OrganizationsService,
} from './organizations.service';

/**
 * OrganizationsService tests only. EffectiveRoleService is in effective-role.service.spec.ts.
 *
 * OOM note: The tests here are normal unit tests (create/findOne/update/delete/createChild/
 * getMembers/revokeMembership plus hierarchy, revocation, parent-deletion). The failure is
 * not the test logic but (1) Nest TestingModule compiling OrganizationsService and its deps
 * (TypeORM + @data entities + AuditService, EffectiveRoleService, OrganizationMembershipService),
 * and (2) Jest loading the whole api project when running api:test. Module is compiled once
 * in beforeAll to reduce repeated work. If you still hit OOM, run this file alone with a
 * larger heap: NODE_OPTIONS=--max-old-space-size=16384 nx run api:test --testPathPattern=organizations.service.spec
 */
describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepo: any;
  let memberRepo: any;
  let userRepo: any;
  let auditService: any;
  let effectiveRoleService: any;
  let membershipService: any;
  let moduleRef: TestingModule;

  const mockOwner = {
    id: 'owner-1',
    email: 'o@test.com',
    firstName: 'O',
    lastName: 'Owner',
  };

  beforeAll(async () => {
    orgRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    memberRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    userRepo = {};
    auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
    effectiveRoleService = {
      getEffectiveRole: jest.fn(),
      hasMinimumRole: jest.fn(),
    };
    membershipService = {
      getOwnerForOrg: jest.fn().mockResolvedValue(mockOwner),
      getMembersForOrg: jest.fn().mockResolvedValue([]),
      getEffectiveMembersForOrg: jest.fn().mockResolvedValue([]),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: memberRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: AuditService, useValue: auditService },
        { provide: EffectiveRoleService, useValue: effectiveRoleService },
        { provide: OrganizationMembershipService, useValue: membershipService },
      ],
    }).compile();
    service = moduleRef.get<OrganizationsService>(OrganizationsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    membershipService.getOwnerForOrg.mockResolvedValue(mockOwner);
  });

  describe('create', () => {
    it('should add membership with owner role and return org with owner', async () => {
      const savedOrg = {
        id: 'org-1',
        name: 'W',
        description: null,
        parentId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      orgRepo.create.mockReturnValue(savedOrg);
      orgRepo.save.mockResolvedValue(savedOrg);
      memberRepo.create.mockReturnValue({});
      memberRepo.save.mockResolvedValue({});

      const result = await service.create({ name: 'W' }, 'user-1');

      expect(result.name).toBe('W');
      expect(result.owner).toEqual({
        id: mockOwner.id,
        email: mockOwner.email,
        firstName: mockOwner.firstName,
        lastName: mockOwner.lastName,
      });
      expect(memberRepo.save).toHaveBeenCalled();
      expect(membershipService.getOwnerForOrg).toHaveBeenCalledWith('org-1');
    });
  });

  describe('findOne', () => {
    it('should throw ForbiddenException when user has no access', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);

      await expect(service.findOne('org-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(orgRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return org with owner when user has viewer access', async () => {
      const org = {
        id: 'org-1',
        name: 'Test',
        description: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      orgRepo.findOne.mockResolvedValue(org);

      const result = await service.findOne('org-1', 'user-1');

      expect(result.id).toBe('org-1');
      expect(result.owner).toBeDefined();
      expect(membershipService.getOwnerForOrg).toHaveBeenCalledWith('org-1');
    });

    it('should throw NotFoundException when org does not exist', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      orgRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('org-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException when user has insufficient role', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);

      await expect(
        service.update('org-1', { name: 'New' }, 'viewer-user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update and return org with owner when user is admin', async () => {
      const org = {
        id: 'org-1',
        name: 'Old',
        description: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.save.mockResolvedValue({ ...org, name: 'New' });

      const result = await service.update(
        'org-1',
        { name: 'New' },
        'admin-user'
      );

      expect(result.name).toBe('New');
      expect(auditService.logAction).toHaveBeenCalledWith(
        'admin-user',
        'update',
        'organization',
        expect.any(Object)
      );
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException when user is not owner', async () => {
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.ADMIN);

      await expect(service.delete('org-1', 'admin-user')).rejects.toThrow(
        ForbiddenException
      );
      expect(orgRepo.remove).not.toHaveBeenCalled();
    });

    it('should delete org and descendants when user is owner', async () => {
      const org = { id: 'org-1', name: 'O', parentId: null };
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.OWNER);
      orgRepo.findOne.mockResolvedValue(org);
      orgRepo.find.mockResolvedValue([]);

      await service.delete('org-1', 'owner-user');

      expect(orgRepo.remove).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        'owner-user',
        'delete',
        'organization',
        expect.any(Object)
      );
    });
  });

  describe('createChild', () => {
    it('should throw ForbiddenException when user lacks admin role on parent', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);

      await expect(
        service.createChild('parent-1', { name: 'Child' }, 'viewer-user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create child org and return with owner when user has access', async () => {
      const child = {
        id: 'child-1',
        name: 'Child',
        parentId: 'parent-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      orgRepo.create.mockReturnValue(child);
      orgRepo.save.mockResolvedValue(child);

      const result = await service.createChild(
        'parent-1',
        { name: 'Child' },
        'owner-user'
      );

      expect(result.name).toBe('Child');
      expect(result.parentId).toBe('parent-1');
    });
  });

  describe('getMembers', () => {
    it('should throw ForbiddenException when user has no viewer access', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);

      await expect(service.getMembers('org-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(
        membershipService.getEffectiveMembersForOrg
      ).not.toHaveBeenCalled();
    });

    it('should return members list when user has access', async () => {
      const members = [
        {
          userId: 'u1',
          email: 'a@b.com',
          firstName: 'A',
          lastName: 'B',
          role: RoleType.OWNER,
          joinedAt: new Date(),
          source: 'direct' as const,
        },
      ];
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      membershipService.getEffectiveMembersForOrg = jest
        .fn()
        .mockResolvedValue(members);

      const result = await service.getMembers('org-1', 'user-1');

      expect(result).toEqual(members);
      expect(membershipService.getEffectiveMembersForOrg).toHaveBeenCalledWith(
        'org-1'
      );
    });
  });

  describe('revokeMembership', () => {
    it('should throw ForbiddenException when caller is not admin/owner', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);

      await expect(
        service.revokeMembership('org-1', 'target-id', 'viewer-user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should forbid admin from revoking owner', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.ADMIN);
      memberRepo.findOne.mockResolvedValue({ id: 'm1', role: RoleType.OWNER });

      await expect(
        service.revokeMembership('org-1', 'target-user', 'admin-user')
      ).rejects.toThrow(ForbiddenException);
      expect(memberRepo.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when membership does not exist', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.OWNER);
      memberRepo.findOne.mockResolvedValue(null);

      await expect(
        service.revokeMembership('org-1', 'target-user', 'owner-user')
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove membership when owner revokes a non-owner', async () => {
      const membership = {
        id: 'm1',
        userId: 'target',
        organizationId: 'org-1',
        role: RoleType.VIEWER,
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.OWNER);
      memberRepo.findOne.mockResolvedValue(membership);
      memberRepo.remove.mockResolvedValue(undefined);

      await service.revokeMembership('org-1', 'target', 'owner-user');

      expect(memberRepo.remove).toHaveBeenCalledWith(membership);
      expect(auditService.logAction).toHaveBeenCalledWith(
        'owner-user',
        'membership_revoked',
        'membership',
        expect.any(Object)
      );
    });
  });

  describe('hierarchy: parent and child ownership', () => {
    it('should allow owner of parent to create child org (2-level hierarchy)', async () => {
      const parent = { id: 'parent-1', name: 'Workspace', parentId: null };
      const child = {
        id: 'child-1',
        name: 'Project',
        parentId: 'parent-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      orgRepo.create.mockReturnValue(child);
      orgRepo.save.mockResolvedValue(child);

      const result = await service.createChild(
        'parent-1',
        { name: 'Project' },
        'owner-user'
      );

      expect(result.parentId).toBe('parent-1');
      expect(result.name).toBe('Project');
      expect(orgRepo.save).toHaveBeenCalled();
    });

    it('should allow viewer to access child org when they have inherited role from parent', async () => {
      const childOrg = {
        id: 'child-1',
        name: 'Child',
        parentId: 'parent-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      orgRepo.findOne.mockResolvedValue(childOrg);

      const result = await service.findOne(
        'child-1',
        'user-with-parent-viewer'
      );

      expect(result.id).toBe('child-1');
      expect(result.parentId).toBe('parent-1');
    });
  });

  describe('revocation: child vs parent', () => {
    it('should revoke only child membership when revoking from child org', async () => {
      const childMembership = {
        id: 'm-child',
        userId: 'target',
        organizationId: 'child-org',
        role: RoleType.VIEWER,
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.OWNER);
      memberRepo.findOne.mockResolvedValue(childMembership);
      memberRepo.remove.mockResolvedValue(undefined);

      await service.revokeMembership('child-org', 'target', 'owner-user');

      expect(memberRepo.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'child-org', userId: 'target' },
      });
      expect(memberRepo.remove).toHaveBeenCalledWith(childMembership);
    });

    it('should revoke parent membership only (direct row); user loses parent + inherited child access', async () => {
      const parentMembership = {
        id: 'm-parent',
        userId: 'target',
        organizationId: 'parent-org',
        role: RoleType.VIEWER,
      };
      effectiveRoleService.hasMinimumRole.mockResolvedValue(true);
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.OWNER);
      memberRepo.findOne.mockResolvedValue(parentMembership);
      memberRepo.remove.mockResolvedValue(undefined);

      await service.revokeMembership('parent-org', 'target', 'owner-user');

      expect(memberRepo.remove).toHaveBeenCalledWith(parentMembership);
      expect(memberRepo.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('parent deletion: cascade children and memberships', () => {
    it('should call deleteDescendants and remove parent when owner deletes parent org', async () => {
      const parent = { id: 'parent-1', name: 'Parent', parentId: null };
      const children = [{ id: 'child-1', name: 'C1', parentId: 'parent-1' }];
      effectiveRoleService.getEffectiveRole.mockResolvedValue(RoleType.OWNER);
      orgRepo.findOne.mockResolvedValue(parent);
      orgRepo.find.mockResolvedValue(children);

      await service.delete('parent-1', 'owner-user');

      expect(orgRepo.find).toHaveBeenCalledWith({
        where: { parentId: 'parent-1' },
      });
      expect(orgRepo.remove).toHaveBeenCalled();
    });
  });
});
