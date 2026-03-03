import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

// Import from libs
import { AuditAction, AuditResource } from '@data';

// Local service
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;
    
    // Skip audit logging if no user (public endpoints)
    if (!user) {
      return next.handle();
    }

    const { method, originalUrl, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    
    // Map HTTP methods to audit actions
    const actionMap: Record<string, AuditAction> = {
      'POST': AuditAction.CREATE,
      'GET': AuditAction.READ,
      'PUT': AuditAction.UPDATE,
      'PATCH': AuditAction.UPDATE,
      'DELETE': AuditAction.DELETE,
    };

    // Map URL patterns to resources
    const getResourceFromUrl = (url: string): AuditResource => {
      if (url.includes('/tasks')) return AuditResource.TASK;
      if (url.includes('/auth')) return AuditResource.AUTH;
      if (url.includes('/audit-log')) return AuditResource.AUDIT_LOG;
      if (url.includes('/users')) return AuditResource.USER;
      if (url.includes('/organizations')) return AuditResource.ORGANIZATION;
      return AuditResource.TASK; // default
    };

    // Extract resource ID from URL if available
    const getResourceIdFromUrl = (url: string): string | undefined => {
      const uuidRegex = /\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i;
      const match = url.match(uuidRegex);
      return match ? match[1] : undefined;
    };

    const action = actionMap[method] || AuditAction.READ;
    const resource = getResourceFromUrl(originalUrl);
    const resourceId = getResourceIdFromUrl(originalUrl);

    // Prepare audit details
    const details = {
      method,
      url: originalUrl,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Log successful operation
    const logSuccess = (response: any) => {
      // Don't log GET requests for audit logs to avoid infinite loops
      if (method === 'GET' && resource === AuditResource.AUDIT_LOG) {
        return;
      }

      this.auditService.logAction(
        user.id,
        action,
        resource,
        {
          resourceId,
          details: {
            ...details,
            responseStatus: 'success',
            // Include relevant response data (without sensitive info)
            responseSize: JSON.stringify(response).length,
          },
          ipAddress: ip,
          userAgent,
          success: true,
        }
      ).catch(error => {
        console.error('Failed to log successful audit action:', error);
      });
    };

    // Log failed operation
    const logError = (error: any) => {
      // Don't log GET requests for audit logs to avoid infinite loops
      if (method === 'GET' && resource === AuditResource.AUDIT_LOG) {
        return;
      }

      this.auditService.logAction(
        user.id,
        action,
        resource,
        {
          resourceId,
          details: {
            ...details,
            responseStatus: 'error',
            errorType: error.constructor.name,
            statusCode: error.status || 500,
          },
          ipAddress: ip,
          userAgent,
          success: false,
          errorMessage: error.message || 'Unknown error',
        }
      ).catch(auditError => {
        console.error('Failed to log failed audit action:', auditError);
      });
    };

    return next.handle().pipe(
      tap(response => {
        // Log successful operations asynchronously
        setTimeout(() => logSuccess(response), 0);
      }),
      catchError(error => {
        // Log failed operations asynchronously
        setTimeout(() => logError(error), 0);
        throw error; // Re-throw the error
      })
    );
  }
} 