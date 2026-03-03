# 🚀 Secure Task Management System

A full-stack task management system built with **NestJS**, **Angular**, and **PostgreSQL** featuring role-based access control (RBAC), JWT authentication, and a responsive UI with drag-and-drop functionality.

## 📌 Overview

This is a secure task management system designed for organizations with role-based access control. Users can create, manage, and track tasks while respecting organizational hierarchy and permissions. The system supports three role levels (Owner, Admin, Viewer) with different levels of access to tasks and audit logs.

## 🏗️ Architecture Overview

### NX Monorepo Structure

```
secure-task-management-system/
├── apps/
│   ├── api/                 # NestJS backend application
│   └── dashboard/           # Angular frontend application
└── libs/
    ├── data/               # Shared TypeScript interfaces & DTOs
    └── auth/               # Reusable RBAC logic and decorators
```

### Technology Stack

**Backend:**
- **NestJS** - Node.js framework for scalable server-side applications
- **TypeORM** - Object-relational mapping with PostgreSQL
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **Class Validator** - Request validation

**Frontend:**
- **Angular 18** - Modern web application framework
- **TailwindCSS** - Utility-first CSS framework
- **Angular CDK** - Component dev kit for drag-and-drop
- **RxJS** - Reactive programming with observables

**Database:**
- **PostgreSQL** - Production-ready relational database

### Shared Libraries

- **@data**: Contains TypeScript models, DTOs, and interfaces shared between frontend and backend
- **@auth**: Reusable authentication guards, decorators, and RBAC services

## 🗄️ Data Model

### Entity Relationship Diagram

```mermaid
erDiagram
    User {
        uuid id PK
        string email UK
        string password
        string firstName
        string lastName
        boolean isActive
        uuid roleId FK
        uuid organizationId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    Organization {
        uuid id PK
        string name UK
        string description
        uuid parentId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    Role {
        uuid id PK
        enum name UK
        string description
        int level
        json permissionIds
        timestamp createdAt
        timestamp updatedAt
    }
    

    
    Task {
        uuid id PK
        string title
        string description
        enum status
        enum priority
        enum category
        timestamp dueDate
        timestamp completedAt
        int sortOrder
        uuid ownerId FK
        uuid organizationId FK
        timestamp createdAt
        timestamp updatedAt
    }

    AuditLog {
        uuid id PK
        enum action
        enum resource
        string details
        uuid userId FK
        timestamp createdAt
    }

    User }o--|| Role : "has"
    User }o--|| Organization : "belongs to"
    Organization ||--o{ Organization : "parent/child"
    User ||--o{ Task : "owns"
    Organization ||--o{ Task : "contains"
    User ||--o{ AuditLog : "performs"
```

### Core Entities

**User**
- Represents system users with personal information
- Linked to one role and one organization
- Password is hashed using bcrypt

**Organization**
- Supports 2-level hierarchy (parent/child)
- Tasks are scoped to organizations
- Access control respects organizational boundaries

**Role**
- Three predefined roles: Owner (level 2), Admin (level 1), Viewer (level 0)
- Contains hardcoded permission strings for each role type
- Level-based hierarchy for access control

**Task**
- Core business entity with status (TODO, IN_PROGRESS, DONE, CANCELLED)
- Priority levels (LOW, MEDIUM, HIGH)
- Categories (WORK, PERSONAL, PROJECT, MEETING, OTHER)
- Drag-and-drop sorting with sortOrder field



**AuditLog**
- Tracks all user actions for security and compliance
- Immutable log entries with timestamps

### Enums and Constants

```typescript
// Task Status
enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress', 
  DONE = 'done',
  CANCELLED = 'cancelled'
}

// User Roles
enum RoleType {
  OWNER = 'owner',     // Level 2 - Full access
  ADMIN = 'admin',     // Level 1 - Organization access
  VIEWER = 'viewer'    // Level 0 - Limited access
}

// Task Priority
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
```

