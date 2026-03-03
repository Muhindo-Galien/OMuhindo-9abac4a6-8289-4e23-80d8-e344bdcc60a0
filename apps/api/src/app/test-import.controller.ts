import { Controller, Get } from '@nestjs/common';

// Test imports from libs - should work now!
import { User } from '@data';
import { AuthService } from '@auth';

@Controller('test-import')
export class TestImportController {
  constructor() {}

  @Get()
  testImports() {
    // Test that we can reference the imported types
    const userType = User.name;
    const serviceType = AuthService.name;
    
    return { 
      message: 'Import test successful - ready for Phase 5',
      imports: {
        userModel: userType,
        authService: serviceType
      }
    };
  }
} 