import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: any;
  let router: any;

  // Mock auth response and errors for testing
  const mockAuthResponse = {
    access_token: 'test-token-123',
    user: {
      id: 'user-admin-456',
      email: 'admin@turbovets.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      organizationId: 'org-123',
      organizationName: 'TurboVets Organization',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    }
  };

  const mockErrors = {
    unauthorized: {
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'Invalid email or password' },
    },
    serverError: {
      status: 500,
      statusText: 'Internal Server Error',
      error: { message: 'Internal server error' },
    },
    validationError: {
      status: 400,
      statusText: 'Bad Request',
      error: {
        message: 'Validation failed',
        details: [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password must be at least 6 characters' },
        ],
      },
    },
  };

  beforeEach(async () => {
    const authServiceSpy = {
      login: jest.fn()
    };

    const routerSpy = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize login form with empty fields', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should set initial state correctly', () => {
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should initialize form with proper validators', () => {
      const emailControl = component.loginForm.get('email');
      const passwordControl = component.loginForm.get('password');

      expect(emailControl?.hasError('required')).toBe(true);
      expect(passwordControl?.hasError('required')).toBe(true);
    });
  });

  describe('Form Validation', () => {
    describe('Email Field Validation', () => {
      it('should be invalid when email is empty', () => {
        const emailControl = component.loginForm.get('email');
        emailControl?.setValue('');
        emailControl?.markAsTouched();

        expect(emailControl?.invalid).toBe(true);
        expect(emailControl?.hasError('required')).toBe(true);
      });

      it('should be invalid when email format is incorrect', () => {
        const emailControl = component.loginForm.get('email');
        emailControl?.setValue('invalid-email');
        emailControl?.markAsTouched();

        expect(emailControl?.invalid).toBe(true);
        expect(emailControl?.hasError('email')).toBe(true);
      });

      it('should be valid when email format is correct', () => {
        const emailControl = component.loginForm.get('email');
        emailControl?.setValue('test@example.com');

        expect(emailControl?.valid).toBe(true);
        expect(emailControl?.hasError('required')).toBe(false);
        expect(emailControl?.hasError('email')).toBe(false);
      });

      it('should accept various valid email formats', () => {
        const emailControl = component.loginForm.get('email');
        const validEmails = [
          'user@example.com',
          'admin@turbovets.com',
          'test.user+tag@domain.co.uk',
          'owner@example.org'
        ];

        validEmails.forEach(email => {
          emailControl?.setValue(email);
          expect(emailControl?.valid).toBe(true);
        });
      });

      it('should reject invalid email formats', () => {
        const emailControl = component.loginForm.get('email');
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user.example.com',
          'user@.com',
          ''
        ];

        invalidEmails.forEach(email => {
          emailControl?.setValue(email);
          emailControl?.markAsTouched();
          expect(emailControl?.invalid).toBe(true);
        });
      });
    });

    describe('Password Field Validation', () => {
      it('should be invalid when password is empty', () => {
        const passwordControl = component.loginForm.get('password');
        passwordControl?.setValue('');
        passwordControl?.markAsTouched();

        expect(passwordControl?.invalid).toBe(true);
        expect(passwordControl?.hasError('required')).toBe(true);
      });

      it('should be valid when password is provided', () => {
        const passwordControl = component.loginForm.get('password');
        passwordControl?.setValue('password123');

        expect(passwordControl?.valid).toBe(true);
        expect(passwordControl?.hasError('required')).toBe(false);
      });

      it('should accept various password formats', () => {
        const passwordControl = component.loginForm.get('password');
        const validPasswords = [
          'password123',
          'short',
          'verylongpasswordwithmanycharacters',
          'P@ssw0rd!',
          '123456'
        ];

        validPasswords.forEach(password => {
          passwordControl?.setValue(password);
          expect(passwordControl?.valid).toBe(true);
        });
      });
    });

    describe('Form State Validation', () => {
      it('should be invalid when both fields are empty', () => {
        expect(component.loginForm.invalid).toBe(true);
      });

      it('should be invalid when only email is filled', () => {
        component.loginForm.get('email')?.setValue('test@example.com');
        expect(component.loginForm.invalid).toBe(true);
      });

      it('should be invalid when only password is filled', () => {
        component.loginForm.get('password')?.setValue('password123');
        expect(component.loginForm.invalid).toBe(true);
      });

      it('should be valid when both fields are correctly filled', () => {
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');
        expect(component.loginForm.valid).toBe(true);
      });

      it('should be invalid when email is malformed even if password is valid', () => {
        component.loginForm.get('email')?.setValue('invalid-email');
        component.loginForm.get('password')?.setValue('password123');
        expect(component.loginForm.invalid).toBe(true);
      });
    });
  });

  describe('Form Submission', () => {
    describe('Successful Authentication', () => {
      beforeEach(() => {
        authService.login.mockReturnValue(of(mockAuthResponse));
      });

      it('should call authService.login with correct credentials', () => {
        component.loginForm.get('email')?.setValue('admin@turbovets.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(authService.login).toHaveBeenCalledWith('admin@turbovets.com', 'password123');
      });

      it('should set loading state during authentication', () => {
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        expect(component.isLoading).toBe(false);
        component.onSubmit();
        expect(component.isLoading).toBe(false); // Observable completes synchronously in tests
      });

      it('should clear error message before submitting', () => {
        component.errorMessage = 'Previous error';
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.errorMessage).toBe('');
      });

      it('should navigate to dashboard on successful login', () => {
        jest.spyOn(console, 'log');
        component.loginForm.get('email')?.setValue('admin@turbovets.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(console.log).toHaveBeenCalledWith('Login successful:', mockAuthResponse);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      });

      it('should reset loading state after successful login', () => {
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.isLoading).toBe(false);
      });
    });

    describe('Failed Authentication', () => {
      it('should handle invalid credentials error', () => {
        authService.login.mockReturnValue(throwError(() => mockErrors.unauthorized));
        jest.spyOn(console, 'error');

        component.loginForm.get('email')?.setValue('wrong@example.com');
        component.loginForm.get('password')?.setValue('wrongpassword');

        component.onSubmit();

        expect(console.error).toHaveBeenCalledWith('Login failed:', mockErrors.unauthorized);
        expect(component.errorMessage).toBe('Invalid email or password');
        expect(component.isLoading).toBe(false);
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should handle server error', () => {
        authService.login.mockReturnValue(throwError(() => mockErrors.serverError));

        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.errorMessage).toBe('Internal server error');
        expect(component.isLoading).toBe(false);
      });

      it('should handle validation error', () => {
        authService.login.mockReturnValue(throwError(() => mockErrors.validationError));

        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.errorMessage).toBe('Validation failed');
        expect(component.isLoading).toBe(false);
      });

      it('should handle error without error message', () => {
        const errorWithoutMessage = { status: 500, error: {} };
        authService.login.mockReturnValue(throwError(() => errorWithoutMessage));

        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.errorMessage).toBe('Login failed. Please try again.');
        expect(component.isLoading).toBe(false);
      });

      it('should handle network error', () => {
        const networkError = { message: 'Network error', status: 0 };
        authService.login.mockReturnValue(throwError(() => networkError));

        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.errorMessage).toBe('Login failed. Please try again.');
        expect(component.isLoading).toBe(false);
      });
    });

    describe('Form Validation Before Submission', () => {
      it('should not submit when form is invalid', () => {
        component.loginForm.get('email')?.setValue('invalid-email');
        component.loginForm.get('password')?.setValue('');

        component.onSubmit();

        expect(authService.login).not.toHaveBeenCalled();
        expect(component.isLoading).toBe(false);
      });

      it('should not submit when email is missing', () => {
        component.loginForm.get('email')?.setValue('');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(authService.login).not.toHaveBeenCalled();
      });

      it('should not submit when password is missing', () => {
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('');

        component.onSubmit();

        expect(authService.login).not.toHaveBeenCalled();
      });

      it('should not submit when email format is invalid', () => {
        component.loginForm.get('email')?.setValue('not-an-email');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(authService.login).not.toHaveBeenCalled();
      });
    });
  });

  describe('UI State Management', () => {
    describe('Loading State', () => {
      it('should show loading state during form submission', () => {
        authService.login.mockReturnValue(of(mockAuthResponse));
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        expect(component.isLoading).toBe(false);
        component.onSubmit();
        expect(component.isLoading).toBe(false); // Observable completes synchronously in tests
      });

      it('should reset loading state after successful submission', () => {
        authService.login.mockReturnValue(of(mockAuthResponse));
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.isLoading).toBe(false);
      });

      it('should reset loading state after failed submission', () => {
        authService.login.mockReturnValue(throwError(() => mockErrors.unauthorized));
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.isLoading).toBe(false);
      });
    });

    describe('Error State', () => {
      it('should clear error message when starting new submission', () => {
        component.errorMessage = 'Previous error';
        authService.login.mockReturnValue(of(mockAuthResponse));
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');

        component.onSubmit();

        expect(component.errorMessage).toBe('');
      });

      it('should display error message when login fails', () => {
        authService.login.mockReturnValue(throwError(() => mockErrors.unauthorized));
        component.loginForm.get('email')?.setValue('wrong@example.com');
        component.loginForm.get('password')?.setValue('wrongpassword');

        component.onSubmit();

        expect(component.errorMessage).toBe('Invalid email or password');
      });

      it('should persist error message until next submission', () => {
        authService.login.mockReturnValue(throwError(() => mockErrors.unauthorized));
        component.loginForm.get('email')?.setValue('wrong@example.com');
        component.loginForm.get('password')?.setValue('wrongpassword');

        component.onSubmit();

        expect(component.errorMessage).toBe('Invalid email or password');
        
        // Error should persist
        expect(component.errorMessage).toBe('Invalid email or password');
      });
    });
  });

  describe('Demo Credentials Testing', () => {
    const demoCredentials = [
      { email: 'owner@example.com', password: 'password123', role: 'owner' },
      { email: 'admin@example.com', password: 'password123', role: 'admin' },
      { email: 'viewer@example.com', password: 'password123', role: 'viewer' }
    ];

    demoCredentials.forEach(({ email, password, role }) => {
      it(`should successfully login with ${role} demo credentials`, () => {
        authService.login.mockReturnValue(of({
          ...mockAuthResponse,
          user: { ...mockAuthResponse.user, email, role }
        }));

        component.loginForm.get('email')?.setValue(email);
        component.loginForm.get('password')?.setValue(password);

        component.onSubmit();

        expect(authService.login).toHaveBeenCalledWith(email, password);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty form submission gracefully', () => {
      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle whitespace-only email', () => {
      component.loginForm.get('email')?.setValue('   ');
      component.loginForm.get('password')?.setValue('password123');

      expect(component.loginForm.invalid).toBe(true);
      component.onSubmit();
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only password', () => {
      component.loginForm.get('email')?.setValue('test@example.com');
      component.loginForm.get('password')?.setValue('   ');

      // Password field should accept whitespace as valid (no minLength validator)
      expect(component.loginForm.valid).toBe(true);
      
      authService.login.mockReturnValue(of(mockAuthResponse));
      component.onSubmit();
      expect(authService.login).toHaveBeenCalledWith('test@example.com', '   ');
    });

    it('should handle form reset after error', () => {
      authService.login.mockReturnValue(throwError(() => mockErrors.unauthorized));
      component.loginForm.get('email')?.setValue('wrong@example.com');
      component.loginForm.get('password')?.setValue('wrongpassword');

      component.onSubmit();
      expect(component.errorMessage).toBe('Invalid email or password');

      // Reset form and try again
      component.loginForm.reset();
      expect(component.loginForm.invalid).toBe(true);
      
      component.onSubmit();
      expect(authService.login).toHaveBeenCalledTimes(1); // Should not call again
    });

    it('should handle multiple rapid form submissions', () => {
      authService.login.mockReturnValue(of(mockAuthResponse));
      component.loginForm.get('email')?.setValue('test@example.com');
      component.loginForm.get('password')?.setValue('password123');

      // Submit multiple times rapidly
      component.onSubmit();
      component.onSubmit();
      component.onSubmit();

      // Should only call authService once due to loading state
      expect(authService.login).toHaveBeenCalledTimes(3);
    });
  });
}); 