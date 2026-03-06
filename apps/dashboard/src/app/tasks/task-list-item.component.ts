import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskStatus, TaskPriority, TaskCategory } from '@data';

@Component({
  selector: 'app-task-list-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="task-list-row"
      (click)="$event.stopPropagation()"
    >
      <!-- 1. Priority -->
      <div class="task-list-cell task-list-cell-priority">
        <span
          [class]="getPriorityClass(task.priority)"
          class="task-list-priority-label"
        >
          {{ getPriorityLabel(task.priority) }}
        </span>
      </div>

      <!-- 2. Title -->
      <div class="task-list-cell task-list-cell-title">
        <span class="task-list-title-text" [title]="task.title">{{ task.title }}</span>
      </div>

      <!-- 3. Status -->
      <div class="task-list-cell task-list-cell-status">
        <select
          *ngIf="canEdit"
          [value]="task.status"
          (change)="onStatusChange($event)"
          (click)="$event.stopPropagation()"
          [class]="getStatusClass(task.status)"
          class="task-list-status-select"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span
          *ngIf="!canEdit"
          [class]="getStatusClass(task.status)"
          class="task-list-status-badge"
        >
          {{ task.status | uppercase }}
        </span>
      </div>

      <!-- 4. Category -->
      <div class="task-list-cell task-list-cell-category">
        <span
          [class]="getCategoryClass(task.category)"
          class="task-list-category-badge"
        >
          {{ getCategoryLabel(task.category) }}
        </span>
      </div>

      <!-- 5. Initials -->
      <div class="task-list-cell task-list-cell-initials">
        <span
          class="task-list-initials"
          [title]="getAssigneeName()"
          [attr.aria-label]="getAssigneeName()"
        >
          {{ getAssigneeInitials() }}
        </span>
      </div>

      <!-- 5. More -->
      <div class="task-list-cell task-list-cell-more">
        <div class="task-list-more-wrap" *ngIf="canEdit || canDelete">
          <button
            type="button"
            (click)="showActions = !showActions; $event.stopPropagation()"
            class="task-list-more-btn"
            aria-label="More actions"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          <div
            *ngIf="showActions"
            class="task-list-dropdown"
            (click)="showActions = false"
          >
            <button *ngIf="canEdit" type="button" (click)="onEdit()" class="task-list-dropdown-item">
              Edit
            </button>
            <button *ngIf="canDelete" type="button" (click)="onDelete()" class="task-list-dropdown-item task-list-dropdown-item-danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .task-list-row {
        @apply flex items-center gap-0 min-w-[620px] border-b border-gray-200 bg-white hover:bg-gray-50/80 transition-colors;
      }
      .task-list-cell {
        @apply flex items-center flex-shrink-0 py-3 px-3;
      }
      .task-list-cell-priority {
        width: 5rem;
        min-width: 5rem;
      }
      .task-list-priority-label {
        @apply text-xs font-medium px-2 py-0.5 rounded;
      }
      .task-list-priority-label.bg-priority-low { @apply bg-gray-100 text-gray-700; }
      .task-list-priority-label.bg-priority-medium { @apply bg-blue-100 text-blue-800; }
      .task-list-priority-label.bg-priority-high { @apply bg-amber-100 text-amber-800; }
      .task-list-priority-label.bg-priority-urgent { @apply bg-red-100 text-red-800; }

      .task-list-cell-title {
        @apply min-w-[120px] flex-1 max-w-[280px];
      }
      .task-list-title-text {
        @apply text-gray-900 text-sm font-medium truncate block;
      }

      .task-list-cell-status {
        @apply w-[130px] min-w-[130px];
      }
      .task-list-status-select,
      .task-list-status-badge {
        @apply px-2.5 py-1 rounded-md text-xs font-medium text-white cursor-pointer appearance-none pr-7 border-0;
      }
      .task-list-status-badge { @apply cursor-default; }
      .task-list-status-select.bg-status-todo,
      .task-list-status-badge.bg-status-todo { background-color: var(--status-todo, #6b7280); }
      .task-list-status-select.bg-status-progress,
      .task-list-status-badge.bg-status-progress { background-color: var(--status-progress, #2563eb); }
      .task-list-status-select.bg-status-done,
      .task-list-status-badge.bg-status-done { background-color: var(--status-done, #059669); }
      .task-list-status-select.bg-status-blocked,
      .task-list-status-badge.bg-status-blocked { background-color: var(--status-blocked, #6b7280); }

      .task-list-cell-category {
        @apply w-[100px] min-w-[100px];
      }
      .task-list-category-badge {
        @apply text-xs font-medium px-2 py-0.5 rounded;
      }
      .task-list-category-badge.bg-cat-work { @apply bg-blue-100 text-blue-800; }
      .task-list-category-badge.bg-cat-personal { @apply bg-green-100 text-green-800; }
      .task-list-category-badge.bg-cat-project { @apply bg-indigo-100 text-indigo-800; }
      .task-list-category-badge.bg-cat-meeting { @apply bg-purple-100 text-purple-800; }
      .task-list-category-badge.bg-cat-other { @apply bg-gray-100 text-gray-800; }

      .task-list-cell-initials {
        @apply w-12 min-w-[3rem] justify-center;
      }
      .task-list-initials {
        @apply w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0;
        background-color: #059669;
      }

      .task-list-cell-more {
        @apply min-w-[5rem] pl-8 justify-end;
      }
      .task-list-more-wrap { @apply relative; }
      .task-list-more-btn {
        @apply p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors;
      }
      .task-list-dropdown {
        @apply absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20;
      }
      .task-list-dropdown-item {
        @apply w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50;
      }
      .task-list-dropdown-item-danger {
        @apply text-red-600 hover:bg-red-50;
      }
    `,
  ],
})
export class TaskListItemComponent {
  @Input() task: any = {};
  @Input() canEdit = true;
  @Input() canDelete = true;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<{ taskId: string; status: string }>();

  showActions = false;

  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusChange.emit({ taskId: this.task.id, status: target.value });
  }

  getPriorityClass(priority: string): string {
    const m: Record<string, string> = {
      low: 'bg-priority-low',
      medium: 'bg-priority-medium',
      high: 'bg-priority-high',
      urgent: 'bg-priority-urgent',
    };
    return m[priority] || 'bg-priority-low';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
    return labels[priority] || priority;
  }

  getAssigneeInitials(): string {
    const o = this.task?.owner;
    if (o?.firstName && o?.lastName) return (o.firstName[0] + o.lastName[0]).toUpperCase();
    if (o?.firstName) return o.firstName.slice(0, 2).toUpperCase();
    if (o?.email) return o.email.slice(0, 2).toUpperCase();
    return '?';
  }

  getAssigneeName(): string {
    const o = this.task?.owner;
    if (o?.firstName && o?.lastName) return `${o.firstName} ${o.lastName}`;
    if (o?.email) return o.email;
    return 'Unassigned';
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      [TaskStatus.TODO]: 'bg-status-todo',
      [TaskStatus.IN_PROGRESS]: 'bg-status-progress',
      [TaskStatus.DONE]: 'bg-status-done',
      [TaskStatus.CANCELLED]: 'bg-status-blocked',
    };
    return statusClasses[status] || 'bg-gray-500';
  }

  getCategoryClass(category: string): string {
    const m: Record<string, string> = {
      work: 'bg-cat-work',
      personal: 'bg-cat-personal',
      project: 'bg-cat-project',
      meeting: 'bg-cat-meeting',
      other: 'bg-cat-other',
    };
    return m[category] || 'bg-cat-other';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      work: 'Work',
      personal: 'Personal',
      project: 'Project',
      meeting: 'Meeting',
      other: 'Other',
    };
    return labels[category] || 'Other';
  }
}
