import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtStrategyPayload, RoleType } from '@data';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(
    email: string,
    password: string,
    userRepository: { findOne: (opts: any) => Promise<any> } | null
  ): Promise<any> {
    if (!userRepository) return null;
    const user = await userRepository.findOne({
      where: { email, isActive: true },
    });
    if (user && (await this.comparePassword(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(
    user: { id: string; email: string; globalRole: string },
    orgRoles?: Record<string, RoleType>
  ): Promise<{ access_token: string }> {
    const payload = this.generateJwtPayload(user, orgRoles);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  generateJwtPayload(
    user: { id: string; email: string; globalRole: string },
    orgRoles?: Record<string, RoleType>
  ): JwtStrategyPayload {
    const payload: JwtStrategyPayload = {
      sub: user.id,
      email: user.email,
      role: user.globalRole ?? 'user',
      iat: Math.floor(Date.now() / 1000),
    };
    if (orgRoles && Object.keys(orgRoles).length > 0) {
      payload.org_roles = orgRoles;
    }
    return payload;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
