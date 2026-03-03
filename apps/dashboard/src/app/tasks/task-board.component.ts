import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { TaskCardComponent } from './task-card.component';
import { TaskFormComponent } from './task-form.component';
import { TaskFiltersComponent } from './task-filters.component';
import { TaskService, BulkUpdateTask } from '../services/task.service';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskStatus } from '@data';

interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskResponseDto[];
  color: string;
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule, TaskCardComponent, TaskFormComponent, TaskFiltersComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="container-padding py-6">
          <div class="flex-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Task Board</h1>
              <p class="text-gray-600 mt-1">Drag and drop to organize your tasks</p>
            </div>
            <div class="flex items-center gap-4">
              <button
                (click)="toggleView()"
                class="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        [attr.d]="isListView ? 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' : 'M4 6h16M4 10h16M4 14h16M4 18h16'"></path>
                </svg>
                {{ isListView ? 'Board View' : 'List View' }}
              </button>
              <button
                (click)="openCreateModal()"
                class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Task
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container-padding section-spacing">
        <!-- Filters -->
        <app-task-filters
          (filterChange)="onFiltersChange($event)"
          [isLoading]="isLoading"
        ></app-task-filters>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading tasks...</p>
        </div>

        <!-- Kanban Board -->
        <div *ngIf="!isLoading" class="mt-6">
          <div class="flex gap-6 overflow-x-auto pb-6">
            <div
              *ngFor="let column of columns; trackBy: trackByColumnId"
              class="flex-shrink-0 w-80"
            >
              <!-- Column Header -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <div [class]="column.color" class="w-3 h-3 rounded-full"></div>
                  <h3 class="font-semibold text-gray-900">{{ column.title }}</h3>
                  <span class="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    {{ column.tasks.length }}
                  </span>
                </div>
              </div>

              <!-- Column Content -->
                             <div
                 class="bg-gray-100 rounded-lg p-4 min-h-[400px]"
                 cdkDropList
                 [cdkDropListData]="column.tasks"
                 [cdkDropListConnectedTo]="getAllColumnIds()"
                 [id]="'cdk-drop-list-' + column.id"
                 (cdkDropListDropped)="onTaskDrop($event)"
               >
                <div
                  *ngFor="let task of column.tasks; trackBy: trackByTaskId"
                  cdkDrag
                  class="mb-4 cursor-move"
                  [cdkDragData]="task"
                >
                  <app-task-card
                    [task]="task"
                    (edit)="openEditModal($event)"
                    (delete)="deleteTask($event)"
                    (statusChange)="updateTaskStatus($event.taskId, $event.status)"
                    class="animate-fade-in block"
                  ></app-task-card>
                  
                  <!-- Drag Placeholder -->
                  <div *cdkDragPlaceholder class="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 opacity-50">
                    <!-- Empty placeholder that matches the card height -->
                  </div>
                </div>

                <!-- Empty Column Message -->
                <div *ngIf="column.tasks.length === 0" class="text-center py-8">
                  <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8v.01M6 8v.01" />
                  </svg>
                  <p class="mt-2 text-sm text-gray-500">No {{ column.title.toLowerCase() }} tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Task Statistics -->
        <div *ngIf="!isLoading && getAllTasks().length > 0" class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-gray-900">{{ getTaskCountByStatus(TaskStatus.TODO) }}</div>
            <div class="text-sm text-gray-600">To Do</div>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-primary-600">{{ getTaskCountByStatus(TaskStatus.IN_PROGRESS) }}</div>
            <div class="text-sm text-gray-600">In Progress</div>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-green-600">{{ getTaskCountByStatus(TaskStatus.DONE) }}</div>
            <div class="text-sm text-gray-600">Completed</div>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-task-card">
            <div class="text-2xl font-bold text-gray-900">{{ getAllTasks().length }}</div>
            <div class="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </main>

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
    
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* CDK Drag and Drop Styles */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class TaskBoardComponent implements OnInit {
  private taskService = inject(TaskService);
  private router = inject(Router);

  // Component state
  isLoading = false;
  showTaskModal = false;
  selectedTask: TaskResponseDto | null = null;
  isListView = false;

  // Task data
  allTasks: TaskResponseDto[] = [];
  currentFilters: any = null;

  // Task columns for Kanban board
  columns: TaskColumn[] = [
    {
      id: TaskStatus.TODO,
      title: 'To Do',
      tasks: [],
      color: 'bg-blue-500'
    },
    {
      id: TaskStatus.IN_PROGRESS,
      title: 'In Progress',
      tasks: [],
      color: 'bg-yellow-500'
    },
    {
      id: TaskStatus.DONE,
      title: 'Done',
      tasks: [],
      color: 'bg-green-500'
    }
  ];

  // Enum access for template
  TaskStatus = TaskStatus;

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Tasks loaded:', tasks);
        this.allTasks = tasks;
        this.applyFiltersAndOrganize();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
      }
    });
  }

  organizeTasks(tasks: TaskResponseDto[]): void {
    // Reset all columns
    this.columns.forEach(column => column.tasks = []);

    // Distribute tasks into columns by status
    tasks.forEach(task => {
      const column = this.columns.find(col => col.id === task.status);
      if (column) {
        column.tasks.push(task);
      }
    });

    // Sort tasks within each column by sortOrder, then by createdAt
    this.columns.forEach(column => {
      column.tasks.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
  }

  onFiltersChange(filters: any): void {
    console.log('Filters changed:', filters);
    this.currentFilters = filters;
    this.applyFiltersAndOrganize();
  }

  applyFiltersAndOrganize(): void {
    let filteredTasks = [...this.allTasks];

    if (this.currentFilters) {
      filteredTasks = this.filterTasks(filteredTasks, this.currentFilters);
    }

    this.organizeTasks(filteredTasks);
  }

  private filterTasks(tasks: TaskResponseDto[], filters: any): TaskResponseDto[] {
    let filtered = tasks;
    console.log('Filtering tasks:', { totalTasks: tasks.length, filters });

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    // Apply quick filters
    if (filters.quickFilter && filters.quickFilter !== 'all') {
      filtered = this.applyQuickFilter(filtered, filters.quickFilter);
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered = this.sortTasks(filtered, filters.sortBy);
    }

    console.log('Filtered result:', { filteredCount: filtered.length });
    return filtered;
  }

  private applyQuickFilter(tasks: TaskResponseDto[], quickFilter: string): TaskResponseDto[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (quickFilter) {
      case 'my':
        // Assuming we need to check current user - for now return all tasks
        // This would need to check task.ownerId against current user
        return tasks;
      
      case 'due-today':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      
      case 'overdue':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate < today && task.status !== TaskStatus.DONE;
        });
      
      case 'high-priority':
        return tasks.filter(task => task.priority === 'high');
      
      default:
        return tasks;
    }
  }

  private sortTasks(tasks: TaskResponseDto[], sortBy: string): TaskResponseDto[] {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  onTaskDrop(event: CdkDragDrop<TaskResponseDto[]>): void {
    const task = event.item.data as TaskResponseDto;
    const targetStatus = this.getColumnStatusById(event.container.id);
    
    if (event.previousContainer === event.container) {
      // Same column reordering
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskOrder(event.container.data);
    } else {
      // Moving between columns (status change)
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update task status and order
      this.updateTaskStatusAndOrder(task.id, targetStatus, event.container.data);
    }
  }

  private getColumnStatusById(containerId: string): TaskStatus {
    const column = this.columns.find(col => `cdk-drop-list-${col.id}` === containerId);
    return column ? column.id : TaskStatus.TODO;
  }

  private updateTaskOrder(tasks: TaskResponseDto[]): void {
    // Update sortOrder for all tasks in the column
    const updates: BulkUpdateTask[] = tasks.map((task, index) => ({
      id: task.id,
      sortOrder: index
    }));

    this.taskService.bulkUpdateTasks(updates).subscribe({
      next: (updatedTasks) => {
        console.log('Task order updated:', updatedTasks);
        // Update local state with returned data
        tasks.forEach((task, index) => {
          task.sortOrder = index;
        });
      },
      error: (error) => {
        console.error('Error updating task order:', error);
        // Revert the change
        this.loadTasks();
      }
    });
  }

  private updateTaskStatusAndOrder(taskId: string, newStatus: TaskStatus, columnTasks: TaskResponseDto[]): void {
    const updateData: UpdateTaskDto = {
      status: newStatus,
      sortOrder: columnTasks.findIndex(t => t.id === taskId)
    };

    this.taskService.updateTask(taskId, updateData).subscribe({
      next: (updatedTask) => {
        console.log('Task updated:', updatedTask);
        // Update the task in our local state
        const task = columnTasks.find(t => t.id === taskId);
        if (task) {
          Object.assign(task, updatedTask);
        }
      },
      error: (error) => {
        console.error('Error updating task:', error);
        // Revert the change
        this.loadTasks();
      }
    });
  }

  updateTaskStatus(taskId: string, status: string): void {
    const updateData: UpdateTaskDto = { status: status as TaskStatus };
    
    this.taskService.updateTask(taskId, updateData).subscribe({
      next: (updatedTask) => {
        console.log('Task status updated:', updatedTask);
        this.loadTasks(); // Reload to refresh the board
      },
      error: (error) => {
        console.error('Error updating task status:', error);
      }
    });
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          console.log('Task deleted successfully');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  openCreateModal(): void {
    this.selectedTask = null;
    this.showTaskModal = true;
  }

  openEditModal(task: TaskResponseDto): void {
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
          this.closeTaskModal();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error updating task:', error);
        }
      });
    } else {
      // Create new task
      this.taskService.createTask(taskData as CreateTaskDto).subscribe({
        next: (newTask) => {
          console.log('Task created:', newTask);
          this.closeTaskModal();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error creating task:', error);
        }
      });
    }
  }

  toggleView(): void {
    this.isListView = !this.isListView;
    if (this.isListView) {
      this.router.navigate(['/tasks/list']);
    } else {
      this.router.navigate(['/tasks/board']);
    }
  }

  // Helper methods
  getAllColumnIds(): string[] {
    return this.columns.map(col => `cdk-drop-list-${col.id}`);
  }

  getAllTasks(): TaskResponseDto[] {
    return this.columns.reduce((allTasks, column) => [...allTasks, ...column.tasks], [] as TaskResponseDto[]);
  }

  getTaskCountByStatus(status: TaskStatus): number {
    const column = this.columns.find(col => col.id === status);
    return column ? column.tasks.length : 0;
  }

  trackByColumnId(index: number, column: TaskColumn): string {
    return column.id;
  }

  trackByTaskId(index: number, task: TaskResponseDto): string {
    return task.id;
  }
} 