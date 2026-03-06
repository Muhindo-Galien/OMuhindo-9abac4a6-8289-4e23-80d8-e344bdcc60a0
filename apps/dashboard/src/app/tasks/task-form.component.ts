import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TaskStatus, TaskPriority, TaskCategory, RoleType } from '@data';
import { OrgContextService } from '../services/org-context.service';
import { OrganizationService } from '../services/organization.service';
import { TaskPermissionService } from '../services/task-permission.service';
import type { OrgMemberSummaryDto } from '@data';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Right-side panel overlay -->
    <div
      *ngIf="isOpen"
      class="task-form-drawer-overlay"
      [class.task-form-drawer-overlay--visible]="overlayVisible"
      (click)="onClose()"
    ></div>

    <!-- Right-side panel -->
    <div
      *ngIf="isOpen"
      class="task-form-drawer"
      [class.task-form-drawer--visible]="panelVisible"
      role="dialog"
      aria-labelledby="task-form-title"
    >
      <!-- Panel Header (sticky) -->
      <div class="task-form-drawer-header">
        <h2 id="task-form-title" class="task-form-drawer-title">
          {{ task ? 'Edit Task' : 'Create New Task' }}
        </h2>
        <button
          type="button"
          (click)="onClose()"
          class="task-form-drawer-close"
          aria-label="Close"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Form (scrollable body + sticky footer) -->
      <form
        [formGroup]="taskForm"
        (ngSubmit)="onSubmit()"
        class="task-form-drawer-body"
      >
        <div class="task-form-drawer-content">
          <!-- Title Field -->
          <div class="task-form-field">
            <label for="title" class="task-form-label">Title *</label>
            <input
              id="title"
              type="text"
              formControlName="title"
              placeholder="Enter task title"
              class="task-form-input"
              [class.border-red-500]="
                taskForm.get('title')?.invalid && taskForm.get('title')?.touched
              "
            />
            <div
              *ngIf="
                taskForm.get('title')?.invalid && taskForm.get('title')?.touched
              "
              class="task-form-error"
            >
              <span *ngIf="taskForm.get('title')?.errors?.['required']"
                >Title is required</span
              >
              <span *ngIf="taskForm.get('title')?.errors?.['maxlength']"
                >Title must be less than 200 characters</span
              >
            </div>
          </div>

          <!-- Description Field -->
          <div class="task-form-field">
            <label for="description" class="task-form-label">Description</label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              placeholder="Enter task description"
              class="task-form-input task-form-textarea"
              [class.border-red-500]="
                taskForm.get('description')?.invalid &&
                taskForm.get('description')?.touched
              "
            ></textarea>
            <div
              *ngIf="
                taskForm.get('description')?.invalid &&
                taskForm.get('description')?.touched
              "
              class="task-form-error"
            >
              <span *ngIf="taskForm.get('description')?.errors?.['maxlength']"
                >Description must be less than 1000 characters</span
              >
            </div>
          </div>

          <!-- Priority and Category Row -->
          <div class="task-form-row task-form-grid-2">
            <!-- Priority Field -->
            <div class="task-form-field">
              <label for="priority" class="task-form-label"> Priority </label>
              <select
                id="priority"
                formControlName="priority"
                class="task-form-input task-form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <!-- Category Field -->
            <div class="task-form-field">
              <label for="category" class="task-form-label"> Category </label>
              <select
                id="category"
                formControlName="category"
                class="task-form-input task-form-select"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="project">Project</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <!-- Status and Due Date Row -->
          <div class="task-form-row task-form-grid-2">
            <!-- Status Field -->
            <div class="task-form-field">
              <label for="status" class="task-form-label"> Status </label>
              <select
                id="status"
                formControlName="status"
                class="task-form-input task-form-select"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <!-- Due Date Field -->
            <div class="task-form-field">
              <label for="dueDate" class="task-form-label"> Due Date </label>
              <input
                id="dueDate"
                type="date"
                formControlName="dueDate"
                class="task-form-input"
                [min]="getMinDate()"
              />
            </div>
          </div>

          <!-- Assigned To: only Admin/Owner can change; Viewer sees "Assigned to you" -->
          <div class="task-form-field" *ngIf="canChangeAssignee">
            <label for="ownerId" class="task-form-label">Assigned To</label>
            <select
              id="ownerId"
              formControlName="ownerId"
              class="task-form-input task-form-select"
              [class.border-red-500]="
                taskForm.get('ownerId')?.invalid &&
                taskForm.get('ownerId')?.touched
              "
            >
              <option value="">Unassigned (assign to me)</option>
              @for (m of orgMembers; track m.userId) {
              <option [value]="m.userId">
                {{ m.firstName }} {{ m.lastName }} ({{ m.email }})
              </option>
              }
            </select>
            <p class="task-form-hint">Select a member to assign the task to.</p>
            <div
              *ngIf="
                taskForm.get('ownerId')?.invalid &&
                taskForm.get('ownerId')?.touched
              "
              class="task-form-error"
            >
              <span *ngIf="taskForm.get('ownerId')?.errors?.['pattern']"
                >Please select a valid member</span
              >
            </div>
          </div>
          <div class="task-form-field" *ngIf="!canChangeAssignee">
            <span class="task-form-label">Assigned To</span>
            <p class="task-form-hint mt-1">Assigned to you</p>
          </div>
        </div>

        <!-- Form Actions (sticky footer) -->
        <div class="task-form-drawer-footer">
          <button
            type="button"
            (click)="onClose()"
            class="task-form-btn task-form-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="taskForm.invalid || isLoading"
            class="task-form-btn task-form-btn-primary"
          >
            <span *ngIf="!isLoading">{{
              task ? 'Update Task' : 'Create Task'
            }}</span>
            <span *ngIf="isLoading" class="flex items-center gap-2">
              <svg
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ task ? 'Updating...' : 'Creating...' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      /* Overlay */
      .task-form-drawer-overlay {
        position: fixed;
        inset: 0;
        z-index: 40;
        background-color: rgba(17, 24, 39, 0.5);
        opacity: 0;
        transition: opacity 0.25s ease-out;
        backdrop-filter: blur(2px);
      }
      .task-form-drawer-overlay--visible {
        opacity: 1;
      }

      /* Drawer panel – responsive width */
      .task-form-drawer {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 50;
        width: 100%;
        max-width: 100%;
        height: 100vh;
        height: 100dvh;
        background: white;
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
      }
      @media (min-width: 384px) {
        .task-form-drawer {
          max-width: 24rem;
        }
      }
      @media (min-width: 512px) {
        .task-form-drawer {
          max-width: 28rem;
        }
      }
      @media (min-width: 640px) {
        .task-form-drawer {
          max-width: 32rem;
        }
      }
      .task-form-drawer--visible {
        transform: translateX(0);
      }

      /* Header – responsive padding */
      .task-form-drawer-header {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1rem 1rem 1rem 1.25rem;
        border-bottom: 1px solid #e5e7eb;
        background: white;
      }
      @media (min-width: 384px) {
        .task-form-drawer-header {
          padding: 1.25rem 1.25rem 1.25rem 1.5rem;
        }
      }
      @media (min-width: 640px) {
        .task-form-drawer-header {
          padding: 1.25rem 1.5rem 1.25rem 1.75rem;
        }
      }
      .task-form-drawer-title {
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 600;
        line-height: 1.4;
        color: #111827;
      }
      @media (min-width: 384px) {
        .task-form-drawer-title {
          font-size: 1.125rem;
        }
      }
      .task-form-drawer-close {
        flex-shrink: 0;
        padding: 0.5rem;
        border-radius: 0.5rem;
        color: #9ca3af;
        transition: color 0.15s, background-color 0.15s;
      }
      .task-form-drawer-close:hover {
        background-color: #f3f4f6;
        color: #4b5563;
      }
      .task-form-drawer-close:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }

      /* Body & scrollable content */
      .task-form-drawer-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
      .task-form-drawer-content {
        overflow-y: auto;
        flex: 1;
        min-height: 0;
        padding: 1rem 1rem 1.25rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      @media (min-width: 384px) {
        .task-form-drawer-content {
          padding: 1.25rem 1.25rem 1.5rem 1.5rem;
          gap: 1.5rem;
        }
      }
      @media (min-width: 640px) {
        .task-form-drawer-content {
          padding: 1.5rem 1.5rem 1.75rem 1.75rem;
          gap: 1.5rem;
        }
      }

      /* Form field block */
      .task-form-field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      .task-form-label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #374151;
      }
      @media (min-width: 384px) {
        .task-form-label {
          font-size: 0.875rem;
        }
      }
      .task-form-input,
      .task-form-select,
      .task-form-textarea {
        width: 100%;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #111827;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .task-form-input::placeholder,
      .task-form-textarea::placeholder {
        color: #9ca3af;
      }
      .task-form-input:focus,
      .task-form-select:focus,
      .task-form-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
      }
      .task-form-textarea {
        resize: none;
        min-height: 4.5rem;
      }
      .task-form-select {
        cursor: pointer;
        appearance: auto;
      }
      .task-form-error {
        font-size: 0.8125rem;
        color: #dc2626;
      }
      .task-form-hint {
        margin: 0;
        font-size: 0.75rem;
        color: #6b7280;
      }

      /* Responsive grid: 1 col on narrow, 2 cols when room */
      .task-form-row {
        display: grid;
        gap: 1rem;
      }
      .task-form-grid-2 {
        grid-template-columns: 1fr;
      }
      @media (min-width: 384px) {
        .task-form-grid-2 {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Footer – responsive padding */
      .task-form-drawer-footer {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1rem 1rem 1.25rem;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }
      @media (min-width: 384px) {
        .task-form-drawer-footer {
          padding: 1rem 1.25rem 1rem 1.5rem;
        }
      }
      @media (min-width: 640px) {
        .task-form-drawer-footer {
          padding: 1.25rem 1.5rem 1.25rem 1.75rem;
        }
      }
      .task-form-btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.5;
        border-radius: 0.5rem;
        transition: background-color 0.15s, border-color 0.15s, color 0.15s;
      }
      .task-form-btn:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }
      .task-form-btn-secondary {
        color: #374151;
        background: white;
        border: 1px solid #d1d5db;
      }
      .task-form-btn-secondary:hover {
        background: #f9fafb;
      }
      .task-form-btn-primary {
        color: white;
        background: #2563eb;
        border: 1px solid transparent;
      }
      .task-form-btn-primary:hover:not(:disabled) {
        background: #1d4ed8;
      }
      .task-form-btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class TaskFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private orgContext = inject(OrgContextService);
  private organizationService = inject(OrganizationService);
  private taskPermissionService = inject(TaskPermissionService);

  @Input() task: any = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  /** Used for enter animation (overlay fade-in). */
  overlayVisible = false;
  /** Used for enter animation (panel slide-in from right). */
  panelVisible = false;

  /** Org members for assignment dropdown (current space). */
  orgMembers: OrgMemberSummaryDto[] = [];

  taskForm: FormGroup;
  isLoading = false;

  // Enum access for template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;
  TaskCategory = TaskCategory;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      priority: ['medium'],
      category: ['work'],
      status: [TaskStatus.TODO],
      dueDate: [''],
      ownerId: [
        '',
        [
          (c: { value: string }) =>
            !c.value ||
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              c.value
            )
              ? null
              : { pattern: true },
        ],
      ],
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.populateForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.overlayVisible = false;
        this.panelVisible = false;
        this.loadOrgMembers();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.overlayVisible = true;
            this.panelVisible = true;
          });
        });
      } else {
        this.overlayVisible = false;
        this.panelVisible = false;
      }
    }
    if (changes['task'] && this.task) {
      this.populateForm();
    }
  }

  /** Current space org id (tasks are only in spaces). */
  get currentOrgId(): string | null {
    return this.orgContext.getCurrentOrgId();
  }

  /** Only Admin and Owner can change assignee; Viewer is always assigned to themselves. */
  get canChangeAssignee(): boolean {
    const role = this.taskPermissionService.getRoleForOrg(this.currentOrgId);
    return role === RoleType.ADMIN || role === RoleType.OWNER;
  }

  private loadOrgMembers(): void {
    const orgId = this.task?.organizationId ?? this.currentOrgId;
    if (!orgId) {
      this.orgMembers = [];
      return;
    }
    this.organizationService.getMembers(orgId).subscribe({
      next: members => (this.orgMembers = members),
      error: () => (this.orgMembers = []),
    });
  }

  populateForm(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title || '',
        description: this.task.description || '',
        priority: this.task.priority || 'medium',
        category: this.task.category || 'work',
        status: this.task.status || TaskStatus.TODO,
        dueDate: this.task.dueDate
          ? this.formatDateForInput(this.task.dueDate)
          : '',
        ownerId: this.task.ownerId || '',
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.isLoading = true;

      const formValue = this.taskForm.value;
      const taskData = {
        ...formValue,
        dueDate: formValue.dueDate
          ? new Date(formValue.dueDate).toISOString()
          : null,
        ownerId:
          formValue.ownerId && formValue.ownerId.trim() !== ''
            ? formValue.ownerId.trim()
            : undefined,
      };
      if (!this.canChangeAssignee) {
        taskData.ownerId = undefined;
      }

      console.log('Submitting task:', taskData);

      // Simulate API call delay
      setTimeout(() => {
        this.save.emit(taskData);
        this.isLoading = false;
      }, 500);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.get(key)?.markAsTouched();
      });
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.taskForm.reset({
      title: '',
      description: '',
      priority: 'medium',
      category: 'work',
      status: TaskStatus.TODO,
      dueDate: '',
    });
    this.isLoading = false;
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}
