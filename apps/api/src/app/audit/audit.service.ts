import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between } from 'typeorm';

// Import from libs
import { 
  AuditLog, 
  AuditAction, 
  AuditResource,
  CreateAuditLogDto, 
  AuditLogResponseDto, 
  AuditLogQueryDto,
  PaginatedResponse 
} from '@data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * Log an action to the audit trail
   */
  async logAction(
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    options: {
      resourceId?: string;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<AuditLog> {
    console.log('=== AUDIT LOG START ===');
    console.log('User ID:', userId);
    console.log('Action:', action);
    console.log('Resource:', resource);
    console.log('Options:', options);

    try {
      const auditLogData: CreateAuditLogDto = {
        userId,
        action,
        resource,
        resourceId: options.resourceId,
        details: options.details,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        success: options.success ?? true,
        errorMessage: options.errorMessage,
      };

      const auditLog = this.auditLogRepository.create(auditLogData);
      const savedLog = await this.auditLogRepository.save(auditLog);

      // Console logging for immediate visibility
      const logMessage = `[AUDIT] ${action.toUpperCase()} ${resource.toUpperCase()}` + 
        (options.resourceId ? ` (ID: ${options.resourceId})` : '') +
        ` by User ${userId}` +
        (options.success === false ? ' - FAILED' : ' - SUCCESS');
      
      if (options.success === false) {
        console.log(logMessage + (options.errorMessage ? `: ${options.errorMessage}` : ''));
      } else {
        console.log(logMessage);
      }

      console.log('Audit log saved successfully:', savedLog.id);
      console.log('=== AUDIT LOG END ===');

      return savedLog;
    } catch (error) {
      console.log('=== AUDIT LOG ERROR ===');
      console.error('Error saving audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    queryDto: AuditLogQueryDto,
    currentUser: any
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    console.log('=== GET AUDIT LOGS START ===');
    console.log('Query parameters:', queryDto);
    console.log('Current user:', currentUser.id, currentUser.email, currentUser.role);

    try {
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'timestamp', 
        sortOrder = 'DESC',
        userId,
        action,
        resource,
        resourceId,
        startDate,
        endDate,
        success,
        search
      } = queryDto;

      // Build query conditions
      const where: any = {};

      // Apply filters
      if (userId) {
        where.userId = userId;
      }

      if (action) {
        where.action = action;
      }

      if (resource) {
        where.resource = resource;
      }

      if (resourceId) {
        where.resourceId = resourceId;
      }

      if (success !== undefined) {
        where.success = success;
      }

      // Date range filter
      if (startDate || endDate) {
        where.timestamp = Between(
          startDate ? new Date(startDate) : new Date('1970-01-01'),
          endDate ? new Date(endDate) : new Date()
        );
      }

      // Search functionality (search in error messages and details)
      if (search) {
        // Note: For more complex search, you might want to use raw SQL
        where.errorMessage = Like(`%${search}%`);
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Build find options
      const findOptions: FindManyOptions<AuditLog> = {
        where,
        relations: ['user'],
        skip,
        take: limit,
        order: { [sortBy]: sortOrder },
      };

      console.log('Executing query with options:', {
        where,
        skip,
        take: limit,
        order: { [sortBy]: sortOrder }
      });

      const [auditLogs, total] = await this.auditLogRepository.findAndCount(findOptions);

      console.log(`Found ${auditLogs.length} audit logs out of ${total} total`);

      // Map to response DTOs
      const data: AuditLogResponseDto[] = auditLogs.map(log => ({
        id: log.id,
        userId: log.userId,
        userEmail: log.user?.email || 'Unknown',
        userFullName: log.user?.fullName || 'Unknown User',
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

      const result: PaginatedResponse<AuditLogResponseDto> = {
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

      console.log('=== GET AUDIT LOGS SUCCESS ===');
      return result;
    } catch (error) {
      console.log('=== GET AUDIT LOGS ERROR ===');
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics (for dashboard/reporting)
   */
  async getAuditStats(currentUser: any): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    actionBreakdown: Record<string, number>;
    resourceBreakdown: Record<string, number>;
  }> {
    console.log('=== GET AUDIT STATS START ===');

    try {
      const [
        totalLogs,
        successfulActions,
        failedActions,
        actionStats,
        resourceStats
      ] = await Promise.all([
        this.auditLogRepository.count(),
        this.auditLogRepository.count({ where: { success: true } }),
        this.auditLogRepository.count({ where: { success: false } }),
        this.auditLogRepository
          .createQueryBuilder('audit')
          .select('audit.action', 'action')
          .addSelect('COUNT(*)', 'count')
          .groupBy('audit.action')
          .getRawMany(),
        this.auditLogRepository
          .createQueryBuilder('audit')
          .select('audit.resource', 'resource')
          .addSelect('COUNT(*)', 'count')
          .groupBy('audit.resource')
          .getRawMany()
      ]);

      const actionBreakdown = actionStats.reduce((acc, stat) => {
        acc[stat.action] = parseInt(stat.count);
        return acc;
      }, {});

      const resourceBreakdown = resourceStats.reduce((acc, stat) => {
        acc[stat.resource] = parseInt(stat.count);
        return acc;
      }, {});

      const stats = {
        totalLogs,
        successfulActions,
        failedActions,
        actionBreakdown,
        resourceBreakdown,
      };

      console.log('Audit statistics:', stats);
      console.log('=== GET AUDIT STATS SUCCESS ===');

      return stats;
    } catch (error) {
      console.log('=== GET AUDIT STATS ERROR ===');
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  }
} 