import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpErrorResponse, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('AuthInterceptor', () => {
  let authService: any;
  let router: any;
  let mockNext: jest.MockedFunction<HttpHandlerFn>;

  // Mock tokens and errors from fixtures
  const mockTokens = {
    valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLW93bmVyLTEyMyIsImVtYWlsIjoib3duZXJAdHVyYm92ZXRzLmNvbSIsInJvbGUiOiJvd25lciIsImV4cCI6MTk5OTk5OTk5OX0.test',
    expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLW93bmVyLTEyMyIsImVtYWlsIjoib3duZXJAdHVyYm92ZXRzLmNvbSIsInJvbGUiOiJvd25lciIsImV4cCI6MTAwMDAwMDAwMH0.test',
    malformed: 'invalid.token.format'
  };

  const mockErrors = {
    unauthorized: {
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'Invalid email or password' },
      message: 'Http failure response for /api/tasks: 401 Unauthorized',
      url: '/api/tasks'
    },
    forbidden: {
      status: 403,
      statusText: 'Forbidden',
      error: { message: 'Access forbidden' },
      message: 'Http failure response for /api/admin: 403 Forbidden',
      url: '/api/admin'
    },
    notFound: {
      status: 404,
      statusText: 'Not Found',
      error: { message: 'Resource not found' },
      message: 'Http failure response for /api/tasks/123: 404 Not Found',
      url: '/api/tasks/123'
    },
    serverError: {
      status: 500,
      statusText: 'Internal Server Error',
      error: { message: 'Internal server error' },
      message: 'Http failure response for /api/tasks: 500 Internal Server Error',
      url: '/api/tasks'
    }
  };

  beforeEach(async () => {
    const authServiceSpy = {
      getToken: jest.fn(),
      logout: jest.fn()
    };

    const routerSpy = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);

    // Mock HttpHandlerFn
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Attachment', () => {
    it('should add Authorization header when valid token exists', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200, body: 'success' })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('Intercepting request:', '/api/tasks');
      expect(console.log).toHaveBeenCalledWith('Added authorization header to request');
      const calledRequest = mockNext.mock.calls[0][0];
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${mockTokens.valid}`);
    });

    it('should add Authorization header with expired token', () => {
      authService.getToken.mockReturnValue(mockTokens.expired);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('Added authorization header to request');
      const calledRequest = mockNext.mock.calls[0][0];
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${mockTokens.expired}`);
    });

    it('should add Authorization header with malformed token', () => {
      authService.getToken.mockReturnValue(mockTokens.malformed);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('Added authorization header to request');
      const calledRequest = mockNext.mock.calls[0][0];
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${mockTokens.malformed}`);
    });

    it('should proceed without Authorization header when no token exists', () => {
      authService.getToken.mockReturnValue(null);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('Intercepting request:', '/api/tasks');
      expect(console.log).toHaveBeenCalledWith('No token available, proceeding without authorization header');
      expect(mockNext).toHaveBeenCalledWith(request); // Original request without modification
    });

    it('should proceed without Authorization header when token is empty string', () => {
      authService.getToken.mockReturnValue('');
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('No token available, proceeding without authorization header');
      expect(mockNext).toHaveBeenCalledWith(request);
    });

    it('should proceed without Authorization header when token is undefined', () => {
      authService.getToken.mockReturnValue(undefined);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('No token available, proceeding without authorization header');
      expect(mockNext).toHaveBeenCalledWith(request);
    });
  });

  describe('Login URL Skipping', () => {
    it('should skip authentication for login requests', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('POST', '/api/auth/login', { email: 'test@example.com', password: 'password' });
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('Intercepting request:', '/api/auth/login');
      expect(console.log).not.toHaveBeenCalledWith('Added authorization header to request');
      expect(mockNext).toHaveBeenCalledWith(request); // Original request without modification
      expect(authService.getToken).not.toHaveBeenCalled();
    });

    it('should skip authentication for login requests with different paths', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));

      const loginUrls = [
        '/auth/login',
        'https://api.example.com/auth/login',
        '/v1/auth/login',
        '/api/v1/auth/login'
      ];

      loginUrls.forEach(url => {
        jest.clearAllMocks();
        const request = new HttpRequest('POST', url, { email: 'test@example.com', password: 'password' });
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe();
        });

        expect(mockNext).toHaveBeenCalledWith(request);
        expect(authService.getToken).not.toHaveBeenCalled();
      });
    });

    it('should add authentication for non-login requests', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));

      const nonLoginUrls = [
        '/api/tasks',
        '/api/users',
        '/api/auth/logout',
        '/api/auth/profile',
        '/api/auth/refresh'
      ];

      nonLoginUrls.forEach(url => {
        jest.clearAllMocks();
        const request = new HttpRequest('GET', url);
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe();
        });

        expect(authService.getToken).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    describe('401 Unauthorized Errors', () => {
      it('should handle 401 error by logging out and redirecting to login', () => {
        authService.getToken.mockReturnValue(mockTokens.valid);
        const error = new HttpErrorResponse(mockErrors.unauthorized);
        mockNext.mockReturnValue(throwError(() => error));
        jest.spyOn(console, 'error');
        jest.spyOn(console, 'log');

        const request = new HttpRequest('GET', '/api/tasks');
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: (err) => {
              expect(err).toBe(error);
            }
          });
        });

        expect(console.error).toHaveBeenCalledWith('HTTP Error in interceptor:', error);
        expect(console.log).toHaveBeenCalledWith('401 Unauthorized - redirecting to login');
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });

      it('should handle 401 error for different API endpoints', () => {
        authService.getToken.mockReturnValue(mockTokens.valid);
        const error = new HttpErrorResponse({
          ...mockErrors.unauthorized,
          url: '/api/users/profile'
        });
        mockNext.mockReturnValue(throwError(() => error));
        jest.spyOn(console, 'log');

        const request = new HttpRequest('GET', '/api/users/profile');
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: () => {}
          });
        });

        expect(console.log).toHaveBeenCalledWith('401 Unauthorized - redirecting to login');
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });

      it('should handle 401 error when no token was provided', () => {
        authService.getToken.mockReturnValue(null);
        const error = new HttpErrorResponse(mockErrors.unauthorized);
        mockNext.mockReturnValue(throwError(() => error));

        const request = new HttpRequest('GET', '/api/tasks');
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: () => {}
          });
        });

        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      });
    });

    describe('403 Forbidden Errors', () => {
      it('should handle 403 error by logging access denied', () => {
        authService.getToken.mockReturnValue(mockTokens.valid);
        const error = new HttpErrorResponse(mockErrors.forbidden);
        mockNext.mockReturnValue(throwError(() => error));
        jest.spyOn(console, 'error');
        jest.spyOn(console, 'log');

        const request = new HttpRequest('GET', '/api/admin');
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: (err) => {
              expect(err).toBe(error);
            }
          });
        });

        expect(console.error).toHaveBeenCalledWith('HTTP Error in interceptor:', error);
        expect(console.log).toHaveBeenCalledWith('403 Forbidden - access denied');
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should handle 403 error without redirecting', () => {
        authService.getToken.mockReturnValue(mockTokens.valid);
        const error = new HttpErrorResponse(mockErrors.forbidden);
        mockNext.mockReturnValue(throwError(() => error));

        const request = new HttpRequest('DELETE', '/api/admin/users/123');
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: () => {}
          });
        });

        // Should not logout or redirect for 403 errors
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('Other HTTP Errors', () => {
      it('should handle 404 errors without special processing', () => {
        authService.getToken.mockReturnValue(mockTokens.valid);
        const error = new HttpErrorResponse(mockErrors.notFound);
        mockNext.mockReturnValue(throwError(() => error));
        jest.spyOn(console, 'error');

        const request = new HttpRequest('GET', '/api/tasks/999');
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: (err) => {
              expect(err).toBe(error);
            }
          });
        });

        expect(console.error).toHaveBeenCalledWith('HTTP Error in interceptor:', error);
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should handle 500 errors without special processing', () => {
        authService.getToken.mockReturnValue(mockTokens.valid);
        const error = new HttpErrorResponse(mockErrors.serverError);
        mockNext.mockReturnValue(throwError(() => error));
        jest.spyOn(console, 'error');

        const request = new HttpRequest('POST', '/api/tasks', { title: 'New Task' });
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: (err) => {
              expect(err).toBe(error);
            }
          });
        });

        expect(console.error).toHaveBeenCalledWith('HTTP Error in interceptor:', error);
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should handle network errors', () => {
        authService.getToken.mockReturnValue(mockTokens.valid);
        const networkError = new HttpErrorResponse({
          status: 0,
          statusText: 'Unknown Error',
          error: 'Network error',
          url: '/api/tasks'
        });
        mockNext.mockReturnValue(throwError(() => networkError));
        jest.spyOn(console, 'error');

        const request = new HttpRequest('GET', '/api/tasks');
        
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: (err) => {
              expect(err).toBe(networkError);
            }
          });
        });

        expect(console.error).toHaveBeenCalledWith('HTTP Error in interceptor:', networkError);
        expect(authService.logout).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Request Types and Methods', () => {
    it('should handle GET requests with token', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200, body: [] })));

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      const calledRequest = mockNext.mock.calls[0][0];
      expect(calledRequest.method).toBe('GET');
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${mockTokens.valid}`);
    });

    it('should handle POST requests with token', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 201, body: { id: 1 } })));

      const request = new HttpRequest('POST', '/api/tasks', { title: 'New Task' });
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      const calledRequest = mockNext.mock.calls[0][0];
      expect(calledRequest.method).toBe('POST');
      expect(calledRequest.body).toEqual({ title: 'New Task' });
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${mockTokens.valid}`);
    });

    it('should handle PUT requests with token', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200, body: { id: 1, title: 'Updated Task' } })));

      const request = new HttpRequest('PUT', '/api/tasks/1', { title: 'Updated Task' });
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          body: { title: 'Updated Task' }
        })
      );
    });

    it('should handle DELETE requests with token', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 204 })));

      const request = new HttpRequest('DELETE', '/api/tasks/1');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle concurrent requests correctly', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));

      const requests = [
        new HttpRequest('GET', '/api/tasks'),
        new HttpRequest('GET', '/api/users'),
        new HttpRequest('POST', '/api/tasks', { title: 'Test' })
      ];

      requests.forEach(request => {
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe();
        });
      });

      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(authService.getToken).toHaveBeenCalledTimes(3);
    });

    it('should handle successful responses without interference', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      const successResponse = new HttpResponse({ status: 200, body: { tasks: [] } });
      mockNext.mockReturnValue(of(successResponse));

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe(response => {
          expect(response).toEqual(successResponse);
        });
      });
    });

    it('should handle requests with query parameters', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200, body: [] })));

      const request = new HttpRequest('GET', '/api/tasks?page=1&limit=10&status=todo');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/tasks?page=1&limit=10&status=todo'
        })
      );
    });

    it('should handle multiple authentication errors in sequence', () => {
      authService.getToken.mockReturnValue(mockTokens.expired);
      const error = new HttpErrorResponse(mockErrors.unauthorized);
      mockNext.mockReturnValue(throwError(() => error));

      const requests = [
        new HttpRequest('GET', '/api/tasks'),
        new HttpRequest('GET', '/api/users')
      ];

      requests.forEach(request => {
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe({
            error: () => {}
          });
        });
      });

      expect(authService.logout).toHaveBeenCalledTimes(2);
      expect(router.navigate).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and error responses', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      
      // First request succeeds
      mockNext.mockReturnValueOnce(of(new HttpResponse({ status: 200 })));
      const request1 = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request1, mockNext).subscribe();
      });

      // Second request fails with 401
      const error = new HttpErrorResponse(mockErrors.unauthorized);
      mockNext.mockReturnValueOnce(throwError(() => error));
      const request2 = new HttpRequest('GET', '/api/users');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request2, mockNext).subscribe({
          error: () => {}
        });
      });

      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Console Logging', () => {
    it('should log all intercepted requests', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const requests = [
        '/api/tasks',
        '/api/users',
        '/api/auth/logout'
      ];

      requests.forEach(url => {
        const request = new HttpRequest('GET', url);
        TestBed.runInInjectionContext(() => {
          authInterceptor(request, mockNext).subscribe();
        });
        expect(console.log).toHaveBeenCalledWith('Intercepting request:', url);
      });
    });

    it('should log when authorization header is added', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('Added authorization header to request');
    });

    it('should log when no token is available', () => {
      authService.getToken.mockReturnValue(null);
      mockNext.mockReturnValue(of(new HttpResponse({ status: 200 })));
      jest.spyOn(console, 'log');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe();
      });

      expect(console.log).toHaveBeenCalledWith('No token available, proceeding without authorization header');
    });

    it('should log HTTP errors', () => {
      authService.getToken.mockReturnValue(mockTokens.valid);
      const error = new HttpErrorResponse(mockErrors.serverError);
      mockNext.mockReturnValue(throwError(() => error));
      jest.spyOn(console, 'error');

      const request = new HttpRequest('GET', '/api/tasks');
      
      TestBed.runInInjectionContext(() => {
        authInterceptor(request, mockNext).subscribe({
          error: () => {}
        });
      });

      expect(console.error).toHaveBeenCalledWith('HTTP Error in interceptor:', error);
    });
  });
}); 