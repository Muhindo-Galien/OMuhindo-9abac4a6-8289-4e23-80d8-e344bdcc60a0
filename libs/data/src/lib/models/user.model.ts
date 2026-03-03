import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Organization } from './organization.model';
import { Role, RoleType } from './role.model';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude() // Don't include password in serialization
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Foreign key to organization
  @Column({ type: 'uuid' })
  organizationId: string;

  // Many-to-one relationship with organization
  @ManyToOne(() => Organization, {
    eager: true,
  })
  organization: Organization;

  // Foreign key to role
  @Column({ type: 'uuid' })
  roleId: string;

  // Many-to-one relationship with role
  @ManyToOne(() => Role, { eager: true })
  role: Role;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to get full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper method to check if user has role
  hasRole(roleName: RoleType): boolean {
    return this.role?.name === roleName;
  }

  // Helper method to get role level
  getRoleLevel(): number {
    return this.role?.level || 0;
  }

  // Helper method to check if user has permission
  hasPermission(permissionString: string): boolean {
    return this.role?.permissionIds?.includes(permissionString) || false;
  }
}
