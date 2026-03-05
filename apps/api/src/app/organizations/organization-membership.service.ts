import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember, User, RoleType, Organization } from '@data';

export interface OrgMemberSummary {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleType;
  joinedAt: Date;
}

/** Member with source: direct (row in this org) or inherited (from parent org). */
export interface EffectiveOrgMemberSummary extends OrgMemberSummary {
  source: 'direct' | 'inherited';
}

@Injectable()
export class OrganizationMembershipService {
  constructor(
    @InjectRepository(OrganizationMember)
    private membershipRepo: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>
  ) {}

  /** Get the owner (user with owner role) for an org. Used for org detail response. */
  async getOwnerForOrg(orgId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null> {
    const ownerMembership = await this.membershipRepo.findOne({
      where: { organizationId: orgId, role: RoleType.OWNER },
      relations: ['user'],
    });
    if (!ownerMembership?.user) return null;
    const u = ownerMembership.user;
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    };
  }

  /** Get direct members of an org only (no inheritance). */
  async getMembersForOrg(orgId: string): Promise<OrgMemberSummary[]> {
    const memberships = await this.membershipRepo.find({
      where: { organizationId: orgId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    return memberships.map(m => ({
      userId: m.userId,
      email: m.user?.email ?? '',
      firstName: m.user?.firstName ?? '',
      lastName: m.user?.lastName ?? '',
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Get effective members: direct members of this org plus members inherited from the parent (when this org is a child).
   * Direct role overrides inherited; each user appears once with their effective role and source.
   */
  async getEffectiveMembersForOrg(
    orgId: string
  ): Promise<EffectiveOrgMemberSummary[]> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) return [];

    const directMemberships = await this.membershipRepo.find({
      where: { organizationId: orgId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
    const byUserId = new Map<string, EffectiveOrgMemberSummary>();
    for (const m of directMemberships) {
      byUserId.set(m.userId, {
        userId: m.userId,
        email: m.user?.email ?? '',
        firstName: m.user?.firstName ?? '',
        lastName: m.user?.lastName ?? '',
        role: m.role,
        joinedAt: m.createdAt,
        source: 'direct',
      });
    }

    if (org.parentId) {
      const parentMemberships = await this.membershipRepo.find({
        where: { organizationId: org.parentId },
        relations: ['user'],
      });
      for (const m of parentMemberships) {
        if (!byUserId.has(m.userId)) {
          byUserId.set(m.userId, {
            userId: m.userId,
            email: m.user?.email ?? '',
            firstName: m.user?.firstName ?? '',
            lastName: m.user?.lastName ?? '',
            role: m.role,
            joinedAt: m.createdAt,
            source: 'inherited',
          });
        }
      }
    }

    return Array.from(byUserId.values());
  }

  /** Get a user's direct role in an org (no inheritance). */
  async getDirectRole(userId: string, orgId: string): Promise<RoleType | null> {
    const m = await this.membershipRepo.findOne({
      where: { userId, organizationId: orgId },
    });
    return m?.role ?? null;
  }

  /** Get all org IDs and roles for a user (for enriching request.user.org_roles from DB). */
  async getOrgRolesForUser(userId: string): Promise<Record<string, RoleType>> {
    const list = await this.membershipRepo.find({
      where: { userId },
    });
    const out: Record<string, RoleType> = {};
    for (const m of list) out[m.organizationId] = m.role;
    return out;
  }
}
