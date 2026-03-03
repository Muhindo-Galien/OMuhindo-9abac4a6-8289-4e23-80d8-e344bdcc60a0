import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsObject,
  IsIP,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AuditAction, AuditResource } from '../models/audit-log.model';

// DTO for creating audit log entries (internal use)
export class CreateAuditLogDto {
  @IsUUID()
  userId: string;

  @IsEnum(AuditAction)
  action: AuditAction;

  @IsEnum(AuditResource)
  resource: AuditResource;

  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsBoolean()
  success?: boolean = true;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

// DTO for audit log API responses
export class AuditLogResponseDto {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  actionDescription: string;
}

// DTO for querying audit logs with filters and pagination
export class AuditLogQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsEnum(AuditResource)
  resource?: AuditResource;

  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  success?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
