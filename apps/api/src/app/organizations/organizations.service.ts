import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Organization,
  OrganizationMember,
  User,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationResponseDto,
  RoleType,
  AuditAction,
  AuditResource,
  getRoleLevel,
} from '@data';
import { AuditService } from '../audit/audit.service';
import { OrganizationMembershipService } from './organization-membership.service';

/** Resolves effective role in an org: direct membership or inherited from parent (owner→children, admin→children, viewer→children). */
@Injectable()
export class EffectiveRoleService {
  constructor(
    @InjectRepository(OrganizationMember)
    private membershipRepo: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>
  ) {}

  async getEffectiveRole(
    userId: string,
    orgId: string
  ): Promise<RoleType | null> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) return null;

    const direct = await this.membershipRepo.findOne({
      where: { userId, organizationId: orgId },
    });
    if (direct) return direct.role;

    if (!org.parentId) return null;
    const parentRole = await this.getEffectiveRole(userId, org.parentId);
    return parentRole; // inherit: owner on parent → owner on child, etc.
  }

  /** Returns true if user has at least the required role level in the org (direct or inherited). */
  async hasMinimumRole(
    userId: string,
    orgId: string,
    required: RoleType
  ): Promise<boolean> {
    const effective = await this.getEffectiveRole(userId, orgId);
    if (!effective) return false;
    return getRoleLevel(effective) >= getRoleLevel(required);
  }
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private membershipRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
    private effectiveRoleService: EffectiveRoleService,
    private membershipService: OrganizationMembershipService
  ) {}

  async create(
    dto: CreateOrganizationDto,
    userId: string
  ): Promise<OrganizationResponseDto> {
    const org = this.orgRepository.create({
      name: dto.name,
      description: dto.description,
      parentId: dto.parentId,
    });
    const saved = await this.orgRepository.save(org);
    const membership = this.membershipRepository.create({
      userId,
      organizationId: saved.id,
      role: RoleType.OWNER,
    });
    await this.membershipRepository.save(membership);

    await this.auditService.logAction(
      userId,
      AuditAction.CREATE,
      AuditResource.ORGANIZATION,
      {
        resourceId: saved.id,
        organizationId: saved.id,
        details: { name: saved.name },
        success: true,
      }
    );

    const owner = await this.membershipService.getOwnerForOrg(saved.id);
    return this.toDto(saved, owner);
  }

  async findMyOrganizations(
    userId: string
  ): Promise<OrganizationResponseDto[]> {
    const memberships = await this.membershipRepository.find({
      where: { userId },
      relations: ['organization'],
    });
    const result: OrganizationResponseDto[] = [];
    for (const m of memberships) {
      const owner = await this.membershipService.getOwnerForOrg(
        m.organization.id
      );
      result.push(this.toDto(m.organization, owner));
    }
    return result;
  }

  async findOne(
    orgId: string,
    userId: string
  ): Promise<OrganizationResponseDto> {
    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      userId,
      orgId,
      RoleType.VIEWER
    );
    if (!hasAccess)
      throw new ForbiddenException('No access to this organization');

    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    const owner = await this.membershipService.getOwnerForOrg(orgId);
    return this.toDto(org, owner);
  }

  async update(
    orgId: string,
    dto: UpdateOrganizationDto,
    userId: string
  ): Promise<OrganizationResponseDto> {
    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      userId,
      orgId,
      RoleType.ADMIN
    );
    if (!hasAccess) throw new ForbiddenException('Insufficient role');

    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    if (dto.name !== undefined) org.name = dto.name;
    if (dto.description !== undefined) org.description = dto.description;
    const saved = await this.orgRepository.save(org);

    await this.auditService.logAction(
      userId,
      AuditAction.UPDATE,
      AuditResource.ORGANIZATION,
      { resourceId: orgId, organizationId: orgId, details: dto, success: true }
    );

    const owner = await this.membershipService.getOwnerForOrg(orgId);
    return this.toDto(saved, owner);
  }

  async delete(orgId: string, userId: string): Promise<void> {
    const effective = await this.effectiveRoleService.getEffectiveRole(
      userId,
      orgId
    );
    if (effective !== RoleType.OWNER)
      throw new ForbiddenException('Only owner can delete the organization');

    const org = await this.orgRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    // Delete all descendants first (children, then their children, then parent)
    await this.deleteDescendants(orgId);
    await this.orgRepository.remove(org);

    await this.auditService.logAction(
      userId,
      AuditAction.DELETE,
      AuditResource.ORGANIZATION,
      {
        resourceId: orgId,
        organizationId: orgId,
        details: { name: org.name },
        success: true,
      }
    );
  }

  async createChild(
    parentId: string,
    dto: CreateOrganizationDto,
    userId: string
  ): Promise<OrganizationResponseDto> {
    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      userId,
      parentId,
      RoleType.ADMIN
    );
    if (!hasAccess)
      throw new ForbiddenException('Insufficient role to create project');

    const org = this.orgRepository.create({
      name: dto.name,
      description: dto.description,
      parentId,
    });
    const saved = await this.orgRepository.save(org);

    await this.auditService.logAction(
      userId,
      AuditAction.CREATE,
      AuditResource.ORGANIZATION,
      {
        resourceId: saved.id,
        organizationId: saved.id,
        details: { name: saved.name, parentId },
        success: true,
      }
    );

    const owner = await this.membershipService.getOwnerForOrg(saved.id);
    return this.toDto(saved, owner);
  }

  async getMembers(orgId: string, userId: string) {
    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      userId,
      orgId,
      RoleType.VIEWER
    );
    if (!hasAccess)
      throw new ForbiddenException('No access to this organization');
    return this.membershipService.getEffectiveMembersForOrg(orgId);
  }

  async revokeMembership(
    orgId: string,
    targetUserId: string,
    currentUserId: string
  ): Promise<void> {
    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      currentUserId,
      orgId,
      RoleType.ADMIN
    );
    if (!hasAccess)
      throw new ForbiddenException('Only admin or owner can revoke membership');

    const membership = await this.membershipRepository.findOne({
      where: { organizationId: orgId, userId: targetUserId },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    const currentRole = await this.effectiveRoleService.getEffectiveRole(
      currentUserId,
      orgId
    );
    if (currentRole === RoleType.ADMIN && membership.role === RoleType.OWNER)
      throw new ForbiddenException('Admin cannot revoke owner');

    await this.membershipRepository.remove(membership);
    await this.auditService.logAction(
      currentUserId,
      AuditAction.MEMBERSHIP_REVOKED,
      AuditResource.MEMBERSHIP,
      {
        resourceId: membership.id,
        organizationId: orgId,
        details: { orgId, targetUserId },
        success: true,
      }
    );
  }

  private async deleteDescendants(parentId: string): Promise<void> {
    const children = await this.orgRepository.find({
      where: { parentId },
    });
    for (const child of children) {
      await this.deleteDescendants(child.id);
      await this.orgRepository.remove(child);
    }
  }

  private toDto(
    org: Organization,
    owner?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    } | null
  ): OrganizationResponseDto {
    const dto: OrganizationResponseDto = {
      id: org.id,
      name: org.name,
      description: org.description,
      parentId: org.parentId,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
    if (owner) {
      dto.owner = {
        id: owner.id,
        email: owner.email,
        firstName: owner.firstName,
        lastName: owner.lastName,
      };
    }
    return dto;
  }
}
