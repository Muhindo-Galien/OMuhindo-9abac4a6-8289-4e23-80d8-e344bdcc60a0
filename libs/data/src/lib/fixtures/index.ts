// Test Fixtures for Secure Task Management System
// Shared across frontend and backend tests

import { RoleType } from '../models/role.model';
import { TaskStatus, TaskPriority, TaskCategory } from '../models/task.model';
import { AuditAction, AuditResource } from '../models/audit-log.model';

// =============================================================================
// USER FIXTURES
// =============================================================================

export const mockUsers = {
  owner: {
    id: 'user-owner-123',
    email: 'owner@turbovets.com',
    firstName: 'Owner',
    lastName: 'User',
    role: RoleType.OWNER,
    organizationId: 'org-123',
    organizationName: 'TurboVets Organization',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  admin: {
    id: 'user-admin-456',
    email: 'admin@turbovets.com',
    firstName: 'Admin',
    lastName: 'User',
    role: RoleType.ADMIN,
    organizationId: 'org-123',
    organizationName: 'TurboVets Organization',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  viewer: {
    id: 'user-viewer-789',
    email: 'viewer@turbovets.com',
    firstName: 'Viewer',
    lastName: 'User',
    role: RoleType.VIEWER,
    organizationId: 'org-456',
    organizationName: 'Different Organization',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
};

// =============================================================================
// JWT TOKEN FIXTURES
// =============================================================================

export const mockTokens = {
  valid:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLW93bmVyLTEyMyIsImVtYWlsIjoib3duZXJAdHVyYm92ZXRzLmNvbSIsInJvbGUiOiJvd25lciIsImV4cCI6MTk5OTk5OTk5OX0.test',
  expired:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLW93bmVyLTEyMyIsImVtYWlsIjoib3duZXJAdHVyYm92ZXRzLmNvbSIsInJvbGUiOiJvd25lciIsImV4cCI6MTAwMDAwMDAwMH0.test',
  malformed: 'invalid.token.format',
  adminToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWFkbWluLTQ1NiIsImVtYWlsIjoiYWRtaW5AdHVyYm92ZXRzLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTk5OTk5OTk5OX0.test',
  viewerToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXZpZXdlci03ODkiLCJlbWFpbCI6InZpZXdlckB0dXJib3ZldHMuY29tIiwicm9sZSI6InZpZXdlciIsImV4cCI6MTk5OTk5OTk5OX0.test',
};

// =============================================================================
// AUTH RESPONSE FIXTURES
// =============================================================================

export const mockAuthResponses = {
  owner: {
    access_token: mockTokens.valid,
    user: mockUsers.owner,
  },
  admin: {
    access_token: mockTokens.adminToken,
    user: mockUsers.admin,
  },
  viewer: {
    access_token: mockTokens.viewerToken,
    user: mockUsers.viewer,
  },
};

// =============================================================================
// TASK FIXTURES
// =============================================================================

export const mockTasks = {
  todo: {
    id: 'task-todo-001',
    title: 'Complete project documentation',
    description: 'Write comprehensive API documentation for the project',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    category: TaskCategory.WORK,
    ownerId: 'user-admin-456',
    organizationId: 'org-123',
    dueDate: new Date('2023-12-31'),
    completedAt: null,
    sortOrder: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  inProgress: {
    id: 'task-progress-002',
    title: 'Implement authentication',
    description: 'Set up JWT authentication with role-based access control',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.URGENT,
    category: TaskCategory.PROJECT,
    ownerId: 'user-owner-123',
    organizationId: 'org-123',
    dueDate: new Date('2023-12-15'),
    completedAt: null,
    sortOrder: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-05'),
  },
  done: {
    id: 'task-done-003',
    title: 'Design UI components',
    description: 'Create reusable Angular components with TailwindCSS',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.PROJECT,
    ownerId: 'user-admin-456',
    organizationId: 'org-123',
    dueDate: new Date('2023-11-30'),
    completedAt: new Date('2023-11-28'),
    sortOrder: 2,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-11-28'),
  },
  cancelled: {
    id: 'task-cancelled-004',
    title: 'Old legacy feature',
    description: 'This task was cancelled due to change in requirements',
    status: TaskStatus.CANCELLED,
    priority: TaskPriority.LOW,
    category: TaskCategory.OTHER,
    ownerId: 'user-viewer-789',
    organizationId: 'org-456',
    dueDate: null,
    completedAt: null,
    sortOrder: 3,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-10'),
  },
};

// =============================================================================
// TASK DTO FIXTURES
// =============================================================================

export const mockTaskDtos = {
  create: {
    title: 'New Task',
    description: 'A new task to be created',
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.WORK,
    dueDate: new Date('2023-12-31'),
  },
  update: {
    title: 'Updated Task Title',
    description: 'Updated task description',
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    dueDate: new Date('2024-01-15'),
  },
};

// =============================================================================
// AUDIT LOG FIXTURES
// =============================================================================

export const mockAuditLogs = {
  login: {
    id: 'audit-001',
    userId: 'user-owner-123',
    userEmail: 'owner@turbovets.com',
    userFullName: 'Owner User',
    action: AuditAction.LOGIN,
    resource: AuditResource.AUTH,
    resourceId: null,
    details: { loginMethod: 'email', ipAddress: '192.168.1.1' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    timestamp: new Date('2023-01-01T10:00:00Z'),
    success: true,
    errorMessage: null,
    actionDescription: 'User logged in successfully',
  },
  taskCreate: {
    id: 'audit-002',
    userId: 'user-admin-456',
    userEmail: 'admin@turbovets.com',
    userFullName: 'Admin User',
    action: AuditAction.CREATE,
    resource: AuditResource.TASK,
    resourceId: 'task-todo-001',
    details: {
      taskTitle: 'Complete project documentation',
      taskPriority: 'high',
      assignedTo: 'user-admin-456',
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    timestamp: new Date('2023-01-01T11:00:00Z'),
    success: true,
    errorMessage: null,
    actionDescription: 'Task created successfully',
  },
  taskUpdate: {
    id: 'audit-003',
    userId: 'user-admin-456',
    userEmail: 'admin@turbovets.com',
    userFullName: 'Admin User',
    action: AuditAction.UPDATE,
    resource: AuditResource.TASK,
    resourceId: 'task-progress-002',
    details: {
      oldStatus: 'todo',
      newStatus: 'in_progress',
      changedFields: ['status', 'updatedAt'],
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    timestamp: new Date('2023-01-01T12:00:00Z'),
    success: true,
    errorMessage: null,
    actionDescription: 'Task status updated',
  },
  failedAccess: {
    id: 'audit-004',
    userId: 'user-viewer-789',
    userEmail: 'viewer@turbovets.com',
    userFullName: 'Viewer User',
    action: AuditAction.READ,
    resource: AuditResource.AUDIT_LOG,
    resourceId: null,
    details: {
      reason: 'Insufficient permissions',
      attemptedAction: 'view_audit_logs',
    },
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    timestamp: new Date('2023-01-01T13:00:00Z'),
    success: false,
    errorMessage: 'Access denied: insufficient permissions',
    actionDescription: 'Failed to access audit logs',
  },
};

// =============================================================================
// PAGINATION FIXTURES
// =============================================================================

export const mockPagination = {
  firstPage: {
    page: 1,
    limit: 20,
    total: 45,
    totalPages: 3,
    hasNextPage: true,
    hasPrevPage: false,
  },
  middlePage: {
    page: 2,
    limit: 20,
    total: 45,
    totalPages: 3,
    hasNextPage: true,
    hasPrevPage: true,
  },
  lastPage: {
    page: 3,
    limit: 20,
    total: 45,
    totalPages: 3,
    hasNextPage: false,
    hasPrevPage: true,
  },
  singlePage: {
    page: 1,
    limit: 20,
    total: 5,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

// =============================================================================
// PAGINATED RESPONSE FIXTURES
// =============================================================================

export const mockPaginatedResponses = {
  auditLogs: {
    data: [
      mockAuditLogs.login,
      mockAuditLogs.taskCreate,
      mockAuditLogs.taskUpdate,
    ],
    pagination: mockPagination.firstPage,
  },
  tasks: {
    data: [mockTasks.todo, mockTasks.inProgress, mockTasks.done],
    pagination: mockPagination.singlePage,
  },
  emptyResults: {
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },
};

// =============================================================================
// ERROR FIXTURES
// =============================================================================

export const mockErrors = {
  unauthorized: {
    status: 401,
    statusText: 'Unauthorized',
    error: { message: 'Invalid email or password' },
  },
  forbidden: {
    status: 403,
    statusText: 'Forbidden',
    error: { message: 'Access forbidden' },
  },
  notFound: {
    status: 404,
    statusText: 'Not Found',
    error: { message: 'Resource not found' },
  },
  serverError: {
    status: 500,
    statusText: 'Internal Server Error',
    error: { message: 'Internal server error' },
  },
  validationError: {
    status: 400,
    statusText: 'Bad Request',
    error: {
      message: 'Validation failed',
      details: [
        { field: 'email', message: 'Email is required' },
        {
          field: 'password',
          message: 'Password must be at least 6 characters',
        },
      ],
    },
  },
};

// =============================================================================
// FILTER FIXTURES
// =============================================================================

export const mockFilters = {
  taskFilters: {
    empty: {
      search: '',
      status: '',
      priority: '',
      category: '',
      sortBy: 'createdAt',
      quickFilter: 'all',
    },
    statusFilter: {
      search: '',
      status: 'in_progress',
      priority: '',
      category: '',
      sortBy: 'createdAt',
      quickFilter: 'all',
    },
    priorityFilter: {
      search: '',
      status: '',
      priority: 'high',
      category: '',
      sortBy: 'priority',
      quickFilter: 'high-priority',
    },
    searchFilter: {
      search: 'documentation',
      status: '',
      priority: '',
      category: '',
      sortBy: 'createdAt',
      quickFilter: 'all',
    },
  },
  auditFilters: {
    empty: {
      action: '',
      resource: '',
      userEmail: '',
      page: 1,
      limit: 20,
    },
    actionFilter: {
      action: 'create',
      resource: '',
      userEmail: '',
      page: 1,
      limit: 20,
    },
    userFilter: {
      action: '',
      resource: '',
      userEmail: 'admin@turbovets.com',
      page: 1,
      limit: 20,
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a deep copy of any fixture to avoid test pollution
 */
export function cloneFixture<T>(fixture: T): T {
  return JSON.parse(JSON.stringify(fixture));
}

/**
 * Create multiple instances of a fixture with different IDs
 */
export function createMultipleFixtures<T extends { id: string }>(
  fixture: T,
  count: number,
  idPrefix: string = 'test'
): T[] {
  return Array.from({ length: count }, (_, index) => ({
    ...cloneFixture(fixture),
    id: `${idPrefix}-${index + 1}`,
  }));
}

/**
 * Create a fixture with custom overrides
 */
export function createCustomFixture<T>(
  baseFixture: T,
  overrides: Partial<T>
): T {
  return {
    ...cloneFixture(baseFixture),
    ...overrides,
  };
}
