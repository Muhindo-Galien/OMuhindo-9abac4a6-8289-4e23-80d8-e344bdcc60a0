import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { OrgContextService } from '../services/org-context.service';

/**
 * Ensures a current organization is selected before accessing dashboard/tasks/audit.
 * If none is selected, redirects to the org list page.
 */
@Injectable({
  providedIn: 'root',
})
export class OrgSelectedGuard implements CanActivate {
  private orgContext = inject(OrgContextService);
  private router = inject(Router);

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.orgContext.currentOrg$.pipe(
      take(1),
      map((org) => {
        if (org) return true;
        this.router.navigate(['/orgs'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      })
    );
  }
}
