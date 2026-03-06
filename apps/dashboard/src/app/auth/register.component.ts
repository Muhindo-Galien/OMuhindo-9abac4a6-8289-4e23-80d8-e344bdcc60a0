import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { InvitationService } from '../services/invitation.service';
import { ButtonComponent } from '../shared/components/button.component';
import { AuthInputFieldComponent } from './auth-input-field.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent, AuthInputFieldComponent],
  template: `
    <div
      class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div
        class="max-w-md w-full space-y-8  bg-turbovets-navy text-white mt-8 rounded-2xl px-6 py-6 shadow-lg"
      >
        <div class="text-center">
          <div class="flex justify-center">
            <img
              src="/vets.png"
              alt="Turbovets"
              class="h-10 w-auto max-h-12 object-contain sm:h-12 sm:max-h-14 drop-shadow-sm"
            />
          </div>
          <h2 class="mt-6 text-3xl font-semibold text-white">
            {{
              inviteContext()
                ? 'Join ' + inviteContext()!.organizationName
                : 'Create your account'
            }}
          </h2>
          <p class="mt-2 text-sm text-gray-100">
            @if (inviteContext()) { Create your account to join as
            <strong>{{ inviteContext()!.role }}</strong
            >. Your email is set from the invitation. } @else { Secure task
            management for veterinary teams }
          </p>
        </div>

        @if (validatingToken) {
        <div class="text-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-2 border-turbovets-navy border-t-transparent mx-auto"
          ></div>
          <p class="mt-3 text-sm text-gray-600">Checking invitation…</p>
        </div>
        } @else {
        <div
          class="mt-8 bg-turbovets-navy text-white rounded-2xl px-6 py-6 shadow-lg"
        >
          <form
            [formGroup]="registerForm"
            (ngSubmit)="onSubmit()"
            class="space-y-6"
          >
            <div class="rounded-md space-y-4">
              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-100 mb-1"
                  >Email address</label
                >
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  [readonly]="!!inviteContext()"
                  class="relative block w-full px-3 py-2 border placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-turbovets-navy focus:border-turbovets-navy focus:z-10 sm:text-sm bg-white"
                  [class.border-gray-300]="!inviteContext()"
                  [class.border-gray-200]="inviteContext()"
                  [class.bg-gray-50]="inviteContext()"
                  [class.text-gray-600]="inviteContext()"
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
              <app-auth-input-field
                label="First name"
                id="firstName"
                [control]="registerForm.get('firstName')"
                placeholder="Jane"
                [requiredMessage]="'Required (min 2 characters)'"
                [minlengthMessage]="'Required (min 2 characters)'"
              ></app-auth-input-field>
              <app-auth-input-field
                label="Last name"
                id="lastName"
                [control]="registerForm.get('lastName')"
                placeholder="Doe"
                [requiredMessage]="'Required (min 2 characters)'"
                [minlengthMessage]="'Required (min 2 characters)'"
              ></app-auth-input-field>
            </div>

            <app-auth-input-field
              label="Password"
              id="password"
              type="password"
              [control]="registerForm.get('password')"
              placeholder="Min 6 characters"
              [requiredMessage]="'Password is required'"
              [minlengthMessage]="'Password must be at least 6 characters'"
            ></app-auth-input-field>
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
              <app-button
                type="submit"
                [disabled]="registerForm.invalid || isLoading"
                variant="primary"
                class="w-full justify-center"
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
              </app-button>
            </div>

            <p class="text-center text-sm text-gray-100">
              Already have an account?
              <a
                routerLink="/login"
                class="font-medium text-white underline underline-offset-2 hover:text-turbovets-sky-light"
              >
                Sign in
              </a>
            </p>
          </form>
        </div>
        }
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private invitationService = inject(InvitationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registerForm: FormGroup;
  isLoading = false;
  validatingToken = false;
  errorMessage = '';
  inviteContext = signal<{ organizationName: string; role: string } | null>(
    null
  );

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

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token?.trim()) return;

    this.validatingToken = true;
    this.invitationService.validateToken(token).subscribe({
      next: result => {
        this.validatingToken = false;
        if (result) {
          this.registerForm.patchValue({ email: result.email });
          this.inviteContext.set({
            organizationName: result.organizationName,
            role: result.role,
          });
        }
      },
      error: () => {
        this.validatingToken = false;
      },
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
