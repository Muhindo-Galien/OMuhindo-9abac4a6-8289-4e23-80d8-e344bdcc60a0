import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Import from libs
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskQueryDto,
  BulkUpdateTaskDto,
  RoleType,
} from '@data';
import {
  JwtAuthGuard,
  CurrentUser,
  Roles,
  RolesGuard,
  OrgRoleGuard,
  RequireOrgAdminOrOwner,
} from '@auth';

// Local
import { EnrichOrgRolesGuard } from '../organizations/enrich-org-roles.guard';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(EnrichOrgRolesGuard, OrgRoleGuard)
  @RequireOrgAdminOrOwner()
  @Roles(RoleType.VIEWER)
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() currentUser: any
  ): Promise<TaskResponseDto> {
    return await this.tasksService.createTask(createTaskDto, currentUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.VIEWER) // All authenticated users can view tasks (filtered by service)
  async getTasks(
    @Query() queryDto: TaskQueryDto,
    @CurrentUser() currentUser: any
  ): Promise<TaskResponseDto[]> {
    return await this.tasksService.findAllTasks(queryDto, currentUser);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.VIEWER) // All authenticated users can view individual tasks (access controlled by service)
  async getTaskById(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: any
  ): Promise<TaskResponseDto> {
    return await this.tasksService.findTaskById(taskId, currentUser);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.VIEWER) // All users can update tasks (permission checked by service)
  async updateTask(
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: any
  ): Promise<TaskResponseDto> {
    return await this.tasksService.updateTask(
      taskId,
      updateTaskDto,
      currentUser
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleType.ADMIN) // Only Admin and Owner can delete tasks
  async deleteTask(
    @Param('id') taskId: string,
    @CurrentUser() currentUser: any
  ): Promise<void> {
    return await this.tasksService.deleteTask(taskId, currentUser);
  }

  @Put('bulk-update')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.VIEWER) // All users can bulk update (for drag-and-drop, permission checked by service)
  async bulkUpdateTasks(
    @Body() bulkUpdateDto: { tasks: BulkUpdateTaskDto[] },
    @CurrentUser() currentUser: any
  ): Promise<TaskResponseDto[]> {
    return await this.tasksService.bulkUpdateTasks(
      bulkUpdateDto.tasks,
      currentUser
    );
  }
}
