import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { combineLatest, merge, of } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { NavigationComponent } from './shared/navigation.component';
import { AuthService } from './services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, NavigationComponent],
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-navigation *ngIf="showNav$ | async"></app-navigation>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isAuthenticated$ = this.authService.isAuthenticated$;
  private notOrgsPage$ = merge(
    of(this.router.url),
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url)
    )
  ).pipe(map(url => !url.startsWith('/orgs')));
  showNav$ = combineLatest([
    this.authService.isAuthenticated$,
    this.notOrgsPage$,
  ]).pipe(map(([auth, notOrgs]) => !!auth && notOrgs));
  title = 'dashboard';
}
