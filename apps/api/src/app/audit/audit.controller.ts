import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  BadRequestException,
} from '@nestjs/common';
import {
  AuditLogQueryDto,
  AuditLogResponseDto,
  PaginatedResponse,
  RoleType,
} from '@data';
import { JwtAuthGuard, CurrentUser, OrgRoles, OrgRoleGuard } from '@auth';
import { EnrichOrgRolesGuard } from '../organizations/enrich-org-roles.guard';
import { AuditService } from './audit.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, EnrichOrgRolesGuard, OrgRoleGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AuditController {
  constructor(private auditService: AuditService) {}

  /** Only admin/owner of the org can view logs. Requires query.organizationId. */
  @Get()
  @HttpCode(HttpStatus.OK)
  @OrgRoles(RoleType.ADMIN, RoleType.OWNER)
  async getAuditLogs(
    @Query() queryDto: AuditLogQueryDto,
    @CurrentUser() currentUser: { id: string }
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    if (!queryDto.organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.auditService.getAuditLogs(queryDto, currentUser);
  }

  /** Only admin/owner of the org can view stats. Requires query.organizationId. */
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @OrgRoles(RoleType.ADMIN, RoleType.OWNER)
  async getAuditStats(
    @Query('organizationId') organizationId: string,
    @Query('includeChildOrgs') includeChildOrgs?: string,
    @CurrentUser() _currentUser?: { id: string }
  ): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    actionBreakdown: Record<string, number>;
    resourceBreakdown: Record<string, number>;
  }> {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return this.auditService.getAuditStats(
      organizationId,
      includeChildOrgs === 'true'
    );
  }
}
