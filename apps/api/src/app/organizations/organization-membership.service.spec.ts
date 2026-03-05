import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationMember, User, Organization, RoleType } from '@data';
import { OrganizationMembershipService } from './organization-membership.service';

describe('OrganizationMembershipService', () => {
  let service: OrganizationMembershipService;
  let membershipRepo: any;
  let userRepo: any;
  let orgRepo: any;

  beforeEach(async () => {
    membershipRepo = { findOne: jest.fn(), find: jest.fn() };
    userRepo = {};
    orgRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationMembershipService,
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: membershipRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
      ],
    }).compile();
    service = module.get<OrganizationMembershipService>(
      OrganizationMembershipService
    );
    jest.clearAllMocks();
  });

  describe('getOwnerForOrg', () => {
    it('should return owner user when org has owner', async () => {
      const ownerUser = {
        id: 'u1',
        email: 'o@test.com',
        firstName: 'O',
        lastName: 'Owner',
      };
      membershipRepo.findOne.mockResolvedValue({ user: ownerUser });

      const result = await service.getOwnerForOrg('org-1');
      expect(result).toEqual({
        id: 'u1',
        email: 'o@test.com',
        firstName: 'O',
        lastName: 'Owner',
      });
      expect(membershipRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1', role: RoleType.OWNER },
        })
      );
    });

    it('should return null when org has no owner membership', async () => {
      membershipRepo.findOne.mockResolvedValue(null);
      expect(await service.getOwnerForOrg('org-1')).toBeNull();
    });
  });

  describe('getMembersForOrg', () => {
    it('should return member summaries with user and role', async () => {
      const memberships = [
        {
          userId: 'u1',
          role: RoleType.OWNER,
          createdAt: new Date('2024-01-01'),
          user: { email: 'o@test.com', firstName: 'O', lastName: 'Owner' },
        },
        {
          userId: 'u2',
          role: RoleType.VIEWER,
          createdAt: new Date('2024-01-02'),
          user: { email: 'v@test.com', firstName: 'V', lastName: 'Viewer' },
        },
      ];
      membershipRepo.find.mockResolvedValue(memberships);

      const result = await service.getMembersForOrg('org-1');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        userId: 'u1',
        email: 'o@test.com',
        role: RoleType.OWNER,
      });
      expect(result[1]).toMatchObject({
        userId: 'u2',
        email: 'v@test.com',
        role: RoleType.VIEWER,
      });
    });
  });

  describe('getDirectRole', () => {
    it('should return role when user is direct member', async () => {
      membershipRepo.findOne.mockResolvedValue({ role: RoleType.ADMIN });
      expect(await service.getDirectRole('user-1', 'org-1')).toBe(
        RoleType.ADMIN
      );
    });

    it('should return null when user is not direct member', async () => {
      membershipRepo.findOne.mockResolvedValue(null);
      expect(await service.getDirectRole('user-1', 'org-1')).toBeNull();
    });
  });

  describe('getOrgRolesForUser', () => {
    it('should return map of orgId to role for all memberships', async () => {
      membershipRepo.find.mockResolvedValue([
        { organizationId: 'org-1', role: RoleType.OWNER },
        { organizationId: 'org-2', role: RoleType.VIEWER },
      ]);
      const result = await service.getOrgRolesForUser('user-1');
      expect(result).toEqual({
        'org-1': RoleType.OWNER,
        'org-2': RoleType.VIEWER,
      });
    });

    it('should return empty object when user has no memberships', async () => {
      membershipRepo.find.mockResolvedValue([]);
      expect(await service.getOrgRolesForUser('user-1')).toEqual({});
    });
  });

  describe('getEffectiveMembersForOrg', () => {
    it('should return direct members only when org has no parent', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 'org-1', parentId: null });
      membershipRepo.find.mockResolvedValue([
        {
          userId: 'u1',
          role: RoleType.OWNER,
          createdAt: new Date(),
          user: { email: 'o@test.com', firstName: 'O', lastName: 'Owner' },
        },
      ]);

      const result = await service.getEffectiveMembersForOrg('org-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 'u1',
        role: RoleType.OWNER,
        source: 'direct',
      });
    });

    it('should return direct members plus inherited from parent for child org', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 'child', parentId: 'parent' });
      membershipRepo.find
        .mockResolvedValueOnce([
          {
            userId: 'u2',
            role: RoleType.VIEWER,
            createdAt: new Date(),
            user: { email: 'v@test.com', firstName: 'V', lastName: 'Viewer' },
          },
        ])
        .mockResolvedValueOnce([
          {
            userId: 'u1',
            role: RoleType.OWNER,
            createdAt: new Date(),
            user: { email: 'o@test.com', firstName: 'O', lastName: 'Owner' },
          },
        ]);

      const result = await service.getEffectiveMembersForOrg('child');
      expect(result.length).toBeGreaterThanOrEqual(1);
      const direct = result.find(r => r.source === 'direct');
      const inherited = result.find(r => r.source === 'inherited');
      expect(direct).toMatchObject({ userId: 'u2', source: 'direct' });
      expect(inherited).toMatchObject({ userId: 'u1', source: 'inherited' });
    });

    it('should show direct role only when user is in both parent and child (direct overrides inherited)', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 'child', parentId: 'parent' });
      membershipRepo.find
        .mockResolvedValueOnce([
          {
            userId: 'u1',
            role: RoleType.ADMIN,
            createdAt: new Date(),
            user: { email: 'a@test.com', firstName: 'A', lastName: 'Admin' },
          },
        ])
        .mockResolvedValueOnce([
          {
            userId: 'u1',
            role: RoleType.OWNER,
            createdAt: new Date(),
            user: { email: 'a@test.com', firstName: 'A', lastName: 'Admin' },
          },
        ]);

      const result = await service.getEffectiveMembersForOrg('child');
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('u1');
      expect(result[0].role).toBe(RoleType.ADMIN);
      expect(result[0].source).toBe('direct');
    });

    it('should return empty array when org does not exist', async () => {
      orgRepo.findOne.mockResolvedValue(null);
      const result = await service.getEffectiveMembersForOrg('non-existent');
      expect(result).toEqual([]);
    });
  });
});
