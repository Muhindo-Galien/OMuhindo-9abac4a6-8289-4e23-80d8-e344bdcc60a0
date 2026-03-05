import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-sm text-gray-600">Task Management System</p>
        </div>

        <form
          [formGroup]="registerForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <div class="rounded-md shadow-sm space-y-4">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Email address</label
              >
              <input
                id="email"
                type="email"
                formControlName="email"
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="you&#64;example.com"
                [class.border-red-500]="
                  registerForm.get('email')?.invalid &&
                  registerForm.get('email')?.touched
                "
              />
              @if ( registerForm.get('email')?.invalid &&
              registerForm.get('email')?.touched ) {
              <div class="mt-1 text-sm text-red-600">
                @if (registerForm.get('email')?.errors?.['required']) {
                <span>Email is required</span>
                } @if (registerForm.get('email')?.errors?.['email']) {
                <span>Please enter a valid email</span>
                }
              </div>
              }
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  for="firstName"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >First name</label
                >
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Jane"
                  [class.border-red-500]="
                    registerForm.get('firstName')?.invalid &&
                    registerForm.get('firstName')?.touched
                  "
                />
                @if ( registerForm.get('firstName')?.invalid &&
                registerForm.get('firstName')?.touched ) {
                <div class="mt-1 text-sm text-red-600">
                  <span>Required (min 2 characters)</span>
                </div>
                }
              </div>
              <div>
                <label
                  for="lastName"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Last name</label
                >
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Doe"
                  [class.border-red-500]="
                    registerForm.get('lastName')?.invalid &&
                    registerForm.get('lastName')?.touched
                  "
                />
                @if ( registerForm.get('lastName')?.invalid &&
                registerForm.get('lastName')?.touched ) {
                <div class="mt-1 text-sm text-red-600">
                  <span>Required (min 2 characters)</span>
                </div>
                }
              </div>
            </div>

            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Password</label
              >
              <input
                id="password"
                type="password"
                formControlName="password"
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Min 6 characters"
                [class.border-red-500]="
                  registerForm.get('password')?.invalid &&
                  registerForm.get('password')?.touched
                "
              />
              @if ( registerForm.get('password')?.invalid &&
              registerForm.get('password')?.touched ) {
              <div class="mt-1 text-sm text-red-600">
                @if (registerForm.get('password')?.errors?.['required']) {
                <span>Password is required</span>
                } @if (registerForm.get('password')?.errors?.['minlength']) {
                <span>Password must be at least 6 characters</span>
                }
              </div>
              }
            </div>

          </div>

          @if (errorMessage) {
          <div class="text-center">
            <p
              class="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200"
            >
              {{ errorMessage }}
            </p>
          </div>
          }

          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              @if (!isLoading) { Create account } @else {
              <span class="flex items-center justify-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </span>
              }
            </button>
          </div>

          <p class="text-center text-sm text-gray-600">
            Already have an account?
            <a
              routerLink="/login"
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const value = this.registerForm.value;
      const dto = {
        email: value.email,
        password: value.password,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        inviteToken:
          this.route.snapshot.queryParamMap.get('token') || undefined,
      };

      this.authService.register(dto).subscribe({
        next: () => {
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/orgs';
          this.router.navigateByUrl(returnUrl);
        },
        error: err => {
          this.errorMessage =
            err?.error?.message || 'Registration failed. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }
}
