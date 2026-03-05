import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.model';
import { Organization } from './organization.model';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  BULK_UPDATE = 'bulk_update',
  INVITE_SENT = 'invite_sent',
  INVITE_ACCEPTED = 'invite_accepted',
  INVITE_EXPIRED = 'invite_expired',
  INVITE_CANCELLED = 'invite_cancelled',
  MEMBERSHIP_ADDED = 'membership_added',
  MEMBERSHIP_REVOKED = 'membership_revoked',
  ROLE_CHANGED = 'role_changed',
}

export enum AuditResource {
  TASK = 'task',
  USER = 'user',
  ORGANIZATION = 'organization',
  AUTH = 'auth',
  AUDIT_LOG = 'audit_log',
  INVITATION = 'invitation',
  MEMBERSHIP = 'membership',
}

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['resource', 'timestamp'])
@Index(['action', 'timestamp'])
@Index(['organizationId', 'timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Org context for org-scoped resources (task, organization, invitation, membership). Null for global (e.g. auth). */
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ManyToOne(() => Organization, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization | null;

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
