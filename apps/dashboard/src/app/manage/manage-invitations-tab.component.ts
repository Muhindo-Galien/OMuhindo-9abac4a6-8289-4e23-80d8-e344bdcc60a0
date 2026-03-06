import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { InvitationListItem } from '../services/invitation.service';

@Component({
  selector: 'app-manage-invitations-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="bg-white rounded-xl border border-gray-200 p-6">
      @if (canInvite) {
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        Invite someone
      </h2>
      <form
        [formGroup]="inviteForm"
        (ngSubmit)="sendInvite.emit()"
        class="flex flex-wrap items-end gap-4 mb-6"
      >
        <div class="flex-1 min-w-[200px]">
          <label
            for="invite-email"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Email</label
          >
          <input
            id="invite-email"
            type="email"
            formControlName="email"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="colleague@example.com"
          />
        </div>
        <div class="w-48">
          <label
            for="invite-org"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Add to</label
          >
          <select
            id="invite-org"
            formControlName="organizationId"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            @for (opt of inviteTargetOptions; track opt.id) {
            <option [value]="opt.id">{{ opt.name }}</option>
            }
          </select>
        </div>
        <div class="w-32">
          <label
            for="invite-role"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Role</label
          >
          <select
            id="invite-role"
            formControlName="role"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          [disabled]="inviteForm.invalid || inviteLoading"
          class="px-4 py-2 text-sm font-medium text-white bg-turbovets-navy rounded-lg hover:bg-turbovets-navy/90 disabled:opacity-50"
        >
          {{ inviteLoading ? 'Sending…' : 'Send invite' }}
        </button>
      </form>
      @if (inviteError) {
      <p class="mt-2 text-sm text-red-600 mb-4">{{ inviteError }}</p>
      } }
      @if (canViewInvitations) {
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 class="text-lg font-semibold text-gray-900 mb-0">
          Invitations
        </h2>
        @if (inviteTargetOptions.length > 1) {
        <div class="w-56">
          <label
            for="invitations-org"
            class="block text-sm font-medium text-gray-700 mb-1"
            >For organization</label
          >
          <select
            id="invitations-org"
            [value]="invitationsOrgId"
            (change)="invitationsOrgChange.emit($any($event.target).value)"
            class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            @for (opt of inviteTargetOptions; track opt.id) {
            <option [value]="opt.id">{{ opt.name }}</option>
            }
          </select>
        </div>
        }
      </div>
      @if (invitations.length === 0) {
      <p class="text-sm text-gray-500">No pending invitations.</p>
      } @else {
      <div
        class="invitation-list-scroll rounded-lg border border-gray-200 bg-white overflow-hidden"
      >
        <div class="invitation-list-inner overflow-x-auto">
          <div class="invitation-list-row invitation-list-header">
            <div class="invitation-list-cell invitation-list-cell-email">
              Email
            </div>
            <div class="invitation-list-cell invitation-list-cell-role">
              Role
            </div>
            <div class="invitation-list-cell invitation-list-cell-status">
              Status
            </div>
            <div class="invitation-list-cell invitation-list-cell-expires">
              Expires
            </div>
          </div>
          @for (inv of invitations; track inv.id) {
          <div class="invitation-list-row">
            <div
              class="invitation-list-cell invitation-list-cell-email"
              [title]="inv.email"
            >
              <span class="invitation-list-email">{{ inv.email }}</span>
            </div>
            <div class="invitation-list-cell invitation-list-cell-role">
              <span
                class="invitation-list-role-badge"
                [class.invitation-role-viewer]="
                  (inv.role || '').toLowerCase() === 'viewer'
                "
                [class.invitation-role-admin]="
                  (inv.role || '').toLowerCase() === 'admin'
                "
              >
                {{ inv.role }}
              </span>
            </div>
            <div class="invitation-list-cell invitation-list-cell-status">
              <span class="invitation-list-status">{{ inv.status }}</span>
            </div>
            <div class="invitation-list-cell invitation-list-cell-expires">
              <span class="invitation-list-expires">{{
                inv.expiresAt | date : 'short'
              }}</span>
            </div>
          </div>
          }
        </div>
      </div>
      } }
    </section>
  `,
  styles: [
    `
      .invitation-list-scroll {
        -webkit-overflow-scrolling: touch;
      }
      .invitation-list-inner {
        min-height: 0;
      }
      .invitation-list-row {
        @apply flex items-center gap-0 min-w-[480px] border-b border-gray-200 bg-white transition-colors;
      }
      .invitation-list-row:last-child {
        border-bottom: none;
      }
      .invitation-list-header {
        @apply bg-gray-50 text-gray-600 font-medium text-sm;
      }
      .invitation-list-header.invitation-list-row {
        border-bottom: 1px solid rgb(229 231 235);
      }
      .invitation-list-row:not(.invitation-list-header):hover {
        @apply bg-gray-50/80;
      }
      .invitation-list-cell {
        @apply flex items-center flex-shrink-0 py-3 px-3 text-sm;
      }
      .invitation-list-cell-email {
        @apply min-w-[180px] flex-1 max-w-[280px];
      }
      .invitation-list-email {
        @apply text-gray-900 font-medium truncate block;
      }
      .invitation-list-cell-role {
        @apply w-[90px] min-w-[90px];
      }
      .invitation-list-role-badge {
        @apply text-xs font-medium px-2 py-0.5 rounded;
      }
      .invitation-role-viewer {
        @apply bg-gray-100 text-gray-700;
      }
      .invitation-role-admin {
        @apply bg-blue-100 text-blue-800;
      }
      .invitation-list-cell-status {
        @apply w-[90px] min-w-[90px] text-gray-600 capitalize;
      }
      .invitation-list-cell-expires {
        @apply w-[140px] min-w-[140px] text-gray-600;
      }
    `,
  ],
})
export class ManageInvitationsTabComponent {
  @Input() canInvite = false;
  @Input() canViewInvitations = false;
  @Input({ required: true }) inviteForm!: FormGroup;
  @Input() inviteLoading = false;
  @Input() inviteError: string | null = null;
  @Input() inviteTargetOptions: { id: string; name: string }[] = [];
  @Input() invitationsOrgId: string | null = null;
  @Input() invitations: InvitationListItem[] = [];

  @Output() sendInvite = new EventEmitter<void>();
  @Output() invitationsOrgChange = new EventEmitter<string>();
}

