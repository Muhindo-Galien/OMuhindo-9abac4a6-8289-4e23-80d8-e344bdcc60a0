import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

/**
 * Reusable button with consistent styling across auth, orgs, tasks, etc.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (variant() === 'link') {
      <button
        type="button"
        [disabled]="disabled()"
        [class]="linkClasses()"
        (click)="click.emit()"
      >
        <ng-content />
      </button>
    } @else {
      <button
        [type]="type()"
        [disabled]="disabled()"
        [class]="buttonClasses()"
        (click)="click.emit()"
      >
        <ng-content />
      </button>
    }
  `,
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
  /** Extra Tailwind classes. */
  class = input('');

  click = output<void>();

  private base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  private variantClasses: Record<ButtonVariant, string> = {
    primary:
      'px-4 py-2 text-sm text-white bg-turbovets-red hover:bg-turbovets-red/90 focus:ring-turbovets-red shadow-sm',
    secondary:
      'px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-primary-500',
    ghost:
      'px-4 py-2 text-sm text-turbovets-navy hover:text-turbovets-red underline',
    danger:
      'px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    link:
      'text-turbovets-navy hover:text-turbovets-red font-medium text-sm underline focus:ring-turbovets-navy',
  };

  buttonClasses(): string {
    const v = this.variant();
    const c = this.variantClasses[v] ?? this.variantClasses.primary;
    return `${this.base} ${c} ${this.class()}`.trim();
  }

  linkClasses(): string {
    return `${this.variantClasses.link} ${this.class()}`.trim();
  }
}
