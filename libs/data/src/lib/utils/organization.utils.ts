/**
 * Shared organization hierarchy helpers (2-level: parent = site, child = space).
 * Use on both backend and frontend for consistent checks.
 *
 * Role inheritance (enforced on backend; use for UI):
 * - Owner on parent → inherits "owner" on all children (no extra row).
 * - Admin on parent → inherits "admin" on children.
 * - Viewer on parent → inherits "viewer" on children (no escalation).
 * - Direct child role overrides inheritance.
 *
 * Task scope (backend + frontend):
 * - Tasks are only allowed in spaces (child orgs). Sites (parent orgs) cannot have tasks.
 * - Backend: RequireSpaceOrgGuard + service checks. Frontend: require space before create/scope.
 */

export interface OrgWithParentId {
  parentId?: string | null;
}

/** Message when task operation is attempted in a site (parent org) instead of a space. */
export const TASKS_REQUIRE_SPACE_MESSAGE =
  'Tasks can only be created in spaces (child orgs), not in sites (parent orgs). Select a space first.';

/**
 * True if the org is a space (child org). Tasks and space-scoped features use this.
 */
export function isChildOrg(org: OrgWithParentId | null | undefined): boolean {
  return org != null && org.parentId != null && org.parentId !== '';
}

/**
 * True if the org is a site (parent org). No tasks; use for workspace-level features.
 */
export function isParentOrg(org: OrgWithParentId | null | undefined): boolean {
  return org != null && (org.parentId == null || org.parentId === '');
}
