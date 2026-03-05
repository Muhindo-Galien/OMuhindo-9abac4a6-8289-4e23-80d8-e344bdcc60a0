import { Component, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './app-header.component';
import { AppSidebarComponent } from './app-sidebar.component';
import { ContentBarComponent } from './content-bar.component';
import { CreateOrgModalComponent, CreateOrgFormValue } from '../orgs/create-org-modal.component';
import { AuthService } from '../services/auth.service';
import { OrgContextService } from '../services/org-context.service';
import { OrganizationService } from '../services/organization.service';
import { map } from 'rxjs/operators';
import { isChildOrg } from '@data';

/**
 * Layout when user is inside an org: header (logo, settings, avatar) + sidebar (spaces / child orgs) + main content.
 * Used for /dashboard, /tasks, /audit-logs. Not used for /orgs (org list has its own header).
 * Child orgs are referred to as "spaces" in the UI.
 */
@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent,
    AppSidebarComponent,
    ContentBarComponent,
    CreateOrgModalComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <app-app-header
        (menuClick)="toggleMobileSidebar()"
        (createOrgClick)="openCreateChildModal()"
        (profileClick)="onProfile()"
        (logoutClick)="onLogout()"
      ></app-app-header>
      <div class="flex flex-1 overflow-hidden">
        <app-app-sidebar
          [mobileOpen]="mobileSidebarOpen()"
          (close)="mobileSidebarOpen.set(false)"
          (createClick)="openCreateChildModal()"
        ></app-app-sidebar>
        <div class="flex-1 flex flex-col overflow-hidden min-w-0">
          @if (hasSpaceSelected$ | async) {
            <app-content-bar></app-content-bar>
            <main class="flex-1 overflow-auto min-w-0">
              <router-outlet></router-outlet>
            </main>
          } @else {
            <div class="flex-1 flex items-center justify-center p-8 bg-gray-50">
              <div class="text-center max-w-sm">
                <p class="text-gray-600 mb-4">No space selected. Create a space or select one from the sidebar.</p>
                <button
                  type="button"
                  (click)="openCreateChildModal()"
                  class="px-4 py-2 text-sm font-medium text-white bg-turbovets-navy rounded-lg hover:bg-turbovets-navy/90"
                >
                  Create space
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <app-create-org-modal
      #createChildModal
      [isOpen]="showCreateChildModal()"
      [loading]="createLoading()"
      [error]="createError()"
      title="Create space"
      nameLabel="Space name"
      namePlaceholder="My Space"
      (close)="closeCreateChildModal()"
      (submit)="onCreateChildSubmit($event)"
    ></app-create-org-modal>
  `,
})
export class AppLayoutComponent {
  private authService = inject(AuthService);
  private orgContext = inject(OrgContextService);
  private orgService = inject(OrganizationService);
  private router = inject(Router);

  /** True when a space (child org) is selected; then we show content bar + outlet. Uses shared @data isChildOrg. */
  hasSpaceSelected$ = this.orgContext.currentOrg$.pipe(
    map((org) => isChildOrg(org))
  );

  mobileSidebarOpen = signal(false);
  showCreateChildModal = signal(false);
  createLoading = signal(false);
  createError = signal<string | null>(null);

  createChildModal = viewChild(CreateOrgModalComponent);
  private sidebarRef = viewChild(AppSidebarComponent);

  openCreateChildModal(): void {
    this.showCreateChildModal.set(true);
    this.createError.set(null);
    this.createChildModal()?.resetForm();
  }

  closeCreateChildModal(): void {
    this.showCreateChildModal.set(false);
    this.createError.set(null);
  }

  onCreateChildSubmit(value: CreateOrgFormValue): void {
    const parentId = this.orgContext.getEffectiveParentId();
    if (!parentId) return;
    this.createLoading.set(true);
    this.createError.set(null);
    this.orgService.createChildOrganization(parentId, value).subscribe({
      next: (org) => {
        this.closeCreateChildModal();
        this.sidebarRef()?.loadChildren();
      },
      error: (err) => {
        this.createError.set(err?.error?.message ?? 'Failed to create space.');
        this.createLoading.set(false);
      },
      complete: () => this.createLoading.set(false),
    });
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((v) => !v);
  }

  onProfile(): void {
    this.router.navigate(['/orgs']);
  }

  onLogout(): void {
    this.orgContext.clearCurrentOrg();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
