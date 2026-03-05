import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { OrganizationMembershipService } from './organization-membership.service';

/**
 * Runs after JwtAuthGuard. Enriches request.user.org_roles from the database
 * so that OrgRoleGuard can allow access to orgs the user just created or joined
 * without requiring a token refresh.
 */
@Injectable()
export class EnrichOrgRolesGuard implements CanActivate {
  constructor(private membershipService: OrganizationMembershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) return true;

    const orgRoles = await this.membershipService.getOrgRolesForUser(user.id);
    request.user.org_roles = { ...request.user.org_roles, ...orgRoles };
    return true;
  }
}
