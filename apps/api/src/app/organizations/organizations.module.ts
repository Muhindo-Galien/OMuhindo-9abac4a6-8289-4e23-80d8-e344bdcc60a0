import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization, OrganizationMember, User } from '@data';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsController } from './organizations.controller';
import {
  OrganizationsService,
  EffectiveRoleService,
} from './organizations.service';
import { OrganizationMembershipService } from './organization-membership.service';
import { EnrichOrgRolesGuard } from './enrich-org-roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember, User]),
    forwardRef(() => AuditModule),
    forwardRef(() => AuthModule),
  ],
  exports: [
    OrganizationsService,
    EffectiveRoleService,
    OrganizationMembershipService,
    EnrichOrgRolesGuard,
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    EffectiveRoleService,
    OrganizationMembershipService,
    EnrichOrgRolesGuard,
  ],
})
export class OrganizationsModule {}
