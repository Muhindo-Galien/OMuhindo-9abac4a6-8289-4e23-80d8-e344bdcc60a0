import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <!-- Search and Filters Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- Search Input -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (ngModelChange)="onFilterChange()"
              placeholder="Search tasks..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              [disabled]="isLoading"
            />
            <!-- Clear Search Button -->
            <button
              *ngIf="filters.search"
              (click)="clearSearch()"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg class="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let quickFilter of quickFilters"
            (click)="applyQuickFilter(quickFilter.value)"
            [class]="getQuickFilterClass(quickFilter.value)"
            class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200"
          >
            {{ quickFilter.label }}
          </button>
        </div>
      </div>

      <!-- Advanced Filters (Collapsible) -->
      <div class="mt-4">
        <button
          (click)="showAdvancedFilters = !showAdvancedFilters"
          class="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <svg 
            [class.rotate-180]="showAdvancedFilters"
            class="w-4 h-4 mr-1 transform transition-transform duration-200" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {{ showAdvancedFilters ? 'Hide' : 'Show' }} Advanced Filters
        </button>

        <!-- Advanced Filters Panel -->
        <div *ngIf="showAdvancedFilters" class="mt-3 pt-3 border-t border-gray-200">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Status Filter -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                [(ngModel)]="filters.status"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                [disabled]="isLoading"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <!-- Priority Filter -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                [(ngModel)]="filters.priority"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                [disabled]="isLoading"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <!-- Category Filter -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                [(ngModel)]="filters.category"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                [disabled]="isLoading"
              >
                <option value="">All Categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="project">Project</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Sort By -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                [(ngModel)]="filters.sortBy"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                [disabled]="isLoading"
              >
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          <!-- Clear All Filters -->
          <div class="mt-4 flex justify-between items-center">
            <div class="text-xs text-gray-500">
              {{ getActiveFilterCount() }} filter(s) active
            </div>
            <button
              (click)="clearAllFilters()"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              [disabled]="!hasActiveFilters()"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rotate-180 {
      transform: rotate(180deg);
    }
  `]
})
export class TaskFiltersComponent {
  @Input() isLoading = false;
  @Output() filterChange = new EventEmitter<any>();

  showAdvancedFilters = false;

  filters = {
    search: '',
    status: '',
    priority: '',
    category: '',
    sortBy: 'createdAt'
  };

  quickFilters = [
    { label: 'All', value: 'all' },
    { label: 'My Tasks', value: 'my' },
    { label: 'Due Today', value: 'due-today' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'High Priority', value: 'high-priority' }
  ];

  activeQuickFilter = 'all';

  onFilterChange(): void {
    this.filterChange.emit({
      ...this.filters,
      quickFilter: this.activeQuickFilter
    });
  }

  clearSearch(): void {
    this.filters.search = '';
    this.onFilterChange();
  }

  applyQuickFilter(filterValue: string): void {
    this.activeQuickFilter = filterValue;
    
    // Reset individual filters when applying quick filters
    if (filterValue !== 'all') {
      this.clearAllFilters(false);
    }
    
    this.onFilterChange();
  }

  getQuickFilterClass(filterValue: string): string {
    const baseClasses = 'px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200';
    const isActive = this.activeQuickFilter === filterValue;
    
    if (isActive) {
      return `${baseClasses} bg-primary-100 text-primary-800 border border-primary-200`;
    }
    
    return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200`;
  }

  clearAllFilters(emitChange = true): void {
    this.filters = {
      search: '',
      status: '',
      priority: '',
      category: '',
      sortBy: 'createdAt'
    };
    
    if (emitChange) {
      this.activeQuickFilter = 'all';
      this.onFilterChange();
    }
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.status ||
      this.filters.priority ||
      this.filters.category ||
      this.activeQuickFilter !== 'all'
    );
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.status) count++;
    if (this.filters.priority) count++;
    if (this.filters.category) count++;
    if (this.activeQuickFilter !== 'all') count++;
    return count;
  }
} 