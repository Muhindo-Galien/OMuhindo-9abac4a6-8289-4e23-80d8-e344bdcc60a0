import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../services/audit.service';
import { AuthService } from '../services/auth.service';
import { AuditLogResponseDto, PaginatedResponse, RoleType, AuditAction, AuditResource } from '@data';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="container-padding py-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p class="text-gray-600 mt-1">System activity and security logs</p>
            </div>
            
            <!-- Refresh Button -->
            <button
              (click)="loadAuditLogs()"
              [disabled]="loading"
              class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg class="w-5 h-5" [class.animate-spin]="loading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </header>

      <!-- Filters Section -->
      <div class="container-padding py-4 bg-white border-b border-gray-200">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Action Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select 
              [(ngModel)]="filters.action" 
              (change)="loadAuditLogs()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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

          <!-- Resource Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Resource</label>
            <select 
              [(ngModel)]="filters.resource" 
              (change)="loadAuditLogs()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Resources</option>
              <option value="task">Tasks</option>
              <option value="user">Users</option>
              <option value="organization">Organization</option>
              <option value="auth">Authentication</option>
              <option value="audit_log">Audit Log</option>
            </select>
          </div>

          <!-- User Email Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">User Email</label>
            <input 
              type="text" 
              [(ngModel)]="filters.userEmail" 
              (keyup.enter)="loadAuditLogs()"
              placeholder="Filter by user email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <!-- Clear Filters -->
          <div class="flex items-end">
            <button 
              (click)="clearFilters()"
              class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="container-padding py-6">
        <!-- Loading State -->
        <div *ngIf="loading && auditLogs.length === 0" class="text-center py-12">
          <div class="inline-flex items-center gap-2 text-gray-600">
            <svg class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Loading audit logs...
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex items-center gap-2 text-red-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {{ error }}
          </div>
        </div>

        <!-- No Logs State -->
        <div *ngIf="!loading && auditLogs.length === 0 && !error" class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
          <p class="text-gray-600">Try adjusting your filters or check back later.</p>
        </div>

        <!-- Audit Logs Table -->
        <div *ngIf="auditLogs.length > 0" class="bg-white rounded-lg shadow-sm overflow-hidden">
          <!-- Desktop Table -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let log of auditLogs" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getActionBadgeClass(log.action)" class="px-2 py-1 text-xs font-medium rounded-full">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ log.resource }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ log.userEmail }}</div>
                    <div class="text-sm text-gray-500">{{ log.ipAddress }}</div>
                  </td>
                                     <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{{ formatDetails(log.details) }}</td>
                                     <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {{ formatTimestamp(log.timestamp.toString()) }}
                   </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="lg:hidden">
            <div *ngFor="let log of auditLogs" class="border-b border-gray-200 p-4">
              <div class="flex items-start justify-between mb-2">
                <span [class]="getActionBadgeClass(log.action)" class="px-2 py-1 text-xs font-medium rounded-full">
                  {{ log.action }}
                </span>
                                 <span class="text-xs text-gray-500">{{ formatTimestamp(log.timestamp.toString()) }}</span>
              </div>
              
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-sm font-medium text-gray-700">Resource:</span>
                  <span class="text-sm text-gray-900">{{ log.resource }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm font-medium text-gray-700">User:</span>
                  <span class="text-sm text-gray-900">{{ log.userEmail }}</span>
                </div>
                <div *ngIf="log.details" class="mt-2">
                  <span class="text-sm font-medium text-gray-700">Details:</span>
                  <p class="text-sm text-gray-600 mt-1">{{ formatDetails(log.details) }}</p>
                </div>
                <div *ngIf="log.ipAddress" class="text-xs text-gray-400">IP: {{ log.ipAddress }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
          <div class="flex items-center text-sm text-gray-700">
            Showing {{ (pagination.currentPage - 1) * pagination.pageSize + 1 }} to 
            {{ Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems) }} 
            of {{ pagination.totalItems }} results
          </div>
          
          <div class="flex items-center space-x-2">
            <button 
              (click)="goToPage(pagination.currentPage - 1)"
              [disabled]="pagination.currentPage === 1"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span class="px-3 py-2 text-sm text-gray-700">
              Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
            </span>
            
            <button 
              (click)="goToPage(pagination.currentPage + 1)"
              [disabled]="pagination.currentPage === pagination.totalPages"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-padding {
      @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  private auditService = inject(AuditService);
  private authService = inject(AuthService);

  // Make Math available in template
  Math = Math;

  auditLogs: AuditLogResponseDto[] = [];
  loading = false;
  error: string | null = null;

  filters = {
    action: '',
    resource: '',
    userEmail: ''
  };

  pagination = {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  };

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    
    // Check if user has permission to view audit logs
    if (!currentUser || (currentUser.role !== RoleType.OWNER && currentUser.role !== RoleType.ADMIN)) {
      this.error = 'You do not have permission to view audit logs. Only Owners and Admins can access this information.';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      console.log('Loading audit logs with filters:', this.filters);
      
      const queryParams: any = {
        page: this.pagination.currentPage,
        limit: this.pagination.pageSize
      };

      // Add filters to query
      if (this.filters.action) queryParams.action = this.filters.action;
      if (this.filters.resource) queryParams.resource = this.filters.resource;
      if (this.filters.userEmail) queryParams.userEmail = this.filters.userEmail;

      const response = await this.auditService.getAuditLogs(queryParams);
      
      this.auditLogs = response.data;
      this.pagination = {
        currentPage: response.pagination.page,
        pageSize: response.pagination.limit,
        totalItems: response.pagination.total,
        totalPages: response.pagination.totalPages
      };

      console.log('Loaded audit logs:', this.auditLogs.length);
    } catch (error: unknown) {
      console.error('Error loading audit logs:', error);
      this.error = (error as Error).message || 'Failed to load audit logs. Please try again.';
      this.auditLogs = [];
    } finally {
      this.loading = false;
    }
  }

  clearFilters(): void {
    this.filters = {
      action: '',
      resource: '',
      userEmail: ''
    };
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
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    
    switch (action) {
      case 'create':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'read':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'update':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'delete':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'login':
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case 'logout':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'register':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'bulk_update':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDetails(details: Record<string, any> | null | undefined): string {
    if (!details) {
      return 'N/A';
    }

    if (typeof details === 'string') {
      return details;
    }

    if (typeof details === 'object') {
      try {
        // Convert object to a readable string format
        const entries = Object.entries(details);
        if (entries.length === 0) {
          return 'N/A';
        }

        // Create a formatted string from the object
        return entries
          .map(([key, value]) => {
            let formattedValue = value;
            if (typeof value === 'object' && value !== null) {
              formattedValue = JSON.stringify(value);
            }
            return `${key}: ${formattedValue}`;
          })
          .join(', ');
      } catch (error) {
        console.error('Error formatting details:', error);
        return 'Error formatting details';
      }
    }

    return String(details);
  }
} 