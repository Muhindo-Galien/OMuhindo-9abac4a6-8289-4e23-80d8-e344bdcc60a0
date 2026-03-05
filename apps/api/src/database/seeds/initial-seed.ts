import { DataSource, IsNull } from 'typeorm';
import {
  Organization,
  Role,
  RoleType,
  DEFAULT_ROLE_PERMISSIONS,
  User,
  OrganizationMember,
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  GLOBAL_ROLE_USER,
} from '@data';
import * as bcrypt from 'bcrypt';

export class InitialSeedService {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('🌱 Seeding...');
    const parentOrg = await this.createParentOrg();
    const space = await this.createSpace(parentOrg);
    const roles = await this.createRoles();
    const users = await this.createUsers(parentOrg, roles);
    await this.createTasks(users, space);
    console.log('✅ Seeding done!');
  }

  /** Parent org (site). No tasks here. */
  private async createParentOrg(): Promise<Organization> {
    const repo = this.dataSource.getRepository(Organization);
    const existing = await repo.findOne({
      where: { name: 'TurboVets', parentId: IsNull() },
    });
    if (existing) return existing;
    return await repo.save({
      name: 'TurboVets',
      description: 'Main organization',
      parentId: undefined,
    });
  }

  /** Child org (space). Tasks are only allowed in spaces. */
  private async createSpace(parent: Organization): Promise<Organization> {
    const repo = this.dataSource.getRepository(Organization);
    const existing = await repo.findOne({
      where: { name: 'Default Space', parentId: parent.id },
    });
    if (existing) return existing;
    return await repo.save({
      name: 'Default Space',
      description: 'Default space for tasks',
      parentId: parent.id,
    });
  }

  private async createRoles() {
    const repo = this.dataSource.getRepository(Role);
    const roles = [
      {
        name: RoleType.VIEWER,
        description: 'Can view tasks',
        level: 0,
        permissionIds: DEFAULT_ROLE_PERMISSIONS[RoleType.VIEWER],
      },
      {
        name: RoleType.ADMIN,
        description: 'Can manage tasks and users',
        level: 1,
        permissionIds: DEFAULT_ROLE_PERMISSIONS[RoleType.ADMIN],
      },
      {
        name: RoleType.OWNER,
        description: 'Full access',
        level: 2,
        permissionIds: DEFAULT_ROLE_PERMISSIONS[RoleType.OWNER],
      },
    ];
    const result: Role[] = [];
    for (const r of roles) {
      let role = await repo.findOne({ where: { name: r.name } });
      if (!role) {
        role = await repo.save(r);
        console.log(`👑 Created role: ${role.name}`);
      }
      result.push(role);
    }
    return result;
  }

  private async createUsers(org: Organization, _roles: Role[]) {
    const userRepo = this.dataSource.getRepository(User);
    const memberRepo = this.dataSource.getRepository(OrganizationMember);
    const existing = await userRepo.count();
    if (existing > 0) return await userRepo.find();

    const hashed = await bcrypt.hash('password123', 10);
    const configs = [
      {
        email: 'owner@turbovets.com',
        firstName: 'Owner',
        lastName: 'User',
        role: RoleType.OWNER,
      },
      {
        email: 'admin@turbovets.com',
        firstName: 'Admin',
        lastName: 'User',
        role: RoleType.ADMIN,
      },
      {
        email: 'viewer@turbovets.com',
        firstName: 'Viewer',
        lastName: 'User',
        role: RoleType.VIEWER,
      },
    ];
    const users: User[] = [];
    for (const c of configs) {
      const user = await userRepo.save({
        email: c.email,
        password: hashed,
        firstName: c.firstName,
        lastName: c.lastName,
        globalRole: GLOBAL_ROLE_USER,
        isActive: true,
      });
      users.push(user);
      await memberRepo.save({
        userId: user.id,
        organizationId: org.id,
        role: c.role,
      });
      console.log(`👤 Created user: ${user.email} (${c.role})`);
    }
    return users;
  }

  /** Create tasks only in the given space (child org). Never in parent org. */
  private async createTasks(users: User[], space: Organization) {
    const repo = this.dataSource.getRepository(Task);
    const existing = await repo.count();
    if (existing > 0) return;
    if (space.parentId == null) {
      console.warn('⚠️ Seed skipped task creation: org is a site (parent), not a space. Tasks only belong in spaces.');
      return;
    }

    const tasks = [
      {
        title: 'Task 1',
        description: 'First task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        category: TaskCategory.WORK,
        ownerId: users[0].id,
        organizationId: space.id,
      },
      {
        title: 'Task 2',
        description: 'Second task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        category: TaskCategory.PROJECT,
        ownerId: users[1].id,
        organizationId: space.id,
      },
      {
        title: 'Task 3',
        description: 'Third task',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        category: TaskCategory.PERSONAL,
        ownerId: users[2].id,
        organizationId: space.id,
        completedAt: new Date(),
      },
    ];
    for (const t of tasks) {
      await repo.save(t);
      console.log(`📝 Created task: ${t.title}`);
    }
  }
}

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const seedService = new InitialSeedService(dataSource);
  await seedService.run();
}
