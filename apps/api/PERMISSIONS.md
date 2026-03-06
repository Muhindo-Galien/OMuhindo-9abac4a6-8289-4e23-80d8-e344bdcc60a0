# Backend roles and permissions (2-level hierarchy)

## Role hierarchy

- **Owner** (level 2): Full CRUD on tasks and organizations; all admin actions; owner-only actions (update org, delete org, update member roles, revoke admin/viewer).
- **Admin** (level 1): CRUD on tasks in their orgs; create/read/update org and spaces; revoke viewer or self; cannot delete org, change roles, or revoke owner/admin.
- **Viewer** (level 0): Read tasks (and update own tasks); read org/members; revoke only self.

## Where it’s enforced

### Tasks (`TasksController`)

- Uses **RolesGuard** with `@Roles(RoleType.VIEWER)` or `@Roles(RoleType.ADMIN)`.
- **RolesGuard** allows a user if either:
  - `user.role` (JWT) has level ≥ required, or
  - **any** `user.org_roles[orgId]` has level ≥ required (so Owner in any org passes “admin”).
- Service methods then enforce per-task and per-org rules (e.g. viewer can only delete own tasks; admin/owner can delete any task in their org).

### Organizations (`OrganizationsController`)

- Uses **OrgRoleGuard** with `@OrgRoles(...)` for all `:orgId` routes.
- **OrgRoleGuard** reads `orgId` from params, body, or query; checks `user.org_roles[orgId]` and requires **level ≥ minimum** of the listed roles (e.g. `@OrgRoles(ADMIN, OWNER)` → min level 1 → Admin and Owner both pass).
- No **RolesGuard** on org routes; hierarchy is already correct via OrgRoleGuard and service checks.

### Invitations

- No guard on controller; **InvitationsService** uses effective role (via EffectiveRoleService) and allows admin or owner. Owner satisfies that.

### Audit

- **AuditController** uses **OrgRoleGuard** + `@OrgRoles(RoleType.ADMIN, RoleType.OWNER)` and `organizationId` from query. Owner and Admin both pass.

## Summary

- **Tasks**: Fixed by making RolesGuard consider `user.org_roles` so Owner (in any org) satisfies `@Roles(ADMIN)` for delete (and any other admin-level task route).
- **Organizations**: No change needed; OrgRoleGuard and services already use level-based checks, so Owner can do all org CRUD and admin-only actions.
