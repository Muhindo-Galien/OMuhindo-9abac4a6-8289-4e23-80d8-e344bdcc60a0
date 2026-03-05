import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskFiltersComponent } from './task-filters.component';

/**
 * Modal that contains all task filters (basic + advanced). Opened when Filter icon is clicked.
 */
@Component({
  selector: 'app-task-filter-modal',
  standalone: true,
  imports: [CommonModule, TaskFiltersComponent],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-modal="true"
        role="dialog"
        aria-labelledby="filter-modal-title"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-gray-500/75 transition-opacity"
            (click)="close.emit()"
          ></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 id="filter-modal-title" class="text-lg font-semibold text-gray-900">Filter</h2>
              <button
                type="button"
                (click)="close.emit()"
                class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-label="Close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="overflow-y-auto max-h-[calc(90vh-5rem)] p-6">
              <app-task-filters
                [isLoading]="isLoading()"
                (filterChange)="filterChange.emit($event)"
              ></app-task-filters>
            </div>
            <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                (click)="close.emit()"
                class="px-4 py-2 text-sm font-medium text-white bg-turbovets-navy rounded-lg hover:bg-turbovets-navy/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class TaskFilterModalComponent {
  isOpen = input(false);
  isLoading = input(false);
  close = output<void>();
  filterChange = output<any>();
}