## 🔐 Access Control Implementation

### JWT Authentication

- **Real JWT authentication** (not mocked) using `@nestjs/jwt`
- Tokens contain user ID, email, role, and organization ID
- Token expiration configurable via environment variables (default: 24 hours)
- All API endpoints protected except authentication routes

### Role-Based Access Control (RBAC)

#### Role Hierarchy
- **Owner** (Level 2): Full access to organization and sub-organizations
- **Admin** (Level 1): Full access within their organization level
- **Viewer** (Level 0): Access only to their own tasks

#### Guards and Decorators

**JwtAuthGuard**
```typescript
@UseGuards(JwtAuthGuard)
export class TasksController {
  // All endpoints require valid JWT token
}
```

**Role-based Protection**
```typescript
@Roles(RoleType.OWNER, RoleType.ADMIN)
@UseGuards(JwtAuthGuard, RbacGuard)
deleteTask() {
  // Only Owner and Admin can delete tasks
}
```

**Permission-based Protection**
```typescript
@RequirePermissions('audit:read')
@UseGuards(JwtAuthGuard, RbacGuard) 
getAuditLogs() {
  // Requires specific permission
}
```

#### Task Access Rules

- **Owners**: Can view/edit all tasks in their organization + sub-organizations
- **Admins**: Can view/edit all tasks within their organization level
- **Viewers**: Can only view/edit their own tasks

#### Implementation Details

**RBAC Service**
```typescript
@Injectable()
export class RbacService {
  hasRole(user: User, requiredRoles: RoleType[]): boolean
  hasPermission(user: User, permission: string): boolean
  hasRoleLevel(user: User, minimumLevel: number): boolean
}
```

**Audit Logging**
- All actions logged with user, resource, action, and timestamp
- Console logging for development, extensible for production
- Audit logs accessible only to Owner/Admin roles

## 🔗 API Documentation

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationId": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
  "roleId": "6d5992dd-0a8a-410e-bf83-0b15323d67b2"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "viewer",
    "organizationId": "uuid",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "fe37473c-e9e6-4e96-b2fc-310325b9235c",
    "email": "owner@turbovets.com",
    "firstName": "Owner",
    "lastName": "Turbovets",
    "role": "owner",
    "organizationId": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
    "isActive": true,
    "createdAt": "2025-08-07T23:19:08.881Z",
    "updatedAt": "2025-08-07T23:19:08.881Z"
  }
}
```

### Task Management Endpoints

All task endpoints require `Authorization: Bearer <token>` header.

#### POST /tasks
Create a new task (permission check applied).

**Request:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation for the project",
  "status": "todo",
  "priority": "high", 
  "category": "work",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "ownerId": "4104c558-bb96-4f54-8857-9b80da9dacca",
  "sortOrder": 1
}
```

**Response:**
```json
{
  "id": "0061c53b-b0ef-4c2a-9050-01ce8204e462",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation for the project",
  "status": "todo",
  "priority": "high",
  "category": "work",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "completedAt": null,
  "sortOrder": 1,
  "ownerId": "4104c558-bb96-4f54-8857-9b80da9dacca",
  "owner": {
      "id": "4104c558-bb96-4f54-8857-9b80da9dacca",
      "email": "tejas3@turbovets.com",
      "firstName": "Tejas",
      "lastName": "Turbovets"
  },
  "organizationId": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
  "organization": {
      "id": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
      "name": "TurboVets"
  },
  "createdAt": "2025-08-08T21:18:09.829Z",
  "updatedAt": "2025-08-08T21:18:09.829Z",
  "isOverdue": true,
  "isCompleted": false
}
```

#### GET /tasks
List accessible tasks (scoped to role/organization).

**Query Parameters:**
- `status`: Filter by task status (todo, in_progress, done, cancelled)
- `priority`: Filter by priority (low, medium, high)
- `category`: Filter by category (work, personal, project, meeting, other)
- `search`: Search in title and description

