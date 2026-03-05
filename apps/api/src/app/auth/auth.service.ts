import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  Organization,
  OrganizationMember,
  Invitation,
  InvitationStatus,
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserProfile,
  RoleType,
  AuditAction,
  AuditResource,
  GLOBAL_ROLE_USER,
} from '@data';
import { AuthService as AuthLibService } from '@auth';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthApplicationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private membershipRepository: Repository<OrganizationMember>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private authService: AuthLibService,
    private auditService: AuditService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing)
      throw new ConflictException('User with this email already exists');

    const hashedPassword = await this.authService.hashPassword(password);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      globalRole: GLOBAL_ROLE_USER,
      isActive: true,
    });
    const savedUser = await this.userRepository.save(user);

    let orgRoles: Record<string, RoleType> = {};

    if (registerDto.inviteToken?.trim()) {
      const inv = await this.invitationRepository.findOne({
        where: {
          token: registerDto.inviteToken.trim(),
          status: InvitationStatus.PENDING,
        },
        relations: ['organization'],
      });
      if (
        inv &&
        inv.email.toLowerCase() === savedUser.email.toLowerCase() &&
        new Date() <= inv.expiresAt
      ) {
        await this.membershipRepository.save(
          this.membershipRepository.create({
            userId: savedUser.id,
            organizationId: inv.organizationId,
            role: inv.role,
          })
        );
        orgRoles[inv.organizationId] = inv.role;
        inv.status = InvitationStatus.ACCEPTED;
        await this.invitationRepository.save(inv);
        await this.auditService.logAction(
          savedUser.id,
          AuditAction.INVITE_ACCEPTED,
          AuditResource.INVITATION,
          {
            resourceId: inv.id,
            organizationId: inv.organizationId,
            details: { email: inv.email, orgId: inv.organizationId },
            success: true,
          }
        );
      }
    }

    const tokenResult = await this.authService.login(savedUser, orgRoles);
    const profile = this.toProfile(savedUser, orgRoles);

    await this.auditService.logAction(
      savedUser.id,
      AuditAction.REGISTER,
      AuditResource.AUTH,
      { details: { email }, success: true }
    );

    return { access_token: tokenResult.access_token, user: profile };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
      this.userRepository
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Login: return JWT without org_roles (no access until membership exists)
    const tokenResult = await this.authService.login(user);
    const profile = this.toProfile(user);

    await this.auditService.logAction(
      user.id,
      AuditAction.LOGIN,
      AuditResource.AUTH,
      { details: { email: user.email }, success: true }
    );

    return { access_token: tokenResult.access_token, user: profile };
  }

  /** Refresh JWT to include current org_roles from memberships. */
  async refresh(userId: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const memberships = await this.membershipRepository.find({
      where: { userId },
      relations: ['organization'],
    });
    const orgRoles: Record<string, RoleType> = {};
    for (const m of memberships) {
      orgRoles[m.organizationId] = m.role;
    }

    const tokenResult = await this.authService.login(user, orgRoles);
    const profile = this.toProfile(user, orgRoles);
    return { access_token: tokenResult.access_token, user: profile };
  }

  private toProfile(
    user: User,
    orgRoles?: Record<string, RoleType>
  ): UserProfile {
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.globalRole ?? GLOBAL_ROLE_USER,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    profile.org_roles = orgRoles ?? {};
    return profile;
  }
}
