import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Intercepting request:', req.url);
  
  // Skip authentication for login requests
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  // Get the auth token
  const token = authService.getToken();
  
  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Added authorization header to request');
  } else {
    console.log('No token available, proceeding without authorization header');
  }

  // Send the request and handle errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error in interceptor:', error);
      
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        console.log('401 Unauthorized - redirecting to login');
        authService.logout();
        router.navigate(['/login']);
      }
      
      // Handle 403 Forbidden errors
      if (error.status === 403) {
        console.log('403 Forbidden - access denied');
        // You could show a toast notification here
      }

      return throwError(() => error);
    })
  );
}; 