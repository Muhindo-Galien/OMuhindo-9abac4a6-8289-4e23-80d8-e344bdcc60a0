import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Invitation,
  InvitationStatus,
  Organization,
  OrganizationMember,
  User,
  RoleType,
} from '@data';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { EffectiveRoleService } from '../organizations/organizations.service';
import { MailService } from './mail.service';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationRepo: any;
  let orgRepo: any;
  let memberRepo: any;
  let userRepo: any;
  let auditService: any;
  let effectiveRoleService: any;
  let mailService: any;
  let config: any;

  const org = { id: 'org-1', name: 'Test Org' };
  const sendDto = {
    email: 'invitee@test.com',
    role: RoleType.VIEWER,
    organizationId: 'org-1',
  };

  beforeEach(async () => {
    invitationRepo = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    orgRepo = { findOne: jest.fn() };
    memberRepo = {
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn(),
    };
    userRepo = { findOne: jest.fn() };
    auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
    effectiveRoleService = {
      hasMinimumRole: jest.fn().mockResolvedValue(true),
    };
    mailService = {
      sendInvitation: jest.fn().mockResolvedValue({ sent: true }),
    };
    config = { get: jest.fn().mockReturnValue('http://app') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: getRepositoryToken(Invitation), useValue: invitationRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: memberRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: AuditService, useValue: auditService },
        { provide: EffectiveRoleService, useValue: effectiveRoleService },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    jest.clearAllMocks();
    orgRepo.findOne.mockResolvedValue(org);
    userRepo.findOne.mockResolvedValue(null);
    memberRepo.findOne.mockResolvedValue(null);
    invitationRepo.create.mockImplementation((d: any) => d);
    invitationRepo.save.mockImplementation((d: any) =>
      Promise.resolve({ ...d, id: 'inv-1' })
    );
  });

  describe('send', () => {
    it('should throw ForbiddenException when user is not admin/owner', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);

      await expect(service.send(sendDto, 'viewer-user')).rejects.toThrow(
        ForbiddenException
      );
      expect(invitationRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      orgRepo.findOne.mockResolvedValue(null);

      await expect(service.send(sendDto, 'admin-user')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when user is already a member', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'invitee@test.com',
      });
      memberRepo.findOne.mockResolvedValue({
        userId: 'u1',
        organizationId: 'org-1',
      });

      await expect(service.send(sendDto, 'admin-user')).rejects.toThrow(
        BadRequestException
      );
      expect(invitationRepo.save).not.toHaveBeenCalled();
    });

    it('should create invitation, send email, and return token and emailSent', async () => {
      const result = await service.send(sendDto, 'admin-user');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result.emailSent).toBe(true);
      expect(invitationRepo.save).toHaveBeenCalled();
      expect(mailService.sendInvitation).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        'admin-user',
        'invite_sent',
        'invitation',
        expect.any(Object)
      );
    });

    it('should create invitation when existing user is not yet a member', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'invitee@test.com',
      });
      memberRepo.findOne.mockResolvedValue(null);

      const result = await service.send(sendDto, 'admin-user');

      expect(result.token).toBeDefined();
      expect(invitationRepo.save).toHaveBeenCalled();
    });

    it('should allow owner to send invite (same as admin for permission)', async () => {
      const result = await service.send(sendDto, 'owner-user');
      expect(result.token).toBeDefined();
      expect(effectiveRoleService.hasMinimumRole).toHaveBeenCalledWith(
        'owner-user',
        'org-1',
        RoleType.ADMIN
      );
    });

    it('should deny viewer from sending invite', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);
      await expect(service.send(sendDto, 'viewer-user')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('validateToken', () => {
    it('should return null for invalid or missing token', async () => {
      invitationRepo.findOne.mockResolvedValue(null);

      expect(await service.validateToken('bad-token')).toBeNull();
    });

    it('should return null when invitation is expired', async () => {
      const inv = {
        token: 't',
        status: InvitationStatus.PENDING,
        expiresAt: new Date('2020-01-01'),
        organization: org,
      };
      invitationRepo.findOne.mockResolvedValue(inv);

      expect(await service.validateToken('t')).toBeNull();
    });

    it('should return invite details when valid and pending', async () => {
      const inv = {
        token: 'valid',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
        organization: org,
        email: 'a@b.com',
        organizationId: 'org-1',
        role: RoleType.ADMIN,
      };
      invitationRepo.findOne.mockResolvedValue(inv);

      const result = await service.validateToken('valid');

      expect(result).toEqual({
        email: 'a@b.com',
        organizationName: 'Test Org',
        role: RoleType.ADMIN,
        organizationId: 'org-1',
      });
    });
  });

  describe('acceptWithToken', () => {
    const validInv = {
      id: 'inv-1',
      token: 'valid',
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 86400000),
      organization: org,
      email: 'user@test.com',
      organizationId: 'org-1',
      role: RoleType.VIEWER,
    };
    const currentUser = { id: 'user-1', email: 'user@test.com' };

    it('should throw BadRequestException when token is invalid', async () => {
      invitationRepo.findOne.mockResolvedValue(null);

      await expect(service.acceptWithToken('bad', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when invitation is expired', async () => {
      invitationRepo.findOne.mockResolvedValue({
        ...validInv,
        expiresAt: new Date('2020-01-01'),
      });
      userRepo.findOne.mockResolvedValue(currentUser);

      await expect(service.acceptWithToken('valid', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ForbiddenException when user email does not match invite', async () => {
      invitationRepo.findOne.mockResolvedValue(validInv);
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'other@test.com',
      });

      await expect(service.acceptWithToken('valid', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should add membership and return alreadyMember: false when first time', async () => {
      invitationRepo.findOne.mockResolvedValue(validInv);
      userRepo.findOne.mockResolvedValue(currentUser);
      memberRepo.findOne.mockResolvedValue(null);
      memberRepo.save.mockResolvedValue({});

      const result = await service.acceptWithToken('valid', 'user-1');

      expect(result.alreadyMember).toBe(false);
      expect(memberRepo.save).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        'user-1',
        'invite_accepted',
        'invitation',
        expect.any(Object)
      );
    });

    it('should return alreadyMember: true when user already in org', async () => {
      invitationRepo.findOne.mockResolvedValue(validInv);
      userRepo.findOne.mockResolvedValue(currentUser);
      memberRepo.findOne.mockResolvedValue({
        userId: 'user-1',
        organizationId: 'org-1',
      });

      const result = await service.acceptWithToken('valid', 'user-1');

      expect(result.alreadyMember).toBe(true);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('listForOrg', () => {
    it('should throw ForbiddenException when user is not admin/owner', async () => {
      effectiveRoleService.hasMinimumRole.mockResolvedValue(false);

      await expect(service.listForOrg('org-1', 'viewer-user')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should return list of invitations when user has access', async () => {
      const list = [
        {
          id: 'i1',
          email: 'a@b.com',
          role: RoleType.VIEWER,
          status: InvitationStatus.PENDING,
          expiresAt: new Date(),
          invitedBy: null,
          createdAt: new Date(),
        },
      ];
      invitationRepo.find.mockResolvedValue(list);

      const result = await service.listForOrg('org-1', 'admin-user');

      expect(result).toHaveLength(1);
      expect(invitationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1' } })
      );
    });
  });
});
