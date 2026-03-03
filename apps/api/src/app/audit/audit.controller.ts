import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor 
} from '@nestjs/common';

// Import from libs
import { 
  AuditLogQueryDto, 
  AuditLogResponseDto, 
  PaginatedResponse,
  RoleType 
} from '@data';
import { JwtAuthGuard, CurrentUser, CanViewAuditLog, Roles, RolesGuard } from '@auth';

// Local service
import { AuditService } from './audit.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all endpoints with JWT authentication and RBAC
@UseInterceptors(ClassSerializerInterceptor)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.ADMIN) // Only Admin and Owner can view audit logs
  @CanViewAuditLog() // Additional permission check
  async getAuditLogs(
    @Query() queryDto: AuditLogQueryDto,
    @CurrentUser() currentUser: any
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    console.log('=== GET AUDIT LOGS ENDPOINT START ===');
    console.log('Query parameters:', queryDto);
    console.log('Current user:', currentUser.id, currentUser.email, currentUser.role);

    try {
      const result = await this.auditService.getAuditLogs(queryDto, currentUser);
      
      console.log('=== GET AUDIT LOGS ENDPOINT SUCCESS ===');
      console.log(`Returning ${result.data.length} audit logs`);
      
      return result;
    } catch (error) {
      console.log('=== GET AUDIT LOGS ENDPOINT ERROR ===');
      console.log('Error:', error.message);
      throw error;
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @CanViewAuditLog() // Only Owner/Admin can view audit stats
  async getAuditStats(
    @CurrentUser() currentUser: any
  ): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    actionBreakdown: Record<string, number>;
    resourceBreakdown: Record<string, number>;
  }> {
    console.log('=== GET AUDIT STATS ENDPOINT START ===');
    console.log('Current user:', currentUser.id, currentUser.email, currentUser.role);

    try {
      const stats = await this.auditService.getAuditStats(currentUser);
      
      console.log('=== GET AUDIT STATS ENDPOINT SUCCESS ===');
      console.log('Stats:', stats);
      
      return stats;
    } catch (error) {
      console.log('=== GET AUDIT STATS ENDPOINT ERROR ===');
      console.log('Error:', error.message);
      throw error;
    }
  }
} 