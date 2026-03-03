import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtStrategyPayload } from '@data';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // validateUser will be implemented at the application level with actual user repository
  async validateUser(
    email: string,
    password: string,
    userRepository: any
  ): Promise<any> {
    const user = await userRepository.findOne({
      where: { email, isActive: true },
      relations: ['role', 'organization'],
    });

    if (user && (await this.comparePassword(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any): Promise<{ access_token: string }> {
    const payload = this.generateJwtPayload(user);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationId: string;
      roleId: string;
    },
    userRepository: any
  ): Promise<any> {
    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create new user
    const newUser = userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return await userRepository.save(newUser);
  }

  generateJwtPayload(user: any): JwtStrategyPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      roleLevel: user.role.level,
      organizationId: user.organizationId,
      iat: Math.floor(Date.now() / 1000),
      // exp is automatically set by JWT module's expiresIn option
    };
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
