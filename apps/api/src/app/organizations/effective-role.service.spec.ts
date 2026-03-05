import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization, OrganizationMember, RoleType } from '@data';
import { EffectiveRoleService } from './organizations.service';

describe('EffectiveRoleService', () => {
  let service: EffectiveRoleService;
  let memberRepo: { findOne: jest.Mock };
  let orgRepo: { find: jest.Mock; findOne?: jest.Mock };

  beforeEach(async () => {
    memberRepo = { findOne: jest.fn() };
    orgRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EffectiveRoleService,
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: memberRepo,
        },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
      ],
    }).compile();
    service = module.get<EffectiveRoleService>(EffectiveRoleService);
    jest.clearAllMocks();
  });

  it('should return direct role when user is member of org', async () => {
    (orgRepo as any).findOne = jest
      .fn()
      .mockResolvedValue({ id: 'org-1', parentId: null });
    memberRepo.findOne.mockResolvedValue({ role: RoleType.ADMIN });
    const role = await service.getEffectiveRole('user-1', 'org-1');
    expect(role).toBe(RoleType.ADMIN);
  });

  it('should return null when org does not exist', async () => {
    (orgRepo as any).findOne = jest.fn().mockResolvedValue(null);
    const role = await service.getEffectiveRole('user-1', 'org-1');
    expect(role).toBeNull();
  });

  it('should return null when user has no membership and org has no parent', async () => {
    (orgRepo as any).findOne = jest
      .fn()
      .mockResolvedValue({ id: 'org-1', parentId: null });
    memberRepo.findOne.mockResolvedValue(null);
    const role = await service.getEffectiveRole('user-1', 'org-1');
    expect(role).toBeNull();
  });

  it('should inherit parent role when no direct membership (child org)', async () => {
    (orgRepo as any).findOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 'child', parentId: 'parent' })
      .mockResolvedValueOnce({ id: 'parent', parentId: null });
    memberRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ role: RoleType.OWNER });
    const role = await service.getEffectiveRole('user-1', 'child');
    expect(role).toBe(RoleType.OWNER);
  });

  it('hasMinimumRole returns false when user has no role in org', async () => {
    (orgRepo as any).findOne = jest
      .fn()
      .mockResolvedValue({ id: 'org-1', parentId: null });
    memberRepo.findOne.mockResolvedValue(null);
    const result = await service.hasMinimumRole(
      'user-1',
      'org-1',
      RoleType.VIEWER
    );
    expect(result).toBe(false);
  });

  it('hasMinimumRole returns true when user has owner and required is viewer', async () => {
    (orgRepo as any).findOne = jest
      .fn()
      .mockResolvedValue({ id: 'org-1', parentId: null });
    memberRepo.findOne.mockResolvedValue({ role: RoleType.OWNER });
    const result = await service.hasMinimumRole(
      'user-1',
      'org-1',
      RoleType.VIEWER
    );
    expect(result).toBe(true);
  });

  it('should return direct child role when user has both parent and child membership (direct overrides inheritance)', async () => {
    (orgRepo as any).findOne = jest
      .fn()
      .mockResolvedValue({ id: 'child', parentId: 'parent' });
    memberRepo.findOne.mockResolvedValue({ role: RoleType.VIEWER });
    const role = await service.getEffectiveRole('user-1', 'child');
    expect(role).toBe(RoleType.VIEWER);
  });

  it('should inherit viewer from parent when no direct child membership', async () => {
    (orgRepo as any).findOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 'child', parentId: 'parent' })
      .mockResolvedValueOnce({ id: 'parent', parentId: null });
    memberRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ role: RoleType.VIEWER });
    const role = await service.getEffectiveRole('user-1', 'child');
    expect(role).toBe(RoleType.VIEWER);
  });
});
