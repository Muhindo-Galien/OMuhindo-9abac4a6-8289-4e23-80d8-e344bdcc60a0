import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../services/audit.service';
import { AuthService } from '../services/auth.service';
import { OrgContextService } from '../services/org-context.service';
import { AuditLogResponseDto, RoleType } from '@data';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-gray-50 min-h-full">
      <!-- Toolbar: Refresh (only admin/owner see content) -->
      <div
        class="container-padding py-4 flex flex-wrap items-center justify-end gap-3 border-b border-gray-200 bg-white"
      >
        <button
          type="button"
          (click)="loadAuditLogs()"
          [disabled]="loading"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <svg class="w-5 h-5" [class.animate-spin]="loading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <!-- Filters (collapsible like task list: show when filter open, or always visible - keeping simple bar) -->
      <div class="container-padding py-4 bg-white border-b border-gray-200">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              [(ngModel)]="filters.action"
              (change)="loadAuditLogs()"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-turbovets-navy"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="read">Read</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="register">Register</option>
              <option value="bulk_update">Bulk Update</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Resource</label>
            <select
              [(ngModel)]="filters.resource"
              (change)="loadAuditLogs()"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-turbovets-navy"
            >
              <option value="">All Resources</option>
              <option value="task">Tasks</option>
              <option value="user">Users</option>
              <option value="organization">Organization</option>
              <option value="auth">Authentication</option>
              <option value="audit_log">Audit Log</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">User Email</label>
            <input
              type="text"
              [(ngModel)]="filters.userEmail"
              (keyup.enter)="loadAuditLogs()"
              placeholder="Filter by user email"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-turbovets-navy"
            />
          </div>
          <div class="flex items-end">
            <button
              type="button"
              (click)="clearFilters()"
              class="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <main class="container-padding section-spacing">
        <!-- Permission error: only admin and owner can view audit logs -->
        @if (!canViewAuditLogs()) {
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p class="text-amber-800 font-medium">Only Admins and Owners can view audit logs.</p>
            <p class="text-amber-700 text-sm mt-1">You need admin or owner role in this space to access audit logs.</p>
          </div>
        } @else if (error) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-800">{{ error }}</p>
          </div>
        } @else if (loading && auditLogs.length === 0) {
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-2 border-turbovets-navy border-t-transparent"></div>
          </div>
        } @else if (auditLogs.length === 0) {
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        } @else {
          <!-- List view: same layout as task list (scrollable rows) -->
          <div class="audit-list-scroll mt-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div class="audit-list-inner overflow-x-auto">
              @for (log of auditLogs; track log.id) {
                <div class="audit-list-row">
                  <div class="audit-list-cell audit-list-cell-action">
                    <span [class]="getActionBadgeClass(log.action)" class="audit-list-badge">
                      {{ log.action }}
                    </span>
                  </div>
                  <div class="audit-list-cell audit-list-cell-resource">
                    <span class="audit-list-text" [title]="log.resource">{{ log.resource }}</span>
                  </div>
                  <div class="audit-list-cell audit-list-cell-user">
                    <span class="audit-list-text" [title]="log.userEmail">{{ log.userEmail }}</span>
                    @if (log.ipAddress) {
                      <span class="audit-list-meta">IP: {{ log.ipAddress }}</span>
                    }
                  </div>
                  <div class="audit-list-cell audit-list-cell-time">
                    <span class="audit-list-text">{{ formatTimestamp(log.timestamp.toString()) }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Pagination -->
          @if (pagination.totalPages > 1) {
            <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div class="text-sm text-gray-600">
                Showing {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} to
                {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems) }}
                of {{ pagination.totalItems }} results
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="goToPage(pagination.currentPage - 1)"
                  [disabled]="pagination.currentPage === 1"
                  class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span class="text-sm text-gray-700">Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
                <button
                  type="button"
                  (click)="goToPage(pagination.currentPage + 1)"
                  [disabled]="pagination.currentPage === pagination.totalPages"
                  class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [
    `
      .container-padding { @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; }
      .section-spacing { @apply py-6; }
      .audit-list-scroll { -webkit-overflow-scrolling: touch; }
      .audit-list-inner { min-height: 0; }
      .audit-list-row {
        @apply flex items-center min-w-[520px] border-b border-gray-200 bg-white hover:bg-gray-50/80 transition-colors gap-6 px-4;
      }
      .audit-list-cell { @apply flex items-center flex-shrink-0 py-3 px-0; }
      .audit-list-cell-action { width: 6rem; min-width: 6rem; }
      .audit-list-badge { @apply text-xs font-medium px-2 py-0.5 rounded; }
      .audit-list-cell-resource { width: 6rem; min-width: 6rem; }
      .audit-list-cell-user { width: 11rem; min-width: 11rem; flex-direction: column; align-items: flex-start; }
      .audit-list-meta { @apply text-xs text-gray-500; }
      .audit-list-cell-time { width: 11rem; min-width: 11rem; }
      .audit-list-text { @apply text-sm text-gray-900; }
    `,
  ],
})
export class AuditLogsComponent implements OnInit {
  private auditService = inject(AuditService);
  private authService = inject(AuthService);
  private orgContext = inject(OrgContextService);

  Math = Math;
  auditLogs: AuditLogResponseDto[] = [];
  loading = false;
  error: string | null = null;

  filters = {
    action: '',
    resource: '',
    userEmail: '',
  };

  pagination = {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  };

  /** Only admin or owner of the current org can view audit logs (same rule as content bar). */
  canViewAuditLogs(): boolean {
    const orgId = this.orgContext.getCurrentOrgId();
    if (!orgId) return false;
    const user = this.authService.getCurrentUser();
    const role =
      user?.org_roles?.[orgId] ??
      user?.memberships?.find(m => m.organizationId === orgId)?.role;
    return role === RoleType.ADMIN || role === RoleType.OWNER;
  }

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    if (!this.canViewAuditLogs()) {
      this.error = null;
      this.auditLogs = [];
      return;
    }

    const orgId = this.orgContext.getCurrentOrgId();
    if (!orgId) {
      this.error = 'Select a space to view audit logs.';
      this.auditLogs = [];
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const queryParams = {
        organizationId: orgId,
        page: this.pagination.currentPage,
        limit: this.pagination.pageSize,
        ...(this.filters.action && { action: this.filters.action }),
        ...(this.filters.resource && { resource: this.filters.resource }),
        ...(this.filters.userEmail && { userEmail: this.filters.userEmail }),
      };
      const response = await this.auditService.getAuditLogs(queryParams);
      this.auditLogs = response.data;
      this.pagination = {
        currentPage: response.pagination.page,
        pageSize: response.pagination.limit,
        totalItems: response.pagination.total,
        totalPages: response.pagination.totalPages,
      };
    } catch (err: unknown) {
      this.error = (err as Error).message || 'Failed to load audit logs.';
      this.auditLogs = [];
    } finally {
      this.loading = false;
    }
  }

  clearFilters(): void {
    this.filters = { action: '', resource: '', userEmail: '' };
    this.pagination.currentPage = 1;
    this.loadAuditLogs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.loadAuditLogs();
    }
  }

  getActionBadgeClass(action: string): string {
    const base = 'audit-list-badge';
    const map: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      read: 'bg-purple-100 text-purple-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      login: 'bg-emerald-100 text-emerald-800',
      logout: 'bg-gray-100 text-gray-800',
      register: 'bg-indigo-100 text-indigo-800',
      bulk_update: 'bg-orange-100 text-orange-800',
    };
    return `${base} ${map[action] ?? 'bg-gray-100 text-gray-800'}`;
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
