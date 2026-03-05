import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtStrategyPayload, RoleType } from '@data';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'JWT_SECRET' ? 'secret' : undefined
            ),
          },
        },
      ],
    }).compile();
    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should return user object with id, email, role, org_roles', async () => {
    const payload: JwtStrategyPayload = {
      sub: 'user-1',
      email: 'u@test.com',
      role: 'user',
      org_roles: { 'org-1': RoleType.OWNER },
    };
    const result = await strategy.validate(payload);
    expect(result).toEqual({
      id: 'user-1',
      email: 'u@test.com',
      role: 'user',
      org_roles: { 'org-1': RoleType.OWNER },
      permissions: [],
    });
  });

  it('should default org_roles to empty object when missing', async () => {
    const payload: JwtStrategyPayload = {
      sub: 'user-1',
      email: 'u@test.com',
      role: 'user',
    };
    const result = await strategy.validate(payload);
    expect(result.org_roles).toEqual({});
  });

  it('should pass through org_roles for parent and child orgs', async () => {
    const payload: JwtStrategyPayload = {
      sub: 'user-1',
      email: 'u@test.com',
      role: 'user',
      org_roles: { 'parent-org': RoleType.OWNER, 'child-org': RoleType.ADMIN },
    };
    const result = await strategy.validate(payload);
    expect(result.org_roles).toEqual({
      'parent-org': RoleType.OWNER,
      'child-org': RoleType.ADMIN,
    });
  });
});
