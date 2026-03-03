import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import controller and service
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

// Import from shared libraries
import { 
  CreateTaskDto, 
  TaskResponseDto, 
  Task, 
  Organization, 
  User,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  RoleType,
  AuditAction,
  AuditResource 
} from '@data';
import { mockUsers, mockTasks, cloneFixture, createCustomFixture } from '@data';

// Import audit service
import { AuditService } from '../audit/audit.service';

describe('TasksController - POST /tasks', () => {
  let controller: TasksController;
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let auditService: jest.Mocked<AuditService>;

  // Test users
  const ownerUser = cloneFixture(mockUsers.owner);
  const adminUser = cloneFixture(mockUsers.admin);
  const viewerUser = cloneFixture(mockUsers.viewer);

  // Mock repositories
  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockOrganizationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    organizationRepository = module.get(getRepositoryToken(Organization));
    userRepository = module.get(getRepositoryToken(User));
    auditService = module.get(AuditService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    const validCreateTaskDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test task description',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      category: TaskCategory.WORK,
      dueDate: '2023-12-31T23:59:59.000Z',
      sortOrder: 1,
    };

    const mockCreatedTask = {
      id: 'task-new-123',
      ...validCreateTaskDto,
      ownerId: ownerUser.id,
      organizationId: ownerUser.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      isOverdue: false,
      isCompleted: false,
    };

    const mockTaskWithRelations = {
      ...mockCreatedTask,
      owner: {
        id: ownerUser.id,
        email: ownerUser.email,
        firstName: ownerUser.firstName,
        lastName: ownerUser.lastName,
      },
      organization: {
        id: ownerUser.organizationId,
        name: ownerUser.organizationName,
      },
    };

    beforeEach(() => {
      // Setup default successful mocks
      taskRepository.create.mockReturnValue(mockCreatedTask as any);
      taskRepository.save.mockResolvedValue(mockCreatedTask as any);
      taskRepository.findOne.mockResolvedValue(mockTaskWithRelations as any);
      auditService.logAction.mockResolvedValue({} as any);
    });

    describe('Authorization Tests', () => {
      it('should allow Owner to create task', async () => {
        // Act
        const result = await controller.createTask(validCreateTaskDto, ownerUser);

        // Assert
        expect(result).toBeDefined();
        expect(result.title).toBe(validCreateTaskDto.title);
        expect(result.ownerId).toBe(ownerUser.id);
        expect(taskRepository.create).toHaveBeenCalledWith({
          ...validCreateTaskDto,
          ownerId: ownerUser.id,
          organizationId: ownerUser.organizationId,
        });
        expect(taskRepository.save).toHaveBeenCalled();
      });

      it('should allow Admin to create task', async () => {
        // Arrange
        const mockAdminTask = {
          ...mockCreatedTask,
          ownerId: adminUser.id,
          organizationId: adminUser.organizationId,
        };
        const mockAdminTaskWithRelations = {
          ...mockAdminTask,
          owner: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
          },
          organization: {
            id: adminUser.organizationId,
            name: adminUser.organizationName,
          },
        };

        taskRepository.create.mockReturnValue(mockAdminTask as any);
        taskRepository.save.mockResolvedValue(mockAdminTask as any);
        taskRepository.findOne.mockResolvedValue(mockAdminTaskWithRelations as any);

        // Act
        const result = await controller.createTask(validCreateTaskDto, adminUser);

        // Assert
        expect(result).toBeDefined();
        expect(result.ownerId).toBe(adminUser.id);
        expect(taskRepository.create).toHaveBeenCalledWith({
          ...validCreateTaskDto,
          ownerId: adminUser.id,
          organizationId: adminUser.organizationId,
        });
      });

      it('should deny Viewer from creating task', async () => {
        // Act & Assert
        await expect(
          controller.createTask(validCreateTaskDto, viewerUser)
        ).rejects.toThrow(
          new ForbiddenException('Only owners and admins can create tasks')
        );

        expect(taskRepository.create).not.toHaveBeenCalled();
        expect(taskRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Custom Owner Assignment Tests', () => {
      it('should allow Owner to assign task to different user in same organization', async () => {
        // Arrange
        const customOwnerId = 'user-different-123';
        const taskDtoWithCustomOwner = {
          ...validCreateTaskDto,
          ownerId: customOwnerId,
        };

        const mockTargetUser = {
          id: customOwnerId,
          email: 'target@turbovets.com',
          firstName: 'Target',
          lastName: 'User',
          organizationId: ownerUser.organizationId,
          organization: { id: ownerUser.organizationId, name: 'Same Org' },
        };

                 userRepository.findOne.mockResolvedValue(mockTargetUser as any);
         organizationRepository.find.mockResolvedValue([]); // No sub-organizations for this test
         
         const mockCustomTask = {
          ...mockCreatedTask,
          ownerId: customOwnerId,
        };
        const mockCustomTaskWithRelations = {
          ...mockCustomTask,
          owner: mockTargetUser,
          organization: mockTargetUser.organization,
        };

        taskRepository.create.mockReturnValue(mockCustomTask as any);
        taskRepository.save.mockResolvedValue(mockCustomTask as any);
        taskRepository.findOne.mockResolvedValue(mockCustomTaskWithRelations as any);

        // Act
        const result = await controller.createTask(taskDtoWithCustomOwner, ownerUser);

        // Assert
        expect(result.ownerId).toBe(customOwnerId);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { id: customOwnerId },
          relations: ['organization'],
        });
        expect(taskRepository.create).toHaveBeenCalledWith({
          ...taskDtoWithCustomOwner,
          ownerId: customOwnerId,
          organizationId: ownerUser.organizationId,
        });
      });

      it('should reject Owner assigning task to user outside organization hierarchy', async () => {
        // Arrange
        const customOwnerId = 'user-outside-123';
        const taskDtoWithCustomOwner = {
          ...validCreateTaskDto,
          ownerId: customOwnerId,
        };

        const mockOutsideUser = {
          id: customOwnerId,
          email: 'outside@external.com',
          organizationId: 'org-external-999', // Different organization
          organization: { id: 'org-external-999', name: 'External Org' },
        };

        userRepository.findOne.mockResolvedValue(mockOutsideUser as any);
        organizationRepository.find.mockResolvedValue([]); // No sub-organizations

        // Act & Assert
        await expect(
          controller.createTask(taskDtoWithCustomOwner, ownerUser)
        ).rejects.toThrow(
          new ForbiddenException('Cannot assign task to user outside your organization hierarchy')
        );

        expect(taskRepository.create).not.toHaveBeenCalled();
      });

      it('should reject assignment to non-existent user', async () => {
        // Arrange
        const taskDtoWithInvalidOwner = {
          ...validCreateTaskDto,
          ownerId: 'non-existent-user',
        };

        userRepository.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(
          controller.createTask(taskDtoWithInvalidOwner, ownerUser)
        ).rejects.toThrow(new NotFoundException('User not found'));

        expect(taskRepository.create).not.toHaveBeenCalled();
      });

      it('should allow Admin to assign task within their organization only', async () => {
        // Arrange
        const customOwnerId = 'user-same-org-123';
        const taskDtoWithCustomOwner = {
          ...validCreateTaskDto,
          ownerId: customOwnerId,
        };

        const mockSameOrgUser = {
          id: customOwnerId,
          email: 'sameorg@turbovets.com',
          firstName: 'Same',
          lastName: 'Org',
          organizationId: adminUser.organizationId, // Same as admin
          organization: { id: adminUser.organizationId, name: 'Same Org' },
        };

        userRepository.findOne.mockResolvedValue(mockSameOrgUser as any);
        
        const mockCustomTask = {
          ...mockCreatedTask,
          ownerId: customOwnerId,
          organizationId: adminUser.organizationId,
        };
        const mockCustomTaskWithRelations = {
          ...mockCustomTask,
          owner: mockSameOrgUser,
          organization: mockSameOrgUser.organization,
        };

        taskRepository.create.mockReturnValue(mockCustomTask as any);
        taskRepository.save.mockResolvedValue(mockCustomTask as any);
        taskRepository.findOne.mockResolvedValue(mockCustomTaskWithRelations as any);

        // Act
        const result = await controller.createTask(taskDtoWithCustomOwner, adminUser);

        // Assert
        expect(result.ownerId).toBe(customOwnerId);
        expect(result.organizationId).toBe(adminUser.organizationId);
      });

      it('should reject Admin assigning task outside their organization', async () => {
        // Arrange
        const taskDtoWithExternalOwner = {
          ...validCreateTaskDto,
          ownerId: 'user-external-123',
        };

        const mockExternalUser = {
          id: 'user-external-123',
          organizationId: 'org-external-999', // Different from admin's org
          organization: { id: 'org-external-999', name: 'External Org' },
        };

        userRepository.findOne.mockResolvedValue(mockExternalUser as any);

        // Act & Assert
        await expect(
          controller.createTask(taskDtoWithExternalOwner, adminUser)
        ).rejects.toThrow(
          new ForbiddenException('Cannot assign task to user outside your organization')
        );
      });
    });

    describe('Input Validation Tests', () => {
      it('should create task with minimal required fields', async () => {
        // Arrange
        const minimalTaskDto: CreateTaskDto = {
          title: 'Minimal Task',
        };

        const mockMinimalTask = {
          id: 'task-minimal-123',
          title: 'Minimal Task',
          description: undefined,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          category: TaskCategory.OTHER,
          dueDate: undefined,
          sortOrder: 0,
          ownerId: ownerUser.id,
          organizationId: ownerUser.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          isOverdue: false,
          isCompleted: false,
        };

        const mockMinimalTaskWithRelations = {
          ...mockMinimalTask,
          owner: {
            id: ownerUser.id,
            email: ownerUser.email,
            firstName: ownerUser.firstName,
            lastName: ownerUser.lastName,
          },
          organization: {
            id: ownerUser.organizationId,
            name: ownerUser.organizationName,
          },
        };

        taskRepository.create.mockReturnValue(mockMinimalTask as any);
        taskRepository.save.mockResolvedValue(mockMinimalTask as any);
        taskRepository.findOne.mockResolvedValue(mockMinimalTaskWithRelations as any);

        // Act
        const result = await controller.createTask(minimalTaskDto, ownerUser);

        // Assert
        expect(result).toBeDefined();
        expect(result.title).toBe('Minimal Task');
        expect(result.status).toBe(TaskStatus.TODO);
        expect(result.priority).toBe(TaskPriority.MEDIUM);
        expect(result.category).toBe(TaskCategory.OTHER);
      });

      it('should create task with all optional fields', async () => {
        // Arrange
        const completeTaskDto: CreateTaskDto = {
          title: 'Complete Task',
          description: 'Very detailed description',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.LOW,
          category: TaskCategory.PERSONAL,
          dueDate: '2023-12-25T10:00:00.000Z',
          sortOrder: 99,
        };

        const mockCompleteTask = {
          id: 'task-complete-123',
          ...completeTaskDto,
          ownerId: ownerUser.id,
          organizationId: ownerUser.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          isOverdue: false,
          isCompleted: false,
        };

        const mockCompleteTaskWithRelations = {
          ...mockCompleteTask,
          owner: {
            id: ownerUser.id,
            email: ownerUser.email,
            firstName: ownerUser.firstName,
            lastName: ownerUser.lastName,
          },
          organization: {
            id: ownerUser.organizationId,
            name: ownerUser.organizationName,
          },
        };

        taskRepository.create.mockReturnValue(mockCompleteTask as any);
        taskRepository.save.mockResolvedValue(mockCompleteTask as any);
        taskRepository.findOne.mockResolvedValue(mockCompleteTaskWithRelations as any);

        // Act
        const result = await controller.createTask(completeTaskDto, ownerUser);

        // Assert
        expect(result.title).toBe(completeTaskDto.title);
        expect(result.description).toBe(completeTaskDto.description);
        expect(result.status).toBe(completeTaskDto.status);
        expect(result.priority).toBe(completeTaskDto.priority);
        expect(result.category).toBe(completeTaskDto.category);
        expect(result.sortOrder).toBe(completeTaskDto.sortOrder);
      });
    });

    describe('Audit Logging Tests', () => {
      it('should log successful task creation', async () => {
        // Act
        await controller.createTask(validCreateTaskDto, ownerUser);

        // Assert
                 expect(auditService.logAction).toHaveBeenCalledWith(
           ownerUser.id,
           AuditAction.CREATE,
           AuditResource.TASK,
          expect.objectContaining({
            resourceId: mockCreatedTask.id,
            details: expect.objectContaining({
              title: validCreateTaskDto.title,
              status: validCreateTaskDto.status,
              priority: validCreateTaskDto.priority,
              ownerId: ownerUser.id,
            }),
            success: true,
          })
        );
      });

      it('should handle audit logging failure gracefully', async () => {
        // Arrange
        auditService.logAction.mockRejectedValue(new Error('Audit service down'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act
        const result = await controller.createTask(validCreateTaskDto, ownerUser);

        // Assert
        expect(result).toBeDefined(); // Task creation should still succeed
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to log audit action:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Error Handling Tests', () => {
      it('should handle database save failure', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        taskRepository.save.mockRejectedValue(dbError);

        // Act & Assert
        await expect(
          controller.createTask(validCreateTaskDto, ownerUser)
        ).rejects.toThrow('Database connection failed');

        expect(taskRepository.create).toHaveBeenCalled();
        expect(taskRepository.save).toHaveBeenCalled();
      });

      it('should handle task relation loading failure', async () => {
        // Arrange
        taskRepository.findOne.mockResolvedValue(null); // Simulate task not found after creation

        // Act & Assert
        await expect(
          controller.createTask(validCreateTaskDto, ownerUser)
        ).rejects.toThrow(); // Should fail when trying to map null to response DTO

        expect(taskRepository.save).toHaveBeenCalled();
        expect(taskRepository.findOne).toHaveBeenCalledWith({
          where: { id: mockCreatedTask.id },
          relations: ['owner', 'organization'],
        });
      });
    });

    describe('Response Format Tests', () => {
      it('should return properly formatted TaskResponseDto', async () => {
        // Act
        const result = await controller.createTask(validCreateTaskDto, ownerUser);

        // Assert
        expect(result).toMatchObject({
          id: expect.any(String),
          title: validCreateTaskDto.title,
          description: validCreateTaskDto.description,
          status: validCreateTaskDto.status,
          priority: validCreateTaskDto.priority,
          category: validCreateTaskDto.category,
          dueDate: validCreateTaskDto.dueDate,
          sortOrder: validCreateTaskDto.sortOrder,
          ownerId: ownerUser.id,
          owner: expect.objectContaining({
            id: ownerUser.id,
            email: ownerUser.email,
            firstName: ownerUser.firstName,
            lastName: ownerUser.lastName,
          }),
          organizationId: ownerUser.organizationId,
          organization: expect.objectContaining({
            id: ownerUser.organizationId,
            name: ownerUser.organizationName,
          }),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          isOverdue: expect.any(Boolean),
          isCompleted: expect.any(Boolean),
        });
      });
    });

    describe('Organization Hierarchy Tests', () => {
      it('should allow Owner to assign task to user in sub-organization', async () => {
        // Arrange
        const subOrgUserId = 'user-sub-org-123';
        const taskDtoWithSubOrgOwner = {
          ...validCreateTaskDto,
          ownerId: subOrgUserId,
        };

        const mockSubOrgUser = {
          id: subOrgUserId,
          email: 'suborg@turbovets.com',
          organizationId: 'org-sub-456', // Sub-organization
          organization: { id: 'org-sub-456', name: 'Sub Organization' },
        };

        const mockSubOrganization = {
          id: 'org-sub-456',
          name: 'Sub Organization',
          parentId: ownerUser.organizationId, // Parent is owner's org
        };

        userRepository.findOne.mockResolvedValue(mockSubOrgUser as any);
        organizationRepository.find.mockResolvedValue([mockSubOrganization] as any);

        const mockSubOrgTask = {
          ...mockCreatedTask,
          ownerId: subOrgUserId,
        };
        const mockSubOrgTaskWithRelations = {
          ...mockSubOrgTask,
          owner: mockSubOrgUser,
          organization: { id: ownerUser.organizationId, name: ownerUser.organizationName },
        };

        taskRepository.create.mockReturnValue(mockSubOrgTask as any);
        taskRepository.save.mockResolvedValue(mockSubOrgTask as any);
        taskRepository.findOne.mockResolvedValue(mockSubOrgTaskWithRelations as any);

        // Act
        const result = await controller.createTask(taskDtoWithSubOrgOwner, ownerUser);

        // Assert
        expect(result.ownerId).toBe(subOrgUserId);
        expect(organizationRepository.find).toHaveBeenCalledWith({
          where: { parentId: ownerUser.organizationId },
        });
      });
    });
  });
}); 