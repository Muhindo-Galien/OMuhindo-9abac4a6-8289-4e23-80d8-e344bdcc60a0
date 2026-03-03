import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authService: any;
  let router: any;
  let currentUserSubject: BehaviorSubject<any>;

  // Mock users for testing
  const mockUsers = {
    owner: {
      id: 'user-owner-123',
      email: 'owner@turbovets.com',
      firstName: 'Owner',
      lastName: 'User',
      role: 'owner',
      organizationId: 'org-123',
      organizationName: 'TurboVets Organization',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    admin: {
      id: 'user-admin-456',
      email: 'admin@turbovets.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      organizationId: 'org-123',
      organizationName: 'TurboVets Organization',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
    viewer: {
      id: 'user-viewer-789',
      email: 'viewer@turbovets.com',
      firstName: 'Viewer',
      lastName: 'User',
      role: 'viewer',
      organizationId: 'org-456',
      organizationName: 'Different Organization',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    },
  };

  const cloneFixture = <T>(fixture: T): T => {
    return JSON.parse(JSON.stringify(fixture));
  };

  const createMockState = (url: string): RouterStateSnapshot => ({
    url,
    root: {} as ActivatedRouteSnapshot
  });

  const createMockRoute = (roles?: string[]) => ({
    data: { roles: roles || [] }
  } as unknown as ActivatedRouteSnapshot);

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<any>(null);

    const authServiceSpy = {
      currentUser$: currentUserSubject.asObservable()
    };

    const routerSpy = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(RoleGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    currentUserSubject.complete();
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should be created', () => {
      expect(guard).toBeTruthy();
    });

    it('should implement CanActivate interface', () => {
      expect(guard.canActivate).toBeDefined();
      expect(typeof guard.canActivate).toBe('function');
    });
  });

  describe('No User Authentication', () => {
    beforeEach(() => {
      currentUserSubject.next(null);
    });

    it('should deny access and redirect to login when no user is present', (done) => {
      const mockRoute = createMockRoute(['owner']);
      const mockState = createMockState('/admin');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: Checking roles for route:', '/admin', 'Required roles:', ['owner']);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: No user found, redirecting to login');
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should deny access for routes without role requirements when no user', (done) => {
      const mockRoute = createMockRoute([]);
      const mockState = createMockState('/dashboard');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
    });
  });

  describe('Routes Without Role Requirements', () => {
    it('should allow access when no roles are required and user is present', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.viewer));
      const mockRoute = createMockRoute([]);
      const mockState = createMockState('/dashboard');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: No roles required, allowing access');
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should allow access when roles array is undefined and user is present', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.admin));
      const mockRoute = createMockRoute();
      const mockState = createMockState('/public');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: No roles required, allowing access');
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Owner Role Access Control', () => {
    beforeEach(() => {
      currentUserSubject.next(cloneFixture(mockUsers.owner));
    });

    it('should allow owner access to owner-only routes', (done) => {
      const mockRoute = createMockRoute(['owner']);
      const mockState = createMockState('/admin/users');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: Checking roles for route:', '/admin/users', 'Required roles:', ['owner']);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: User has required role, allowing access');
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should deny owner access to admin-only routes', (done) => {
      const mockRoute = createMockRoute(['admin']);
      const mockState = createMockState('/admin/dashboard');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should deny owner access to viewer-only routes', (done) => {
      const mockRoute = createMockRoute(['viewer']);
      const mockState = createMockState('/reports');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should allow owner access to multi-role routes', (done) => {
      const mockRoute = createMockRoute(['admin', 'owner']);
      const mockState = createMockState('/management');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Admin Role Access Control', () => {
    beforeEach(() => {
      currentUserSubject.next(cloneFixture(mockUsers.admin));
    });

    it('should allow admin access to admin-only routes', (done) => {
      const mockRoute = createMockRoute(['admin']);
      const mockState = createMockState('/admin/tasks');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: User has required role, allowing access');
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should deny admin access to viewer-only routes', (done) => {
      const mockRoute = createMockRoute(['viewer']);
      const mockState = createMockState('/reports');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should deny admin access to owner-only routes', (done) => {
      const mockRoute = createMockRoute(['owner']);
      const mockState = createMockState('/admin/users');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: User does not have required role. User role:', 'admin', 'Required:', ['owner']);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should allow admin access to multi-role routes that include admin', (done) => {
      const mockRoute = createMockRoute(['admin', 'viewer']);
      const mockState = createMockState('/shared-admin');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Viewer Role Access Control', () => {
    beforeEach(() => {
      currentUserSubject.next(cloneFixture(mockUsers.viewer));
    });

    it('should allow viewer access to viewer-only routes', (done) => {
      const mockRoute = createMockRoute(['viewer']);
      const mockState = createMockState('/reports');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: User has required role, allowing access');
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should deny viewer access to admin routes', (done) => {
      const mockRoute = createMockRoute(['admin']);
      const mockState = createMockState('/admin/tasks');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(console.log).toHaveBeenCalledWith('RoleGuard: User does not have required role. User role:', 'viewer', 'Required:', ['admin']);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should deny viewer access to owner routes', (done) => {
      const mockRoute = createMockRoute(['owner']);
      const mockState = createMockState('/admin/users');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should allow viewer access to multi-role routes that include viewer', (done) => {
      const mockRoute = createMockRoute(['admin', 'viewer']);
      const mockState = createMockState('/shared-reports');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should deny viewer access to admin-owner multi-role routes', (done) => {
      const mockRoute = createMockRoute(['admin', 'owner']);
      const mockState = createMockState('/high-level-admin');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });
  });

  describe('Multiple Role Scenarios', () => {
    it('should handle all three roles in requirements', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.admin));
      const mockRoute = createMockRoute(['owner', 'admin', 'viewer']);
      const mockState = createMockState('/multi-access');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle case-sensitive role checking', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.admin));
      const mockRoute = createMockRoute(['ADMIN']); // Different case
      const mockState = createMockState('/case-test');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });
  });

  describe('User Role Changes', () => {
    it('should handle user role change from viewer to admin', (done) => {
      const mockRoute = createMockRoute(['admin']);
      const mockState = createMockState('/admin/panel');

      // Start with viewer
      currentUserSubject.next(cloneFixture(mockUsers.viewer));
      
      const result1 = guard.canActivate(mockRoute, mockState);
      
      (result1 as any).subscribe((canActivate1: boolean) => {
        expect(canActivate1).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        
        // Change to admin
        currentUserSubject.next(cloneFixture(mockUsers.admin));
        
        const result2 = guard.canActivate(mockRoute, mockState);
        (result2 as any).subscribe((canActivate2: boolean) => {
          expect(canActivate2).toBe(true);
          done();
        });
      });
    });

    it('should handle user logout (null user)', (done) => {
      const mockRoute = createMockRoute(['viewer']);
      const mockState = createMockState('/reports');

      // Start with user
      currentUserSubject.next(cloneFixture(mockUsers.viewer));
      
      const result1 = guard.canActivate(mockRoute, mockState);
      
      (result1 as any).subscribe((canActivate1: boolean) => {
        expect(canActivate1).toBe(true);
        
        // User logs out
        currentUserSubject.next(null);
        
        const result2 = guard.canActivate(mockRoute, mockState);
        (result2 as any).subscribe((canActivate2: boolean) => {
          expect(canActivate2).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        });
      });
    });
  });

  describe('Logging and Console Output', () => {
    it('should log role checking information', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.owner));
      const mockRoute = createMockRoute(['owner', 'admin']);
      const mockState = createMockState('/admin/system');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('RoleGuard: Checking roles for route:', '/admin/system', 'Required roles:', ['owner', 'admin']);
        done();
      });
    });

    it('should log access denied information', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.viewer));
      const mockRoute = createMockRoute(['admin']);
      const mockState = createMockState('/admin/dashboard');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('RoleGuard: User does not have required role. User role:', 'viewer', 'Required:', ['admin']);
        done();
      });
    });

    it('should log no user found scenario', (done) => {
      currentUserSubject.next(null);
      const mockRoute = createMockRoute(['viewer']);
      const mockState = createMockState('/any-route');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('RoleGuard: No user found, redirecting to login');
        done();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined user role', (done) => {
      const userWithoutRole: any = { ...cloneFixture(mockUsers.viewer) };
      userWithoutRole.role = undefined;
      currentUserSubject.next(userWithoutRole);
      
      const mockRoute = createMockRoute(['viewer']);
      const mockState = createMockState('/test');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should handle empty roles array', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.admin));
      const mockRoute = createMockRoute([]);
      const mockState = createMockState('/no-roles-required');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle non-existent role requirements', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.admin));
      const mockRoute = createMockRoute(['super-admin', 'non-existent']);
      const mockState = createMockState('/invalid-roles');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });
  });

  describe('Route Data Integration', () => {
    it('should properly read roles from route data', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.owner));
      
      const routeWithComplexData = {
        data: {
          roles: ['owner'],
          title: 'Admin Panel',
          breadcrumb: 'Administration'
        }
      } as unknown as ActivatedRouteSnapshot;
      
      const mockState = createMockState('/complex-route');

      const result = guard.canActivate(routeWithComplexData, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle missing route data object', (done) => {
      currentUserSubject.next(cloneFixture(mockUsers.admin));
      
      const routeWithoutData = {
        data: {}
      } as unknown as ActivatedRouteSnapshot;
      
      const mockState = createMockState('/no-data');

      const result = guard.canActivate(routeWithoutData, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true); // No roles required
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });
}); 