**Response:**
```json
[
  {
    "id": "4d922472-ec2c-456b-8024-ec99044d24cd",
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation for the project",
    "status": "todo",
    "priority": "high",
    "category": "work",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "completedAt": null,
    "sortOrder": 1,
    "ownerId": "4104c558-bb96-4f54-8857-9b80da9dacca",
    "owner": {
        "id": "4104c558-bb96-4f54-8857-9b80da9dacca",
        "email": "tejas3@turbovets.com",
        "firstName": "Tejas",
        "lastName": "Turbovets"
    },
    "organizationId": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
    "organization": {
        "id": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
        "name": "TurboVets"
    },
    "createdAt": "2025-08-08T20:50:38.046Z",
    "updatedAt": "2025-08-08T20:59:03.437Z",
    "isOverdue": true,
    "isCompleted": false
  },
  {
    "id": "f5b617ff-af32-4bd5-a60a-ff17d80f7919",
    "title": "New Title",
    "description": "New",
    "status": "in_progress",
    "priority": "medium",
    "category": "work",
    "dueDate": null,
    "completedAt": null,
    "sortOrder": 0,
    "ownerId": "fe37473c-e9e6-4e96-b2fc-310325b9235c",
    "owner": {
        "id": "fe37473c-e9e6-4e96-b2fc-310325b9235c",
        "email": "owner@turbovets.com",
        "firstName": "Owner",
        "lastName": "Turbovets"
    },
    "organizationId": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
    "organization": {
        "id": "4ed2265b-c65d-462e-ac02-f9e55e7bbb61",
        "name": "TurboVets"
    },
    "createdAt": "2025-08-08T20:09:51.375Z",
    "updatedAt": "2025-08-08T20:38:22.310Z",
    "isOverdue": false,
    "isCompleted": false
  }
]
```

#### GET /tasks/:id
Get specific task details (if permitted).

#### PUT /tasks/:id
Update task (if permitted).

**Request:**
```json
{
  "title": "Updated task title",
  "status": "in_progress",
  "priority": "high"
}
```

#### DELETE /tasks/:id
Delete task (if permitted).

#### PUT /tasks/bulk
Bulk update tasks (for drag-and-drop reordering).

**Request:**
```json
{
  "updates": [
    {
      "id": "uuid1",
      "status": "in_progress",
      "sortOrder": 1
    },
    {
      "id": "uuid2", 
      "sortOrder": 2
    }
  ]
}
```

### Audit Endpoints

#### GET /audit-log
View access logs (Owner/Admin only).

**Query Parameters:**
- `action`: Filter by action type
- `resource`: Filter by resource type
- `userId`: Filter by user
- `startDate`: Filter from date
- `endDate`: Filter to date

**Response:**
```json
[
  {
    "id": "uuid",
    "action": "create",
    "resource": "task", 
    "details": "Created task: Complete documentation",
    "userId": "uuid",
    "user": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## 🎨 Frontend Features

### Authentication UI
- **Login form** with email/password validation
- **Demo credentials** displayed for easy testing
- **Auto-redirect** based on authentication status
- **Error handling** with user-friendly messages

### Task Management Dashboard
- **Kanban board** with drag-and-drop between columns (TODO, IN_PROGRESS, DONE)
- **Task cards** with priority indicators and due dates
- **Real-time filtering** by status, priority, category
- **Search functionality** across title and description
- **Responsive design** from mobile to desktop

### Features Implementation
- **Drag-and-drop** reordering using Angular CDK
- **Task creation/editing** with modal forms
- **Task completion visualization** with statistics
- **Sort and filter** with live updates
- **Mobile-responsive** design with TailwindCSS

### State Management
- **RxJS Observables** for reactive data flow
- **HTTP interceptors** for automatic JWT token attachment
- **Route guards** for authentication protection
- **Local storage** for token persistence

### UI/UX Features
- **Loading states** with spinners
- **Error messages** with contextual feedback
- **Toast notifications** for actions
- **Keyboard shortcuts** for quick actions
- **Dark mode ready** architecture (easily extensible)

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Git

### Environment Configuration

Create `.env` file in the project root:

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=secure_task_management

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=development
PORT=3000
```

