import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  Invitation,
  InvitationStatus,
  Organization,
  OrganizationMember,
  User,
  SendInvitationDto,
  RoleType,
  AuditAction,
  AuditResource,
} from '@data';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { EffectiveRoleService } from '../organizations/organizations.service';
import { MailService } from './mail.service';

const TOKEN_BYTES = 32;
const EXPIRY_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private membershipRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
    private effectiveRoleService: EffectiveRoleService,
    private mailService: MailService,
    private config: ConfigService
  ) {}

  async send(
    dto: SendInvitationDto,
    userId: string
  ): Promise<{ token: string; expiresAt: Date; emailSent: boolean }> {
    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      userId,
      dto.organizationId,
      RoleType.ADMIN
    );
    if (!hasAccess)
      throw new ForbiddenException('Only admin or owner can invite');

    const org = await this.orgRepository.findOne({
      where: { id: dto.organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      const existingMembership = await this.membershipRepository.findOne({
        where: {
          userId: existingUser.id,
          organizationId: dto.organizationId,
        },
      });
      if (existingMembership)
        throw new BadRequestException(
          'User is already a member of this organization'
        );
    }

    const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

    const invitation = this.invitationRepository.create({
      email: dto.email.toLowerCase(),
      organizationId: dto.organizationId,
      role: dto.role,
      token,
      status: InvitationStatus.PENDING,
      invitedById: userId,
      expiresAt,
    });
    await this.invitationRepository.save(invitation);

    await this.auditService.logAction(
      userId,
      AuditAction.INVITE_SENT,
      AuditResource.INVITATION,
      {
        resourceId: invitation.id,
        organizationId: dto.organizationId,
        details: {
          email: dto.email,
          orgId: dto.organizationId,
          role: dto.role,
        },
        success: true,
      }
    );

    const baseUrl =
      this.config.get<string>('APP_URL') || 'http://localhost:4200';
    const acceptUrl = `${baseUrl}/invite/accept?token=${token}`;
    const { sent: emailSent } = await this.mailService.sendInvitation({
      to: dto.email,
      orgName: org.name,
      role: dto.role,
      acceptUrl,
      expiresAt,
    });

    return { token, expiresAt, emailSent };
  }

  async validateToken(token: string): Promise<{
    email: string;
    organizationName: string;
    role: RoleType;
    organizationId: string;
  } | null> {
    const inv = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
      relations: ['organization'],
    });
    if (!inv || new Date() > inv.expiresAt) return null;
    return {
      email: inv.email,
      organizationName: inv.organization.name,
      role: inv.role,
      organizationId: inv.organizationId,
    };
  }

  async acceptWithToken(
    token: string,
    userId: string
  ): Promise<{ alreadyMember: boolean }> {
    const inv = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
      relations: ['organization'],
    });
    if (!inv) throw new BadRequestException('Invalid or expired invitation');
    if (new Date() > inv.expiresAt) {
      inv.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(inv);
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');
    if (user.email.toLowerCase() !== inv.email.toLowerCase())
      throw new ForbiddenException('Invitation was sent to a different email');

    const existing = await this.membershipRepository.findOne({
      where: { userId, organizationId: inv.organizationId },
    });
    if (existing) {
      inv.status = InvitationStatus.ACCEPTED;
      await this.invitationRepository.save(inv);
      return { alreadyMember: true };
    }

    const membership = this.membershipRepository.create({
      userId,
      organizationId: inv.organizationId,
      role: inv.role,
    });
    await this.membershipRepository.save(membership);

    inv.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(inv);

    await this.auditService.logAction(
      userId,
      AuditAction.INVITE_ACCEPTED,
      AuditResource.INVITATION,
      {
        resourceId: inv.id,
        organizationId: inv.organizationId,
        details: { email: inv.email, orgId: inv.organizationId },
        success: true,
      }
    );

    return { alreadyMember: false };
  }

  async listForOrg(orgId: string, userId: string): Promise<any[]> {
    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      userId,
      orgId,
      RoleType.ADMIN
    );
    if (!hasAccess) throw new ForbiddenException('No access');

    const list = await this.invitationRepository.find({
      where: { organizationId: orgId },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
    });
    return list.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      invitedBy: inv.invitedBy?.email,
      createdAt: inv.createdAt,
    }));
  }
}
