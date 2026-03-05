import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: any;
  let router: any;

  const mockAuthResponse = {
    access_token: 'test-token-123',
    user: {
      id: 'user-new-789',
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'user',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  const mockErrors = {
    conflict: {
      status: 409,
      error: { message: 'Email already registered' },
    },
    serverError: {
      status: 500,
      error: { message: 'Internal server error' },
    },
    validationError: {
      status: 400,
      error: { message: 'Validation failed' },
    },
  };

  beforeEach(async () => {
    const authServiceSpy = {
      register: jest.fn(),
    };

    const routerSpy = {
      navigate: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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

    it('should initialize register form with empty fields', () => {
      expect(component.registerForm).toBeDefined();
      expect(component.registerForm.get('firstName')?.value).toBe('');
      expect(component.registerForm.get('lastName')?.value).toBe('');
      expect(component.registerForm.get('email')?.value).toBe('');
      expect(component.registerForm.get('password')?.value).toBe('');
      expect(component.registerForm.get('organizationName')?.value).toBe('');
    });

    it('should set initial state correctly', () => {
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should initialize required fields with validators', () => {
      expect(component.registerForm.get('firstName')?.hasError('required')).toBe(true);
      expect(component.registerForm.get('lastName')?.hasError('required')).toBe(true);
      expect(component.registerForm.get('email')?.hasError('required')).toBe(true);
      expect(component.registerForm.get('password')?.hasError('required')).toBe(true);
    });

    it('should initialize organizationName as optional (no required error)', () => {
      expect(component.registerForm.get('organizationName')?.hasError('required')).toBe(false);
    });
  });

  describe('Form Validation', () => {
    describe('First Name Validation', () => {
      it('should be invalid when empty', () => {
        const control = component.registerForm.get('firstName');
        control?.setValue('');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('required')).toBe(true);
      });

      it('should be invalid when less than 2 characters', () => {
        const control = component.registerForm.get('firstName');
        control?.setValue('A');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('minlength')).toBe(true);
      });

      it('should be valid with 2 or more characters', () => {
        const control = component.registerForm.get('firstName');
        control?.setValue('Jo');

        expect(control?.valid).toBe(true);
      });
    });

    describe('Last Name Validation', () => {
      it('should be invalid when empty', () => {
        const control = component.registerForm.get('lastName');
        control?.setValue('');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('required')).toBe(true);
      });

      it('should be invalid when less than 2 characters', () => {
        const control = component.registerForm.get('lastName');
        control?.setValue('D');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('minlength')).toBe(true);
      });

      it('should be valid with 2 or more characters', () => {
        const control = component.registerForm.get('lastName');
        control?.setValue('Doe');

        expect(control?.valid).toBe(true);
      });
    });

    describe('Email Validation', () => {
      it('should be invalid when empty', () => {
        const control = component.registerForm.get('email');
        control?.setValue('');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('required')).toBe(true);
      });

      it('should be invalid with incorrect format', () => {
        const control = component.registerForm.get('email');
        control?.setValue('not-an-email');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('email')).toBe(true);
      });

      it('should be valid with correct email format', () => {
        const control = component.registerForm.get('email');
        control?.setValue('user@example.com');

        expect(control?.valid).toBe(true);
      });
    });

    describe('Password Validation', () => {
      it('should be invalid when empty', () => {
        const control = component.registerForm.get('password');
        control?.setValue('');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('required')).toBe(true);
      });

      it('should be invalid when less than 6 characters', () => {
        const control = component.registerForm.get('password');
        control?.setValue('abc');
        control?.markAsTouched();

        expect(control?.invalid).toBe(true);
        expect(control?.hasError('minlength')).toBe(true);
      });

      it('should be valid with 6 or more characters', () => {
        const control = component.registerForm.get('password');
        control?.setValue('password123');

        expect(control?.valid).toBe(true);
      });
    });

    describe('Organization Name Validation', () => {
      it('should be valid when empty (optional field)', () => {
        const control = component.registerForm.get('organizationName');
        control?.setValue('');

        expect(control?.valid).toBe(true);
      });

      it('should be valid when filled', () => {
        const control = component.registerForm.get('organizationName');
        control?.setValue('My Organization');

        expect(control?.valid).toBe(true);
      });
    });

    describe('Form State', () => {
      it('should be invalid when required fields are empty', () => {
        expect(component.registerForm.invalid).toBe(true);
      });

      it('should be valid when all required fields are correctly filled', () => {
        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
        });

        expect(component.registerForm.valid).toBe(true);
      });

      it('should be invalid when any required field is missing', () => {
        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          // password missing
        });

        expect(component.registerForm.invalid).toBe(true);
      });
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = () => {
      component.registerForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        organizationName: '',
      });
    };

    describe('Successful Registration', () => {
      beforeEach(() => {
        authService.register.mockReturnValue(of(mockAuthResponse));
      });

      it('should call authService.register with correct data', () => {
        fillValidForm();
        component.onSubmit();

        expect(authService.register).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
        });
      });

      it('should include createOrgName when organizationName is provided', () => {
        component.registerForm.patchValue({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'password123',
          organizationName: 'My Company',
        });

        component.onSubmit();

        expect(authService.register).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'password123',
          createOrgName: 'My Company',
        });
      });

      it('should not include createOrgName when organizationName is blank', () => {
        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          organizationName: '   ',
        });

        component.onSubmit();

        const callArg = authService.register.mock.calls[0][0];
        expect(callArg.createOrgName).toBeUndefined();
      });

      it('should clear error message before submitting', () => {
        component.errorMessage = 'Previous error';
        fillValidForm();

        component.onSubmit();

        expect(component.errorMessage).toBe('');
      });

      it('should navigate to dashboard on success', () => {
        jest.spyOn(console, 'log');
        fillValidForm();

        component.onSubmit();

        expect(console.log).toHaveBeenCalledWith('Registration successful:', mockAuthResponse);
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      });

      it('should reset loading state after successful registration', () => {
        fillValidForm();
        component.onSubmit();

        expect(component.isLoading).toBe(false);
      });
    });

    describe('Failed Registration', () => {
      it('should handle email already registered error', () => {
        authService.register.mockReturnValue(throwError(() => mockErrors.conflict));
        jest.spyOn(console, 'error');

        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          password: 'password123',
        });

        component.onSubmit();

        expect(console.error).toHaveBeenCalledWith('Registration failed:', mockErrors.conflict);
        expect(component.errorMessage).toBe('Email already registered');
        expect(component.isLoading).toBe(false);
        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should handle server error', () => {
        authService.register.mockReturnValue(throwError(() => mockErrors.serverError));

        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
        });

        component.onSubmit();

        expect(component.errorMessage).toBe('Internal server error');
        expect(component.isLoading).toBe(false);
      });

      it('should handle error without message', () => {
        const errorWithoutMessage = { status: 500, error: {} };
        authService.register.mockReturnValue(throwError(() => errorWithoutMessage));

        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
        });

        component.onSubmit();

        expect(component.errorMessage).toBe('Registration failed. Please try again.');
        expect(component.isLoading).toBe(false);
      });
    });

    describe('Form Validation Before Submission', () => {
      it('should not submit when form is invalid', () => {
        component.onSubmit();

        expect(authService.register).not.toHaveBeenCalled();
        expect(component.isLoading).toBe(false);
      });

      it('should not submit when email is missing', () => {
        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123',
        });

        component.onSubmit();

        expect(authService.register).not.toHaveBeenCalled();
      });

      it('should not submit when password is too short', () => {
        component.registerForm.patchValue({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'abc',
        });

        component.onSubmit();

        expect(authService.register).not.toHaveBeenCalled();
      });
    });
  });

  describe('UI State Management', () => {
    it('should reset loading state after failed submission', () => {
      authService.register.mockReturnValue(throwError(() => mockErrors.conflict));

      component.registerForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      component.onSubmit();

      expect(component.isLoading).toBe(false);
    });

    it('should clear error message when starting new submission', () => {
      component.errorMessage = 'Previous error';
      authService.register.mockReturnValue(of(mockAuthResponse));

      component.registerForm.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      component.onSubmit();

      expect(component.errorMessage).toBe('');
    });
  });
});
