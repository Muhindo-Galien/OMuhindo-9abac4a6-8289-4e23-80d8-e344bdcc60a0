import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomJwtService {
  constructor(
    private nestJwtService: NestJwtService,
    private configService: ConfigService
  ) {}

  /**
   * Sign a JWT token with the provided payload
   */
  sign(payload: any, options?: any): string {
    const defaultOptions = {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '24h',
      ...options,
    };

    return this.nestJwtService.sign(payload, defaultOptions);
  }

  /**
   * Verify and decode a JWT token
   */
  verify(token: string): any {
    try {
      return this.nestJwtService.verify(token);
    } catch (error) {
      throw new Error(
        `Invalid token: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Decode a JWT token without verification
   */
  decode(token: string): any {
    return this.nestJwtService.decode(token);
  }

  /**
   * Sign a refresh token
   */
  signRefreshToken(payload: any): string {
    return this.nestJwtService.sign(payload, {
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });
  }

  /**
   * Get token expiration date
   */
  getTokenExpirationDate(token: string): Date | null {
    const decoded = this.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    // Convert Unix timestamp to Date
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpirationDate(token);
    if (!expiration) {
      return true;
    }

    return Date.now() >= expiration.getTime();
  }
}
