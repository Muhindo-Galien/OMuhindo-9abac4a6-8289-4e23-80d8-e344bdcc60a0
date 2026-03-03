import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// Import entities and DTOs
import { 
  Task, 
  Organization, 
  User, 
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskQueryDto,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  RoleType,
  BulkUpdateTaskDto,
  AuditAction,
  AuditResource 
} from '@data';

// Import the service under test
import { TasksService } from './tasks.service';
import { AuditService } from '../audit/audit.service';

// Import fixtures
import { 
  mockUsers, 
  mockTasks, 
  mockTaskDtos,
  cloneFixture, 
  createCustomFixture 
} from '@data';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let auditService: jest.Mocked<AuditService>;

  // Test users based on fixtures with extended properties
  const ownerUser = {
    ...cloneFixture(mockUsers.owner),
    role: RoleType.OWNER,
  };

  const adminUser = {
    ...cloneFixture(mockUsers.admin),
    role: RoleType.ADMIN,
  };

  const viewerUser = {
    ...cloneFixture(mockUsers.viewer),
    role: RoleType.VIEWER,
    organizationId: 'org-123', // Same as admin for some tests
  };

  // Different organization user for isolation testing
  const differentOrgViewer = createCustomFixture(viewerUser, {
    id: 'user-viewer-different-org',
    email: 'viewer-different@turbovets.com',
    organizationId: 'org-different-123',
    organizationName: 'Different Organization',
  });

  // Test organizations
  const mainOrganization = {
    id: 'org-123',
    name: 'TurboVets Organization',
    description: 'Main organization',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const subOrganization = {
    id: 'org-sub-456',
    name: 'Sub Organization',
    description: 'Sub organization',
    parentId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const differentOrganization = {
    id: 'org-different-123',
    name: 'Different Organization',
    description: 'Completely different organization',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Test tasks
  const ownerTask = {
    ...cloneFixture(mockTasks.todo),
    id: 'task-owner-001',
    ownerId: ownerUser.id,
    organizationId: ownerUser.organizationId,
    owner: ownerUser,
    organization: mainOrganization,
  };

  const adminTask = {
    ...cloneFixture(mockTasks.inProgress),
    id: 'task-admin-002',
    ownerId: adminUser.id,
    organizationId: adminUser.organizationId,
    owner: adminUser,
    organization: mainOrganization,
  };

  const viewerTask = {
    ...cloneFixture(mockTasks.done),
    id: 'task-viewer-003',
    ownerId: viewerUser.id,
    organizationId: viewerUser.organizationId,
    owner: viewerUser,
    organization: mainOrganization,
  };

  const differentOrgTask = {
    ...cloneFixture(mockTasks.cancelled),
    id: 'task-different-org-004',
    ownerId: differentOrgViewer.id,
    organizationId: differentOrgViewer.organizationId,
    owner: differentOrgViewer,
    organization: differentOrganization,
  };

  beforeEach(async () => {
    // Create mocked repositories
    const mockTaskRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockOrgRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    // Create mocked audit service
    const mockAuditService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrgRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    organizationRepository = module.get(getRepositoryToken(Organization));
    userRepository = module.get(getRepositoryToken(User));
    auditService = module.get(AuditService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTask', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'New Test Task',
      description: 'Test task description',
      priority: TaskPriority.HIGH,
      category: TaskCategory.WORK,
      dueDate: '2024-12-31',
    };

    describe('permission checks', () => {
      it('should allow Owner to create tasks', async () => {
        // Arrange
        const expectedTask = createCustomFixture(ownerTask, {
          title: createTaskDto.title,
          description: createTaskDto.description,
        });

        taskRepository.create.mockReturnValue(expectedTask as any);
        taskRepository.save.mockResolvedValue(expectedTask as any);
        taskRepository.findOne.mockResolvedValue(expectedTask as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        const result = await service.createTask(createTaskDto, ownerUser);

        // Assert
        expect(taskRepository.create).toHaveBeenCalledWith({
          ...createTaskDto,
          ownerId: ownerUser.id,
          organizationId: ownerUser.organizationId,
        });
        expect(taskRepository.save).toHaveBeenCalled();
        expect(result.title).toBe(createTaskDto.title);
        expect(result.ownerId).toBe(ownerUser.id);
      });

      it('should allow Admin to create tasks', async () => {
        // Arrange
        const expectedTask = createCustomFixture(adminTask, {
          title: createTaskDto.title,
          description: createTaskDto.description,
        });

        taskRepository.create.mockReturnValue(expectedTask as any);
        taskRepository.save.mockResolvedValue(expectedTask as any);
        taskRepository.findOne.mockResolvedValue(expectedTask as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        const result = await service.createTask(createTaskDto, adminUser);

        // Assert
        expect(taskRepository.create).toHaveBeenCalledWith({
          ...createTaskDto,
          ownerId: adminUser.id,
          organizationId: adminUser.organizationId,
        });
        expect(result.title).toBe(createTaskDto.title);
        expect(result.ownerId).toBe(adminUser.id);
      });

      it('should deny Viewer from creating tasks', async () => {
        // Act & Assert
        await expect(service.createTask(createTaskDto, viewerUser)).rejects.toThrow(
          new ForbiddenException('Only owners and admins can create tasks')
        );

        expect(taskRepository.create).not.toHaveBeenCalled();
        expect(taskRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('owner assignment validation', () => {
      it('should allow Owner to assign task to user in their organization', async () => {
        // Arrange
        const createTaskWithOwner = { ...createTaskDto, ownerId: adminUser.id };
        const expectedTask = createCustomFixture(ownerTask, {
          ownerId: adminUser.id,
          owner: adminUser,
        });

        userRepository.findOne.mockResolvedValue(adminUser as any);
        taskRepository.create.mockReturnValue(expectedTask as any);
        taskRepository.save.mockResolvedValue(expectedTask as any);
        taskRepository.findOne.mockResolvedValue(expectedTask as any);
        organizationRepository.find.mockResolvedValue([]);

        // Act
        const result = await service.createTask(createTaskWithOwner, ownerUser);

        // Assert
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { id: adminUser.id },
          relations: ['organization'],
        });
        expect(result.ownerId).toBe(adminUser.id);
      });

      it('should allow Admin to assign task to user in same organization', async () => {
        // Arrange
        const createTaskWithOwner = { ...createTaskDto, ownerId: viewerUser.id };
        const expectedTask = createCustomFixture(adminTask, {
          ownerId: viewerUser.id,
          owner: viewerUser,
        });

        userRepository.findOne.mockResolvedValue({
          ...viewerUser,
          organizationId: adminUser.organizationId, // Same org as admin
        } as any);
        taskRepository.create.mockReturnValue(expectedTask as any);
        taskRepository.save.mockResolvedValue(expectedTask as any);
        taskRepository.findOne.mockResolvedValue(expectedTask as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        const result = await service.createTask(createTaskWithOwner, adminUser);

        // Assert
        expect(result.ownerId).toBe(viewerUser.id);
      });

      it('should deny Admin from assigning task to user in different organization', async () => {
        // Arrange
        const createTaskWithOwner = { ...createTaskDto, ownerId: differentOrgViewer.id };

        userRepository.findOne.mockResolvedValue(differentOrgViewer as any);

        // Act & Assert
        await expect(service.createTask(createTaskWithOwner, adminUser)).rejects.toThrow(
          new ForbiddenException('Cannot assign task to user outside your organization')
        );
      });

      it('should deny assignment to non-existent user', async () => {
        // Arrange
        const createTaskWithOwner = { ...createTaskDto, ownerId: 'non-existent-user' };

        userRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.createTask(createTaskWithOwner, ownerUser)).rejects.toThrow(
          new NotFoundException('User not found')
        );
      });
    });

    describe('audit logging', () => {
      it('should log successful task creation', async () => {
        // Arrange
        const expectedTask = createCustomFixture(ownerTask, {
          title: createTaskDto.title,
        });

        taskRepository.create.mockReturnValue(expectedTask as any);
        taskRepository.save.mockResolvedValue(expectedTask as any);
        taskRepository.findOne.mockResolvedValue(expectedTask as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        await service.createTask(createTaskDto, ownerUser);

        // Assert
        expect(auditService.logAction).toHaveBeenCalledWith(
          ownerUser.id,
          AuditAction.CREATE,
          AuditResource.TASK,
          {
            resourceId: expectedTask.id,
            details: {
              title: expectedTask.title,
              status: expectedTask.status,
              priority: expectedTask.priority,
              ownerId: expectedTask.ownerId,
            },
            success: true,
          }
        );
      });

      it('should continue execution even if audit logging fails', async () => {
        // Arrange
        const expectedTask = createCustomFixture(ownerTask, {
          title: createTaskDto.title,
        });

        taskRepository.create.mockReturnValue(expectedTask as any);
        taskRepository.save.mockResolvedValue(expectedTask as any);
        taskRepository.findOne.mockResolvedValue(expectedTask as any);
        auditService.logAction.mockRejectedValue(new Error('Audit service failure'));

        // Act
        const result = await service.createTask(createTaskDto, ownerUser);

        // Assert
        expect(result).toBeDefined();
        expect(result.title).toBe(createTaskDto.title);
      });
    });
  });

  describe('findAllTasks', () => {
    const queryDto: TaskQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    };

    // Mock query builder
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    describe('role-based access control', () => {
      it('should allow Owner to see all tasks in organization and sub-organizations', async () => {
        // Arrange
        const tasks = [ownerTask, adminTask, viewerTask];
        organizationRepository.find.mockResolvedValue([subOrganization] as any);
        mockQueryBuilder.getMany.mockResolvedValue(tasks);

        // Act
        const result = await service.findAllTasks(queryDto, ownerUser);

        // Assert
        expect(organizationRepository.find).toHaveBeenCalledWith({
          where: { parentId: ownerUser.organizationId },
        });
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'task.organizationId IN (:...orgIds)',
          { orgIds: [ownerUser.organizationId, subOrganization.id] }
        );
        expect(result).toHaveLength(3);
      });

      it('should allow Admin to see all tasks in their organization only', async () => {
        // Arrange
        const tasks = [adminTask, viewerTask];
        mockQueryBuilder.getMany.mockResolvedValue(tasks);

        // Act
        const result = await service.findAllTasks(queryDto, adminUser);

        // Assert
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'task.organizationId = :orgId',
          { orgId: adminUser.organizationId }
        );
        expect(result).toHaveLength(2);
      });

      it('should allow Viewer to see only their own tasks', async () => {
        // Arrange
        const tasks = [viewerTask];
        mockQueryBuilder.getMany.mockResolvedValue(tasks);

        // Act
        const result = await service.findAllTasks(queryDto, viewerUser);

        // Assert
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'task.ownerId = :userId',
          { userId: viewerUser.id }
        );
        expect(result).toHaveLength(1);
        expect(result[0].ownerId).toBe(viewerUser.id);
      });
    });

    describe('data isolation between organizations', () => {
      it('should not return tasks from different organizations for Admin', async () => {
        // Arrange
        const tasks = [adminTask]; // Only tasks from same org
        mockQueryBuilder.getMany.mockResolvedValue(tasks);

        // Act
        const result = await service.findAllTasks(queryDto, adminUser);

        // Assert
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'task.organizationId = :orgId',
          { orgId: adminUser.organizationId }
        );
        expect(result.every(task => task.organizationId === adminUser.organizationId)).toBe(true);
      });

      it('should not return tasks from different organizations for Viewer', async () => {
        // Arrange
        const tasks = [viewerTask]; // Only viewer's own tasks
        mockQueryBuilder.getMany.mockResolvedValue(tasks);

        // Act
        const result = await service.findAllTasks(queryDto, viewerUser);

        // Assert
        expect(result.every(task => task.ownerId === viewerUser.id)).toBe(true);
      });
    });

    describe('filtering and sorting', () => {
      it('should apply status filter', async () => {
        // Arrange
        const queryWithStatus = { ...queryDto, status: TaskStatus.TODO };
        organizationRepository.find.mockResolvedValue([]); // No sub-orgs
        mockQueryBuilder.getMany.mockResolvedValue([ownerTask]);

        // Act
        await service.findAllTasks(queryWithStatus, ownerUser);

        // Assert
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'task.status = :status',
          { status: TaskStatus.TODO }
        );
      });

      it('should apply priority filter', async () => {
        // Arrange
        const queryWithPriority = { ...queryDto, priority: TaskPriority.HIGH };
        organizationRepository.find.mockResolvedValue([]); // No sub-orgs
        mockQueryBuilder.getMany.mockResolvedValue([ownerTask]);

        // Act
        await service.findAllTasks(queryWithPriority, ownerUser);

        // Assert
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'task.priority = :priority',
          { priority: TaskPriority.HIGH }
        );
      });

      it('should apply search filter', async () => {
        // Arrange
        const queryWithSearch = { ...queryDto, search: 'test search' };
        organizationRepository.find.mockResolvedValue([]); // No sub-orgs
        mockQueryBuilder.getMany.mockResolvedValue([ownerTask]);

        // Act
        await service.findAllTasks(queryWithSearch, ownerUser);

        // Assert
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          '(task.title ILIKE :search OR task.description ILIKE :search)',
          { search: '%test search%' }
        );
      });

      it('should apply pagination', async () => {
        // Arrange
        const queryWithPagination = { ...queryDto, page: 2, limit: 5 };
        organizationRepository.find.mockResolvedValue([]); // No sub-orgs
        mockQueryBuilder.getMany.mockResolvedValue([ownerTask]);

        // Act
        await service.findAllTasks(queryWithPagination, ownerUser);

        // Assert
        expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page - 1) * limit
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('findTaskById', () => {
    describe('task access permissions', () => {
      it('should allow Owner to access any task in organization hierarchy', async () => {
        // Arrange
        taskRepository.findOne.mockResolvedValue(adminTask as any);
        organizationRepository.find.mockResolvedValue([]);

        // Act
        const result = await service.findTaskById(adminTask.id, ownerUser);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(adminTask.id);
      });

      it('should allow Admin to access tasks in their organization', async () => {
        // Arrange
        const sameOrgTask = {
          ...viewerTask,
          organizationId: adminUser.organizationId, // Same org as admin
        };
        taskRepository.findOne.mockResolvedValue(sameOrgTask as any);

        // Act
        const result = await service.findTaskById(sameOrgTask.id, adminUser);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(sameOrgTask.id);
      });

      it('should allow Viewer to access only their own tasks', async () => {
        // Arrange
        taskRepository.findOne.mockResolvedValue(viewerTask as any);

        // Act
        const result = await service.findTaskById(viewerTask.id, viewerUser);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(viewerTask.id);
      });

      it('should deny Viewer access to other users tasks', async () => {
        // Arrange
        taskRepository.findOne.mockResolvedValue(adminTask as any);

        // Act & Assert
        await expect(service.findTaskById(adminTask.id, viewerUser)).rejects.toThrow(
          new ForbiddenException('Access denied to this task')
        );
      });

      it('should deny Admin access to tasks in different organizations', async () => {
        // Arrange
        taskRepository.findOne.mockResolvedValue(differentOrgTask as any);

        // Act & Assert
        await expect(service.findTaskById(differentOrgTask.id, adminUser)).rejects.toThrow(
          new ForbiddenException('Access denied to this task')
        );
      });
    });

    it('should throw NotFoundException for non-existent task', async () => {
      // Arrange
      taskRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findTaskById('non-existent-task', ownerUser)).rejects.toThrow(
        new NotFoundException('Task not found')
      );
    });
  });

  describe('updateTask', () => {
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Task Title',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
    };

    describe('update permissions', () => {
      it('should allow Owner to update any task in organization hierarchy', async () => {
        // Arrange
        const updatedTask = { ...adminTask, ...updateTaskDto };
        taskRepository.findOne
          .mockResolvedValueOnce(adminTask as any) // Initial fetch
          .mockResolvedValueOnce(updatedTask as any); // After update
        organizationRepository.find.mockResolvedValue([]);
        taskRepository.update.mockResolvedValue({} as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        const result = await service.updateTask(adminTask.id, updateTaskDto, ownerUser);

        // Assert
        expect(taskRepository.update).toHaveBeenCalledWith(adminTask.id, updateTaskDto);
        expect(result.title).toBe(updateTaskDto.title);
      });

      it('should allow Admin to update tasks in their organization', async () => {
        // Arrange
        const sameOrgTask = {
          ...viewerTask,
          organizationId: adminUser.organizationId, // Same org as admin
        };
        const updatedTask = { ...sameOrgTask, ...updateTaskDto };
        taskRepository.findOne
          .mockResolvedValueOnce(sameOrgTask as any)
          .mockResolvedValueOnce(updatedTask as any);
        taskRepository.update.mockResolvedValue({} as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        const result = await service.updateTask(sameOrgTask.id, updateTaskDto, adminUser);

        // Assert
        expect(taskRepository.update).toHaveBeenCalledWith(sameOrgTask.id, updateTaskDto);
        expect(result.title).toBe(updateTaskDto.title);
      });

      it('should allow Viewer to update only their own tasks', async () => {
        // Arrange
        const updatedTask = { ...viewerTask, ...updateTaskDto };
        taskRepository.findOne
          .mockResolvedValueOnce(viewerTask as any)
          .mockResolvedValueOnce(updatedTask as any);
        taskRepository.update.mockResolvedValue({} as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        const result = await service.updateTask(viewerTask.id, updateTaskDto, viewerUser);

        // Assert
        expect(result.title).toBe(updateTaskDto.title);
      });

      it('should deny Viewer from updating other users tasks', async () => {
        // Arrange
        taskRepository.findOne.mockResolvedValue(adminTask as any);

        // Act & Assert
        await expect(service.updateTask(adminTask.id, updateTaskDto, viewerUser)).rejects.toThrow(
          new ForbiddenException('You do not have permission to update this task')
        );
      });
    });

    describe('completion handling', () => {

      it('should clear completedAt when task is marked as not done', async () => {
        // Arrange
        const incompleteTaskDto = { ...updateTaskDto, status: TaskStatus.TODO };
        const completedTask = { ...viewerTask, status: TaskStatus.DONE, completedAt: new Date().toISOString() };
        const updatedTask = { ...completedTask, ...incompleteTaskDto, completedAt: null };
        
        taskRepository.findOne
          .mockResolvedValueOnce(completedTask as any)
          .mockResolvedValueOnce(updatedTask as any);
        taskRepository.update.mockResolvedValue({} as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        await service.updateTask(completedTask.id, incompleteTaskDto, viewerUser);

        // Assert
        expect(taskRepository.update).toHaveBeenCalledWith(
          completedTask.id,
          expect.objectContaining({
            status: TaskStatus.TODO,
            completedAt: undefined,
          })
        );
      });
    });

    it('should throw NotFoundException for non-existent task', async () => {
      // Arrange
      taskRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateTask('non-existent-task', updateTaskDto, ownerUser)).rejects.toThrow(
        new NotFoundException('Task not found')
      );
    });
  });

  describe('deleteTask', () => {
    describe('deletion permissions', () => {
      it('should allow Owner to delete any task', async () => {
        // Arrange
        const ownerWithRole = { ...ownerUser, role: { name: RoleType.OWNER } };
        taskRepository.findOne.mockResolvedValue(adminTask as any);
        taskRepository.remove.mockResolvedValue({} as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        await service.deleteTask(adminTask.id, ownerWithRole);

        // Assert
        expect(taskRepository.remove).toHaveBeenCalledWith(adminTask);
        expect(auditService.logAction).toHaveBeenCalledWith(
          ownerWithRole.id,
          AuditAction.DELETE,
          AuditResource.TASK,
          expect.objectContaining({
            resourceId: adminTask.id,
            success: true,
          })
        );
      });

      it('should allow Admin to delete tasks in their organization', async () => {
        // Arrange
        const adminWithRole = { ...adminUser, role: { name: RoleType.ADMIN } };
        taskRepository.findOne.mockResolvedValue(viewerTask as any);
        taskRepository.remove.mockResolvedValue({} as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        await service.deleteTask(viewerTask.id, adminWithRole);

        // Assert
        expect(taskRepository.remove).toHaveBeenCalledWith(viewerTask);
      });

      it('should allow Viewer to delete only their own tasks', async () => {
        // Arrange
        const viewerWithRole = { ...viewerUser, role: { name: RoleType.VIEWER } };
        taskRepository.findOne.mockResolvedValue(viewerTask as any);
        taskRepository.remove.mockResolvedValue({} as any);
        auditService.logAction.mockResolvedValue({} as any);

        // Act
        await service.deleteTask(viewerTask.id, viewerWithRole);

        // Assert
        expect(taskRepository.remove).toHaveBeenCalledWith(viewerTask);
      });

      it('should deny Viewer from deleting other users tasks', async () => {
        // Arrange
        const viewerWithRole = { ...viewerUser, role: { name: RoleType.VIEWER } };
        taskRepository.findOne.mockResolvedValue(adminTask as any);

        // Act & Assert
        await expect(service.deleteTask(adminTask.id, viewerWithRole)).rejects.toThrow(
          new ForbiddenException('You can only delete your own tasks or be an admin/owner')
        );
      });
    });

    it('should throw NotFoundException for non-existent task', async () => {
      // Arrange
      taskRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteTask('non-existent-task', ownerUser)).rejects.toThrow(
        new NotFoundException('Task not found')
      );
    });
  });

  describe('bulkUpdateTasks', () => {
    const bulkUpdates: BulkUpdateTaskDto[] = [
      { id: viewerTask.id, sortOrder: 1, status: TaskStatus.IN_PROGRESS },
      { id: adminTask.id, sortOrder: 2, status: TaskStatus.TODO },
    ];

    it('should update tasks that user has permission to modify', async () => {
      // Arrange
      const ownerWithRole = { ...ownerUser, role: { name: RoleType.OWNER } };
      taskRepository.findOne
        .mockResolvedValueOnce(viewerTask as any)
        .mockResolvedValueOnce(adminTask as any);
      
      const updatedViewerTask = { ...viewerTask, sortOrder: 1, status: TaskStatus.IN_PROGRESS };
      const updatedAdminTask = { ...adminTask, sortOrder: 2, status: TaskStatus.TODO };
      
      taskRepository.save
        .mockResolvedValueOnce(updatedViewerTask as any)
        .mockResolvedValueOnce(updatedAdminTask as any);

      // Act
      const result = await service.bulkUpdateTasks(bulkUpdates, ownerWithRole);

      // Assert
      expect(result).toHaveLength(2);
      expect(taskRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should skip tasks that user cannot modify', async () => {
      // Arrange
      const viewerWithRole = { ...viewerUser, role: { name: RoleType.VIEWER } };
      taskRepository.findOne
        .mockResolvedValueOnce(viewerTask as any) // User's own task
        .mockResolvedValueOnce(adminTask as any); // Other user's task
      
      const updatedViewerTask = { ...viewerTask, sortOrder: 1, status: TaskStatus.IN_PROGRESS };
      taskRepository.save.mockResolvedValueOnce(updatedViewerTask as any);

      // Act
      const result = await service.bulkUpdateTasks(bulkUpdates, viewerWithRole);

      // Assert
      expect(result).toHaveLength(1); // Only own task updated
      expect(result[0].id).toBe(viewerTask.id);
      expect(taskRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should skip non-existent tasks', async () => {
      // Arrange
      const ownerWithRole = { ...ownerUser, role: { name: RoleType.OWNER } };
      taskRepository.findOne
        .mockResolvedValueOnce(null) // First task not found
        .mockResolvedValueOnce(adminTask as any); // Second task found
      
      const updatedAdminTask = { ...adminTask, sortOrder: 2, status: TaskStatus.TODO };
      taskRepository.save.mockResolvedValueOnce(updatedAdminTask as any);

      // Act
      const result = await service.bulkUpdateTasks(bulkUpdates, ownerWithRole);

      // Assert
      expect(result).toHaveLength(1); // Only found task updated
      expect(result[0].id).toBe(adminTask.id);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle database errors during task creation', async () => {
      // Arrange
      taskRepository.create.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act & Assert
      const validCreateDto = {
        ...mockTaskDtos.create,
        dueDate: '2023-12-31', // Convert Date to string
      };
      await expect(service.createTask(validCreateDto, ownerUser)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle database errors during task fetching', async () => {
      // Arrange
      taskRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act & Assert
      await expect(service.findAllTasks({}, ownerUser)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      const invalidDto = { title: '', description: '', priority: 'INVALID' } as any;

      // The service doesn't validate input (that's done at controller level)
      // But it should handle unexpected values gracefully
      taskRepository.create.mockReturnValue({} as any);
      taskRepository.save.mockResolvedValue({ id: 'test-task' } as any);
      taskRepository.findOne.mockResolvedValue({
        id: 'test-task',
        owner: ownerUser,
        organization: mainOrganization,
      } as any);

      // Act
      const result = await service.createTask(invalidDto, ownerUser);

      // Assert
      expect(result).toBeDefined();
    });
  });
}); 