import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategyPayload } from '@data';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key',
    });
  }

  async validate(payload: JwtStrategyPayload): Promise<any> {
    const { sub, email, role, roleLevel, organizationId } = payload;

    // For a simple strategy, we trust the JWT payload since it's already been verified
    // In production, you might want to add additional database validation

    // Return user object that will be attached to request.user
    return {
      id: sub,
      email: email,
      role: role,
      roleLevel: roleLevel,
      organizationId: organizationId,
      permissions: [], // Will be populated by the role permissions in a real implementation
    };
  }
}
