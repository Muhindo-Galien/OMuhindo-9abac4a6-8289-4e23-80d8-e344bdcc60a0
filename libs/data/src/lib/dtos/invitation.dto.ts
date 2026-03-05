import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RoleType } from '../models/role.model';

export class SendInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(RoleType)
  role: RoleType;

  @IsUUID()
  organizationId: string;
}

export class AcceptInvitationDto {
  @IsOptional()
  @IsString()
  token?: string;
}

export class InvitationResponseDto {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: RoleType;
  status: string;
  invitedById?: string;
  invitedByEmail?: string;
  expiresAt: Date;
  createdAt: Date;
}
