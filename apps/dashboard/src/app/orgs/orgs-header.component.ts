import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InitialsAvatarComponent } from '../shared/components/initials-avatar.component';

/**
 * Header bar for the orgs (sites) page: logo, user avatar and name.
 */
@Component({
  selector: 'app-orgs-header',
  standalone: true,
  imports: [CommonModule, InitialsAvatarComponent],
  template: `
    <header class="bg-turbovets-navy text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div class="flex items-center min-w-0 flex-shrink">
          <img
            [src]="logoUrl()"
            [alt]="appName()"
            class="h-6 w-auto max-h-8 object-contain object-left sm:h-8 sm:max-h-9"
          />
        </div>
        <div class="flex items-center gap-2">
            <app-initials-avatar
              [initials]="userInitials()"
              size="md"
              bgClass="bg-turbovets-red"
              [ariaLabel]="userDisplayName()"
            />
            @if (userDisplayName(); as name) {
              <span class="text-sm font-medium max-w-[120px] truncate hidden sm:inline">
                {{ name }}
              </span>
            }
        </div>
      </div>
    </header>
  `,
})
export class OrgsHeaderComponent {
  logoUrl = input('/vets.png');
  /** Used for the image alt text (accessibility). */
  appName = input('Turbovets');
  userInitials = input<string>('?');
  userDisplayName = input<string | null>(null);
}
