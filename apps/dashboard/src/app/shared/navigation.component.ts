import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleType } from '@data';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-gray-900">TaskManager</h1>
            </div>
            
            <!-- Main Navigation -->
            <div class="hidden md:block ml-10">
              <div class="flex items-baseline space-x-4">
                <a
                  routerLink="/dashboard"
                  routerLinkActive="bg-primary-100 text-primary-700"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  Dashboard
                </a>
                <a
                  routerLink="/tasks/board"
                  routerLinkActive="bg-primary-100 text-primary-700"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  Board View
                </a>
                <a
                  routerLink="/tasks/list"
                  routerLinkActive="bg-primary-100 text-primary-700"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  List View
                </a>
                <a
                  *ngIf="canViewAuditLogs()"
                  routerLink="/audit-logs"
                  routerLinkActive="bg-primary-100 text-primary-700"
                  class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Audit Logs
                </a>

              </div>
            </div>
          </div>

          <!-- User Menu -->
          <div class="flex items-center">
            <!-- User Info -->
            <div class="hidden md:flex items-center mr-4">
              <div class="text-right mr-3">
                <div class="text-sm font-medium text-gray-900">{{ getCurrentUser()?.email }}</div>
                <div class="text-xs text-gray-500">{{ getCurrentUser()?.role }} • {{ getCurrentUser()?.organizationName }}</div>
              </div>
              <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-primary-700 text-sm font-medium">
                  {{ getUserInitials() }}
                </span>
              </div>
            </div>

            <!-- Mobile menu button -->
            <div class="md:hidden">
              <button
                (click)="mobileMenuOpen = !mobileMenuOpen"
                class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <svg class="h-6 w-6" [class.hidden]="mobileMenuOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg class="h-6 w-6" [class.hidden]="!mobileMenuOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Logout Button -->
            <button
              (click)="logout()"
              class="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        <div class="md:hidden" [class.hidden]="!mobileMenuOpen">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-primary-100 text-primary-700"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              (click)="mobileMenuOpen = false"
            >
              Dashboard
            </a>
            <a
              routerLink="/tasks/board"
              routerLinkActive="bg-primary-100 text-primary-700"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              (click)="mobileMenuOpen = false"
            >
              Board View
            </a>
            <a
              routerLink="/tasks/list"
              routerLinkActive="bg-primary-100 text-primary-700"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              (click)="mobileMenuOpen = false"
            >
              List View
            </a>
            <a
              *ngIf="canViewAuditLogs()"
              routerLink="/audit-logs"
              routerLinkActive="bg-primary-100 text-primary-700"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              (click)="mobileMenuOpen = false"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Audit Logs
            </a>
            
            
            <!-- Mobile User Info -->
            <div class="px-3 py-2 border-t border-gray-200 mt-3">
              <div class="text-sm font-medium text-gray-900">{{ getCurrentUser()?.email }}</div>
              <div class="text-xs text-gray-500">{{ getCurrentUser()?.role }} • {{ getCurrentUser()?.organizationName }}</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .router-link-active {
      @apply bg-primary-100 text-primary-700;
    }
  `]
})
export class NavigationComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  mobileMenuOpen = false;

  getCurrentUser(): any {
    return this.authService.getCurrentUser();
  }

  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user?.email) return '??';
    
    const emailParts = user.email.split('@')[0];
    return emailParts.substring(0, 2).toUpperCase();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === RoleType.ADMIN;
  }

  isOwner(): boolean {
    const user = this.getCurrentUser();
    return user?.role === RoleType.OWNER;
  }

  canViewAuditLogs(): boolean {
    const user = this.getCurrentUser();
    return user?.role === RoleType.OWNER || user?.role === RoleType.ADMIN;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 