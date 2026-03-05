import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { OrganizationMembershipService } from './organization-membership.service';

/**
 * Runs after JwtAuthGuard. Sets request.user.org_roles from the database using
 * effective roles (direct + inherited). Ensures OrgRoleGuard sees parent→child
 * inheritance: owner/admin/viewer on parent implies same role on all children;
 * direct child role overrides. Single source of truth so access works without
 * token refresh and child orgs (spaces) are allowed when user has role on parent (site).
 */
@Injectable()
export class EnrichOrgRolesGuard implements CanActivate {
  constructor(private membershipService: OrganizationMembershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) return true;

    const orgRoles = await this.membershipService.getEffectiveOrgRolesForUser(user.id);
    request.user.org_roles = orgRoles;
    return true;
  }
}
