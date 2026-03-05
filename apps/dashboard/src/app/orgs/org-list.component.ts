import { Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OrganizationService } from '../services/organization.service';
import { OrgContextService } from '../services/org-context.service';
import { OrganizationResponseDto } from '@data';
import {
  getInitialsForUser,
  getInitialsFromWords,
} from '../shared/utils/string.utils';

import { OrgsHeaderComponent } from './orgs-header.component';
import { OrgsWelcomeComponent } from './orgs-welcome.component';
import { OrgCardComponent } from './org-card.component';
import { OrgListEmptyComponent } from './org-list-empty.component';
import { OrgListDecorationsComponent } from './org-list-decorations.component';
import {
  CreateOrgModalComponent,
  CreateOrgFormValue,
} from './create-org-modal.component';

/**
 * Container for the org/sites list page: loads organizations, composes header,
 * welcome, list (or empty state), and create-org modal. Handles navigation and API.
 */
@Component({
  selector: 'app-org-list',
  standalone: true,
  imports: [
    CommonModule,
    OrgsHeaderComponent,
    OrgsWelcomeComponent,
    OrgCardComponent,
    OrgListEmptyComponent,
    OrgListDecorationsComponent,
    CreateOrgModalComponent,
  ],
  template: `
    <div class="min-h-screen bg-turbovets-bg font-sans">
      <app-orgs-header
        [userInitials]="getUserInitials()"
        [userDisplayName]="getUserDisplayName()"
      />

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <app-org-list-decorations />

        <app-orgs-welcome
          [firstName]="getCurrentUser()?.firstName ?? null"
          (createClick)="openCreateModal()"
        />

        @if (isLoading) {
        <div class="flex justify-center py-12">
          <div
            class="animate-spin rounded-full h-10 w-10 border-2 border-turbovets-navy border-t-transparent"
          ></div>
        </div>
        } @else if (organizations.length === 0) {
        <app-org-list-empty (createClick)="openCreateModal()" />
        } @else {
        <ul class="space-y-4">
          @for (org of organizations; track org.id) {
          <li>
            <app-org-card
              [org]="org"
              [initials]="getOrgInitials(org.name)"
              (goToDashboard)="goToDashboard($event)"
            />
          </li>
          }
        </ul>

        }
      </main>

      <app-create-org-modal
        #createModal
        [isOpen]="showCreateModal"
        [loading]="createLoading"
        [error]="createError"
        (close)="closeCreateModal()"
        (submit)="onCreateSubmit($event)"
      />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class OrgListComponent implements OnInit {
  private authService = inject(AuthService);
  private orgService = inject(OrganizationService);
  private orgContext = inject(OrgContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  createModal = viewChild(CreateOrgModalComponent);

  organizations: OrganizationResponseDto[] = [];
  isLoading = true;
  showCreateModal = false;
  createLoading = false;
  createError = '';

  ngOnInit(): void {
    this.loadOrgs();
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  getUserDisplayName(): string | null {
    const u = this.authService.getCurrentUser();
    if (!u) return null;
    const first = u.firstName ?? '';
    const last = u.lastName ?? '';
    return [first, last].filter(Boolean).join(' ') || null;
  }

  getUserInitials(): string {
    const u = this.authService.getCurrentUser();
    return getInitialsForUser(u?.firstName, u?.lastName, u?.email);
  }

  getOrgInitials(name: string): string {
    return getInitialsFromWords(name);
  }

  loadOrgs(): void {
    this.isLoading = true;
    this.orgService.getMyOrganizations().subscribe({
      next: list => {
        this.organizations = list;
        this.isLoading = false;
      },
      error: () => {
        this.organizations = [];
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.createError = '';
    this.createModal()?.resetForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createError = '';
  }

  onCreateSubmit(value: CreateOrgFormValue): void {
    this.createLoading = true;
    this.createError = '';
    this.orgService.createOrganization(value).subscribe({
      next: res => {
        this.authService.updateSessionWithToken(res.access_token, res.user);
        this.closeCreateModal();
        this.loadOrgs();
      },
      error: err => {
        this.createError =
          err?.error?.message ?? 'Failed to create organization.';
        this.createLoading = false;
      },
      complete: () => {
        this.createLoading = false;
      },
    });
  }

  goToDashboard(org: OrganizationResponseDto): void {
    this.orgContext.setCurrentOrg({
      id: org.id,
      name: org.name,
      description: org.description,
      parentId: org.parentId,
      owner: org.owner,
    });
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/app/dashboard';
    this.router.navigateByUrl(returnUrl);
  }
}
