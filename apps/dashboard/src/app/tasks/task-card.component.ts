import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskStatus, TaskPriority, TaskCategory } from '@data';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-card task-card-hover group">
      <!-- Title + More on same line; title up to 2 lines, more in corner -->
      <div class="task-card-header">
        <h3 class="task-card-title">
          {{ task.title }}
        </h3>
        <div class="task-card-actions" *ngIf="canEdit || canDelete">
          <button
            type="button"
            (click)="showActions = !showActions; $event.stopPropagation()"
            class="task-card-more"
            aria-label="More actions"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
              />
            </svg>
          </button>
          <div
            *ngIf="showActions"
            class="task-card-dropdown"
            (click)="showActions = false"
          >
            <button
              *ngIf="canEdit"
              type="button"
              (click)="onEdit()"
              class="task-card-dropdown-item"
            >
              Edit
            </button>
            <button
              *ngIf="canDelete"
              type="button"
              (click)="onDelete()"
              class="task-card-dropdown-item task-card-dropdown-item-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Row: Priority only -->
      <div class="task-card-meta">
        <span
          [class]="getPriorityClass(task.priority)"
          class="task-card-priority"
        >
          {{ getPriorityLabel(task.priority) }}
        </span>
      </div>

      <!-- Footer: Status + Assignee initials -->
      <div class="task-card-footer">
        <div class="task-card-status">
          <select
            *ngIf="canEdit"
            [value]="task.status"
            (change)="onStatusChange($event)"
            [class]="getStatusClass(task.status)"
            class="task-card-status-select"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span
            *ngIf="!canEdit"
            [class]="getStatusClass(task.status)"
            class="task-card-status-badge"
          >
            {{ task.status | uppercase }}
          </span>
        </div>
        <span class="task-card-assignee" [title]="getAssigneeName()">
          {{ getAssigneeInitials() }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .task-card {
        @apply bg-white rounded-xl p-4 shadow-sm border border-gray-200 transition-all duration-200 flex flex-col gap-3;
      }
      .task-card-hover:hover {
        @apply shadow-md border-gray-300 -translate-y-0.5;
      }
      .task-card-header {
        @apply flex items-start gap-2 min-w-0;
      }
      .task-card-title {
        @apply text-gray-900 font-semibold text-[15px] leading-snug flex-1 min-w-0 line-clamp-2;
      }
      .task-card-meta {
        @apply flex items-center gap-2 flex-wrap;
      }
      .task-card-priority {
        @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-gray-700;
      }
      .task-card-priority.bg-priority-low {
        @apply bg-gray-100 text-gray-700;
      }
      .task-card-priority.bg-priority-medium {
        @apply bg-blue-100 text-blue-800;
      }
      .task-card-priority.bg-priority-high {
        @apply bg-amber-100 text-amber-800;
      }
      .task-card-priority.bg-priority-urgent {
        @apply bg-red-100 text-red-800;
      }
      .task-card-assignee {
        @apply w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0;
        background-color: #059669;
      }
      .task-card-actions {
        @apply relative flex-shrink-0;
      }
      .task-card-more {
        @apply p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors;
      }
      .task-card-dropdown {
        @apply absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10;
      }
      .task-card-dropdown-item {
        @apply w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50;
      }
      .task-card-dropdown-item-danger {
        @apply text-red-600 hover:bg-red-50;
      }
      .task-card-footer {
        @apply flex items-center justify-between gap-2 pt-1 border-t border-gray-100;
      }
      .task-card-footer .task-card-assignee {
        @apply w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0;
        background-color: #059669;
      }
      .task-card-status-select,
      .task-card-status-badge {
        @apply px-2.5 py-1 rounded-full text-xs font-medium text-white cursor-pointer appearance-none pr-6;
      }
      .task-card-status-badge {
        @apply cursor-default;
      }
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class TaskCardComponent {
  @Input() task: any = {};
  /** Whether the user can edit this task (from org role / task:update). Default true for backward compatibility. */
  @Input() canEdit = true;
  /** Whether the user can delete this task (from org role / task:delete). Default true for backward compatibility. */
  @Input() canDelete = true;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<{
    taskId: string;
    status: string;
  }>();

  showActions = false;

  // Enum access for template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;
  TaskCategory = TaskCategory;

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newStatus = target.value;
    this.statusChange.emit({ taskId: this.task.id, status: newStatus });
  }

  getPriorityClass(priority: string): string {
    const priorityClasses = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-amber-100 text-amber-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return (
      priorityClasses[priority as keyof typeof priorityClasses] ||
      'bg-gray-100 text-gray-700'
    );
  }

  getPriorityLabel(priority: string): string {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    };
    return (labels[priority as keyof typeof labels] || priority) as string;
  }

  getAssigneeInitials(): string {
    const o = this.task?.owner;
    if (o?.firstName && o?.lastName)
      return (o.firstName[0] + o.lastName[0]).toUpperCase();
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
    const statusClasses = {
      [TaskStatus.TODO]: 'bg-status-todo',
      [TaskStatus.IN_PROGRESS]: 'bg-status-progress',
      [TaskStatus.DONE]: 'bg-status-done',
      [TaskStatus.CANCELLED]: 'bg-status-blocked',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-500';
  }

  getCategoryClass(category: string): string {
    const categoryClasses = {
      work: 'bg-blue-100 text-blue-800',
      personal: 'bg-green-100 text-green-800',
      project: 'bg-indigo-100 text-indigo-800',
      meeting: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return (
      categoryClasses[category as keyof typeof categoryClasses] ||
      'bg-gray-100 text-gray-800'
    );
  }

  getProgressPercentage(): number {
    // Simple progress calculation based on status
    if (this.task.status === TaskStatus.TODO) return 0;
    if (this.task.status === TaskStatus.IN_PROGRESS) return 50;
    if (this.task.status === TaskStatus.DONE) return 100;
    if (this.task.status === TaskStatus.CANCELLED) return 0;
    return 25; // Default for other statuses
  }
}
