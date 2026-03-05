import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Empty state when the user has no organizations: message and create CTA.
 */
@Component({
  selector: 'app-org-list-empty',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
      <p class="text-gray-600 mb-4">{{ message() }}</p>
      <button
        type="button"
        (click)="createClick.emit()"
        class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-turbovets-red hover:bg-turbovets-red/90 transition-colors"
      >
        {{ createLabel() }}
      </button>
    </div>
  `,
})
export class OrgListEmptyComponent {
  message = input('You\'re not part of any organization yet.');
  createLabel = input('Create a new site');

  createClick = output<void>();
}
