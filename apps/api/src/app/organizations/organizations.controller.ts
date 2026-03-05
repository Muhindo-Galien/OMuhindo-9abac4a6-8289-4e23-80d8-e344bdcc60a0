import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationResponseDto,
  RoleType,
} from '@data';
import { JwtAuthGuard, CurrentUser, OrgRoles, OrgRoleGuard } from '@auth';
import { OrganizationsService } from './organizations.service';
import { AuthApplicationService } from '../auth/auth.service';
import { EnrichOrgRolesGuard } from './enrich-org-roles.guard';

export interface CreateOrganizationResponse {
  organization: OrganizationResponseDto;
  access_token: string;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard, EnrichOrgRolesGuard)
export class OrganizationsController {
  constructor(
    private organizationsService: OrganizationsService,
    private authApplicationService: AuthApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: { id: string }
  ): Promise<CreateOrganizationResponse> {
    const organization = await this.organizationsService.create(dto, user.id);
    const { access_token } = await this.authApplicationService.refresh(user.id);
    return { organization, access_token };
  }

  @Get()
  async findMy(
    @CurrentUser() user: { id: string }
  ): Promise<OrganizationResponseDto[]> {
    return this.organizationsService.findMyOrganizations(user.id);
  }

  @Get(':orgId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(RoleType.VIEWER, RoleType.ADMIN, RoleType.OWNER)
  async findOne(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { id: string }
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.findOne(orgId, user.id);
  }

  @Put(':orgId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(RoleType.ADMIN, RoleType.OWNER)
  async update(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: { id: string }
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.update(orgId, dto, user.id);
  }

  @Delete(':orgId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(RoleType.OWNER)
  async delete(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { id: string }
  ): Promise<void> {
    return this.organizationsService.delete(orgId, user.id);
  }

  @Post(':orgId/children')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(RoleType.ADMIN, RoleType.OWNER)
  @HttpCode(HttpStatus.CREATED)
  async createChild(
    @Param('orgId') orgId: string,
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: { id: string }
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.createChild(orgId, dto, user.id);
  }

  @Get(':orgId/members')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(RoleType.VIEWER, RoleType.ADMIN, RoleType.OWNER)
  async getMembers(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.organizationsService.getMembers(orgId, user.id);
  }

  @Delete(':orgId/members/:userId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(RoleType.ADMIN, RoleType.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeMember(
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: { id: string }
  ): Promise<void> {
    return this.organizationsService.revokeMembership(
      orgId,
      targetUserId,
      user.id
    );
  }
}
