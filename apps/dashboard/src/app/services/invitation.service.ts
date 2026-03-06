import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SendInvitationDto } from '@data';

export interface InvitationListItem {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  invitedBy?: string;
  createdAt: string;
}

/** Result of validating an invitation token (public endpoint). */
export interface InvitationValidateResult {
  email: string;
  organizationName: string;
  role: string;
  organizationId: string;
  userExists: boolean;
}

/** Pending invitation for the current user (from GET /invitations/me). */
export interface MyPendingInvitation {
  id: string;
  token: string;
  organizationId: string;
  organizationName: string;
  role: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  /** Validate invitation token (no auth). Returns null if invalid or expired. */
  validateToken(token: string): Observable<InvitationValidateResult | null> {
    if (!token?.trim()) {
      return throwError(() => ({ error: { message: 'Invalid invitation link' } }));
    }
    return this.http
      .get<InvitationValidateResult | null>(
        `${this.API_URL}/invitations/validate`,
        { params: { token: token.trim() } }
      )
      .pipe(catchError(this.handleError));
  }

  /** Accept invitation (requires auth). Call after login for existing users. */
  acceptInvite(token: string): Observable<{ alreadyMember: boolean }> {
    return this.http
      .post<{ alreadyMember: boolean }>(`${this.API_URL}/invitations/accept`, {
        token: token?.trim() ?? '',
      })
      .pipe(catchError(this.handleError));
  }

  /** Pending invitations sent to the current user's email (for org list page). */
  getMyPendingInvitations(): Observable<MyPendingInvitation[]> {
    return this.http
      .get<MyPendingInvitation[]>(`${this.API_URL}/invitations/me`)
      .pipe(catchError(this.handleError));
  }

  send(dto: SendInvitationDto): Observable<{ token: string; expiresAt: string; emailSent: boolean }> {
    return this.http
      .post<{ token: string; expiresAt: string; emailSent: boolean }>(
        `${this.API_URL}/invitations/send`,
        dto
      )
      .pipe(catchError(this.handleError));
  }

  listForOrg(orgId: string): Observable<InvitationListItem[]> {
    return this.http
      .get<InvitationListItem[]>(`${this.API_URL}/invitations/org/${orgId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const message =
      error.error?.message ?? 'An error occurred';
    return throwError(() => ({ error: { message } }));
  };
}
