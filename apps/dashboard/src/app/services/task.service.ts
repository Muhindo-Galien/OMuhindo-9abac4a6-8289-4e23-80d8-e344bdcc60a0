import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskStatus, TaskPriority } from '@data';
import { environment } from '../../environments/environment';

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  sortBy?: string;
  quickFilter?: string;
}

export interface BulkUpdateTask {
  id: string;
  sortOrder: number;
  status?: TaskStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  
  private readonly API_URL = environment.apiUrl;

  getTasks(): Observable<TaskResponseDto[]> {
    // Default to sorting by sortOrder to respect drag-and-drop positioning
    return this.http.get<TaskResponseDto[]>(`${this.API_URL}/tasks?sortBy=sortOrder&sortOrder=ASC`).pipe(
      catchError(this.handleError)
    );
  }

  getTaskById(id: string): Observable<TaskResponseDto> {
    return this.http.get<TaskResponseDto>(`${this.API_URL}/tasks/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createTask(task: CreateTaskDto): Observable<TaskResponseDto> {
    return this.http.post<TaskResponseDto>(`${this.API_URL}/tasks`, task).pipe(
      catchError(this.handleError)
    );
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<TaskResponseDto> {
    return this.http.put<TaskResponseDto>(`${this.API_URL}/tasks/${id}`, task).pipe(
      catchError(this.handleError)
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/tasks/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Bulk update for drag-and-drop operations
  bulkUpdateTasks(updates: BulkUpdateTask[]): Observable<TaskResponseDto[]> {
    return this.http.put<TaskResponseDto[]>(`${this.API_URL}/tasks/bulk-update`, { tasks: updates }).pipe(
      catchError(this.handleError)
    );
  }

  // Client-side filtering for better UX when API doesn't support complex filtering
  filterTasks(tasks: TaskResponseDto[], filters: TaskFilters): TaskResponseDto[] {
    let filteredTasks = [...tasks];

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply status filter
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    // Apply category filter
    if (filters.category) {
      filteredTasks = filteredTasks.filter(task => task.category === filters.category);
    }

    // Apply quick filters
    if (filters.quickFilter) {
      switch (filters.quickFilter) {
                 case 'due-today':
           const today = new Date().toISOString().split('T')[0];
           filteredTasks = filteredTasks.filter(task => 
             task.dueDate && new Date(task.dueDate).toISOString().startsWith(today)
           );
           break;
           
         case 'overdue':
           const now = new Date();
           filteredTasks = filteredTasks.filter(task => 
             task.dueDate && 
             new Date(task.dueDate) < now && 
             task.status !== TaskStatus.DONE
           );
           break;
           
         case 'high-priority':
           filteredTasks = filteredTasks.filter(task => 
             task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT
           );
           break;
          
        case 'my':
          // This would need user context from AuthService
          // For now, return all tasks
          break;
          
        case 'all':
        default:
          // No additional filtering
          break;
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredTasks = this.sortTasks(filteredTasks, filters.sortBy);
    }

    return filteredTasks;
  }

  private sortTasks(tasks: TaskResponseDto[], sortBy: string): TaskResponseDto[] {
    return tasks.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
          
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          
                 case 'priority':
           const priorityOrder = { [TaskPriority.URGENT]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
           return priorityOrder[b.priority] - priorityOrder[a.priority];
           
         case 'status':
           const statusOrder = { [TaskStatus.TODO]: 1, [TaskStatus.IN_PROGRESS]: 2, [TaskStatus.DONE]: 3, [TaskStatus.CANCELLED]: 4 };
           return statusOrder[a.status] - statusOrder[b.status];
          
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  // Helper methods for task statistics
  getTaskCountByStatus(tasks: TaskResponseDto[], status: string): number {
    return tasks.filter(task => task.status === status).length;
  }

  getTaskCountByPriority(tasks: TaskResponseDto[], priority: string): number {
    return tasks.filter(task => task.priority === priority).length;
  }

  getOverdueTasks(tasks: TaskResponseDto[]): TaskResponseDto[] {
    const now = new Date();
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== TaskStatus.DONE
    );
  }

  getTasksDueToday(tasks: TaskResponseDto[]): TaskResponseDto[] {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => 
      task.dueDate && new Date(task.dueDate).toISOString().startsWith(today)
    );
  }

  getCompletionRate(tasks: TaskResponseDto[]): number {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('TaskResponse service error:', error);
    
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid task data';
          break;
        case 401:
          errorMessage = 'Authentication required';
          break;
        case 403:
          errorMessage = 'Permission denied';
          break;
        case 404:
          errorMessage = 'TaskResponse not found';
          break;
        case 500:
          errorMessage = 'Server error';
          break;
        default:
          errorMessage = error.error?.message || `Server error (${error.status})`;
      }
    }
    
    return throwError(() => ({ error: { message: errorMessage } }));
  };
} 