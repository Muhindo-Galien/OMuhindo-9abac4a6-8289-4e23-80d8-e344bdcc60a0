import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrganizationMember } from './organization-member.model';
import { Invitation } from './invitation.model';

@Entity('organizations')
@Index(['parentId'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** Parent org (workspace). Null = workspace (root). Set = project (child). */
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ManyToOne(() => Organization, org => org.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent?: Organization;

  @OneToMany(() => Organization, org => org.parent)
  children: Organization[];

  @OneToMany(() => OrganizationMember, m => m.organization)
  members: OrganizationMember[];

  @OneToMany(() => Invitation, inv => inv.organization)
  invitations: Invitation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
