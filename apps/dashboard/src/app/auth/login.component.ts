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
import { ButtonComponent } from '../shared/components/button.component';
import { AuthInputFieldComponent } from './auth-input-field.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    AuthInputFieldComponent,
  ],
  template: `
    <div
      class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div
        class="max-w-md w-full space-y-8 bg-turbovets-navy text-white mt-8 rounded-2xl px-6 py-6 shadow-lg"
      >
        <!-- Header -->
        <div class="text-center">
          <div class="flex justify-center">
            <img
              src="/vets.png"
              alt="Turbovets"
              class="h-10 w-auto max-h-12 object-contain sm:h-12 sm:max-h-14 drop-shadow-sm"
            />
          </div>
          <h2 class="mt-6 text-3xl font-semibold text-white">
            Sign in to your account
          </h2>
          <p class="mt-2 text-sm text-gray-100">
            Secure task management for veterinary teams
          </p>
        </div>

        <!-- Login Form -->
        <div class="">
          <form
            [formGroup]="loginForm"
            (ngSubmit)="onSubmit()"
            class="space-y-6"
          >
            <div class="rounded-md space-y-4">
              <!-- Email Field -->
              <app-auth-input-field
                label="Email address"
                id="email"
                type="email"
                [control]="loginForm.get('email')"
                placeholder="Enter your email"
                [requiredMessage]="'Email is required'"
                [emailMessage]="'Please enter a valid email'"
              ></app-auth-input-field>

              <!-- Password Field -->
              <app-auth-input-field
                label="Password"
                id="password"
                type="password"
                [control]="loginForm.get('password')"
                placeholder="Enter your password"
                [requiredMessage]="'Password is required'"
              ></app-auth-input-field>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="text-center">
              <p
                class="text-sm text-red-100 bg-red-500/20 p-3 rounded-md border border-red-300/60"
              >
                {{ errorMessage }}
              </p>
            </div>

            <!-- Submit Button -->
            <div>
              <app-button
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                variant="primary"
                class="w-full justify-center"
              >
                <span *ngIf="!isLoading">Sign in</span>
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
                  Signing in...
                </span>
              </app-button>
            </div>

            <p class="text-center text-sm text-gray-100">
              Don't have an account?
              <a
                routerLink="/register"
                class="font-medium text-white underline underline-offset-2 hover:text-turbovets-sky-light"
              >
                Create one
              </a>
            </p>

            <!-- Demo Credentials -->
            <div class="mt-6 p-4 bg-white/5 rounded-md border border-white/10">
              <h3 class="text-sm font-medium text-white mb-2">
                Demo Credentials:
              </h3>
              <div class="text-xs text-turbovets-sky-light space-y-1">
                <p>
                  <strong>Owner:</strong> owner&#64;turbovets.com / password123
                </p>
                <p>
                  <strong>Admin:</strong> admin&#64;turbovets.com / password123
                </p>
                <p>
                  <strong>Viewer:</strong> viewer&#64;turbovets.com /
                  password123
                </p>
              </div>
              <h3 class="text-sm font-medium text-white mb-2 mt-6">
                Demo Parent Org and Child Org or Space
              </h3>
              <div class="text-xs text-turbovets-sky-light space-y-1">
                <p>
                  <strong>Turbo Vets:</strong> Parent Org
                </p>
                <p>
                  <strong>Default Space:</strong> Child Org
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .group:hover .group-hover\\:translate-x-1 {
        transform: translateX(0.25rem);
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.loginForm = this.fb.group({
      email: [emailFromQuery, [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: response => {
          console.log('Login successful:', response);
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/orgs';
          this.router.navigateByUrl(returnUrl);
        },
        error: error => {
          console.error('Login failed:', error);
          this.errorMessage =
            error.error?.message || 'Login failed. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }
}
