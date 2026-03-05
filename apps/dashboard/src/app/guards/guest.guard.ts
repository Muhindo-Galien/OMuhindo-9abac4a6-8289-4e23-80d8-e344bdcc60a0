import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Use on login (guest-only) routes.
 * If the user is already authenticated, redirects to returnUrl or /dashboard and blocks the route.
 */
@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((authenticated) => {
        if (authenticated) {
          const returnUrl =
            route.queryParamMap.get('returnUrl') || '/app/dashboard';
          this.router.navigateByUrl(returnUrl);
          return false;
        }
        return true;
      })
    );
  }
}
