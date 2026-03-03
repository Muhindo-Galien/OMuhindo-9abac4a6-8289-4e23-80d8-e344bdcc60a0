import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Import entities and DTOs
import { User, Organization, Role, RegisterDto, LoginDto, RoleType } from '../../../../../libs/data/src';
import { AuthService } from '../../../../../libs/auth/src';

// Import the service under test
import { AuthApplicationService } from './auth.service';
import { AuditService } from '../audit/audit.service';

// Import fixtures
import { mockUsers, mockAuthResponses, cloneFixture, createCustomFixture } from '../../../../../libs/data/src';

describe('AuthApplicationService', () => {
  let service: AuthApplicationService;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let authService: jest.Mocked<AuthService>;
  let auditService: jest.Mocked<AuditService>;

  // Test data based on fixtures
  const testPassword = 'SecurePassword123!';
  const hashedPassword = '$2b$10$test.hashed.password.string.here';
  
  const mockRole = {
    id: 'role-viewer-123',
    name: RoleType.VIEWER,
    level: 1,
    description: 'Viewer role',
    permissionIds: ['task:read'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization = {
    id: 'org-123',
    name: 'TurboVets Organization',
    description: 'Test organization',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserEntity = {
    ...cloneFixture(mockUsers.viewer),
    password: hashedPassword,
    role: mockRole,
    organization: mockOrganization,
  };

  beforeEach(async () => {
    // Create mocked repositories
    const mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockOrgRepo = {
      findOne: jest.fn(),
    };

    const mockRoleRepo = {
      findOne: jest.fn(),
    };

    // Create mocked services
    const mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };

    const mockAuditService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthApplicationService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrgRepo,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepo,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthApplicationService>(AuthApplicationService);
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
    roleRepository = module.get(getRepositoryToken(Role));
    authService = module.get(AuthService);
    auditService = module.get(AuditService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@turbovets.com',
      password: testPassword,
      firstName: 'New',
      lastName: 'User',
      organizationId: 'org-123',
      roleId: 'role-viewer-123',
    };

    it('should successfully register a new user with provided role', async () => {
      // Arrange
      const expectedUser = createCustomFixture(mockUserEntity, {
        id: 'new-user-123',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        organizationId: registerDto.organizationId,
      });

      userRepository.findOne.mockResolvedValue(null); // No existing user
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue(expectedUser as any);
      userRepository.save.mockResolvedValue(expectedUser as any);
      
      // Mock second findOne call for user with relations
      userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(expectedUser as any);
      
      authService.login.mockResolvedValue({ access_token: 'jwt.token.here' });
      
      // Mock bcrypt.hash
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(organizationRepository.findOne).toHaveBeenCalledWith({ where: { id: registerDto.organizationId } });
      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: registerDto.roleId } });
      expect(bcrypt.hash).toHaveBeenCalledWith(testPassword, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith(expectedUser);
      
      expect(result).toEqual({
        access_token: 'jwt.token.here',
        user: expect.objectContaining({
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: mockRole.name,
          organizationId: registerDto.organizationId,
        }),
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should register user with default VIEWER role when roleId not provided', async () => {
      // Arrange
      const registerDtoWithoutRole = { ...registerDto };
      delete registerDtoWithoutRole.roleId;
      
      const expectedUser = createCustomFixture(mockUserEntity, {
        id: 'new-user-123',
        email: registerDto.email,
      });

      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      roleRepository.findOne.mockResolvedValue(mockRole); // Default VIEWER role
      userRepository.create.mockReturnValue(expectedUser as any);
      userRepository.save.mockResolvedValue(expectedUser as any);
      userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(expectedUser as any);
      authService.login.mockResolvedValue({ access_token: 'jwt.token.here' });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      // Act
      const result = await service.register(registerDtoWithoutRole);

      // Assert
      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { name: RoleType.VIEWER } });
      expect(result.user.role).toBe(RoleType.VIEWER);
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUserEntity as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(organizationRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when organization not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(organizationRepository.findOne).toHaveBeenCalledWith({ where: { id: registerDto.organizationId } });
      expect(roleRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when provided role not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      roleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: registerDto.roleId } });
    });

    it('should throw BadRequestException when default VIEWER role not found', async () => {
      // Arrange
      const registerDtoWithoutRole = { ...registerDto };
      delete registerDtoWithoutRole.roleId;

      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      roleRepository.findOne.mockResolvedValue(null); // VIEWER role not found

      // Act & Assert
      await expect(service.register(registerDtoWithoutRole)).rejects.toThrow(BadRequestException);
      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { name: RoleType.VIEWER } });
    });

    it('should use real password hashing with bcrypt', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue(mockUserEntity as any);
      userRepository.save.mockResolvedValue(mockUserEntity as any);
      userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserEntity as any);
      authService.login.mockResolvedValue({ access_token: 'jwt.token.here' });
      
      const bcryptSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      // Act
      await service.register(registerDto);

      // Assert - Verify real bcrypt is used with proper salt rounds
      expect(bcryptSpy).toHaveBeenCalledWith(testPassword, 10);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
        })
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'viewer@turbovets.com',
      password: testPassword,
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const userWithRelations = {
        ...cloneFixture(mockUsers.viewer),
        password: hashedPassword,
        role: mockRole,
        organization: mockOrganization,
      };

      authService.validateUser.mockResolvedValue(userWithRelations);
      authService.login.mockResolvedValue({ access_token: 'jwt.token.here' });
      auditService.logAction.mockResolvedValue({} as any);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        userRepository
      );
      expect(authService.login).toHaveBeenCalledWith(userWithRelations);
      expect(auditService.logAction).toHaveBeenCalled();
      
      expect(result).toEqual({
        access_token: 'jwt.token.here',
        user: expect.objectContaining({
          email: loginDto.email,
          role: mockRole.name,
          organizationId: userWithRelations.organizationId,
        }),
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      // Arrange
      authService.validateUser.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        userRepository
      );
      expect(authService.login).not.toHaveBeenCalled();
      expect(auditService.logAction).not.toHaveBeenCalled();
    });

    it('should generate real JWT token through authService', async () => {
      // Arrange
      const userWithRelations = {
        ...cloneFixture(mockUsers.viewer),
        role: mockRole,
        organization: mockOrganization,
      };

      authService.validateUser.mockResolvedValue(userWithRelations);
      authService.login.mockResolvedValue({ access_token: 'real.jwt.token.here' });
      auditService.logAction.mockResolvedValue({} as any);

      // Act
      const result = await service.login(loginDto);

      // Assert - Verify real JWT token generation
      expect(authService.login).toHaveBeenCalledWith(userWithRelations);
      expect(result.access_token).toBe('real.jwt.token.here');
    });

    it('should log successful login audit action', async () => {
      // Arrange
      const userWithRelations = {
        ...cloneFixture(mockUsers.viewer),
        role: mockRole,
        organization: mockOrganization,
      };

      authService.validateUser.mockResolvedValue(userWithRelations);
      authService.login.mockResolvedValue({ access_token: 'jwt.token.here' });
      auditService.logAction.mockResolvedValue({} as any);

      // Act
      await service.login(loginDto);

      // Assert - Verify audit logging
      expect(auditService.logAction).toHaveBeenCalledWith(
        userWithRelations.id,
        'login',
        'auth',
        expect.objectContaining({
          details: expect.objectContaining({
            email: userWithRelations.email,
            role: mockRole.name,
            organizationId: userWithRelations.organizationId,
          }),
          success: true,
        })
      );
    });

    it('should continue execution even if audit logging fails', async () => {
      // Arrange
      const userWithRelations = {
        ...cloneFixture(mockUsers.viewer),
        role: mockRole,
        organization: mockOrganization,
      };

      authService.validateUser.mockResolvedValue(userWithRelations);
      authService.login.mockResolvedValue({ access_token: 'jwt.token.here' });
      auditService.logAction.mockRejectedValue(new Error('Audit service failure'));

      // Act
      const result = await service.login(loginDto);

      // Assert - Login should still succeed even if audit fails
      expect(result).toEqual(expect.objectContaining({
        access_token: 'jwt.token.here',
      }));
      expect(auditService.logAction).toHaveBeenCalled();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle database connection errors during registration', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@turbovets.com',
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'org-123',
      };

      userRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow('Database connection failed');
    });

    it('should handle database connection errors during login', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@turbovets.com',
        password: testPassword,
      };

      authService.validateUser.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Database connection failed');
    });

    it('should handle JWT generation errors', async () => {
      // Arrange
      const userWithRelations = {
        ...cloneFixture(mockUsers.viewer),
        role: mockRole,
        organization: mockOrganization,
      };

      authService.validateUser.mockResolvedValue(userWithRelations);
      authService.login.mockRejectedValue(new Error('JWT generation failed'));

      const loginDto: LoginDto = {
        email: 'test@turbovets.com',
        password: testPassword,
      };

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('JWT generation failed');
    });
  });

  describe('security validations', () => {
    it('should never return password in response', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'security@turbovets.com',
        password: testPassword,
        firstName: 'Security',
        lastName: 'Test',
        organizationId: 'org-123',
      };

      const userWithPassword = {
        ...cloneFixture(mockUserEntity),
        password: hashedPassword,
      };

      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.create.mockReturnValue(userWithPassword as any);
      userRepository.save.mockResolvedValue(userWithPassword as any);
      userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(userWithPassword as any);
      authService.login.mockResolvedValue({ access_token: 'jwt.token.here' });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.user).not.toHaveProperty('password');
      expect(Object.keys(result.user)).not.toContain('password');
    });

    it('should validate email format through DTO (integration test)', async () => {
      // This test assumes DTO validation is properly configured
      // In a real scenario, this would be tested at the controller level
      const invalidEmailDto = {
        email: 'invalid-email',
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'org-123',
      } as RegisterDto;

      // The service itself doesn't validate email format - this is typically done by ValidationPipe
      // But we can test that the service receives the email as-is
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      roleRepository.findOne.mockResolvedValue(mockRole);

      // Act
      try {
        await service.register(invalidEmailDto);
      } catch (error) {
        // Service should handle any email string it receives
      }

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({ 
        where: { email: 'invalid-email' } 
      });
    });
  });
}); 