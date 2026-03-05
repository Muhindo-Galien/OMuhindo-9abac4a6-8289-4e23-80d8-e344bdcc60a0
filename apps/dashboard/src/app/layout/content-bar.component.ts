import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { OrgContextService } from '../services/org-context.service';
import { AuthService } from '../services/auth.service';
import { RoleType, isChildOrg as isChildOrgUtil } from '@data';

/**
 * Bar below the main header: current space name + description (child orgs only) + Board | List | Audit Logs.
 * Only child orgs (spaces) get name/description; parent org is not shown here.
 */
@Component({
  selector: 'app-content-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div class="max-w-full">
        <!-- Space title + description (child org only; parent not displayed) -->
        @if (isChildOrg()) {
        <div class="pt-3 pb-1">
          <h1 class="text-lg font-semibold text-gray-900 truncate">
            {{ spaceName() }}
          </h1>
          @if (spaceDescription(); as desc) {
          <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ desc }}</p>
          }
        </div>
        } @else {
        <div class="pt-3 pb-1">
          <h1 class="text-lg font-semibold text-gray-500">Select a space</h1>
        </div>
        }
        <!-- Tabs: Board, List, Audit Logs -->
        <nav class="flex gap-1 -mb-px">
          <a
            routerLink="/app/tasks/board"
            routerLinkActive="bg-turbovets-sky-light text-turbovets-navy border-b-2 border-turbovets-navy"
            [routerLinkActiveOptions]="{ exact: false }"
            class="px-4 py-3 text-sm font-medium rounded-t-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Board
          </a>
          <a
            routerLink="/app/tasks/list"
            routerLinkActive="bg-turbovets-sky-light text-turbovets-navy border-b-2 border-turbovets-navy"
            [routerLinkActiveOptions]="{ exact: true }"
            class="px-4 py-3 text-sm font-medium rounded-t-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            List
          </a>
          @if (canViewAuditLogs()) {
          <a
            routerLink="/app/audit-logs"
            routerLinkActive="bg-turbovets-sky-light text-turbovets-navy border-b-2 border-turbovets-navy"
            [routerLinkActiveOptions]="{ exact: true }"
            class="px-4 py-3 text-sm font-medium rounded-t-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Audit Logs
          </a>
          }
        </nav>
      </div>
    </div>
  `,
})
export class ContentBarComponent {
  private orgContext = inject(OrgContextService);
  private authService = inject(AuthService);

  /** True when current org is a child (space), not a parent. Uses shared @data helper. */
  isChildOrg(): boolean {
    return isChildOrgUtil(this.orgContext.getCurrentOrg());
  }

  spaceName(): string {
    const org = this.orgContext.getCurrentOrg();
    return org?.name ?? 'Space';
  }

  spaceDescription(): string | null {
    const org = this.orgContext.getCurrentOrg();
    const d = org?.description?.trim();
    return d || null;
  }

  canViewAuditLogs(): boolean {
    const orgId = this.orgContext.getCurrentOrgId();
    if (!orgId) return false;
    const user = this.authService.getCurrentUser();
    const role =
      user?.org_roles?.[orgId] ??
      user?.memberships?.find((m) => m.organizationId === orgId)?.role;
    return role === RoleType.ADMIN || role === RoleType.OWNER;
  }
}