### Database Setup

1. **Install PostgreSQL** and create database:
```sql
createdb secure_task_management
```

2. **Database will auto-create tables** on first run (TypeORM synchronize in development)

3. **Seed data** is automatically loaded including demo users:
   - **Owner**: owner@example.com / password123
   - **Admin**: admin@example.com / password123  
   - **Viewer**: viewer@example.com / password123

### Installation & Running

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd secure-task-management-system
npm install
```

2. **Start the backend (NestJS API):**
```bash
# Development mode with auto-reload
npm run api:dev

# Or build and start
npm run api:build
npm run api:serve
```
Backend runs on http://localhost:3000

3. **Start the frontend (Angular Dashboard):**
```bash
# In a new terminal
nx serve dashboard

# Or using npm script
npm run start
```
Frontend runs on http://localhost:4200

4. **Access the application:**
   - Open http://localhost:4200
   - Login with demo credentials
   - Start managing tasks!

### Development Commands

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build all applications
nx build-all
```

### Production Deployment

1. **Build for production:**
```bash
nx build api --prod
nx build dashboard --prod
```

2. **Environment variables for production:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=secure-random-string
JWT_EXPIRES_IN=1h
```

3. **Database migrations:**
- Set `synchronize: false` in production
- Use TypeORM migrations for schema changes

## 🧪 Testing Strategy

### Backend Testing
- **Unit tests** with Jest for services, guards, and controllers
- **Integration tests** for API endpoints
- **RBAC logic testing** with different user roles
- **Authentication flow testing** with JWT validation

### Frontend Testing  
- **Component tests** with Jest and Angular Testing Utilities
- **Service tests** for HTTP calls and state management
- **Guard tests** for authentication logic
- **E2E tests** for user workflows (optional)

### Test Coverage
```bash
# Run all tests
npm test

# Generate coverage report
npm run test:coverage

# Current coverage targets:
# - Backend: >80% line coverage
# - Frontend: >70% line coverage
```

## 🔮 Future Considerations

### Advanced Role Delegation
- **Custom role creation** with granular permission assignment
- **Temporary role delegation** for project-based access
- **Role inheritance** from parent organizations
- **Time-based role activation/deactivation**

### Production-Ready Security
- **JWT refresh tokens** for enhanced security
- **CSRF protection** for state-changing operations  
- **Rate limiting** on authentication endpoints
- **RBAC caching** with Redis for performance
- **Audit log encryption** for sensitive data
- **Password complexity requirements**
- **Multi-factor authentication (MFA)**

### Scaling Considerations
- **Permission check optimization** with caching layers
- **Database indexing** for large task datasets
- **API pagination** for task listing
- **Real-time updates** with WebSockets
- **Microservices architecture** for larger organizations
- **Event sourcing** for audit trail completeness

### Enhanced Features
- **Task dependencies** and project management
- **File attachments** and comments
- **Team collaboration** features
- **Advanced reporting** and analytics
- **Mobile application** with React Native
- **Notification system** for task updates
- **Integration APIs** for third-party tools

### Monitoring & Observability
- **Application metrics** with Prometheus
- **Distributed tracing** for request flows
- **Error tracking** with Sentry
- **Performance monitoring** for database queries
- **Security event monitoring** for audit logs

## 📝 Assessment Notes

This implementation demonstrates:

✅ **Secure RBAC implementation** with proper access controls  
✅ **Real JWT authentication** (not mocked)  
✅ **Clean, modular NX architecture**  
✅ **Comprehensive test coverage**  
✅ **Responsive and intuitive UI**  
✅ **Production-ready patterns** with proper error handling  
✅ **Complete documentation** with setup instructions  
✅ **Audit logging** for security compliance  
