import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType, getRoleLevel } from '@data';

export const ORG_ID_PARAM = 'orgId';
const ORG_ROLES_KEY = 'org_roles';

/** Requires one of the given org-scoped roles for the org in request (param orgId or body organizationId). */
@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<RoleType[]>(
      ORG_ROLES_KEY,
      context.getHandler()
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const orgId =
      request.params?.[ORG_ID_PARAM] ||
      request.params?.orgId ||
      request.params?.id ||
      request.body?.organizationId ||
      request.query?.organizationId;
    if (!orgId) throw new ForbiddenException('Organization context required');

    const userOrgRole = user.org_roles?.[orgId] as RoleType | undefined;
    if (!userOrgRole) throw new ForbiddenException('No access to this organization');

    const userLevel = getRoleLevel(userOrgRole);
    const minLevel = Math.min(...requiredRoles.map((r) => getRoleLevel(r)));
    if (userLevel < minLevel)
      throw new ForbiddenException('Insufficient role in this organization');

    return true;
  }
}
