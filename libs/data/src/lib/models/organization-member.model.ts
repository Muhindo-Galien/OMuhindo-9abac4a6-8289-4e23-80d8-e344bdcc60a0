import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.model';
import { Organization } from './organization.model';
import { RoleType } from './role.model';

/**
 * Org-scoped membership. A user can have one role per org.
 * Role inheritance: owner/admin/viewer on parent implies same on children (resolved at read time, no extra row).
 */
@Entity('organization_members')
@Unique(['userId', 'organizationId'])
@Index(['organizationId'])
@Index(['userId'])
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: RoleType,
  })
  role: RoleType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
