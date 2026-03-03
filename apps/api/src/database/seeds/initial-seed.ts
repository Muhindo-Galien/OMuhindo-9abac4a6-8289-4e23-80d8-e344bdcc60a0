import { DataSource } from 'typeorm';
import { Organization } from '../../../../../libs/data/src/lib/models/organization.model';
import { Role, RoleType, DEFAULT_ROLE_PERMISSIONS } from '../../../../../libs/data/src/lib/models/role.model';
import { User } from '../../../../../libs/data/src/lib/models/user.model';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../../../../libs/data/src/lib/models/task.model';
import * as bcrypt from 'bcrypt';

export class InitialSeedService {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('🌱 Simple seeding...');

    // Create some basic data
    const org = await this.createOrg();
    const roles = await this.createRole();
    const users = await this.createUsers(org, roles);
    await this.createTasks(users, org);

    console.log('✅ Simple seeding done!');
  }

  private async createOrg() {
    const repo = this.dataSource.getRepository(Organization);
    const existing = await repo.findOne({ where: { name: 'TurboVets' } });
    if (existing) return existing;

    return await repo.save({
      name: 'TurboVets',
      description: 'Main organization'
    });
  }

  private async createRole() {
    const repo = this.dataSource.getRepository(Role);
    
    // Check if we have all three required roles
    const viewerRole = await repo.findOne({ where: { name: RoleType.VIEWER } });
    const adminRole = await repo.findOne({ where: { name: RoleType.ADMIN } });
    const ownerRole = await repo.findOne({ where: { name: RoleType.OWNER } });
    
    if (viewerRole && adminRole && ownerRole) {
      console.log('👑 All roles already exist, skipping...');
      return [viewerRole, adminRole, ownerRole];
    }

    console.log('👑 Creating missing roles...');

    // Create all three roles as specified in context
    const roles = [
      {
        name: RoleType.VIEWER,
        description: 'Can view tasks',
        level: 0,
        permissionIds: DEFAULT_ROLE_PERMISSIONS[RoleType.VIEWER]
      },
      {
        name: RoleType.ADMIN,
        description: 'Can manage tasks and users',
        level: 1,
        permissionIds: DEFAULT_ROLE_PERMISSIONS[RoleType.ADMIN]
      },
      {
        name: RoleType.OWNER,
        description: 'Full access to everything',
        level: 2,
        permissionIds: DEFAULT_ROLE_PERMISSIONS[RoleType.OWNER]
      }
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      // Check if this specific role exists first
      let role = await repo.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = await repo.save(roleData);
        console.log(`👑 Created role: ${role.name}`);
      } else {
        console.log(`👑 Role ${role.name} already exists`);
      }
      createdRoles.push(role);
    }

    return createdRoles;
  }

  private async createUsers(org: Organization, roles: Role[]) {
    const repo = this.dataSource.getRepository(User);
    const existing = await repo.count();
    if (existing > 0) return await repo.find();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Assign different roles to different users
    const users = [];
    const userConfigs = [
      { email: 'owner@turbovets.com', firstName: 'Owner', lastName: 'User', role: roles.find(r => r.name === RoleType.OWNER) },
      { email: 'admin@turbovets.com', firstName: 'Admin', lastName: 'User', role: roles.find(r => r.name === RoleType.ADMIN) },
      { email: 'viewer@turbovets.com', firstName: 'Viewer', lastName: 'User', role: roles.find(r => r.name === RoleType.VIEWER) }
    ];

    for (const config of userConfigs) {
      const user = await repo.save({
        email: config.email,
        password: hashedPassword,
        firstName: config.firstName,
        lastName: config.lastName,
        organizationId: org.id,
        roleId: config.role.id
      });
      users.push(user);
      console.log(`👤 Created user: ${user.email} (${config.role.name})`);
    }
    return users;
  }

  private async createTasks(users: User[], org: Organization) {
    const repo = this.dataSource.getRepository(Task);
    const existing = await repo.count();
    if (existing > 0) return;

    const tasks = [
      {
        title: 'Task 1',
        description: 'First task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        category: TaskCategory.WORK,
        ownerId: users[0].id,
        organizationId: org.id
      },
      {
        title: 'Task 2', 
        description: 'Second task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        category: TaskCategory.PROJECT,
        ownerId: users[1].id,
        organizationId: org.id
      },
      {
        title: 'Task 3',
        description: 'Third task', 
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        category: TaskCategory.PERSONAL,
        ownerId: users[2].id,
        organizationId: org.id,
        completedAt: new Date()
      }
    ];

    for (const taskData of tasks) {
      const task = await repo.save(taskData);
      console.log(`📝 Created task: ${task.title}`);
    }
  }
}

// Standalone seeding function for command line use
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const seedService = new InitialSeedService(dataSource);
  await seedService.run();
} 