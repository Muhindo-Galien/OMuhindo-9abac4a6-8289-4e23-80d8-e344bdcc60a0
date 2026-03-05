import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

export interface CreateOrgFormValue {
  name: string;
  description?: string;
}

/**
 * Modal to create a new organization: name (required) and optional description.
 * Owns the form and emits the value on submit.
 */
@Component({
  selector: 'app-create-org-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-gray-500/75 transition-opacity"
            (click)="close.emit()"
          ></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <h3 id="modal-title" class="text-lg font-semibold text-gray-900 mb-4">
              {{ title() }}
            </h3>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="space-y-4">
                <div>
                  <label for="org-name" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ nameLabel() }}
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    formControlName="name"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-turbovets-navy focus:ring-1 focus:ring-turbovets-navy sm:text-sm"
                    [placeholder]="namePlaceholder()"
                  />
                  @if (form.get('name')?.invalid && form.get('name')?.touched) {
                    <p class="mt-1 text-sm text-turbovets-red">{{ nameError() }}</p>
                  }
                </div>
                <div>
                  <label for="org-desc" class="block text-sm font-medium text-gray-700 mb-1">
                    {{ descriptionLabel() }}
                  </label>
                  <textarea
                    id="org-desc"
                    formControlName="description"
                    rows="2"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-turbovets-navy focus:ring-1 focus:ring-turbovets-navy sm:text-sm"
                    [placeholder]="descriptionPlaceholder()"
                  ></textarea>
                </div>
              </div>
              @if (error(); as err) {
                <p class="mt-3 text-sm text-turbovets-red">{{ err }}</p>
              }
              <div class="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  (click)="close.emit()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {{ cancelLabel() }}
                </button>
                <button
                  type="submit"
                  [disabled]="form.invalid || loading()"
                  class="px-4 py-2 text-sm font-medium text-white bg-turbovets-red rounded-lg hover:bg-turbovets-red/90 disabled:opacity-50"
                >
                  {{ loading() ? submitLoadingLabel() : submitLabel() }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
})
export class CreateOrgModalComponent {
  private fb = inject(FormBuilder);

  isOpen = input(false);
  loading = input(false);
  error = input<string | null>(null);
  title = input('Create a new organization');
  nameLabel = input('Organization name');
  namePlaceholder = input('My Workspace');
  nameError = input('Name is required');
  descriptionLabel = input('Description (optional)');
  descriptionPlaceholder = input('Brief description');
  cancelLabel = input('Cancel');
  submitLabel = input('Create');
  submitLoadingLabel = input('Creating...');

  close = output<void>();
  submit = output<CreateOrgFormValue>();

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      description: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    this.submit.emit({
      name: (value.name ?? '').trim(),
      description: value.description?.trim() || undefined,
    });
  }

  /** Call when opening the modal to reset form and optionally patch values. */
  resetForm(): void {
    this.form.reset({ name: '', description: '' });
  }
}
