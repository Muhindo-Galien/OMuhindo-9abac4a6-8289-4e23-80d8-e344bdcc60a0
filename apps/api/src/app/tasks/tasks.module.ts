import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task, User, Organization } from '@data';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RequireSpaceOrgGuard } from './require-space-org.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Organization]),
    AuditModule,
    OrganizationsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, RequireSpaceOrgGuard],
  exports: [TasksService],
})
export class TasksModule {}
