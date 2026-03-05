import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  MembershipSummary,
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

    const effectiveOrgRoles = await this.getEffectiveOrgRolesForUser(savedUser.id);
    const memberships = await this.getMembershipsForUser(savedUser.id);
    const tokenResult = await this.authService.login(savedUser);
    const profile = this.toProfile(savedUser, effectiveOrgRoles, memberships);

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

    const effectiveOrgRoles = await this.getEffectiveOrgRolesForUser(user.id);
    const memberships = await this.getMembershipsForUser(user.id);
    const tokenResult = await this.authService.login(user);
    const profile = this.toProfile(user, effectiveOrgRoles, memberships);

    await this.auditService.logAction(
      user.id,
      AuditAction.LOGIN,
      AuditResource.AUTH,
      { details: { email: user.email }, success: true }
    );

    return { access_token: tokenResult.access_token, user: profile };
  }

  /** Refresh: new JWT (minimal, no org_roles); response user has org_roles + memberships from DB. */
  async refresh(userId: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const effectiveOrgRoles = await this.getEffectiveOrgRolesForUser(userId);
    const memberships = await this.getMembershipsForUser(userId);
    const tokenResult = await this.authService.login(user);
    const profile = this.toProfile(user, effectiveOrgRoles, memberships);
    return { access_token: tokenResult.access_token, user: profile };
  }

  private async getEffectiveOrgRolesForUser(
    userId: string
  ): Promise<Record<string, RoleType>> {
    const list = await this.membershipRepository.find({
      where: { userId },
      select: ['organizationId', 'role'],
    });
    const direct: Record<string, RoleType> = {};
    for (const m of list) direct[m.organizationId] = m.role as RoleType;
    const parentIds = Object.keys(direct);
    if (parentIds.length === 0) return direct;

    const children = await this.organizationRepository.find({
      where: { parentId: In(parentIds) },
      select: ['id', 'parentId'],
    });
    const out = { ...direct };
    for (const child of children) {
      if (child.parentId && !(child.id in out)) {
        out[child.id] = direct[child.parentId];
      }
    }
    return out;
  }

  private async getMembershipsForUser(
    userId: string
  ): Promise<MembershipSummary[]> {
    const list = await this.membershipRepository.find({
      where: { userId },
      relations: ['organization'],
    });
    return list.map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization?.name,
      role: m.role as RoleType,
    }));
  }

  private toProfile(
    user: User,
    orgRoles?: Record<string, RoleType>,
    memberships?: MembershipSummary[]
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
    profile.memberships = memberships ?? [];
    return profile;
  }
}
