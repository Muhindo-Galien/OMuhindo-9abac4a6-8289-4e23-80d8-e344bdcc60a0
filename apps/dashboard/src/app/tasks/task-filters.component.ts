import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TaskFilterValues {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  sortBy?: string;
  quickFilter?: string;
}

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="task-filters-root">
      @if (showSearch) {
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
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
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              [disabled]="isLoading"
            />
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
        <div class="flex flex-wrap gap-2">
          @for (quickFilter of quickFilters; track quickFilter.value) {
            <button
              type="button"
              (click)="applyQuickFilter(quickFilter.value)"
              [class]="getQuickFilterClass(quickFilter.value)"
              class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200"
            >
              {{ quickFilter.label }}
            </button>
          }
        </div>
      </div>
      }

      @if (!showSearch) {
      <div class="flex flex-wrap gap-2 mb-4">
        @for (quickFilter of quickFilters; track quickFilter.value) {
          <button
            type="button"
            (click)="applyQuickFilter(quickFilter.value)"
            [class]="getQuickFilterClass(quickFilter.value)"
            class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200"
          >
            {{ quickFilter.label }}
          </button>
        }
      </div>
      }

      <!-- Advanced filters: all visible, each row expandable -->
      <div class="advanced-filters space-y-1">
        <!-- Status -->
        <div class="advanced-row border-b border-gray-100">
          <button
            type="button"
            (click)="expanded.status = !expanded.status"
            class="advanced-row-header"
          >
            <svg
              [class.rotate-180]="expanded.status"
              class="w-4 h-4 flex-shrink-0 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="text-sm font-medium text-gray-700">Status</span>
          </button>
          @if (expanded.status) {
            <div class="advanced-row-content">
              <select
                [(ngModel)]="filters.status"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                [disabled]="isLoading"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          }
        </div>

        <!-- Priority -->
        <div class="advanced-row border-b border-gray-100">
          <button
            type="button"
            (click)="expanded.priority = !expanded.priority"
            class="advanced-row-header"
          >
            <svg
              [class.rotate-180]="expanded.priority"
              class="w-4 h-4 flex-shrink-0 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="text-sm font-medium text-gray-700">Priority</span>
          </button>
          @if (expanded.priority) {
            <div class="advanced-row-content">
              <select
                [(ngModel)]="filters.priority"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                [disabled]="isLoading"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          }
        </div>

        <!-- Category -->
        <div class="advanced-row border-b border-gray-100">
          <button
            type="button"
            (click)="expanded.category = !expanded.category"
            class="advanced-row-header"
          >
            <svg
              [class.rotate-180]="expanded.category"
              class="w-4 h-4 flex-shrink-0 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="text-sm font-medium text-gray-700">Category</span>
          </button>
          @if (expanded.category) {
            <div class="advanced-row-content">
              <select
                [(ngModel)]="filters.category"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
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
          }
        </div>

        <!-- Sort By -->
        <div class="advanced-row border-b border-gray-100">
          <button
            type="button"
            (click)="expanded.sortBy = !expanded.sortBy"
            class="advanced-row-header"
          >
            <svg
              [class.rotate-180]="expanded.sortBy"
              class="w-4 h-4 flex-shrink-0 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="text-sm font-medium text-gray-700">Sort By</span>
          </button>
          @if (expanded.sortBy) {
            <div class="advanced-row-content">
              <select
                [(ngModel)]="filters.sortBy"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                [disabled]="isLoading"
              >
                <option value="createdAt">Created Date</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
            </div>
          }
        </div>
      </div>

      <div class="mt-4 flex justify-between items-center">
        <span class="text-xs text-gray-500">{{ getActiveFilterCount() }} filter(s) active</span>
        <button
          type="button"
          (click)="clearAllFilters()"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          [disabled]="!hasActiveFilters()"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .task-filters-root {
        @apply bg-white rounded-lg border border-gray-200 p-4;
      }
      .advanced-filters {
        @apply pt-2;
      }
      .advanced-row-header {
        @apply w-full flex items-center gap-2 py-2 text-left hover:bg-gray-50 rounded;
      }
      .advanced-row-content {
        @apply pb-3 pl-6;
      }
      .rotate-180 {
        transform: rotate(180deg);
      }
    `,
  ],
})
export class TaskFiltersComponent implements OnChanges {
  @Input() isLoading = false;
  /** When false, search input is hidden (e.g. when search lives in the toolbar). */
  @Input() showSearch = true;
  /** Optional initial/current filter values from parent (e.g. when used in dropdown). */
  @Input() filterValues: TaskFilterValues | null = null;
  @Output() filterChange = new EventEmitter<TaskFilterValues & { quickFilter: string }>();

  expanded = {
    status: true,
    priority: true,
    category: true,
    sortBy: true,
  };

  filters: TaskFilterValues & { search: string } = {
    search: '',
    status: '',
    priority: '',
    category: '',
    sortBy: 'createdAt',
  };

  quickFilters = [
    { label: 'All', value: 'all' },
    { label: 'My Tasks', value: 'my' },
    { label: 'Due Today', value: 'due-today' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'High Priority', value: 'high-priority' },
  ];

  activeQuickFilter = 'all';

  ngOnChanges(changes: SimpleChanges): void {
    const v = changes['filterValues'];
    if (v && v.currentValue) {
      const f = v.currentValue as TaskFilterValues;
      this.filters = {
        search: f.search ?? '',
        status: f.status ?? '',
        priority: f.priority ?? '',
        category: f.category ?? '',
        sortBy: f.sortBy ?? 'createdAt',
      };
      if (f.quickFilter) this.activeQuickFilter = f.quickFilter;
    }
  }

  onFilterChange(): void {
    this.filterChange.emit({
      ...this.filters,
      quickFilter: this.activeQuickFilter,
    });
  }

  clearSearch(): void {
    this.filters.search = '';
    this.onFilterChange();
  }

  applyQuickFilter(filterValue: string): void {
    this.activeQuickFilter = filterValue;
    if (filterValue !== 'all') {
      this.filters.status = '';
      this.filters.priority = '';
      this.filters.category = '';
    }
    this.onFilterChange();
  }

  getQuickFilterClass(filterValue: string): string {
    const isActive = this.activeQuickFilter === filterValue;
    if (isActive) {
      return 'bg-primary-100 text-primary-800 border border-primary-200';
    }
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200';
  }

  clearAllFilters(emitChange = true): void {
    this.filters = {
      search: '',
      status: '',
      priority: '',
      category: '',
      sortBy: 'createdAt',
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
