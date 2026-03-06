import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskStatus, TaskPriority, TaskCategory } from '@data';

@Component({
  selector: 'app-task-form-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-form-drawer-body">
      <div class="task-form-drawer-content">
        <div class="task-form-field">
          <span class="task-form-label">Title</span>
          <p class="task-form-value">{{ task?.title || '—' }}</p>
        </div>
        <div class="task-form-field">
          <span class="task-form-label">Description</span>
          <p class="task-form-value task-form-value-multiline">{{ task?.description || '—' }}</p>
        </div>
        <div class="task-form-row task-form-grid-2">
          <div class="task-form-field">
            <span class="task-form-label">Priority</span>
            <p class="task-form-value">{{ formatPriority(task?.priority) }}</p>
          </div>
          <div class="task-form-field">
            <span class="task-form-label">Category</span>
            <p class="task-form-value">{{ formatCategory(task?.category) }}</p>
          </div>
        </div>
        <div class="task-form-row task-form-grid-2">
          <div class="task-form-field">
            <span class="task-form-label">Status</span>
            <p class="task-form-value">{{ formatStatus(task?.status) }}</p>
          </div>
          <div class="task-form-field">
            <span class="task-form-label">Due Date</span>
            <p class="task-form-value">{{ formatDueDate(task?.dueDate) }}</p>
          </div>
        </div>
        <div class="task-form-field">
          <span class="task-form-label">Assigned To</span>
          <p class="task-form-value">{{ assignedToLabel }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class TaskFormViewComponent {
  @Input() task: any = null;

  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;
  TaskCategory = TaskCategory;

  get assignedToLabel(): string {
    if (!this.task) return '—';
    const o = this.task.owner;
    if (o?.firstName != null || o?.lastName != null) {
      return [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email || '—';
    }
    return this.task.ownerId ? `User (${this.task.ownerId})` : 'Unassigned';
  }

  formatStatus(s: string | undefined): string {
    if (!s) return '—';
    const v = (s + '').toLowerCase().replace(/_/g, ' ');
    return v.charAt(0).toUpperCase() + v.slice(1);
  }

  formatPriority(p: string | undefined): string {
    if (!p) return '—';
    return (p + '').charAt(0).toUpperCase() + (p + '').slice(1).toLowerCase();
  }

  formatCategory(c: string | undefined): string {
    if (!c) return '—';
    return (c + '').charAt(0).toUpperCase() + (c + '').slice(1).toLowerCase();
  }

  formatDueDate(d: string | Date | undefined): string {
    if (!d) return '—';
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  }
}
