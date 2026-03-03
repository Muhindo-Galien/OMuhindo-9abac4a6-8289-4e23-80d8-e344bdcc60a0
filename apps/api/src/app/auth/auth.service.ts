import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Import from libs
import { User, Organization, Role, RegisterDto, LoginDto, AuthResponseDto, UserProfile, RoleType, AuditAction, AuditResource } from '@data';
import { AuthService } from '@auth';

// Import audit service
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthApplicationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private authService: AuthService,
    private auditService: AuditService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    console.log('=== REGISTER ENDPOINT START ===');
    console.log('Registration attempt for email:', registerDto.email);
    
    try {
      const { email, password, firstName, lastName, organizationId, roleId } = registerDto;

      console.log('Checking if user already exists with email:', email);
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email }
      });

      if (existingUser) {
        console.log('Registration failed - User already exists:', email);
        throw new ConflictException('User with this email already exists');
      }

      console.log('Verifying organization exists:', organizationId);
      // Verify organization exists
      const organization = await this.organizationRepository.findOne({
        where: { id: organizationId }
      });

      if (!organization) {
        console.log('Registration failed - Organization not found:', organizationId);
        throw new BadRequestException('Organization not found');
      }
      console.log('Organization found:', organization.name);

      // Get role - use provided roleId or default to VIEWER role
      let role: Role | null;
      if (roleId) {
        console.log('Looking up provided role:', roleId);
        role = await this.roleRepository.findOne({
          where: { id: roleId }
        });
        if (!role) {
          console.log('Registration failed - Role not found:', roleId);
          throw new BadRequestException('Role not found');
        }
        console.log('Role found:', role.name);
      } else {
        console.log('No role provided, defaulting to VIEWER role');
        // Default to VIEWER role
        role = await this.roleRepository.findOne({
          where: { name: RoleType.VIEWER }
        });
        if (!role) {
          console.log('Registration failed - Default VIEWER role not found in system');
          throw new BadRequestException('Default VIEWER role not found in system');
        }
        console.log('Default VIEWER role assigned');
      }

      console.log('Hashing password...');
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      console.log('Creating new user record...');
      // Create new user
      const newUser = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        organizationId,
        roleId: role.id,
        isActive: true
      });

      console.log('Saving user to database...');
      // Save user to database
      const savedUser = await this.userRepository.save(newUser);
      console.log('User saved with ID:', savedUser.id);

      console.log('Loading user with relations for JWT generation...');
      // Load user with relations for JWT payload
      const userWithRelations = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ['organization', 'role']
      });

      if (!userWithRelations) {
        console.log('Registration failed - Could not load user with relations');
        throw new BadRequestException('Failed to create user');
      }

      console.log('Generating JWT token...');
      // Generate JWT token using library service
      const tokenResult = await this.authService.login(userWithRelations);

      console.log('Creating user profile response...');
      // Create user profile (without password)
      const userProfile: UserProfile = {
        id: userWithRelations.id,
        email: userWithRelations.email,
        firstName: userWithRelations.firstName,
        lastName: userWithRelations.lastName,
        role: userWithRelations.role.name,
        organizationId: userWithRelations.organizationId,
        isActive: userWithRelations.isActive,
        createdAt: userWithRelations.createdAt,
        updatedAt: userWithRelations.updatedAt
      };

      console.log('Registration successful for user:', userProfile.email, 'with role:', userProfile.role);
      console.log('=== REGISTER ENDPOINT SUCCESS ===');

      return {
        access_token: tokenResult.access_token,
        user: userProfile
      };
    } catch (error) {
      console.log('=== REGISTER ENDPOINT ERROR ===');
      console.log('Error details:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    console.log('=== LOGIN ENDPOINT START ===');
    console.log('Login attempt for email:', loginDto.email);
    
    try {
      const { email, password } = loginDto;

      console.log('Validating user credentials for email:', email);
      // Validate user credentials using the library service
      const user = await this.authService.validateUser(email, password, this.userRepository);

      if (!user) {
        console.log('Login failed - Invalid credentials for email:', email);
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('User validation successful for:', user.email, 'with role:', user.role.name);
      console.log('User organization:', user.organizationId);
      console.log('User active status:', user.isActive);

      console.log('Generating JWT token...');
      // Generate JWT token using library service
      const tokenResult = await this.authService.login(user);

      console.log('Creating user profile response...');
      // Create user profile (without password)
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        organizationId: user.organizationId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      console.log('Login successful for user:', userProfile.email, 'with role:', userProfile.role);
      console.log('JWT token generated successfully');

      // Log audit action
      try {
        await this.auditService.logAction(
          user.id,
          AuditAction.LOGIN,
          AuditResource.AUTH,
          {
            details: {
              email: user.email,
              role: user.role.name,
              organizationId: user.organizationId,
            },
            success: true,
          }
        );
      } catch (auditError) {
        console.log('Failed to log audit action:', auditError);
      }

      console.log('=== LOGIN ENDPOINT SUCCESS ===');

      return {
        access_token: tokenResult.access_token,
        user: userProfile
      };
    } catch (error) {
      console.log('=== LOGIN ENDPOINT ERROR ===');
      console.log('Error details:', error);
      throw error;
    }
  }
} 