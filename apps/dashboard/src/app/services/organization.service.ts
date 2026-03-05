import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
} from '@data';

export interface CreateOrganizationResponse {
  organization: OrganizationResponseDto;
  access_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  getMyOrganizations(): Observable<OrganizationResponseDto[]> {
    return this.http
      .get<OrganizationResponseDto[]>(`${this.API_URL}/organizations`)
      .pipe(catchError(this.handleError));
  }

  createOrganization(
    dto: CreateOrganizationDto
  ): Observable<CreateOrganizationResponse> {
    return this.http
      .post<CreateOrganizationResponse>(
        `${this.API_URL}/organizations`,
        dto
      )
      .pipe(catchError(this.handleError));
  }

  /** GET /organizations/:orgId/children – returns child orgs (spaces) of the given parent. */
  getChildOrganizations(parentOrgId: string): Observable<OrganizationResponseDto[]> {
    return this.http
      .get<OrganizationResponseDto[]>(
        `${this.API_URL}/organizations/${parentOrgId}/children`
      )
      .pipe(catchError(this.handleError));
  }

  /** Get spaces (child orgs) for a parent org – uses GET /organizations/:orgId/children. */
  getSpaces(parentOrgId: string): Observable<OrganizationResponseDto[]> {
    return this.getChildOrganizations(parentOrgId);
  }

  createChildOrganization(
    parentOrgId: string,
    dto: CreateOrganizationDto
  ): Observable<OrganizationResponseDto> {
    return this.http
      .post<OrganizationResponseDto>(
        `${this.API_URL}/organizations/${parentOrgId}/children`,
        dto
      )
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const message =
      error.error?.message ||
      (error.status === 409 ? 'An organization with this name may already exist.' : 'Failed to load or create organizations.');
    return throwError(() => ({ error: { message } }));
  };
}
