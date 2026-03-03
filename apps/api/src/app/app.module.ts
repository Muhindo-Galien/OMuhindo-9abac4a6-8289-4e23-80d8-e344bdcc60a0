import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestImportController } from './test-import.controller';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { DatabaseSeedService } from './database/seed.service';

@Module({
  imports: [
    // Simple config - just loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Basic TypeORM setup
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'secure_task_management_test',
      autoLoadEntities: true,
      synchronize: true, // Only for development/assessment
    }),
    
    // Feature modules
    AuthModule,
    TasksModule,
    AuditModule,
  ],
  controllers: [AppController, TestImportController],
  providers: [AppService, DatabaseSeedService],
})
export class AppModule {}
