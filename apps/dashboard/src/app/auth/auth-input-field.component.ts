import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div>
      <label
        [for]="id"
        class="block text-sm font-medium text-gray-100 mb-1"
      >
        {{ label }}
      </label>
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [readonly]="readonly"
        [formControl]="control"
        class="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-turbovets-navy focus:border-turbovets-navy focus:z-10 sm:text-sm bg-white"
        [class.border-red-500]="control?.invalid && control?.touched"
      />
      <div
        *ngIf="control?.invalid && control?.touched"
        class="mt-1 text-sm text-red-600"
      >
        <span *ngIf="control?.errors?.['required']">
          {{ requiredMessage || 'This field is required' }}
        </span>
        <span *ngIf="control?.errors?.['email']">
          {{ emailMessage || 'Please enter a valid email' }}
        </span>
        <span *ngIf="control?.errors?.['minlength']">
          {{ minlengthMessage || 'Value is too short' }}
        </span>
      </div>
    </div>
  `,
})
export class AuthInputFieldComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) id!: string;
  @Input({ required: true }) control!: any;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() readonly = false;
  @Input() requiredMessage?: string;
  @Input() emailMessage?: string;
  @Input() minlengthMessage?: string;
}

