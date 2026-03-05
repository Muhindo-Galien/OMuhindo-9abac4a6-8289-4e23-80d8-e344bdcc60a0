import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
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

// Register DTO – user only; no org created on signup (create orgs after login from dashboard).
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  /** Ignored: org creation on register is disabled for security. Create orgs after login. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  createOrgName?: string;

  /** If set and valid, accept the invitation after registration and add membership. */
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

// JWT payload: global role only at login; org_roles only when present (e.g. after refresh).
export interface JwtPayload {
  sub: string;
  email: string;
  role: string; // global: "user"
  org_roles?: Record<string, RoleType>; // orgId -> role
  iat?: number;
  exp?: number;
}

// Auth response: token + user; org_roles included when user has memberships (e.g. after refresh or invite acceptance).
export class AuthResponseDto {
  access_token: string;
  user: UserProfile;
}

export class UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // global "user"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Org-scoped roles when available (e.g. after refresh or register with org creation). */
  org_roles?: Record<string, RoleType>;
}

// Password change DTO
export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
