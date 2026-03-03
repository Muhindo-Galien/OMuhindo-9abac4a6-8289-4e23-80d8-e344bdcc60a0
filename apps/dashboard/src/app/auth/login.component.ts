import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Task Management System
          </p>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div class="rounded-md shadow-sm space-y-4">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                formControlName="email"
                required
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                [class.border-red-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              />
              <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="mt-1 text-sm text-red-600">
                <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                formControlName="password"
                required
                class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
              <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="mt-1 text-sm text-red-600">
                <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</span>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="text-center">
            <p class="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {{ errorMessage }}
            </p>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span *ngIf="!isLoading">Sign in</span>
              <span *ngIf="isLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>
          </div>

          <!-- Demo Credentials -->
          <div class="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 class="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h3>
            <div class="text-xs text-blue-700 space-y-1">
              <p><strong>Owner:</strong> owner&#64;turbovets.com / password123</p>
              <p><strong>Admin:</strong> admin&#64;turbovets.com / password123</p>
              <p><strong>Viewer:</strong> viewer&#64;turbovets.com / password123</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .group:hover .group-hover\\:translate-x-1 {
      transform: translateX(0.25rem);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
} 