import { Route } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./tasks/task-board.component').then(c => c.TaskBoardComponent)
  },
  {
    path: 'tasks',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full'
      },
      {
        path: 'board',
        loadComponent: () => import('./tasks/task-board.component').then(c => c.TaskBoardComponent)
      },
      {
        path: 'list',
        loadComponent: () => import('./tasks/task-list.component').then(c => c.TaskListComponent)
      }
    ]
  },
  {
    path: 'audit-logs',
    canActivate: [AuthGuard],
    loadComponent: () => import('./audit/audit-logs.component').then(c => c.AuditLogsComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
