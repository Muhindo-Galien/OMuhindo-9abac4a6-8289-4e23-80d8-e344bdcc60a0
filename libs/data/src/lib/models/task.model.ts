import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.model';
import { Organization } from './organization.model';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  PROJECT = 'project',
  MEETING = 'meeting',
  OTHER = 'other',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskCategory,
    default: TaskCategory.OTHER,
  })
  category: TaskCategory;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // For drag-and-drop ordering

  // Foreign key to user (owner)
  @Column({ type: 'uuid' })
  ownerId: string;

  // Many-to-one relationship with user (owner)
  @ManyToOne(() => User, {
    eager: true,
  })
  owner: User;

  // Foreign key to organization
  @Column({ type: 'uuid' })
  organizationId: string;

  // Many-to-one relationship with organization
  @ManyToOne(() => Organization, {
    eager: true,
  })
  organization: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if task is overdue
  get isOverdue(): boolean {
    if (
      !this.dueDate ||
      this.status === TaskStatus.DONE ||
      this.status === TaskStatus.CANCELLED
    ) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  // Helper method to check if task is completed
  get isCompleted(): boolean {
    return this.status === TaskStatus.DONE;
  }

  // Helper method to mark task as completed
  markAsCompleted(): void {
    this.status = TaskStatus.DONE;
    this.completedAt = new Date();
  }
}
