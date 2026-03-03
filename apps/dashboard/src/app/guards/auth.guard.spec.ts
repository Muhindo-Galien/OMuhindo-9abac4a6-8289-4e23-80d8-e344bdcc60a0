import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: any;
  let router: any;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  const createMockState = (url: string): RouterStateSnapshot => ({
    url,
    root: {} as ActivatedRouteSnapshot
  });

  const mockRoute = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    const authServiceSpy = {
      isAuthenticated$: isAuthenticatedSubject.asObservable()
    };

    const routerSpy = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    isAuthenticatedSubject.complete();
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

  describe('Route Protection - Authenticated User', () => {
    beforeEach(() => {
      isAuthenticatedSubject.next(true);
    });

    it('should allow access to protected route when user is authenticated', (done) => {
      const mockState = createMockState('/dashboard');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: Checking authentication for route:', '/dashboard');
        expect(console.log).toHaveBeenCalledWith('AuthGuard: User authenticated, allowing access');
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should allow access to tasks route when authenticated', (done) => {
      const mockState = createMockState('/tasks');
      
      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should allow access to audit logs route when authenticated', (done) => {
      const mockState = createMockState('/audit-logs');
      
      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Route Protection - Unauthenticated User', () => {
    beforeEach(() => {
      isAuthenticatedSubject.next(false);
    });

    it('should deny access and redirect to login when user is not authenticated', (done) => {
      const mockState = createMockState('/dashboard');
      jest.spyOn(console, 'log');

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: Checking authentication for route:', '/dashboard');
        expect(console.log).toHaveBeenCalledWith('AuthGuard: User not authenticated, redirecting to login');
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/dashboard' }
        });
        done();
      });
    });

    it('should redirect to login with correct returnUrl for different routes', (done) => {
      const routes = ['/tasks', '/audit-logs', '/profile', '/settings'];
      let completedTests = 0;

      routes.forEach(routeUrl => {
        const mockState = createMockState(routeUrl);
        
        const result = guard.canActivate(mockRoute, mockState);
        
        (result as any).subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: routeUrl }
          });
          
          completedTests++;
          if (completedTests === routes.length) {
            done();
          }
        });
      });
    });

    it('should handle root route redirect correctly', (done) => {
      const mockState = createMockState('/');
      
      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/' }
        });
        done();
      });
    });
  });

  describe('Authentication State Changes', () => {
    it('should handle authentication state change from false to true', (done) => {
      const mockState = createMockState('/dashboard');
      
      // Start with unauthenticated
      isAuthenticatedSubject.next(false);
      
      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/dashboard' }
        });
        
        // Change to authenticated
        isAuthenticatedSubject.next(true);
        
        const secondResult = guard.canActivate(mockRoute, mockState);
        (secondResult as any).subscribe((secondCanActivate: boolean) => {
          expect(secondCanActivate).toBe(true);
          done();
        });
      });
    });

    it('should handle authentication state change from true to false', (done) => {
      const mockState = createMockState('/dashboard');
      
      // Start with authenticated
      isAuthenticatedSubject.next(true);
      
      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
        
        // Change to unauthenticated
        isAuthenticatedSubject.next(false);
        
        const secondResult = guard.canActivate(mockRoute, mockState);
        (secondResult as any).subscribe((secondCanActivate: boolean) => {
          expect(secondCanActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login'], {
            queryParams: { returnUrl: '/dashboard' }
          });
          done();
        });
      });
    });
  });

  describe('Logging and Console Output', () => {
    it('should log authentication check for any route', (done) => {
      const mockState = createMockState('/some-route');
      jest.spyOn(console, 'log');
      isAuthenticatedSubject.next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('AuthGuard: Checking authentication for route:', '/some-route');
        done();
      });
    });

    it('should log successful authentication', (done) => {
      const mockState = createMockState('/dashboard');
      jest.spyOn(console, 'log');
      isAuthenticatedSubject.next(true);

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('AuthGuard: User authenticated, allowing access');
        done();
      });
    });

    it('should log failed authentication and redirect', (done) => {
      const mockState = createMockState('/dashboard');
      jest.spyOn(console, 'log');
      isAuthenticatedSubject.next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe(() => {
        expect(console.log).toHaveBeenCalledWith('AuthGuard: User not authenticated, redirecting to login');
        done();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty route URL', (done) => {
      const mockState = createMockState('');
      isAuthenticatedSubject.next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '' }
        });
        done();
      });
    });

    it('should handle routes with query parameters', (done) => {
      const mockState = createMockState('/dashboard?tab=tasks&filter=active');
      isAuthenticatedSubject.next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/dashboard?tab=tasks&filter=active' }
        });
        done();
      });
    });

    it('should handle routes with fragments', (done) => {
      const mockState = createMockState('/dashboard#section1');
      isAuthenticatedSubject.next(false);

      const result = guard.canActivate(mockRoute, mockState);
      
      (result as any).subscribe((canActivate: boolean) => {
        expect(canActivate).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: '/dashboard#section1' }
        });
        done();
      });
    });
  });

  describe('Multiple Simultaneous Checks', () => {
    it('should handle multiple simultaneous route checks correctly', (done) => {
      const routes = ['/dashboard', '/tasks', '/profile'];
      let completedChecks = 0;
      isAuthenticatedSubject.next(true);

      routes.forEach(routeUrl => {
        const mockState = createMockState(routeUrl);
        const result = guard.canActivate(mockRoute, mockState);
        
        (result as any).subscribe((canActivate: boolean) => {
          expect(canActivate).toBe(true);
          completedChecks++;
          if (completedChecks === routes.length) {
            expect(router.navigate).not.toHaveBeenCalled();
            done();
          }
        });
      });
    });
  });
}); 