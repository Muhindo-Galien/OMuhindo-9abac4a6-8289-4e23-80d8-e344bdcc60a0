import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between, In } from 'typeorm';

import {
  AuditLog,
  AuditAction,
  AuditResource,
  CreateAuditLogDto,
  AuditLogResponseDto,
  AuditLogQueryDto,
  PaginatedResponse,
  Organization,
} from '@data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>
  ) {}

  /**
   * Log an action to the audit trail. Pass organizationId for org-scoped resources (task, organization, invitation, membership).
   */
  async logAction(
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    options: {
      resourceId?: string;
      organizationId?: string | null;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<AuditLog> {
    try {
      const auditLogData: CreateAuditLogDto = {
        userId,
        action,
        resource,
        resourceId: options.resourceId,
        organizationId: options.organizationId ?? undefined,
        details: options.details,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        success: options.success ?? true,
        errorMessage: options.errorMessage,
      };

      const auditLog = this.auditLogRepository.create(auditLogData);
      const savedLog = await this.auditLogRepository.save(auditLog);
      return savedLog;
    } catch (error) {
      console.error('Error saving audit log:', error);
      throw error;
    }
  }

  /** Resolve org id and all descendant org ids (for includeChildOrgs). */
  private async getOrgAndDescendantIds(orgId: string): Promise<string[]> {
    const ids: string[] = [orgId];
    const children = await this.orgRepository.find({ where: { parentId: orgId } });
    for (const c of children) {
      ids.push(...(await this.getOrgAndDescendantIds(c.id)));
    }
    return ids;
  }

  /**
   * Get audit logs with filtering and pagination. Caller must be admin/owner of organizationId (enforced by controller).
   * organizationId required: only logs for that org (and optionally its children when includeChildOrgs) are returned.
   */
  async getAuditLogs(
    queryDto: AuditLogQueryDto,
    currentUser: { id: string }
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'timestamp',
      sortOrder = 'DESC',
      organizationId,
      includeChildOrgs,
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      success,
      search,
    } = queryDto;

    const where: any = {};

    if (organizationId) {
      if (includeChildOrgs) {
        const orgIds = await this.getOrgAndDescendantIds(organizationId);
        where.organizationId = In(orgIds);
      } else {
        where.organizationId = organizationId;
      }
    }

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (success !== undefined) where.success = success;

    if (startDate || endDate) {
      where.timestamp = Between(
        startDate ? new Date(startDate) : new Date('1970-01-01'),
        endDate ? new Date(endDate) : new Date()
      );
    }

    if (search) where.errorMessage = Like(`%${search}%`);

    const skip = (page - 1) * limit;
    const findOptions: FindManyOptions<AuditLog> = {
      where,
      relations: ['user'],
      skip,
      take: limit,
      order: { [sortBy]: sortOrder },
    };

    const [auditLogs, total] = await this.auditLogRepository.findAndCount(findOptions);

    const data: AuditLogResponseDto[] = auditLogs.map(log => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email || 'Unknown',
      userFullName: log.user?.fullName || 'Unknown User',
      organizationId: log.organizationId ?? undefined,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp,
      success: log.success,
      errorMessage: log.errorMessage,
      actionDescription: log.actionDescription,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get audit statistics for an org. Caller must be admin/owner of organizationId (enforced by controller).
   */
  async getAuditStats(
    organizationId: string,
    includeChildOrgs?: boolean
  ): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    actionBreakdown: Record<string, number>;
    resourceBreakdown: Record<string, number>;
  }> {
    const orgIds = includeChildOrgs
      ? await this.getOrgAndDescendantIds(organizationId)
      : [organizationId];
    const where = orgIds.length === 1
      ? { organizationId: orgIds[0] }
      : { organizationId: In(orgIds) };

    const [totalLogs, successfulActions, failedActions, actionStatsRes, resourceStatsRes] = await Promise.all([
      this.auditLogRepository.count({ where }),
      this.auditLogRepository.count({ where: { ...where, success: true } }),
      this.auditLogRepository.count({ where: { ...where, success: false } }),
      this.auditLogRepository
        .createQueryBuilder('audit')
        .where(orgIds.length === 1 ? 'audit.organizationId = :orgId' : 'audit.organizationId IN (:...orgIds)', orgIds.length === 1 ? { orgId: orgIds[0] } : { orgIds })
        .select('audit.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.action')
        .getRawMany(),
      this.auditLogRepository
        .createQueryBuilder('audit')
        .where(orgIds.length === 1 ? 'audit.organizationId = :orgId' : 'audit.organizationId IN (:...orgIds)', orgIds.length === 1 ? { orgId: orgIds[0] } : { orgIds })
        .select('audit.resource', 'resource')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.resource')
        .getRawMany(),
    ]);

    const actionBreakdown = (actionStatsRes || []).reduce((acc: Record<string, number>, stat: any) => {
      acc[stat.action] = parseInt(stat.count, 10);
      return acc;
    }, {});

    const resourceBreakdown = (resourceStatsRes || []).reduce((acc: Record<string, number>, stat: any) => {
      acc[stat.resource] = parseInt(stat.count, 10);
      return acc;
    }, {});

    return {
      totalLogs,
      successfulActions,
      failedActions,
      actionBreakdown,
      resourceBreakdown,
    };
  }
}
