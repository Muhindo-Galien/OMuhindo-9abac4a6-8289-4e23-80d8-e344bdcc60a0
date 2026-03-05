import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to inject the current authenticated user into a route handler parameter.
 * User shape: { id, email, role (global), org_roles?: Record<orgId, RoleType> }.
 * Use with EnrichOrgRolesGuard so org_roles is populated from DB for org-scoped routes.
 * @param data - Optional property name to extract from the user object (e.g. 'id', 'email', 'org_roles')
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  }
);

/** Get the current user's ID */
export const CurrentUserId = () => CurrentUser('id');

/** Get the current user's global role */
export const CurrentUserRole = () => CurrentUser('role');

/** Get the current user's org-scoped roles (orgId -> RoleType). Populated when EnrichOrgRolesGuard is used. */
export const CurrentUserOrgRoles = () => CurrentUser('org_roles');
