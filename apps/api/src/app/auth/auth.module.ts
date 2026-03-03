import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import entities and services from libs
import { User, Organization, Role, Task, AuditLog } from '@data';
import { AuthService, JwtStrategy } from '@auth';

// Import audit service
import { AuditService } from '../audit/audit.service';

// Local auth components
import { AuthController } from './auth.controller';
import { AuthApplicationService } from './auth.service';

@Module({
  imports: [
    // Import entities for repository injection
    TypeOrmModule.forFeature([User, Organization, Role, Task, AuditLog]),
    
    // Passport for authentication strategies
    PassportModule,
    
    // JWT module configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h' 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, // From @auth library
    AuthApplicationService, // Application-specific auth service
    AuditService, // For audit logging
    JwtStrategy, // JWT authentication strategy
  ],
  exports: [AuthService, AuthApplicationService],
})
export class AuthModule {} 