import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  AuditResource,
  getRoleLevel,
  isChildOrg,
  isParentOrg,
  TASKS_REQUIRE_SPACE_MESSAGE,
} from '@data';
import { AuditService } from '../audit/audit.service';
import { EffectiveRoleService } from '../organizations/organizations.service';

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
    private effectiveRoleService: EffectiveRoleService
  ) {}

  async createTask(
    createTaskDto: CreateTaskDto,
    currentUser: { id: string; email: string }
  ): Promise<TaskResponseDto> {
    // Org admin/owner enforced by @RequireOrgAdminOrOwner() + OrgRoleGuard on controller (org from body.organizationId).
    const effective = await this.effectiveRoleService.getEffectiveRole(
      currentUser.id,
      createTaskDto.organizationId
    );
    if (!effective || getRoleLevel(effective) < getRoleLevel(RoleType.ADMIN)) {
      throw new ForbiddenException(
        'You need admin or owner role in this organization to create tasks'
      );
    }

    const org = await this.organizationRepository.findOne({
      where: { id: createTaskDto.organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    if (!isChildOrg(org)) {
      throw new ForbiddenException(TASKS_REQUIRE_SPACE_MESSAGE);
    }

    let taskOwnerId = currentUser.id;
    if (createTaskDto.ownerId) {
      await this.validateOwnerInOrganization(
        createTaskDto.ownerId,
        createTaskDto.organizationId,
        currentUser.id
      );
      taskOwnerId = createTaskDto.ownerId;
    }

    const newTask = this.taskRepository.create({
      ...createTaskDto,
      ownerId: taskOwnerId,
      organizationId: createTaskDto.organizationId,
    });
    const savedTask = await this.taskRepository.save(newTask);
    const taskWithRelations = await this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['owner', 'organization'],
    });

    await this.auditService.logAction(
      currentUser.id,
      AuditAction.CREATE,
      AuditResource.TASK,
      {
        resourceId: savedTask.id,
        organizationId: createTaskDto.organizationId,
        details: {
          title: savedTask.title,
          status: savedTask.status,
          organizationId: createTaskDto.organizationId,
        },
        success: true,
      }
    );

    return this.mapToResponseDto(taskWithRelations!);
  }

  async findAllTasks(
    queryDto: TaskQueryDto,
    currentUser: { id: string }
  ): Promise<TaskResponseDto[]> {
    const orgIds = await this.getAccessibleOrgIds(currentUser.id);
    if (orgIds.length === 0) return [];

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.organization', 'organization')
      .where('task.organizationId IN (:...orgIds)', { orgIds });

    if (queryDto.organizationId) {
      if (!orgIds.includes(queryDto.organizationId))
        throw new ForbiddenException('No access to this organization');
      queryBuilder.andWhere('task.organizationId = :orgId', {
        orgId: queryDto.organizationId,
      });
    }
    if (queryDto.status)
      queryBuilder.andWhere('task.status = :status', {
        status: queryDto.status,
      });
    if (queryDto.priority)
      queryBuilder.andWhere('task.priority = :priority', {
        priority: queryDto.priority,
      });
    if (queryDto.category)
      queryBuilder.andWhere('task.category = :category', {
        category: queryDto.category,
      });
    if (queryDto.search)
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${queryDto.search}%` }
      );

    const sortField = queryDto.sortBy || 'createdAt';
    const sortOrder = queryDto.sortOrder || 'DESC';
    queryBuilder.orderBy(`task.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    queryBuilder.skip((page - 1) * limit).take(limit);

    const tasks = await queryBuilder.getMany();
    return tasks.map(t => this.mapToResponseDto(t));
  }

  async findTaskById(
    taskId: string,
    currentUser: { id: string }
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['owner', 'organization'],
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertOrgIsSpace(task.organizationId, task.organization);

    const effective = await this.effectiveRoleService.getEffectiveRole(
      currentUser.id,
      task.organizationId
    );
    if (!effective) throw new ForbiddenException('Access denied to this task');

    return this.mapToResponseDto(task);
  }

  async updateTask(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    currentUser: { id: string }
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['owner', 'organization'],
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertOrgIsSpace(task.organizationId, task.organization);

    const effective = await this.effectiveRoleService.getEffectiveRole(
      currentUser.id,
      task.organizationId
    );
    if (!effective) throw new ForbiddenException('Access denied to this task');

    const level = getRoleLevel(effective);
    const canUpdateAny = level >= getRoleLevel(RoleType.ADMIN);
    const canUpdateOwn = task.ownerId === currentUser.id;
    if (!canUpdateAny && !canUpdateOwn)
      throw new ForbiddenException(
        'You do not have permission to update this task'
      );

    if (updateTaskDto.ownerId && updateTaskDto.ownerId !== task.ownerId) {
      await this.validateOwnerInOrganization(
        updateTaskDto.ownerId,
        task.organizationId,
        currentUser.id
      );
    }
    if (
      updateTaskDto.status === TaskStatus.DONE &&
      task.status !== TaskStatus.DONE
    ) {
      (updateTaskDto as any).completedAt = new Date();
    } else if (
      updateTaskDto.status &&
      updateTaskDto.status !== TaskStatus.DONE &&
      task.status === TaskStatus.DONE
    ) {
      (updateTaskDto as any).completedAt = undefined;
    }

    await this.taskRepository.update(taskId, updateTaskDto);
    const updated = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['owner', 'organization'],
    });

    await this.auditService.logAction(
      currentUser.id,
      AuditAction.UPDATE,
      AuditResource.TASK,
      {
        resourceId: taskId,
        organizationId: task.organizationId,
        details: { updatedFields: Object.keys(updateTaskDto) },
        success: true,
      }
    );

    return this.mapToResponseDto(updated!);
  }

  async deleteTask(taskId: string, currentUser: { id: string }): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['owner', 'organization'],
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertOrgIsSpace(task.organizationId, task.organization);

    const effective = await this.effectiveRoleService.getEffectiveRole(
      currentUser.id,
      task.organizationId
    );
    if (!effective) throw new ForbiddenException('Access denied to this task');

    const level = getRoleLevel(effective);
    const canDeleteAny = level >= getRoleLevel(RoleType.ADMIN);
    const canDeleteOwn = task.ownerId === currentUser.id;
    if (!canDeleteAny && !canDeleteOwn)
      throw new ForbiddenException(
        'You can only delete your own tasks or need admin/owner role'
      );

    await this.taskRepository.remove(task);
    await this.auditService.logAction(
      currentUser.id,
      AuditAction.DELETE,
      AuditResource.TASK,
      {
        resourceId: taskId,
        organizationId: task.organizationId,
        details: { title: task.title },
        success: true,
      }
    );
  }

  async bulkUpdateTasks(
    updates: BulkUpdateTaskDto[],
    currentUser: { id: string }
  ): Promise<TaskResponseDto[]> {
    const result: TaskResponseDto[] = [];
    for (const update of updates) {
      const task = await this.taskRepository.findOne({
        where: { id: update.id },
        relations: ['owner', 'organization'],
      });
      if (!task) continue;
      if (!isChildOrg(task.organization)) continue; // only spaces

      const effective = await this.effectiveRoleService.getEffectiveRole(
        currentUser.id,
        task.organizationId
      );
      if (!effective) continue;
      const level = getRoleLevel(effective);
      const canUpdate =
        level >= getRoleLevel(RoleType.ADMIN) ||
        task.ownerId === currentUser.id;
      if (!canUpdate) continue;

      if (update.sortOrder !== undefined) task.sortOrder = update.sortOrder;
      if (update.status) task.status = update.status;
      const saved = await this.taskRepository.save(task);
      result.push(this.mapToResponseDto(saved));
    }
    return result;
  }

  /** Org ids where user has access and which are spaces (child orgs). Tasks are only in spaces. */
  private async getAccessibleOrgIds(userId: string): Promise<string[]> {
    const orgs = await this.organizationRepository.find({
      where: {},
      select: ['id', 'parentId'],
    });
    const ids: string[] = [];
    for (const org of orgs) {
      if (!isChildOrg(org)) continue; // only spaces (child orgs), not sites (parents)
      const role = await this.effectiveRoleService.getEffectiveRole(
        userId,
        org.id
      );
      if (role) ids.push(org.id);
    }
    return ids;
  }

  /**
   * Enforces 2-level hierarchy: tasks only in spaces (child orgs). Rejects parent orgs (sites).
   */
  private async assertOrgIsSpace(
    organizationId: string,
    org?: Organization | null
  ): Promise<void> {
    if (org != null) {
      if (isParentOrg(org))
        throw new ForbiddenException(TASKS_REQUIRE_SPACE_MESSAGE);
      return;
    }
    const loaded = await this.organizationRepository.findOne({
      where: { id: organizationId },
      select: ['id', 'parentId'],
    });
    if (!loaded)
      throw new NotFoundException('Organization not found');
    if (isParentOrg(loaded))
      throw new ForbiddenException(TASKS_REQUIRE_SPACE_MESSAGE);
  }

  private async validateOwnerInOrganization(
    ownerId: string,
    organizationId: string,
    currentUserId: string
  ): Promise<User> {
    const proposed = await this.userRepository.findOne({
      where: { id: ownerId },
    });
    if (!proposed) throw new NotFoundException('User not found');

    const hasAccess = await this.effectiveRoleService.hasMinimumRole(
      currentUserId,
      organizationId,
      RoleType.ADMIN
    );
    if (!hasAccess)
      throw new ForbiddenException(
        'You cannot assign tasks in this organization'
      );

    const ownerInOrg = await this.effectiveRoleService.getEffectiveRole(
      ownerId,
      organizationId
    );
    if (!ownerInOrg)
      throw new ForbiddenException(
        'Assigned user must be a member of this organization'
      );

    return proposed;
  }

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
