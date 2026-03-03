import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor 
} from '@nestjs/common';

// Import from libs
import { RegisterDto, LoginDto, AuthResponseDto } from '@data';

// Local service
import { AuthApplicationService } from './auth.service';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor) // Exclude sensitive fields like password
export class AuthController {
  constructor(
    private authApplicationService: AuthApplicationService
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return await this.authApplicationService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authApplicationService.login(loginDto);
  }
} 