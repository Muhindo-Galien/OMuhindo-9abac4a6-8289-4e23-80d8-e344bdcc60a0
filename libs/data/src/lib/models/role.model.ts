import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RoleType {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    unique: true,
  })
  name: RoleType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  level: number; // For role hierarchy: Owner=2, Admin=1, Viewer=0

  // Simple JSON array of permission IDs - assessment-friendly approach
  @Column({ type: 'simple-json', default: [] })
  permissionIds: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// Predefined role permission mappings for seeding
export const DEFAULT_ROLE_PERMISSIONS = {
  [RoleType.OWNER]: [
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'organization:read',
    'organization:update',
    'audit_log:read',
  ],
  [RoleType.ADMIN]: [
    'task:create',
    'task:read',
    'task:update',
    'task:delete',
    'user:read',
    'organization:read',
  ],
  [RoleType.VIEWER]: ['task:read'],
};

export function getRoleLevel(role: RoleType): number {
  const levels = {
    [RoleType.VIEWER]: 0,
    [RoleType.ADMIN]: 1,
    [RoleType.OWNER]: 2,
  };
  return levels[role];
}
