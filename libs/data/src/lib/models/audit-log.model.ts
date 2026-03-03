import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.model';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  BULK_UPDATE = 'bulk_update',
}

export enum AuditResource {
  TASK = 'task',
  USER = 'user',
  ORGANIZATION = 'organization',
  AUTH = 'auth',
  AUDIT_LOG = 'audit_log',
}

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['resource', 'timestamp'])
@Index(['action', 'timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to user who performed the action
  @Column({ type: 'uuid' })
  userId: string;

  // Many-to-one relationship with user
  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  resource: AuditResource;

  @Column({ type: 'uuid', nullable: true })
  resourceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any>;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  // Helper method to get formatted action description
  get actionDescription(): string {
    const resourceName =
      this.resource.charAt(0).toUpperCase() + this.resource.slice(1);
    const actionName =
      this.action.charAt(0).toUpperCase() + this.action.slice(1);
    return `${actionName} ${resourceName}`;
  }

  // Helper method to check if action was successful
  get isSuccessful(): boolean {
    return this.success && !this.errorMessage;
  }
}
