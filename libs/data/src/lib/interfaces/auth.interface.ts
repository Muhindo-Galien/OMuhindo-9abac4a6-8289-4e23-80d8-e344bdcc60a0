import { RoleType } from '../models/role.model';

export interface IAuthStrategy {
  validate(payload: any): Promise<any>;
}

/** JWT payload: global role "user"; org_roles when memberships exist (e.g. after refresh). */
export interface JwtStrategyPayload {
  sub: string;
  email: string;
  role: string; // global: "user"
  org_roles?: Record<string, RoleType>;
  iat?: number;
  exp?: number;
}

export interface LocalStrategyResult {
  user: {
    id: string;
    email: string;
    role: string;
    org_roles?: Record<string, RoleType>;
  };
  isValid: boolean;
}

export interface IAuthService {
  validateUser(email: string, password: string): Promise<any>;
  login(
    user: any,
    orgRoles?: Record<string, RoleType>
  ): Promise<{ access_token: string }>;
  register(userData: any): Promise<any>;
  generateJwtPayload(
    user: any,
    orgRoles?: Record<string, RoleType>
  ): JwtStrategyPayload;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

export interface IJwtService {
  sign(payload: any, options?: any): string;
  verify(token: string): any;
  decode(token: string): any;
}

/** Request user after JWT validation: id, email, global role, optional org_roles. */
export interface AuthGuardContext {
  user: {
    id: string;
    email: string;
    role: string;
    org_roles?: Record<string, RoleType>;
    permissions?: string[];
  };
  request: any;
  response: any;
}
