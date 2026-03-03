import { RoleType } from '../models/role.model';

// Authentication Strategy Interface
export interface IAuthStrategy {
  validate(payload: any): Promise<any>;
}

// JWT Strategy Payload
export interface JwtStrategyPayload {
  sub: string; // User ID
  email: string;
  role: RoleType;
  roleLevel: number;
  organizationId: string;
  iat: number;
  exp?: number; // Optional - JWT library sets this automatically
}

// Local Strategy Validation Result
export interface LocalStrategyResult {
  user: {
    id: string;
    email: string;
    role: RoleType;
    organizationId: string;
  };
  isValid: boolean;
}

// Auth Service Interface
export interface IAuthService {
  validateUser(email: string, password: string): Promise<any>;
  login(user: any): Promise<{ access_token: string }>;
  register(userData: any): Promise<any>;
  generateJwtPayload(user: any): any;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

// JWT Service Interface
export interface IJwtService {
  sign(payload: any, options?: any): string;
  verify(token: string): any;
  decode(token: string): any;
}

// Auth Guard Context
export interface AuthGuardContext {
  user: {
    id: string;
    email: string;
    role: RoleType;
    roleLevel: number;
    organizationId: string;
    permissions: string[];
  };
  request: any;
  response: any;
}
