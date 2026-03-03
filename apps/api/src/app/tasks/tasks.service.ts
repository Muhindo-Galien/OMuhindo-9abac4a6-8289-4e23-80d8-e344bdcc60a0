import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import from libs
import { 
  Task,  
  Organization, 
  User,
  CreateTaskDto, 
  UpdateTaskDto, 
  TaskResponseDto,
  TaskQueryDto,
  TaskStatus,
  RoleType,
  BulkUpdateTaskDto,
  AuditAction,
  AuditResource 
} from '@data';

// Import audit service
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async createTask(createTaskDto: CreateTaskDto, currentUser: any): Promise<TaskResponseDto> {
    console.log('=== CREATE TASK START ===');
    console.log('Creating task for user:', currentUser.email);
    console.log('Task data:', createTaskDto);

    try {
      // Check if user has permission to create tasks (OWNER or ADMIN)
      if (currentUser.role !== RoleType.OWNER && currentUser.role !== RoleType.ADMIN) {
        console.log('Task creation denied - insufficient permissions for role:', currentUser.role);
        throw new ForbiddenException('Only owners and admins can create tasks');
      }

      console.log('User has permission to create tasks');

      // Determine the owner of the task
      let taskOwnerId = currentUser.id; // Default to current user
      
      if (createTaskDto.ownerId) {
        console.log('Custom ownerId provided:', createTaskDto.ownerId);
        // Validate that the proposed owner is valid
        await this.validateOwnerInOrganization(createTaskDto.ownerId, currentUser);
        taskOwnerId = createTaskDto.ownerId;
      }

      // Create new task
      const newTask = this.taskRepository.create({
        ...createTaskDto,
        ownerId: taskOwnerId,
        organizationId: currentUser.organizationId,
      });

      console.log('Saving task to database...');
      const savedTask = await this.taskRepository.save(newTask);
      console.log('Task created with ID:', savedTask.id, 'assigned to:', taskOwnerId);

      // Load task with relations for response
      const taskWithRelations = await this.taskRepository.findOne({
        where: { id: savedTask.id },
        relations: ['owner', 'organization'],
      });

      console.log('Task created successfully');

      // Log audit action
      try {
        await this.auditService.logAction(
          currentUser.id,
          AuditAction.CREATE,
          AuditResource.TASK,
          {
            resourceId: savedTask.id,
            details: {
              title: savedTask.title,
              status: savedTask.status,
              priority: savedTask.priority,
              ownerId: savedTask.ownerId,
            },
            success: true,
          }
        );
      } catch (auditError) {
        console.error('Failed to log audit action:', auditError);
      }

      console.log('=== CREATE TASK SUCCESS ===');

      return this.mapToResponseDto(taskWithRelations!);
    } catch (error) {
      console.log('=== CREATE TASK ERROR ===');
      console.error('Task creation error:', error);
      throw error;
    }
  }

  async findAllTasks(queryDto: TaskQueryDto, currentUser: any): Promise<TaskResponseDto[]> {
    console.log('=== GET TASKS START ===');
    console.log('Fetching tasks for user:', currentUser.email, 'with role:', currentUser.role);
    console.log('Query parameters:', queryDto);

    try {
      const queryBuilder = this.taskRepository.createQueryBuilder('task')
        .leftJoinAndSelect('task.owner', 'owner')
        .leftJoinAndSelect('task.organization', 'organization');

      // Apply organization-based access control
      if (currentUser.role === RoleType.OWNER) {
        console.log('Owner access - fetching all tasks in organization and sub-organizations');
        // Owner can see all tasks in their org + sub-orgs
        const subOrgs = await this.organizationRepository.find({
          where: { parentId: currentUser.organizationId }
        });
        
        const orgIds = [currentUser.organizationId];
        if (subOrgs.length > 0) {
          orgIds.push(...subOrgs.map(org => org.id));
        }
        
        queryBuilder.andWhere('task.organizationId IN (:...orgIds)', { orgIds });
      } else if (currentUser.role === RoleType.ADMIN) {
        console.log('Admin access - fetching tasks in current organization');
        // Admin can see all tasks in their organization level
        queryBuilder.andWhere('task.organizationId = :orgId', { 
          orgId: currentUser.organizationId 
        });
      } else {
        console.log('Viewer access - fetching only owned tasks');
        // Viewer can only see their own tasks
        queryBuilder.andWhere('task.ownerId = :userId', { userId: currentUser.id });
      }

      // Apply filters
      if (queryDto.status) {
        queryBuilder.andWhere('task.status = :status', { status: queryDto.status });
      }
      if (queryDto.priority) {
        queryBuilder.andWhere('task.priority = :priority', { priority: queryDto.priority });
      }
      if (queryDto.category) {
        queryBuilder.andWhere('task.category = :category', { category: queryDto.category });
      }
      if (queryDto.search) {
        queryBuilder.andWhere(
          '(task.title ILIKE :search OR task.description ILIKE :search)',
          { search: `%${queryDto.search}%` }
        );
      }

      // Apply sorting
      const sortField = queryDto.sortBy || 'createdAt';
      const sortOrder = queryDto.sortOrder || 'DESC';
      queryBuilder.orderBy(`task.${sortField}`, sortOrder as 'ASC' | 'DESC');

      // Apply pagination
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      queryBuilder.skip((page - 1) * limit).take(limit);

      console.log('Executing query...');
      const tasks = await queryBuilder.getMany();
      console.log(`Found ${tasks.length} tasks`);

      console.log('=== GET TASKS SUCCESS ===');
      return tasks.map(task => this.mapToResponseDto(task));
    } catch (error) {
      console.log('=== GET TASKS ERROR ===');
      console.error('Tasks fetch error:', error);
      throw error;
    }
  }

  async findTaskById(taskId: string, currentUser: any): Promise<TaskResponseDto> {
    console.log('=== GET TASK BY ID START ===');
    console.log('Fetching task:', taskId, 'for user:', currentUser.email);

    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['owner', 'organization'],
      });

      if (!task) {
        console.log('Task not found:', taskId);
        throw new NotFoundException('Task not found');
      }

      // Check access permissions
      const hasAccess = await this.checkTaskAccess(task, currentUser);
      if (!hasAccess) {
        console.log('Access denied to task:', taskId, 'for user:', currentUser.email);
        throw new ForbiddenException('Access denied to this task');
      }

      console.log('Task access granted');
      console.log('=== GET TASK BY ID SUCCESS ===');

      return this.mapToResponseDto(task);
    } catch (error) {
      console.log('=== GET TASK BY ID ERROR ===');
      console.error('Task fetch error:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto, currentUser: any): Promise<TaskResponseDto> {
    console.log('=== UPDATE TASK START ===');
    console.log('Updating task:', taskId, 'for user:', currentUser.email);
    console.log('Update data:', updateTaskDto);

    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['owner', 'organization'],
      });

      if (!task) {
        console.log('Task not found:', taskId);
        throw new NotFoundException('Task not found');
      }

      // Check if user has permission to update this task
      const canUpdate = await this.checkTaskUpdatePermission(task, currentUser);
      if (!canUpdate) {
        console.log('Update permission denied for task:', taskId, 'user:', currentUser.email);
        throw new ForbiddenException('You do not have permission to update this task');
      }

      console.log('Update permission granted');

      // Validate ownerId change if provided
      if (updateTaskDto.ownerId && updateTaskDto.ownerId !== task.ownerId) {
        console.log('Owner change requested from:', task.ownerId, 'to:', updateTaskDto.ownerId);
        
        // Validate that the proposed new owner is valid
        await this.validateOwnerInOrganization(updateTaskDto.ownerId, currentUser);
        console.log('Owner change validation successful');
      }

      // Handle completion status
      if (updateTaskDto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
        updateTaskDto.completedAt = new Date().toISOString();
        console.log('Task marked as completed');
      } else if (updateTaskDto.status && updateTaskDto.status !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
        updateTaskDto.completedAt = undefined;
      }

      // Update task
      await this.taskRepository.update(taskId, updateTaskDto);
      console.log('Task updated in database');

      // Fetch updated task
      const updatedTask = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['owner', 'organization'],
      });

      console.log('Task updated successfully');

      // Log audit action
      try {
        await this.auditService.logAction(
          currentUser.id,
          AuditAction.UPDATE,
          AuditResource.TASK,
          {
            resourceId: taskId,
            details: {
              updatedFields: Object.keys(updateTaskDto),
                          changes: updateTaskDto,
            previousOwnerId: task.ownerId,
            newOwnerId: updatedTask?.ownerId,
            },
            success: true,
          }
        );
      } catch (auditError) {
        console.error('Failed to log audit action:', auditError);
      }

      console.log('=== UPDATE TASK SUCCESS ===');

      return this.mapToResponseDto(updatedTask!);
    } catch (error) {
      console.log('=== UPDATE TASK ERROR ===');
      console.error('Task update error:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string, currentUser: any): Promise<void> {
    console.log('=== DELETE TASK START ===');
    console.log('Task ID:', taskId);
    console.log('Current User:', currentUser.id, currentUser.email);
    
    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
        relations: ['owner', 'organization']
      });

      if (!task) {
        console.log('Task not found');
        throw new NotFoundException('Task not found');
      }

      // Check if user can delete this task
      if (task.ownerId !== currentUser.id && currentUser.role.name !== RoleType.OWNER && currentUser.role.name !== RoleType.ADMIN) {
        console.log('User not authorized to delete this task');
        throw new ForbiddenException('You can only delete your own tasks or be an admin/owner');
      }

      await this.taskRepository.remove(task);
      console.log('Task deleted successfully');

      // Log audit action
      try {
        await this.auditService.logAction(
          currentUser.id,
          AuditAction.DELETE,
          AuditResource.TASK,
          {
            resourceId: taskId,
            details: {
              title: task.title,
              status: task.status,
              ownerId: task.ownerId,
            },
            success: true,
          }
        );
      } catch (auditError) {
        console.error('Failed to log audit action:', auditError);
      }

      console.log('=== DELETE TASK SUCCESS ===');
    } catch (error) {
      console.log('=== DELETE TASK ERROR ===');
      console.error('Delete error:', error);
      throw error;
    }
  }

  async bulkUpdateTasks(updates: BulkUpdateTaskDto[], currentUser: any): Promise<TaskResponseDto[]> {
    console.log('=== BULK UPDATE TASKS START ===');
    console.log('Updates:', updates);
    console.log('Current User:', currentUser.id, currentUser.email);

    try {
      const updatedTasks: TaskResponseDto[] = [];

      for (const update of updates) {
        const task = await this.taskRepository.findOne({
          where: { id: update.id },
          relations: ['owner', 'organization']
        });

        if (!task) {
          console.log(`Task ${update.id} not found`);
          continue; // Skip missing tasks
        }

        // Check if user can update this task
        if (task.ownerId !== currentUser.id && currentUser.role.name !== RoleType.OWNER && currentUser.role.name !== RoleType.ADMIN) {
          console.log(`User not authorized to update task ${update.id}`);
          continue; // Skip unauthorized tasks
        }

        // Update the task fields
        if (update.sortOrder !== undefined) {
          task.sortOrder = update.sortOrder;
        }
        if (update.status) {
          task.status = update.status;
        }

        const updatedTask = await this.taskRepository.save(task);
        updatedTasks.push(this.mapToResponseDto(updatedTask));
      }

      console.log(`Successfully updated ${updatedTasks.length} tasks`);
      console.log('=== BULK UPDATE TASKS SUCCESS ===');
      return updatedTasks;
    } catch (error) {
      console.log('=== BULK UPDATE TASKS ERROR ===');
      console.error('Bulk update error:', error);
      throw error;
    }
  }

  // Helper method to check task access
  private async checkTaskAccess(task: Task, currentUser: any): Promise<boolean> {
    // Owner can access all tasks in org + sub-orgs
    if (currentUser.role === RoleType.OWNER) {
      const subOrgs = await this.organizationRepository.find({
        where: { parentId: currentUser.organizationId }
      });
      
      const accessibleOrgIds = [currentUser.organizationId];
      if (subOrgs.length > 0) {
        accessibleOrgIds.push(...subOrgs.map(org => org.id));
      }
      
      return accessibleOrgIds.includes(task.organizationId);
    }

    // Admin can access tasks in their organization
    if (currentUser.role === RoleType.ADMIN) {
      return task.organizationId === currentUser.organizationId;
    }

    // Viewer can only access their own tasks
    return task.ownerId === currentUser.id;
  }

  // Helper method to check task update permission
  private async checkTaskUpdatePermission(task: Task, currentUser: any): Promise<boolean> {
    // Owner can update all tasks in accessible orgs
    if (currentUser.role === RoleType.OWNER) {
      return await this.checkTaskAccess(task, currentUser);
    }

    // Admin can update tasks in their organization
    if (currentUser.role === RoleType.ADMIN) {
      return task.organizationId === currentUser.organizationId;
    }

    // Viewer can only update their own tasks
    return task.ownerId === currentUser.id;
  }

  // Helper method to validate owner assignment
  private async validateOwnerInOrganization(ownerId: string, currentUser: any): Promise<User> {
    console.log('Validating owner assignment:', ownerId, 'by user:', currentUser.email);

    // Find the proposed owner
    const proposedOwner = await this.userRepository.findOne({
      where: { id: ownerId },
      relations: ['organization']
    });

    if (!proposedOwner) {
      console.log('Proposed owner not found:', ownerId);
      throw new NotFoundException('User not found');
    }

    // Check if current user has permission to assign tasks to this owner
    if (currentUser.role === RoleType.OWNER) {
      // Owner can assign to users in their org + sub-orgs
      const subOrgs = await this.organizationRepository.find({
        where: { parentId: currentUser.organizationId }
      });
      
      const accessibleOrgIds = [currentUser.organizationId];
      if (subOrgs.length > 0) {
        accessibleOrgIds.push(...subOrgs.map(org => org.id));
      }
      
      if (!accessibleOrgIds.includes(proposedOwner.organizationId)) {
        console.log('Owner cannot assign to user outside organization hierarchy');
        throw new ForbiddenException('Cannot assign task to user outside your organization hierarchy');
      }
    } else if (currentUser.role === RoleType.ADMIN) {
      // Admin can only assign to users in their same organization
      if (proposedOwner.organizationId !== currentUser.organizationId) {
        console.log('Admin cannot assign to user outside their organization');
        throw new ForbiddenException('Cannot assign task to user outside your organization');
      }
    } else {
      // Viewer can only assign to themselves
      if (ownerId !== currentUser.id) {
        console.log('Viewer cannot assign tasks to other users');
        throw new ForbiddenException('You can only assign tasks to yourself');
      }
    }

    console.log('Owner validation successful');
    return proposedOwner;
  }

  // Helper method to map Task entity to TaskResponseDto
  private mapToResponseDto(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      sortOrder: task.sortOrder,
      ownerId: task.ownerId,
      owner: {
        id: task.owner.id,
        email: task.owner.email,
        firstName: task.owner.firstName,
        lastName: task.owner.lastName,
      },
      organizationId: task.organizationId,
      organization: {
        id: task.organization.id,
        name: task.organization.name,
      },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      isOverdue: task.isOverdue,
      isCompleted: task.isCompleted,
    };
  }
} 