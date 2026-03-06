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
import { TaskStatus, TaskPriority, TaskCategory } from '@data';
import { OrgContextService } from '../services/org-context.service';
import { OrganizationService } from '../services/organization.service';
import type { OrgMemberSummaryDto } from '@data';

@Component({
  selector: 'app-task-form-editable',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="task-form-drawer-body">
      <div class="task-form-drawer-content">
        <div class="task-form-field">
          <label for="title" class="task-form-label">Title *</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            placeholder="Enter task title"
            class="task-form-input"
            [class.border-red-500]="taskForm.get('title')?.invalid && taskForm.get('title')?.touched"
          />
          <div *ngIf="taskForm.get('title')?.invalid && taskForm.get('title')?.touched" class="task-form-error">
            <span *ngIf="taskForm.get('title')?.errors?.['required']">Title is required</span>
            <span *ngIf="taskForm.get('title')?.errors?.['maxlength']">Title must be less than 200 characters</span>
          </div>
        </div>
        <div class="task-form-field">
          <label for="description" class="task-form-label">Description</label>
          <textarea
            id="description"
            formControlName="description"
            rows="3"
            placeholder="Enter task description"
            class="task-form-input task-form-textarea"
            [class.border-red-500]="taskForm.get('description')?.invalid && taskForm.get('description')?.touched"
          ></textarea>
          <div *ngIf="taskForm.get('description')?.invalid && taskForm.get('description')?.touched" class="task-form-error">
            <span *ngIf="taskForm.get('description')?.errors?.['maxlength']">Description must be less than 1000 characters</span>
          </div>
        </div>
        <div class="task-form-row task-form-grid-2">
          <div class="task-form-field">
            <label for="priority" class="task-form-label">Priority</label>
            <select id="priority" formControlName="priority" class="task-form-input task-form-select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div class="task-form-field">
            <label for="category" class="task-form-label">Category</label>
            <select id="category" formControlName="category" class="task-form-input task-form-select">
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="project">Project</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="task-form-row task-form-grid-2">
          <div class="task-form-field">
            <label for="status" class="task-form-label">Status</label>
            <select id="status" formControlName="status" class="task-form-input task-form-select">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="task-form-field">
            <label for="dueDate" class="task-form-label">Due Date</label>
            <input
              id="dueDate"
              type="date"
              formControlName="dueDate"
              class="task-form-input"
              [min]="getMinDate()"
            />
          </div>
        </div>
        <div class="task-form-field">
          <label for="ownerId" class="task-form-label">Assigned To</label>
          <select
            id="ownerId"
            formControlName="ownerId"
            class="task-form-input task-form-select"
            [class.border-red-500]="taskForm.get('ownerId')?.invalid && taskForm.get('ownerId')?.touched"
          >
            <option value="">Unassigned (assign to me)</option>
            @for (m of orgMembers; track m.userId) {
              <option [value]="m.userId">{{ m.firstName }} {{ m.lastName }} ({{ m.email }})</option>
            }
          </select>
          <p class="task-form-hint">Select a member to assign the task to.</p>
          <div *ngIf="taskForm.get('ownerId')?.invalid && taskForm.get('ownerId')?.touched" class="task-form-error">
            <span *ngIf="taskForm.get('ownerId')?.errors?.['pattern']">Please select a valid member</span>
          </div>
        </div>
      </div>
      <div class="task-form-drawer-footer">
        <button type="button" (click)="onClose()" class="task-form-btn task-form-btn-secondary">Cancel</button>
        <button
          type="submit"
          [disabled]="taskForm.invalid || isLoading"
          class="task-form-btn task-form-btn-primary"
        >
          <span *ngIf="!isLoading">{{ task ? 'Update Task' : 'Create Task' }}</span>
          <span *ngIf="isLoading" class="flex items-center gap-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ task ? 'Updating...' : 'Creating...' }}
          </span>
        </button>
      </div>
    </form>
  `,
  styles: [],
})
export class TaskFormEditableComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private orgContext = inject(OrgContextService);
  private organizationService = inject(OrganizationService);

  @Input() task: any = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  orgMembers: OrgMemberSummaryDto[] = [];
  taskForm: FormGroup;
  isLoading = false;

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
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(c.value)
              ? null
              : { pattern: true },
        ],
      ],
    });
  }

  ngOnInit(): void {
    if (this.task) this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) this.loadOrgMembers();
    if (changes['task'] && this.task) this.populateForm();
  }

  get currentOrgId(): string | null {
    return this.orgContext.getCurrentOrgId();
  }

  private loadOrgMembers(): void {
    const orgId = this.task?.organizationId ?? this.currentOrgId;
    if (!orgId) {
      this.orgMembers = [];
      return;
    }
    this.organizationService.getMembers(orgId).subscribe({
      next: (members) => (this.orgMembers = members),
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
        dueDate: this.task.dueDate ? this.formatDateForInput(this.task.dueDate) : '',
        ownerId: this.task.ownerId || '',
      });
    }
  }

  onSubmit(): void {
    if (!this.taskForm.valid) {
      Object.keys(this.taskForm.controls).forEach((k) => this.taskForm.get(k)?.markAsTouched());
      return;
    }
    this.isLoading = true;
    const formValue = this.taskForm.value;
    const taskData = {
      ...formValue,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : null,
      ownerId: formValue.ownerId?.trim() ? formValue.ownerId.trim() : undefined,
    };
    setTimeout(() => {
      this.save.emit(taskData);
      this.isLoading = false;
    }, 500);
  }

  onClose(): void {
    this.close.emit();
    this.taskForm.reset({
      title: '',
      description: '',
      priority: 'medium',
      category: 'work',
      status: TaskStatus.TODO,
      dueDate: '',
      ownerId: '',
    });
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateForInput(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }
}
