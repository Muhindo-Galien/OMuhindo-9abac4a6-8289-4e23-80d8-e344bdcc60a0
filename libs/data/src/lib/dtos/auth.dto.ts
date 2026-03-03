import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { RoleType } from '../models/role.model';

// Login DTO
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// Register DTO
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsUUID()
  roleId?: string; // Optional, defaults to VIEWER if not provided
}

// JWT Payload Interface
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: RoleType;
  roleLevel: number;
  organizationId: string;
  iat?: number;
  exp?: number;
}

// Auth Response DTO
export class AuthResponseDto {
  access_token: string;
  user: UserProfile;
}

// User Profile (sanitized user info)
export class UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleType;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Password Change DTO
export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
