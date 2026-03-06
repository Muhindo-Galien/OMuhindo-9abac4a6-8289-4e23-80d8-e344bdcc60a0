import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationResponseDto,
  UserProfile,
  OrgMemberSummaryDto,
} from '@data';

export interface CreateOrganizationResponse {
  organization: OrganizationResponseDto;
  access_token: string;
  user: UserProfile;
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

  getOrganization(orgId: string): Observable<OrganizationResponseDto> {
    return this.http
      .get<OrganizationResponseDto>(`${this.API_URL}/organizations/${orgId}`)
      .pipe(catchError(this.handleError));
  }

  createOrganization(
    dto: CreateOrganizationDto
  ): Observable<CreateOrganizationResponse> {
    return this.http
      .post<CreateOrganizationResponse>(`${this.API_URL}/organizations`, dto)
      .pipe(catchError(this.handleError));
  }

  /** GET /organizations/:orgId/children – returns child orgs (spaces) of the given parent. */
  getChildOrganizations(
    parentOrgId: string
  ): Observable<OrganizationResponseDto[]> {
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

  /** Get org members (e.g. for task assignment). Optional search filters by name or email. */
  getMembers(
    orgId: string,
    search?: string
  ): Observable<OrgMemberSummaryDto[]> {
    const params: Record<string, string> = {};
    if (search?.trim()) params['search'] = search.trim();
    return this.http
      .get<OrgMemberSummaryDto[]>(
        `${this.API_URL}/organizations/${orgId}/members`,
        { params }
      )
      .pipe(catchError(this.handleError));
  }

  revokeMember(orgId: string, userId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/organizations/${orgId}/members/${userId}`)
      .pipe(catchError(this.handleError));
  }

  /** PUT :orgId/members/:userId/role – owner only; role must be admin or viewer. */
  updateMemberRole(
    orgId: string,
    userId: string,
    role: 'admin' | 'viewer'
  ): Observable<{ role: string }> {
    return this.http
      .put<{ role: string }>(
        `${this.API_URL}/organizations/${orgId}/members/${userId}/role`,
        { role }
      )
      .pipe(catchError(this.handleError));
  }

  updateOrganization(
    orgId: string,
    dto: UpdateOrganizationDto
  ): Observable<OrganizationResponseDto> {
    return this.http
      .put<OrganizationResponseDto>(
        `${this.API_URL}/organizations/${orgId}`,
        dto
      )
      .pipe(catchError(this.handleError));
  }

  deleteOrganization(orgId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/organizations/${orgId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const message =
      error.error?.message ||
      (error.status === 409
        ? 'An organization with this name may already exist.'
        : 'Failed to load or create organizations.');
    return throwError(() => ({ error: { message } }));
  };
}
