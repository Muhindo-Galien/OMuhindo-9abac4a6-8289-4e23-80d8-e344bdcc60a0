import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Omit for workspace/parent org (root). Set for space/child org. */
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

/** Owner (creator) or member summary for org responses */
export class OrganizationOwnerDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class OrganizationResponseDto {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  /** Creator / user with owner role in this org */
  owner?: OrganizationOwnerDto;
  createdAt: Date;
  updatedAt: Date;
}
