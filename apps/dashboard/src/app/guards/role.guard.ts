import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredRoles = route.data['roles'] as string[];
    console.log('RoleGuard: Checking roles for route:', state.url, 'Required roles:', requiredRoles);
    
    return this.authService.currentUser$.pipe(
      map(user => {
        if (!user) {
          console.log('RoleGuard: No user found, redirecting to login');
          this.router.navigate(['/login']);
          return false;
        }

        if (!requiredRoles || requiredRoles.length === 0) {
          console.log('RoleGuard: No roles required, allowing access');
          return true;
        }

        const hasRequiredRole = requiredRoles.includes(user.role);
        
        if (!hasRequiredRole) {
          console.log('RoleGuard: User does not have required role. User role:', user.role, 'Required:', requiredRoles);
          this.router.navigate(['/dashboard']); // Redirect to dashboard instead of login
          return false;
        }

        console.log('RoleGuard: User has required role, allowing access');
        return true;
      })
    );
  }
} 