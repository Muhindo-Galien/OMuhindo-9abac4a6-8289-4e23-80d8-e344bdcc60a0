import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuditLogResponseDto, PaginatedResponse } from '@data';
import { environment } from '../../environments/environment';

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  userEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  
  private readonly API_URL = environment.apiUrl;

  /**
   * Get audit logs with optional filtering and pagination
   */
  async getAuditLogs(queryParams: AuditLogQueryParams = {}): Promise<PaginatedResponse<AuditLogResponseDto>> {
    console.log('AuditService: Getting audit logs with params:', queryParams);

    try {
      // Build HTTP params
      let params = new HttpParams();
      if (queryParams.page) params = params.set('page', queryParams.page.toString());
      if (queryParams.limit) params = params.set('limit', queryParams.limit.toString());
      if (queryParams.action) params = params.set('action', queryParams.action);
      if (queryParams.resource) params = params.set('resource', queryParams.resource);
      if (queryParams.userEmail) params = params.set('userEmail', queryParams.userEmail);

      const response = await this.http.get<PaginatedResponse<AuditLogResponseDto>>(
        `${this.API_URL}/audit-log`,
        { params }
      ).pipe(
        catchError(this.handleError)
      ).toPromise();

      if (!response) {
        throw new Error('No response received from server');
      }

      console.log('AuditService: Successfully fetched audit logs:', response.data.length);
      return response;
    } catch (error) {
      console.error('AuditService: Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics (if needed for future enhancement)
   */
  async getAuditStats(): Promise<any> {
    console.log('AuditService: Getting audit statistics');

    try {
      const response = await this.http.get<any>(
        `${this.API_URL}/audit-log/stats`
      ).pipe(
        catchError(this.handleError)
      ).toPromise();

      console.log('AuditService: Successfully fetched audit stats');
      return response;
    } catch (error) {
      console.error('AuditService: Error fetching audit stats:', error);
      throw error;
    }
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('AuditService HTTP Error:', error);

    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized access. Please log in again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to view audit logs.';
          break;
        case 404:
          errorMessage = 'Audit logs not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `Server returned code ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  };
} 