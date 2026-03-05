import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Welcome block: heading with highlighted name, subtitle line with "Create" CTA aligned right.
 */
@Component({
  selector: 'app-orgs-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-1 text-left">
        Welcome back, <span class="underline decoration-turbovets-red decoration-wavy decoration-2 underline-offset-2">{{ firstName() || 'there' }}</span>.
      </h1>
      <div class="flex flex-wrap items-center justify-between gap-2 mt-2">
        <span class="text-gray-600 text-left">
          {{ subtitleText() }} <span class="font-semibold text-turbovets-navy">{{ appName() }}</span>
        </span>
        <button
          type="button"
          (click)="createClick.emit()"
          class="text-turbovets-navy hover:text-turbovets-red font-medium text-sm underline focus:outline-none shrink-0"
        >
          {{ createLabel() }}
        </button>
      </div>
    </div>
  `,
})
export class OrgsWelcomeComponent {
  firstName = input<string | null>(null);
  appName = input('Turbovets');
  subtitleText = input('Pick up where you left off in');
  createLabel = input('Create a new organization');

  createClick = output<void>();
}
