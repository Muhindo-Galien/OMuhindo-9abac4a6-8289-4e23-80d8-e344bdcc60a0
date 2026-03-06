import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  InvitationService,
  InvitationValidateResult,
} from '../services/invitation.service';

@Component({
  selector: 'app-invite-accept',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full">
        @if (loading()) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div class="animate-spin rounded-full h-10 w-10 border-2 border-turbovets-navy border-t-transparent mx-auto"></div>
            <p class="mt-4 text-sm text-gray-600">Checking invitation…</p>
          </div>
        } @else if (error()) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div class="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 class="mt-4 text-lg font-semibold text-gray-900">Invalid or expired invitation</h2>
            <p class="mt-2 text-sm text-gray-500">
              This invitation link has expired or is no longer valid. Please request a new one or sign in if you already have an account.
            </p>
            <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                routerLink="/login"
                class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-turbovets-navy rounded-lg hover:bg-turbovets-navy/90"
              >
                Sign in
              </a>
              <a
                routerLink="/register"
                class="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Create account
              </a>
            </div>
          </div>
        } @else if (invite()) {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900">Accept invitation</h2>
            <p class="mt-2 text-sm text-gray-600">
              You're signed in. Accept this invitation to join
              <strong class="text-gray-900">{{ invite()!.organizationName }}</strong>
              as <strong class="text-gray-900">{{ invite()!.role }}</strong>.
            </p>
            @if (acceptError()) {
              <p class="mt-3 text-sm text-red-600">{{ acceptError() }}</p>
            }
            <div class="mt-6">
              <button
                type="button"
                (click)="acceptAndContinue()"
                [disabled]="accepting()"
                class="w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-turbovets-navy rounded-lg hover:bg-turbovets-navy/90 disabled:opacity-50"
              >
                @if (accepting()) {
                  <span class="flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Accepting…
                  </span>
                } @else {
                  Accept & continue
                }
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class InviteAcceptComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private invitationService = inject(InvitationService);

  loading = signal(true);
  error = signal(false);
  invite = signal<InvitationValidateResult | null>(null);
  accepting = signal(false);
  acceptError = signal<string | null>(null);

  private token = computed(() =>
    this.route.snapshot.queryParamMap.get('token')
  );

  constructor() {}

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    const t = this.token();
    if (!t?.trim()) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }
    this.invitationService.validateToken(t).subscribe({
      next: (result) => {
        this.loading.set(false);
        if (result) {
          if (this.isLoggedIn()) {
            this.invite.set(result);
            return;
          }
          if (result.userExists) {
            this.router.navigate(['/login'], {
              queryParams: {
                email: result.email,
                returnUrl: `/invite/accept?token=${encodeURIComponent(t)}`,
              },
            });
            return;
          }
          this.router.navigate(['/register'], {
            queryParams: { token: t },
          });
        } else {
          this.error.set(true);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  acceptAndContinue(): void {
    const t = this.token();
    if (!t) return;

    this.accepting.set(true);
    this.acceptError.set(null);

    this.invitationService.acceptInvite(t).subscribe({
      next: () => {
        this.authService.refresh().subscribe({
          next: () => {
            this.accepting.set(false);
            this.router.navigateByUrl('/orgs');
          },
          error: () => {
            this.accepting.set(false);
            this.router.navigateByUrl('/orgs');
          },
        });
      },
      error: (err) => {
        this.acceptError.set(
          err?.error?.message ?? 'Failed to accept invitation.'
        );
        this.accepting.set(false);
      },
    });
  }
}
