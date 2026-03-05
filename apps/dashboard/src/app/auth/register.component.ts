import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-sm text-gray-600">Task Management System</p>
        </div>

        <!-- Register Form -->
        <form
          [formGroup]="registerForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <div class="rounded-md shadow-sm space-y-4">
            <!-- First Name -->
            <div>
              <label
                for="firstName"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                formControlName="firstName"
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your first name"
                [class.border-red-500]="
                  registerForm.get('firstName')?.invalid &&
                  registerForm.get('firstName')?.touched
                "
              />
              <div
                *ngIf="
                  registerForm.get('firstName')?.invalid &&
                  registerForm.get('firstName')?.touched
                "
                class="mt-1 text-sm text-red-600"
              >
                <span *ngIf="registerForm.get('firstName')?.errors?.['required']"
                  >First name is required</span
                >
                <span *ngIf="registerForm.get('firstName')?.errors?.['minlength']"
                  >First name must be at least 2 characters</span
                >
              </div>
            </div>

            <!-- Last Name -->
            <div>
              <label
                for="lastName"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                formControlName="lastName"
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your last name"
                [class.border-red-500]="
                  registerForm.get('lastName')?.invalid &&
                  registerForm.get('lastName')?.touched
                "
              />
              <div
                *ngIf="
                  registerForm.get('lastName')?.invalid &&
                  registerForm.get('lastName')?.touched
                "
                class="mt-1 text-sm text-red-600"
              >
                <span *ngIf="registerForm.get('lastName')?.errors?.['required']"
                  >Last name is required</span
                >
                <span *ngIf="registerForm.get('lastName')?.errors?.['minlength']"
                  >Last name must be at least 2 characters</span
                >
              </div>
            </div>

            <!-- Email Field -->
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                formControlName="email"
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your email"
                [class.border-red-500]="
                  registerForm.get('email')?.invalid &&
                  registerForm.get('email')?.touched
                "
              />
              <div
                *ngIf="
                  registerForm.get('email')?.invalid &&
                  registerForm.get('email')?.touched
                "
                class="mt-1 text-sm text-red-600"
              >
                <span *ngIf="registerForm.get('email')?.errors?.['required']"
                  >Email is required</span
                >
                <span *ngIf="registerForm.get('email')?.errors?.['email']"
                  >Please enter a valid email</span
                >
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                formControlName="password"
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your password"
                [class.border-red-500]="
                  registerForm.get('password')?.invalid &&
                  registerForm.get('password')?.touched
                "
              />
              <div
                *ngIf="
                  registerForm.get('password')?.invalid &&
                  registerForm.get('password')?.touched
                "
                class="mt-1 text-sm text-red-600"
              >
                <span *ngIf="registerForm.get('password')?.errors?.['required']"
                  >Password is required</span
                >
                <span *ngIf="registerForm.get('password')?.errors?.['minlength']"
                  >Password must be at least 6 characters</span
                >
              </div>
            </div>

            <!-- Organization Name (optional) -->
            <div>
              <label
                for="organizationName"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Organization name
                <span class="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                formControlName="organizationName"
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Create a workspace (optional)"
              />
              <p class="mt-1 text-xs text-gray-500">
                Leave blank to join an existing organization later
              </p>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="text-center">
            <p
              class="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
            >
              {{ errorMessage }}
            </p>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span *ngIf="!isLoading">Create account</span>
              <span *ngIf="isLoading" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating account...
              </span>
            </button>
          </div>

          <!-- Sign In Link -->
          <div class="text-center text-sm text-gray-600">
            Already have an account?
            <a
              routerLink="/login"
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      organizationName: [''],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { firstName, lastName, email, password, organizationName } =
        this.registerForm.value;

      const registerData: any = { firstName, lastName, email, password };

      if (organizationName?.trim()) {
        registerData.createOrgName = organizationName.trim();
      }

      this.authService.register(registerData).subscribe({
        next: response => {
          console.log('Registration successful:', response);
          this.router.navigate(['/dashboard']);
        },
        error: error => {
          console.error('Registration failed:', error);
          this.errorMessage =
            error.error?.message || 'Registration failed. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }
}
