import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatus, TaskPriority, TaskCategory } from '../models/task.model';

// Create Task DTO
export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus = TaskStatus.TODO;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory = TaskCategory.OTHER;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;

  @IsOptional()
  @IsUUID()
  ownerId?: string; // Optional: if not provided, defaults to current user

  // organizationId will be automatically set from the authenticated user
}

// Update Task DTO
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsUUID()
  ownerId?: string; // Allow reassigning task ownership
}

// Task Response DTO (what gets returned to frontend)
export class TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date;
  completedAt?: Date;
  sortOrder: number;
  ownerId: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
  isCompleted: boolean;
}

// Task List Query DTO (for filtering/sorting)
export class TaskQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @IsString()
  search?: string; // Search in title/description

  @IsOptional()
  @IsString()
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'dueDate'
    | 'priority'
    | 'title'
    | 'sortOrder' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 10;
}

// Bulk Update DTO (for drag-and-drop reordering)
export class BulkUpdateTaskDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class BulkUpdateTasksDto {
  tasks: BulkUpdateTaskDto[];
}
