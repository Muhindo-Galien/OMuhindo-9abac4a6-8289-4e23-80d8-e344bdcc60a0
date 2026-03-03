import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { RoleType } from '../models/role.model';

// Create User DTO (for admin creating new users)
export class CreateUserDto {
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

  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsUUID()
  roleId?: string; // Optional, defaults to VIEWER if not provided

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

// Update User DTO
export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// User Response DTO (what gets returned to frontend)
export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  role: {
    id: string;
    name: RoleType;
    level: number;
  };
  organization: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// User Profile Update DTO (for users updating their own profile)
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

// User List Query DTO (for filtering/sorting users)
export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // Search in name/email

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' =
    'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
