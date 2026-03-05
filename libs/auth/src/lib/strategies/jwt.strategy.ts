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
    const { sub, email, role, org_roles } = payload;
    return {
      id: sub,
      email,
      role,
      org_roles: org_roles ?? {},
      permissions: [],
    };
  }
}
