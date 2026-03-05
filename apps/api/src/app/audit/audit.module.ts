import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuditLog, User, Organization } from '@data';
import { AuthService, JwtStrategy, RbacGuard, RbacService } from '@auth';

import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User, Organization]),
    forwardRef(() => OrganizationsModule),
    AuthModule,
    PassportModule,

    // JWT module configuration (same as other modules)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditInterceptor, // Audit interceptor for automatic logging
    AuthService, // For JWT functionality
    JwtStrategy, // For route protection
    RbacGuard, // For role-based access control
    RbacService, // For role-based access control service
  ],
  exports: [AuditService, AuditInterceptor], // Export service and interceptor for use in other modules
})
export class AuditModule {}
