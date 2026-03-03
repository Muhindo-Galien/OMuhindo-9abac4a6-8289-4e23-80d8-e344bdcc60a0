import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of username
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    // Note: In real implementation, you'll need to inject and pass the userRepository
    // This will be handled at the application level where you have access to repositories
    const user = await this.authService.validateUser(email, password, null);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
