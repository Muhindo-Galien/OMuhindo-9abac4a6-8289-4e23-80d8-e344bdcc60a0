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
  {
    path: 'dashboard',
    canActivate: [AuthGuard, OrgSelectedGuard],
    loadComponent: () =>
      import('./tasks/task-board.component').then(c => c.TaskBoardComponent),
  },
  {
    path: 'tasks',
    canActivate: [AuthGuard, OrgSelectedGuard],
    children: [
      {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full',
      },
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
          import('./tasks/task-list.component').then(c => c.TaskListComponent),
      },
    ],
  },
  {
    path: 'audit-logs',
    canActivate: [AuthGuard, OrgSelectedGuard],
    loadComponent: () =>
      import('./audit/audit-logs.component').then(c => c.AuditLogsComponent),
  },
  { path: '**', redirectTo: '/orgs' },
];
