import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Organization,
  OrganizationMember,
  AuditLog,
  Invitation,
  Role,
} from '@data';
import { AuthService, JwtStrategy } from '@auth';
import { AuditModule } from '../audit/audit.module';
import { AuthController } from './auth.controller';
import { AuthApplicationService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      OrganizationMember,
      AuditLog,
      Invitation,
      Role,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthApplicationService, JwtStrategy],
  exports: [AuthApplicationService],
})
export class AuthModule {}
