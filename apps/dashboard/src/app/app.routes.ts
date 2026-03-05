import { Route } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { OrgSelectedGuard } from './guards/org-selected.guard';

const loginRoute: Route = {
  canActivate: [GuestGuard],
  loadComponent: () =>
    import('./auth/login.component').then(c => c.LoginComponent),
};

const registerRoute: Route = {
  canActivate: [GuestGuard],
  loadComponent: () =>
    import('./auth/register.component').then(c => c.RegisterComponent),
};

/** Layout (header + sidebar) wraps these routes. */
const appLayoutRoute: Route = {
  path: 'app',
  canActivate: [AuthGuard, OrgSelectedGuard],
  loadComponent: () =>
    import('./layout/app-layout.component').then(c => c.AppLayoutComponent),
  children: [
    { path: 'dashboard', redirectTo: 'tasks/board', pathMatch: 'full' },
    {
      path: 'tasks',
      children: [
        { path: '', redirectTo: 'board', pathMatch: 'full' },
        {
          path: 'board',
          loadComponent: () =>
            import('./tasks/task-board.component').then(
              c => c.TaskBoardComponent
            ),
        },
        {
          path: 'list',
          loadComponent: () =>
            import('./tasks/task-list.component').then(
              c => c.TaskListComponent
            ),
        },
      ],
    },
    {
      path: 'audit-logs',
      loadComponent: () =>
        import('./audit/audit-logs.component').then(c => c.AuditLogsComponent),
    },
    { path: '', redirectTo: 'tasks/board', pathMatch: 'full' },
  ],
};

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/orgs', pathMatch: 'full' },
  { path: 'login', ...loginRoute },
  { path: 'register', ...registerRoute },
  {
    path: 'orgs',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./orgs/org-list.component').then(c => c.OrgListComponent),
  },
  appLayoutRoute,
  { path: 'dashboard', redirectTo: '/app/dashboard', pathMatch: 'full' },
  { path: 'tasks', redirectTo: '/app/tasks/board', pathMatch: 'prefix' },
  { path: 'audit-logs', redirectTo: '/app/audit-logs', pathMatch: 'full' },
  { path: '**', redirectTo: '/orgs' },
];
