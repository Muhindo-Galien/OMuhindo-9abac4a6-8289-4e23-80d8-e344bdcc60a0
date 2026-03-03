import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('AuthGuard: Checking authentication for route:', state.url);
    
    return this.authService.isAuthenticated$.pipe(
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('AuthGuard: User not authenticated, redirecting to login');
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url } 
          });
        } else {
          console.log('AuthGuard: User authenticated, allowing access');
        }
      })
    );
  }
} 