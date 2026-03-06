import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OrgRoleGuard } from './org-role.guard';
import { RoleType } from '@data';

describe('OrgRoleGuard', () => {
  let guard: OrgRoleGuard;
  let reflector: Reflector;

  const createContext = (request: {
    user?: any;
    params?: any;
    body?: any;
  }): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgRoleGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();
    guard = module.get<OrgRoleGuard>(OrgRoleGuard);
    reflector = module.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  it('should allow when no org_roles metadata is set', () => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    const ctx = createContext({ user: { id: 'u1', org_roles: {} } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw when user is not authenticated', () => {
    (reflector.get as jest.Mock).mockReturnValue([RoleType.VIEWER]);
    const ctx = createContext({ user: null, params: { orgId: 'org-1' } });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Not authenticated');
  });

  it('should throw when organization context (orgId) is missing', () => {
    (reflector.get as jest.Mock).mockReturnValue([RoleType.VIEWER]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: {} },
      params: {},
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow(
      'Organization context required'
    );
  });

  it('should throw when user has no access to the org (missing org_roles[orgId])', () => {
    (reflector.get as jest.Mock).mockReturnValue([RoleType.VIEWER]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: { 'other-org': RoleType.OWNER } },
      params: { orgId: 'org-1' },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow(
      'No access to this organization'
    );
  });

  it('should allow when user has required role (viewer) in org', () => {
    (reflector.get as jest.Mock).mockReturnValue([RoleType.VIEWER]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: { 'org-1': RoleType.VIEWER } },
      params: { orgId: 'org-1' },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user has higher role (owner) than required (viewer)', () => {
    (reflector.get as jest.Mock).mockReturnValue([RoleType.VIEWER]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: { 'org-1': RoleType.OWNER } },
      params: { orgId: 'org-1' },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw when user has lower role (viewer) than required (admin)', () => {
    (reflector.get as jest.Mock).mockReturnValue([
      RoleType.ADMIN,
      RoleType.OWNER,
    ]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: { 'org-1': RoleType.VIEWER } },
      params: { orgId: 'org-1' },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Insufficient role');
  });

  it('should read orgId from body.organizationId when param not present', () => {
    (reflector.get as jest.Mock).mockReturnValue([RoleType.VIEWER]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: { 'org-1': RoleType.VIEWER } },
      params: {},
      body: { organizationId: 'org-1' },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should read orgId from query.organizationId when param and body not present', () => {
    (reflector.get as jest.Mock).mockReturnValue([
      RoleType.ADMIN,
      RoleType.OWNER,
    ]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: { 'org-1': RoleType.OWNER } },
      params: {},
      body: {},
      query: { organizationId: 'org-1' },
    } as any);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny when orgId from query is present but user has no role for that org', () => {
    (reflector.get as jest.Mock).mockReturnValue([RoleType.VIEWER]);
    const ctx = createContext({
      user: { id: 'u1', org_roles: { 'other-org': RoleType.VIEWER } },
      params: {},
      query: { organizationId: 'org-1' },
    } as any);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
