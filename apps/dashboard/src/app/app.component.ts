import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavigationComponent } from './shared/navigation.component';
import { AuthService } from './services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, NavigationComponent],
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Show navigation only when authenticated -->
      <app-navigation *ngIf="isAuthenticated$ | async"></app-navigation>
      
      <!-- Main content -->
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isAuthenticated$ = this.authService.isAuthenticated$;
  title = 'dashboard';

  ngOnInit(): void {
    // Check authentication status and redirect accordingly
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      const currentRoute = this.router.url;
      
      if (!isAuthenticated && currentRoute !== '/login') {
        this.router.navigate(['/login']);
      } else if (isAuthenticated && currentRoute === '/login') {
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
