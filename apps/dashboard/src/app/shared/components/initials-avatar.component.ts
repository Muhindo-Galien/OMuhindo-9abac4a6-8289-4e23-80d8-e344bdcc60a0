import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable avatar showing initials in a circle (user, org, etc.).
 * Used in header, org cards, and anywhere we need a consistent initials display.
 */
@Component({
  selector: 'app-initials-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center justify-center flex-shrink-0 text-white font-semibold"
      [class]="sizeClass() + ' ' + shapeClass() + ' ' + (bgClass() || 'bg-turbovets-red')"
      [attr.aria-label]="ariaLabel()"
    >
      <span [class]="textSizeClass()">{{ initials() }}</span>
    </div>
  `,
})
export class InitialsAvatarComponent {
  /** 1–2 character initials to display. */
  initials = input.required<string>();
  /** Size: 'sm' (8), 'md' (9), 'lg' (14). */
  size = input<'sm' | 'md' | 'lg'>('md');
  /** Shape: circle (default) or rounded square. */
  shape = input<'circle' | 'square'>('circle');
  /** Tailwind background class (e.g. bg-turbovets-red, bg-turbovets-navy). */
  bgClass = input('bg-turbovets-red');
  /** Accessible label. */
  ariaLabel = input<string | null>(null);

  sizeClass() {
    const s = this.size();
    switch (s) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-14 w-14';
      default:
        return 'h-9 w-9';
    }
  }

  shapeClass() {
    return this.shape() === 'square' ? 'rounded-lg' : 'rounded-full';
  }

  textSizeClass() {
    const s = this.size();
    switch (s) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  }
}
