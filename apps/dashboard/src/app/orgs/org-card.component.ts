import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationResponseDto } from '@data';
import { InitialsAvatarComponent } from '../shared/components/initials-avatar.component';

/**
 * Single organization card: icon with initials, name, owner, and "Go to dashboard" action.
 */
@Component({
  selector: 'app-org-card',
  standalone: true,
  imports: [CommonModule, InitialsAvatarComponent],
  template: `
    <div
      class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 hover:border-turbovets-sky hover:shadow-md transition-all"
    >
      <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <app-initials-avatar
          [initials]="initials()"
          size="lg"
          shape="square"
          bgClass="bg-turbovets-navy"
        />
        <div class="flex-1 min-w-0">
          <h2 class="font-semibold text-gray-900 break-words">{{ org().name }}</h2>
          @if (org().owner; as owner) {
            <p class="text-sm text-gray-500 mt-0.5 break-words">
              {{ owner.firstName }} {{ owner.lastName }}
            </p>
          }
        </div>
      </div>
      <button
        type="button"
        (click)="goToDashboard.emit(org())"
        class="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center px-5 py-3 sm:py-2.5 rounded-lg text-sm font-medium text-white bg-turbovets-red hover:bg-turbovets-red/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-turbovets-red transition-colors shadow-sm touch-manipulation"
      >
        {{ actionLabel() }}
      </button>
    </div>
  `,
})
export class OrgCardComponent {
  org = input.required<OrganizationResponseDto>();
  /** Initials shown in the icon (e.g. first two letters of org name). */
  initials = input.required<string>();
  actionLabel = input('Go to dashboard');

  goToDashboard = output<OrganizationResponseDto>();
}
