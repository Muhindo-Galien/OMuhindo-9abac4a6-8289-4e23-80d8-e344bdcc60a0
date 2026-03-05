import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskCardComponent } from './task-card.component';
import { TaskFormComponent } from './task-form.component';
import { TaskFilterModalComponent } from './task-filter-modal.component';
import { TaskService } from '../services/task.service';
import { OrgContextService } from '../services/org-context.service';
import { CreateTaskDto, UpdateTaskDto, isChildOrg, TASKS_REQUIRE_SPACE_MESSAGE } from '@data';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TaskCardComponent, TaskFormComponent, TaskFilterModalComponent],
  template: `
    <div class="bg-gray-50 min-h-full">
      <!-- List toolbar: Filter + Create task -->
      <div class="container-padding py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white">
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="openFilterModal()"
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button
            type="button"
            (click)="openCreateModal()"
            [disabled]="!canCreateTasks()"
            [title]="canCreateTasks() ? 'Create task' : TASKS_REQUIRE_SPACE_MESSAGE"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-turbovets-navy rounded-lg hover:bg-turbovets-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Create task
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <main class="container-padding section-spacing">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div *ngFor="let item of [1,2,3,4,5,6]" class="task-card animate-pulse">
            <div class="h-4 bg-gray-200 rounded mb-3"></div>
            <div class="h-3 bg-gray-200 rounded mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div class="flex justify-between">
              <div class="h-6 bg-gray-200 rounded w-20"></div>
              <div class="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>

        <!-- Task Grid -->
        <div *ngIf="!isLoading && filteredTasks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <app-task-card
            *ngFor="let task of filteredTasks; trackBy: trackByTaskId"
            [task]="task"
            (edit)="openEditModal($event)"
            (delete)="deleteTask($event)"
            (statusChange)="updateTaskStatus($event.taskId, $event.status)"
            class="animate-fade-in"
          ></app-task-card>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && filteredTasks.length === 0" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ tasks.length === 0 ? 'Get started by creating a new task.' : 'Try adjusting your filters.' }}
          </p>
          <div class="mt-6">
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              New Task
            </button>
          </div>
        </div>

        <!-- Task Statistics -->
        <div *ngIf="tasks.length > 0" class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-gray-900">{{ getTaskCountByStatus('TODO') }}</div>
            <div class="text-sm text-gray-600">To Do</div>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-primary-600">{{ getTaskCountByStatus('IN_PROGRESS') }}</div>
            <div class="text-sm text-gray-600">In Progress</div>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-green-600">{{ getTaskCountByStatus('DONE') }}</div>
            <div class="text-sm text-gray-600">Completed</div>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-gray-900">{{ tasks.length }}</div>
            <div class="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </main>

      <!-- Filter Modal -->
      <app-task-filter-modal
        [isOpen]="filterModalOpen"
        [isLoading]="isLoading"
        (close)="closeFilterModal()"
        (filterChange)="onFiltersChange($event)"
      ></app-task-filter-modal>

      <!-- Task Form Modal -->
      <app-task-form
        *ngIf="showTaskModal"
        [task]="selectedTask"
        [isOpen]="showTaskModal"
        (close)="closeTaskModal()"
        (save)="onTaskSave($event)"
      ></app-task-form>
    </div>
  `,
  styles: [`
    .container-padding {
      @apply px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto;
    }
    
    .section-spacing {
      @apply py-6;
    }
    
    .flex-between {
      @apply flex items-center justify-between;
    }
    
    .task-card {
      @apply bg-white rounded-lg p-6 shadow-sm border border-gray-200;
    }
    
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private orgContext = inject(OrgContextService);

  tasks: any[] = [];
  filteredTasks: any[] = [];
  isLoading = false;
  showTaskModal = false;
  filterModalOpen = false;
  selectedTask: any = null;

  /** Shared with backend RequireSpaceOrgGuard: tasks only in spaces. */
  readonly TASKS_REQUIRE_SPACE_MESSAGE = TASKS_REQUIRE_SPACE_MESSAGE;

  canCreateTasks(): boolean {
    return isChildOrg(this.orgContext.getCurrentOrg());
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Tasks loaded:', tasks);
        this.tasks = tasks;
        this.filteredTasks = tasks;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
      }
    });
  }

  openFilterModal(): void {
    this.filterModalOpen = true;
  }

  closeFilterModal(): void {
    this.filterModalOpen = false;
  }

  onFiltersChange(filters: any): void {
    console.log('Filters changed:', filters);
    this.filteredTasks = this.taskService.filterTasks(this.tasks, filters);
  }

  openCreateModal(): void {
    if (!this.canCreateTasks()) return;
    this.selectedTask = null;
    this.showTaskModal = true;
  }

  openEditModal(task: any): void {
    this.selectedTask = task;
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = null;
  }

  onTaskSave(taskData: CreateTaskDto | UpdateTaskDto): void {
    if (this.selectedTask) {
      // Update existing task
      this.taskService.updateTask(this.selectedTask.id, taskData as UpdateTaskDto).subscribe({
        next: (updatedTask) => {
          console.log('Task updated:', updatedTask);
          this.loadTasks();
          this.closeTaskModal();
        },
        error: (error) => {
          console.error('Error updating task:', error);
        }
      });
    } else {
      // Create new task (scope to current org)
      const orgId = this.orgContext.getCurrentOrgId();
      const createDto: CreateTaskDto = { ...(taskData as CreateTaskDto), organizationId: orgId! };
      this.taskService.createTask(createDto).subscribe({
        next: (newTask) => {
          console.log('Task created:', newTask);
          this.loadTasks();
          this.closeTaskModal();
        },
        error: (error) => {
          console.error('Error creating task:', error);
        }
      });
    }
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          console.log('Task deleted:', taskId);
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  updateTaskStatus(taskId: string, status: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      this.taskService.updateTask(taskId, { status: status as any }).subscribe({
        next: (updatedTask) => {
          console.log('Task status updated:', updatedTask);
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error updating task status:', error);
        }
      });
    }
  }

  getTaskCountByStatus(status: string): number {
    return this.tasks.filter(task => task.status === status).length;
  }

  trackByTaskId(index: number, task: any): string {
    return task.id;
  }
} 