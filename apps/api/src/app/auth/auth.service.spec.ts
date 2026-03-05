import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import {
  User,
  Organization,
  OrganizationMember,
  Invitation,
  InvitationStatus,
  RoleType,
} from '@data';
import { AuthService } from '@auth';
import { AuthApplicationService } from './auth.service';
import { AuditService } from '../audit/audit.service';

describe('AuthApplicationService', () => {
  let service: AuthApplicationService;
  let userRepo: any;
  let orgRepo: any;
  let memberRepo: any;
  let invitationRepo: any;
  let authService: any;
  let auditService: any;

  const hashedPassword = 'hashed';
  const mockUser = {
    id: 'user-1',
    email: 'u@test.com',
    firstName: 'F',
    lastName: 'L',
    globalRole: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    orgRepo = { create: jest.fn(), save: jest.fn() };
    memberRepo = { create: jest.fn(), save: jest.fn() };
    invitationRepo = { findOne: jest.fn(), save: jest.fn() };
    authService = {
      hashPassword: jest.fn().mockResolvedValue(hashedPassword),
      login: jest.fn().mockResolvedValue({ access_token: 'jwt' }),
    };
    auditService = { logAction: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthApplicationService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: memberRepo,
        },
        { provide: getRepositoryToken(Invitation), useValue: invitationRepo },
        { provide: AuthService, useValue: authService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthApplicationService>(AuthApplicationService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user with global role only, no org', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'u@test.com',
        password: 'pass1234',
        firstName: 'F',
        lastName: 'L',
      });

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'u@test.com' },
      });
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'u@test.com',
          globalRole: 'user',
          firstName: 'F',
          lastName: 'L',
        })
      );
      expect(authService.login).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object)
      );
      expect(result.user.role).toBe('user');
      expect(result.user).not.toHaveProperty('organizationId');
    });

    it('should not create org on register when createOrgName provided (ignored for security)', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'u@test.com',
        password: 'pass1234',
        firstName: 'F',
        lastName: 'L',
        createOrgName: 'My Workspace',
      });

      expect(orgRepo.create).not.toHaveBeenCalled();
      expect(orgRepo.save).not.toHaveBeenCalled();
      expect(memberRepo.save).not.toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith(mockUser, {});
      expect(result.user.role).toBe('user');
    });

    it('should throw ConflictException when email exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        service.register({
          email: 'u@test.com',
          password: 'pass',
          firstName: 'F',
          lastName: 'L',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should accept invite and add membership when register with valid inviteToken', async () => {
      const inv = {
        id: 'inv-1',
        token: 'valid-token',
        email: 'u@test.com',
        organizationId: 'org-1',
        role: RoleType.VIEWER,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        organization: { id: 'org-1' },
      };
      const membershipEntity = {
        userId: mockUser.id,
        organizationId: 'org-1',
        role: RoleType.VIEWER,
      };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);
      invitationRepo.findOne.mockResolvedValue(inv);
      invitationRepo.save.mockResolvedValue(inv);
      memberRepo.create.mockReturnValue(membershipEntity);
      memberRepo.save.mockResolvedValue(membershipEntity);

      const result = await service.register({
        email: 'u@test.com',
        password: 'pass1234',
        firstName: 'F',
        lastName: 'L',
        inviteToken: 'valid-token',
      });

      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          organizationId: 'org-1',
          role: RoleType.VIEWER,
        })
      );
      expect(result.user.org_roles).toEqual({ 'org-1': RoleType.VIEWER });
    });
  });

  describe('login', () => {
    it('should return JWT without org_roles', async () => {
      authService.validateUser = jest.fn().mockResolvedValue(mockUser);
      const result = await service.login({
        email: 'u@test.com',
        password: 'pass',
      });
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result.user.role).toBe('user');
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      authService.validateUser = jest.fn().mockResolvedValue(null);
      await expect(
        service.login({ email: 'u@test.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return JWT with org_roles from memberships', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      memberRepo.find = jest.fn().mockResolvedValue([
        { organizationId: 'org-1', role: 'owner' as const },
        { organizationId: 'org-2', role: 'viewer' as const },
      ]);
      const result = await service.refresh('user-1');
      expect(authService.login).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({ 'org-1': 'owner', 'org-2': 'viewer' })
      );
      expect(result.user.org_roles).toEqual({
        'org-1': 'owner',
        'org-2': 'viewer',
      });
    });

    it('should return JWT with empty org_roles when user has no memberships', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      memberRepo.find = jest.fn().mockResolvedValue([]);
      const result = await service.refresh('user-1');
      expect(authService.login).toHaveBeenCalledWith(mockUser, {});
      expect(result.user.org_roles).toEqual({});
    });

    it('should return org_roles for both parent and child when user has direct memberships in both', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      memberRepo.find = jest.fn().mockResolvedValue([
        { organizationId: 'parent-org', role: RoleType.OWNER },
        { organizationId: 'child-org', role: RoleType.ADMIN },
      ]);
      const result = await service.refresh('user-1');
      expect(result.user.org_roles).toEqual({
        'parent-org': RoleType.OWNER,
        'child-org': RoleType.ADMIN,
      });
    });

    it('should return only direct memberships (inheritance resolved at access-check time)', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      memberRepo.find = jest
        .fn()
        .mockResolvedValue([
          { organizationId: 'parent-org', role: RoleType.OWNER },
        ]);
      const result = await service.refresh('user-1');
      expect(result.user.org_roles).toEqual({ 'parent-org': RoleType.OWNER });
      expect(Object.keys(result.user.org_roles ?? {})).toHaveLength(1);
    });
  });
});
