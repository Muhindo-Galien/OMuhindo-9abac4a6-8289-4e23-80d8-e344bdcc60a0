import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestImportController } from './test-import.controller';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { InvitationsModule } from './invitations/invitations.module';
import { DatabaseSeedService } from './database/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'DefiLord23',
      database: process.env.DATABASE_NAME || 'secure_task_management_test',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    OrganizationsModule,
    InvitationsModule,
    TasksModule,
    AuditModule,
  ],
  controllers: [AppController, TestImportController],
  providers: [AppService, DatabaseSeedService],
})
export class AppModule {}
