import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponseDto, LoginDto, UserProfile, RoleType } from '@data';

export interface User extends UserProfile {
  organizationName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'taskmanager_token';
  private readonly USER_KEY = 'taskmanager_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Check if token is expired on service initialization
    this.validateTokenOnInit();
  }

  login(email: string, password: string): Observable<AuthResponseDto> {
    const loginData: LoginDto = { email, password };

    return this.http.post<AuthResponseDto>(`${this.API_URL}/auth/login`, loginData).pipe(
      tap(response => {
        console.log('Login successful, storing token and user data');
        this.setSession(response);
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    console.log('Logging out user');
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(authResult: AuthResponseDto): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, authResult.access_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
      
      this.currentUserSubject.next(authResult.user);
      this.isAuthenticatedSubject.next(true);
      
      console.log('Session established for user:', authResult.user.email);
    } catch (error) {
      console.error('Error setting session:', error);
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private getUserFromStorage(): User | null {
    try {
      const userJson = localStorage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    const user = this.getUserFromStorage();
    
    if (!token || !user) {
      return false;
    }

    // Basic token validation (check if it's not expired)
    try {
      const payload = this.parseJwt(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired');
        this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      this.clearSession();
      return false;
    }
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return {};
    }
  }

  private validateTokenOnInit(): void {
    if (!this.hasValidToken()) {
      this.clearSession();
    }
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('Auth service error:', error);
    
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid email or password';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          break;
        case 404:
          errorMessage = 'Service not found';
          break;
        case 500:
          errorMessage = 'Internal server error';
          break;
        default:
          errorMessage = error.error?.message || `Server error (${error.status})`;
      }
    }
    
    return throwError(() => ({ error: { message: errorMessage } }));
  };

  // Helper methods for role checking
  isOwner(): boolean {
    const user = this.getCurrentUser();
    return user?.role === RoleType.OWNER;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === RoleType.ADMIN;
  }

  isViewer(): boolean {
    const user = this.getCurrentUser();
    return user?.role === RoleType.VIEWER;
  }

  hasAdminAccess(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  canAccessAuditLog(): boolean {
    return this.isOwner() || this.isAdmin();
  }
} 