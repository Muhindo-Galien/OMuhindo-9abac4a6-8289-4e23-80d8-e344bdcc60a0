import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to inject the current authenticated user into a route handler parameter
 * @param data - Optional property name to extract from the user object
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested, return that property
    if (data) {
      return user?.[data];
    }

    // Return the entire user object
    return user;
  }
);

/**
 * Decorator to get the current user's ID
 */
export const CurrentUserId = () => CurrentUser('id');

/**
 * Decorator to get the current user's organization ID
 */
export const CurrentUserOrgId = () => CurrentUser('organizationId');

/**
 * Decorator to get the current user's role
 */
export const CurrentUserRole = () => CurrentUser('role');
