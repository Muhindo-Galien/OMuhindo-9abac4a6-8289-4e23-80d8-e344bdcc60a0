import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, User } from './auth.service';
import { environment } from '../../environments/environment';
import { AuthResponseDto, RoleType, mockUsers, mockTokens, mockAuthResponses, mockErrors } from '@data';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // Use shared fixtures
  const mockUser: User = mockUsers.admin;
  const mockAuthResponse: AuthResponseDto = mockAuthResponses.admin;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with no authenticated user when localStorage is empty', () => {
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalsy();
    });

    it('should initialize with user data from localStorage if valid token exists', () => {
      // Mock parseJwt to return valid payload
      jest.spyOn(service as any, 'parseJwt').mockReturnValue({
        sub: 'user-admin-456',
        email: 'admin@turbovets.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // Valid for 1 hour
      });
      
      // Setup localStorage with valid token and user
      localStorage.setItem('taskmanager_token', mockTokens.valid);
      localStorage.setItem('taskmanager_user', JSON.stringify(mockUser));
      
      // Test hasValidToken method directly
      expect(service['hasValidToken']()).toBeTruthy();
    });

    it('should clear session if token is expired on initialization', () => {
      // Mock parseJwt to return expired payload
      jest.spyOn(service as any, 'parseJwt').mockReturnValue({
        sub: 'user-admin-456',
        email: 'admin@turbovets.com',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });
      
      // Setup localStorage with expired token
      localStorage.setItem('taskmanager_token', mockTokens.expired);
      localStorage.setItem('taskmanager_user', JSON.stringify(mockUser));
      
      // Test hasValidToken method directly
      expect(service['hasValidToken']()).toBeFalsy();
      expect(localStorage.getItem('taskmanager_token')).toBeNull();
    });
  });

  describe('Login Functionality', () => {
    it('should successfully login with valid credentials', () => {
      const email = 'test@example.com';
      const password = 'password123';

      service.login(email, password).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.getCurrentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBeTruthy();
        expect(service.getToken()).toBe(mockAuthResponse.access_token);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush(mockAuthResponse);
    });

    it('should handle login error - invalid credentials', () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      service.login(email, password).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Invalid email or password');
          expect(service.getCurrentUser()).toBeNull();
          expect(service.isAuthenticated()).toBeFalsy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle login error - server error', () => {
      const email = 'test@example.com';
      const password = 'password123';

      service.login(email, password).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Internal server error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should store session data in localStorage on successful login', () => {
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(localStorage.getItem('taskmanager_token')).toBe(mockAuthResponse.access_token);
      expect(localStorage.getItem('taskmanager_user')).toBe(JSON.stringify(mockUser));
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      // Setup authenticated state
      localStorage.setItem('taskmanager_token', mockAuthResponse.access_token);
      localStorage.setItem('taskmanager_user', JSON.stringify(mockUser));
      service['currentUserSubject'].next(mockUser);
      service['isAuthenticatedSubject'].next(true);
    });

    it('should clear session data on logout', () => {
      expect(service.isAuthenticated()).toBeTruthy();
      expect(service.getCurrentUser()).toEqual(mockUser);

      service.logout();

      expect(service.isAuthenticated()).toBeFalsy();
      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('taskmanager_token')).toBeNull();
      expect(localStorage.getItem('taskmanager_user')).toBeNull();
    });

    it('should emit observables on logout', () => {
      let authState: boolean | undefined;
      let currentUser: User | null | undefined;

      service.isAuthenticated$.subscribe(state => authState = state);
      service.currentUser$.subscribe(user => currentUser = user);

      service.logout();

      expect(authState).toBeFalsy();
      expect(currentUser).toBeNull();
    });
  });

  describe('Token Management', () => {
    it('should get token from localStorage', () => {
      const token = 'test-token-123';
      localStorage.setItem('taskmanager_token', token);

      expect(service.getToken()).toBe(token);
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should validate token expiration correctly', () => {
      localStorage.setItem('taskmanager_user', JSON.stringify(mockUser));

      // Test valid token
      jest.spyOn(service as any, 'parseJwt').mockReturnValue({
        sub: 'user-admin-456',
        exp: Math.floor(Date.now() / 1000) + 3600 // Valid for 1 hour
      });
      localStorage.setItem('taskmanager_token', mockTokens.valid);
      expect(service['hasValidToken']()).toBeTruthy();

      // Test expired token
      jest.spyOn(service as any, 'parseJwt').mockReturnValue({
        sub: 'user-admin-456',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });
      localStorage.setItem('taskmanager_token', mockTokens.expired);
      expect(service['hasValidToken']()).toBeFalsy();
      expect(localStorage.getItem('taskmanager_token')).toBeNull(); // Should clear expired token
    });

    it('should handle malformed JWT token', () => {
      localStorage.setItem('taskmanager_token', mockTokens.malformed);
      localStorage.setItem('taskmanager_user', JSON.stringify(mockUser));

      // Mock parseJwt to throw error for malformed token
      jest.spyOn(service as any, 'parseJwt').mockImplementation(() => {
        throw new Error('Invalid token format');
      });

      expect(service['hasValidToken']()).toBeFalsy();
      expect(localStorage.getItem('taskmanager_token')).toBeNull(); // Should clear invalid token
    });
  });

  describe('Role-Based Access Control', () => {
    it('should correctly identify Owner role', () => {
      const ownerUser = { ...mockUser, role: RoleType.OWNER };
      service['currentUserSubject'].next(ownerUser);

      expect(service.isOwner()).toBeTruthy();
      expect(service.isAdmin()).toBeFalsy();
      expect(service.isViewer()).toBeFalsy();
      expect(service.hasAdminAccess()).toBeTruthy();
      expect(service.canAccessAuditLog()).toBeTruthy();
    });

    it('should correctly identify Admin role', () => {
      const adminUser = { ...mockUser, role: RoleType.ADMIN };
      service['currentUserSubject'].next(adminUser);

      expect(service.isOwner()).toBeFalsy();
      expect(service.isAdmin()).toBeTruthy();
      expect(service.isViewer()).toBeFalsy();
      expect(service.hasAdminAccess()).toBeTruthy();
      expect(service.canAccessAuditLog()).toBeTruthy();
    });

    it('should correctly identify Viewer role', () => {
      const viewerUser = { ...mockUser, role: RoleType.VIEWER };
      service['currentUserSubject'].next(viewerUser);

      expect(service.isOwner()).toBeFalsy();
      expect(service.isAdmin()).toBeFalsy();
      expect(service.isViewer()).toBeTruthy();
      expect(service.hasAdminAccess()).toBeFalsy();
      expect(service.canAccessAuditLog()).toBeFalsy();
    });

    it('should return false for role checks when no user is logged in', () => {
      service['currentUserSubject'].next(null);

      expect(service.isOwner()).toBeFalsy();
      expect(service.isAdmin()).toBeFalsy();
      expect(service.isViewer()).toBeFalsy();
      expect(service.hasAdminAccess()).toBeFalsy();
      expect(service.canAccessAuditLog()).toBeFalsy();
    });
  });

  describe('Session Management', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(service.isAuthenticated()).toBeFalsy();
      expect(service.getCurrentUser()).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle corrupted user data in localStorage', () => {
      localStorage.setItem('taskmanager_user', 'invalid-json');
      
      expect(service['getUserFromStorage']()).toBeNull();
    });

    it('should emit currentUser$ observable changes', () => {
      let emittedUser: User | null | undefined;
      service.currentUser$.subscribe(user => emittedUser = user);

      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(emittedUser).toEqual(mockUser);
    });

    it('should emit isAuthenticated$ observable changes', () => {
      let emittedState: boolean | undefined;
      service.isAuthenticated$.subscribe(state => emittedState = state);

      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(emittedState).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle different HTTP error status codes', () => {
      const testCases = [
        { status: 403, expected: 'Access forbidden' },
        { status: 404, expected: 'Service not found' },
        { status: 500, expected: 'Internal server error' }
      ];

      testCases.forEach(testCase => {
        service.login('test@example.com', 'password123').subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.error.message).toBe(testCase.expected);
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        req.flush({}, { status: testCase.status, statusText: 'Error' });
      });
    });

    it('should handle client-side errors', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      service.login('test@example.com', 'password123').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Network error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.error(new ErrorEvent('Network error', { message: 'Network error' }));
    });
  });
}); 