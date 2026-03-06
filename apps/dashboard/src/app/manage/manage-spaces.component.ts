import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { OrganizationResponseDto, RoleType } from '@data';
import { OrgContextService } from '../services/org-context.service';
import { OrganizationService } from '../services/organization.service';
import { OrgMemberSummaryDto } from '@data';
import {
  InvitationService,
  InvitationListItem,
} from '../services/invitation.service';
import { AuthService } from '../services/auth.service';
import {
  CreateOrgModalComponent,
  CreateOrgFormValue,
} from '../orgs/create-org-modal.component';
import { InitialsAvatarComponent } from '../shared/components/initials-avatar.component';
import { getInitialsFromWords } from '../shared/utils/string.utils';
import { ManageInvitationsTabComponent } from './manage-invitations-tab.component';

type ManageTab = 'organization' | 'spaces' | 'members' | 'invitations';

@Component({
  selector: 'app-manage-spaces',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CreateOrgModalComponent,
    InitialsAvatarComponent,
    ManageInvitationsTabComponent,
  ],
  template: `
    <div class="bg-gray-50 min-h-full">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <a
          routerLink="/app/dashboard"
          class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-turbovets-navy mb-4"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to dashboard
        </a>
        <h1 class="text-xl font-bold text-gray-900 mb-6">
          Manage organization
        </h1>
        @if (loading()) {
        <div class="flex justify-center py-12">
          <div
            class="animate-spin rounded-full h-10 w-10 border-2 border-turbovets-navy border-t-transparent"
          ></div>
        </div>
        } @else if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
        } @else if (organization()) {
        <!-- Tabs -->
        <nav
          class="flex gap-1 border-b border-gray-200 mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6"
        >
          <button
            type="button"
            (click)="activeTab.set('organization')"
            class="px-4 py-3 text-sm font-medium rounded-t-lg transition-colors"
            [class.bg-white]="activeTab() === 'organization'"
            [class.text-turbovets-navy]="activeTab() === 'organization'"
            [class.border-b-2]="activeTab() === 'organization'"
            [class.border-turbovets-navy]="activeTab() === 'organization'"
            [class.text-gray-600]="activeTab() !== 'organization'"
            [class.hover:bg-gray-100]="activeTab() !== 'organization'"
          >
            Organization
          </button>
          <button
            type="button"
            (click)="activeTab.set('spaces')"
            class="px-4 py-3 text-sm font-medium rounded-t-lg transition-colors"
            [class.bg-white]="activeTab() === 'spaces'"
            [class.text-turbovets-navy]="activeTab() === 'spaces'"
            [class.border-b-2]="activeTab() === 'spaces'"
            [class.border-turbovets-navy]="activeTab() === 'spaces'"
            [class.text-gray-600]="activeTab() !== 'spaces'"
            [class.hover:bg-gray-100]="activeTab() !== 'spaces'"
          >
            Spaces
          </button>
          <button
            type="button"
            (click)="activeTab.set('members')"
            class="px-4 py-3 text-sm font-medium rounded-t-lg transition-colors"
            [class.bg-white]="activeTab() === 'members'"
            [class.text-turbovets-navy]="activeTab() === 'members'"
            [class.border-b-2]="activeTab() === 'members'"
            [class.border-turbovets-navy]="activeTab() === 'members'"
            [class.text-gray-600]="activeTab() !== 'members'"
            [class.hover:bg-gray-100]="activeTab() !== 'members'"
          >
            Members
          </button>
          <button
            type="button"
            (click)="activeTab.set('invitations')"
            class="px-4 py-3 text-sm font-medium rounded-t-lg transition-colors"
            [class.bg-white]="activeTab() === 'invitations'"
            [class.text-turbovets-navy]="activeTab() === 'invitations'"
            [class.border-b-2]="activeTab() === 'invitations'"
            [class.border-turbovets-navy]="activeTab() === 'invitations'"
            [class.text-gray-600]="activeTab() !== 'invitations'"
            [class.hover:bg-gray-100]="activeTab() !== 'invitations'"
          >
            Invitations
          </button>
        </nav>

        <!-- Tab: Organization -->
        @if (activeTab() === 'organization') {
        <section class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="font-medium text-gray-900">
                {{ organization()!.name }}
              </p>
              @if (organization()!.description) {
              <p class="text-sm text-gray-500 mt-1">
                {{ organization()!.description }}
              </p>
              }
            </div>
            @if (canEditOrganization()) {
            <div class="flex gap-2">
              <button
                type="button"
                (click)="openEditOrganizationModal()"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit
              </button>
              @if (canDeleteOrganization()) {
              <button
                type="button"
                (click)="confirmDeleteOrganization()"
                class="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
              }
            </div>
            }
          </div>
        </section>
        }

        <!-- Tab: Spaces -->
        @if (canViewSpacesTab() && activeTab() === 'spaces') {
        <section class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Spaces</h2>
            @if (canCreateSpace()) {
            <button
              type="button"
              (click)="openCreateSpaceModal()"
              class="px-3 py-1.5 text-sm font-medium text-white bg-turbovets-navy rounded-lg hover:bg-turbovets-navy/90"
            >
              Add space
            </button>
            }
          </div>
          @if (spaces().length === 0) {
          <p class="text-sm text-gray-500">No spaces yet.</p>
          } @else {
          <ul class="space-y-3">
            @for (space of spaces(); track space.id) {
            <li
              class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div class="flex items-center gap-3 min-w-0">
                <app-initials-avatar
                  [initials]="getInitials(space.name)"
                  size="sm"
                  shape="square"
                  bgClass="bg-turbovets-navy"
                />
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 truncate">
                    {{ space.name }}
                  </p>
                  @if (space.description) {
                  <p class="text-sm text-gray-500 truncate">
                    {{ space.description }}
                  </p>
                  }
                </div>
              </div>
              @if (canEditSpace(space.id)) {
              <div class="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  (click)="openEditSpaceModal(space)"
                  class="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Edit
                </button>
                @if (canDeleteSpace(space.id)) {
                <button
                  type="button"
                  (click)="confirmDeleteSpace(space)"
                  class="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
                }
              </div>
              }
            </li>
            }
          </ul>
          }
        </section>
        }

        <!-- Tab: Members -->
        @if (activeTab() === 'members') {
        <section class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Members</h2>
            @if (inviteTargetOptions().length > 1) {
            <div class="w-56">
              <label
                for="members-org"
                class="block text-sm font-medium text-gray-700 mb-1"
                >View members of</label
              >
              <select
                id="members-org"
                [value]="membersOrgId()"
                (change)="onMembersOrgChange($any($event.target).value)"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                @for (opt of inviteTargetOptions(); track opt.id) {
                <option [value]="opt.id">{{ opt.name }}</option>
                }
              </select>
            </div>
            }
          </div>
          @if (members().length === 0) {
          <p class="text-sm text-gray-500">No members.</p>
          } @else {
          <ul class="space-y-2">
            @for (m of members(); track m.userId) {
            <li
              class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div class="flex items-center gap-3">
                <app-initials-avatar
                  [initials]="getMemberInitials(m)"
                  size="sm"
                  bgClass="bg-turbovets-navy"
                />
                <div>
                  <p class="font-medium text-gray-900">
                    {{ m.firstName }} {{ m.lastName }}
                  </p>
                  <p class="text-sm text-gray-500">{{ m.email }}</p>
                </div>
                @if (canUpdateMemberRole() && m.userId !== currentUserId() &&
                (m.role || '').toLowerCase() !== 'owner') {
                <select
                  [value]="(m.role || '').toLowerCase()"
                  (change)="
                    onMemberRoleChange(m.userId, $any($event.target).value)
                  "
                  [disabled]="memberRoleUpdating() === m.userId"
                  class="text-xs font-medium px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-turbovets-navy"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
                } @else {
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded"
                  [class.bg-gray-100]="
                    (m.role || '').toLowerCase() === 'viewer'
                  "
                  [class.text-gray-700]="
                    (m.role || '').toLowerCase() === 'viewer'
                  "
                  [class.bg-blue-100]="(m.role || '').toLowerCase() === 'admin'"
                  [class.text-blue-800]="
                    (m.role || '').toLowerCase() === 'admin'
                  "
                  [class.bg-amber-100]="
                    (m.role || '').toLowerCase() === 'owner'
                  "
                  [class.text-amber-800]="
                    (m.role || '').toLowerCase() === 'owner'
                  "
                  >{{ m.role }}</span
                >
                }
              </div>
              @if (canRevokeMember(m)) {
              <button
                type="button"
                (click)="revokeMember(m.userId)"
                class="text-sm text-red-600 hover:bg-red-50 px-2 py-1 rounded"
              >
                Remove
              </button>
              }
            </li>
            }
          </ul>
          }
        </section>
        }

        <!-- Tab: Invitations -->
        @if (activeTab() === 'invitations') {
        <app-manage-invitations-tab
          [canInvite]="canInvite()"
          [canViewInvitations]="canViewInvitations()"
          [inviteForm]="inviteForm"
          [inviteLoading]="inviteLoading()"
          [inviteError]="inviteError()"
          [inviteTargetOptions]="inviteTargetOptions()"
          [invitationsOrgId]="invitationsOrgId()"
          [invitations]="invitations()"
          (sendInvite)="sendInvite()"
          (invitationsOrgChange)="onInvitationsOrgChange($event)"
        ></app-manage-invitations-tab>
        } }
      </div>
    </div>

    <!-- Create/Edit modal -->
    <app-create-org-modal
      #spaceModal
      [isOpen]="spaceModalOpen()"
      [loading]="spaceModalLoading()"
      [error]="spaceModalError()"
      [title]="
        editingSpace()
          ? editingSpace()!.parentId
            ? 'Edit space'
            : 'Edit organization'
          : 'Create space'
      "
      [initialName]="editingSpace()?.name ?? ''"
      [initialDescription]="editingSpace()?.description ?? ''"
      nameLabel="Space name"
      namePlaceholder="My Space"
      [submitLabel]="editingSpace() ? 'Save' : 'Create'"
      (close)="closeSpaceModal()"
      (submit)="onSpaceModalSubmit($event)"
    ></app-create-org-modal>
  `,
  styles: [],
})
export class ManageSpacesComponent implements OnInit {
  private orgContext = inject(OrgContextService);
  private orgService = inject(OrganizationService);
  private invitationService = inject(InvitationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  activeTab = signal<ManageTab>('organization');
  organization = signal<OrganizationResponseDto | null>(null);
  spaces = signal<OrganizationResponseDto[]>([]);
  members = signal<OrgMemberSummaryDto[]>([]);
  invitations = signal<InvitationListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  spaceModalOpen = signal(false);
  spaceModalLoading = signal(false);
  spaceModalError = signal<string | null>(null);
  editingSpace = signal<OrganizationResponseDto | null>(null);

  inviteForm: FormGroup;
  inviteLoading = signal(false);
  inviteError = signal<string | null>(null);

  /** Set to userId while a role update request is in flight. */
  memberRoleUpdating = signal<string | null>(null);

  /** Org id that Manage page treats as the root for this session:
   * - if user has any role on the parent site, use parent (can manage spaces),
   * - otherwise, fall back to the currently selected org (e.g. child-only admin).
   */
  private parentId = computed(() => this.getManageOrgId());

  /** Options for org selector: parent org plus its spaces (for invite target, members view, invitations view). */
  inviteTargetOptions = computed(() => {
    const org = this.organization();
    const parentId = this.parentId();
    if (!parentId || !org) return [];
    const list: { id: string; name: string }[] = [
      { id: parentId, name: org.name },
    ];
    for (const s of this.spaces()) {
      list.push({ id: s.id, name: s.name });
    }
    return list;
  });

  /** Currently selected org for viewing members (parent or a space). */
  membersOrgId = signal<string | null>(null);
  /** Currently selected org for listing pending invitations (parent or a space). */
  invitationsOrgId = signal<string | null>(null);

  constructor() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [RoleType.VIEWER, Validators.required],
      organizationId: ['' as string, Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  private getManageOrgId(): string | null {
    const current = this.orgContext.getCurrentOrg();
    if (!current) return null;
    const user = this.authService.getCurrentUser();
    if (!user) return current.parentId ?? current.id;

    const resolveRole = (orgId: string | undefined): RoleType | null => {
      if (!orgId) return null;
      return (
        user.org_roles?.[orgId] ??
        user.memberships?.find(m => m.organizationId === orgId)?.role ??
        null
      );
    };

    const parentRole = resolveRole(current.parentId);
    const currentRole = resolveRole(current.id);

    // Prefer parent when user has a role there; otherwise fall back to the current (child) org.
    if (parentRole) return current.parentId!;
    if (currentRole) return current.id;
    return current.parentId ?? current.id;
  }

  load(): void {
    const parentId = this.parentId();
    if (!parentId) {
      this.error.set('No organization selected.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.orgService.getOrganization(parentId).subscribe({
      next: org => {
        this.organization.set(org);
        this.loadSpaces();
        this.membersOrgId.set(parentId);
        this.invitationsOrgId.set(parentId);
        this.inviteForm.patchValue({ organizationId: parentId });
        this.loadMembers();
        this.loadInvitations();
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? 'Failed to load organization.');
        this.loading.set(false);
      },
    });
  }

  private loadSpaces(): void {
    const parentId = this.parentId();
    if (!parentId) return;
    this.orgService.getSpaces(parentId).subscribe({
      next: list => this.spaces.set(list),
      error: () => this.spaces.set([]),
    });
  }

  private loadMembers(): void {
    const orgId = this.membersOrgId() ?? this.parentId();
    if (!orgId) return;
    this.orgService.getMembers(orgId).subscribe({
      next: list => this.members.set(list),
      error: () => this.members.set([]),
    });
  }

  private loadInvitations(): void {
    const orgId = this.invitationsOrgId() ?? this.parentId();
    if (!orgId) return;
    this.invitationService.listForOrg(orgId).subscribe({
      next: list => this.invitations.set(list),
      error: () => this.invitations.set([]),
    });
  }

  canEditOrganization(): boolean {
    return this.hasRole(this.parentId(), RoleType.OWNER);
  }

  canDeleteOrganization(): boolean {
    return this.hasRole(this.parentId(), RoleType.OWNER);
  }

  canCreateSpace(): boolean {
    return (
      this.hasRole(this.parentId(), RoleType.ADMIN) ||
      this.hasRole(this.parentId(), RoleType.OWNER)
    );
  }

  /** Only show the Spaces tab when the user can actually manage spaces on the site (admin/owner on real parent org). */
  canViewSpacesTab(): boolean {
    const current = this.orgContext.getCurrentOrg();
    if (!current) return false;
    const parentId = current.parentId ?? current.id;
    return (
      this.hasRole(parentId, RoleType.ADMIN) ||
      this.hasRole(parentId, RoleType.OWNER)
    );
  }

  canEditSpace(orgId: string): boolean {
    return this.hasRole(orgId, RoleType.OWNER);
  }

  canDeleteSpace(orgId: string): boolean {
    return this.hasRole(orgId, RoleType.OWNER);
  }

  canRevokeMember(member: OrgMemberSummaryDto): boolean {
    const orgId = this.membersOrgId() ?? this.parentId();
    if (!orgId) return false;
    const currentId = this.currentUserId();
    const memberRole = (member.role ?? '').toLowerCase();
    const isSelf = member.userId === currentId;

    // Viewer can only revoke themselves
    if (this.hasRole(orgId, RoleType.VIEWER))
      return isSelf;

    // Admin can revoke only viewers, or themselves (leave)
    if (this.hasRole(orgId, RoleType.ADMIN)) {
      if (isSelf) return true;
      return memberRole === 'viewer';
    }

    // Owner can revoke admins and viewers, not another owner
    if (this.hasRole(orgId, RoleType.OWNER))
      return memberRole === 'admin' || memberRole === 'viewer';

    return false;
  }

  /** Only owner can update member roles (to admin or viewer). */
  canUpdateMemberRole(): boolean {
    const orgId = this.membersOrgId() ?? this.parentId();
    return this.hasRole(orgId, RoleType.OWNER);
  }

  canInvite(): boolean {
    // Admin/owner can invite into whichever org is currently selected in the invite form.
    const targetOrgId =
      (this.inviteForm?.value['organizationId'] as string | undefined) ??
      this.parentId();
    if (!targetOrgId) return false;
    return (
      this.hasRole(targetOrgId, RoleType.ADMIN) ||
      this.hasRole(targetOrgId, RoleType.OWNER)
    );
  }

  canViewInvitations(): boolean {
    // Admin/owner can view invitations for the currently selected org (parent or a specific space).
    const orgId = this.invitationsOrgId() ?? this.parentId();
    if (!orgId) return false;
    return (
      this.hasRole(orgId, RoleType.ADMIN) || this.hasRole(orgId, RoleType.OWNER)
    );
  }

  private hasRole(orgId: string | null, role: RoleType): boolean {
    if (!orgId) return false;
    const user = this.authService.getCurrentUser();
    const r =
      user?.org_roles?.[orgId] ??
      user?.memberships?.find(m => m.organizationId === orgId)?.role;
    return r === role;
  }

  currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  getInitials(name: string): string {
    return getInitialsFromWords(name);
  }

  getMemberInitials(m: OrgMemberSummaryDto): string {
    return (
      [m.firstName, m.lastName]
        .filter(Boolean)
        .map(s => s.charAt(0))
        .join('')
        .toUpperCase() ||
      m.email?.charAt(0)?.toUpperCase() ||
      '?'
    );
  }

  openEditOrganizationModal(): void {
    this.editingSpace.set(null);
    this.spaceModalError.set(null);
    const org = this.organization();
    if (org) {
      this.editingSpace.set({ ...org, parentId: undefined } as any);
    }
    this.spaceModalOpen.set(true);
  }

  openCreateSpaceModal(): void {
    this.editingSpace.set(null);
    this.spaceModalError.set(null);
    this.spaceModalOpen.set(true);
  }

  openEditSpaceModal(space: OrganizationResponseDto): void {
    this.editingSpace.set(space);
    this.spaceModalError.set(null);
    this.spaceModalOpen.set(true);
  }

  closeSpaceModal(): void {
    this.spaceModalOpen.set(false);
    this.editingSpace.set(null);
    this.spaceModalError.set(null);
  }

  onSpaceModalSubmit(value: CreateOrgFormValue): void {
    const parentId = this.parentId();
    const editing = this.editingSpace();
    if (editing) {
      this.spaceModalLoading.set(true);
      this.orgService.updateOrganization(editing.id, value).subscribe({
        next: () => {
          if (!editing.parentId) this.load();
          else this.loadSpaces();
          this.closeSpaceModal();
          this.spaceModalLoading.set(false);
        },
        error: err => {
          this.spaceModalError.set(err?.error?.message ?? 'Failed to update.');
          this.spaceModalLoading.set(false);
        },
      });
    } else if (parentId) {
      this.spaceModalLoading.set(true);
      this.orgService.createChildOrganization(parentId, value).subscribe({
        next: () => {
          // After creating a new space, refresh auth/session so org_roles includes the new space
          // (roles are computed from memberships + org hierarchy on the server).
          this.authService.refresh().subscribe({
            next: () => {
              this.loadSpaces();
              this.closeSpaceModal();
              this.spaceModalLoading.set(false);
            },
            error: () => {
              // Even if refresh fails, keep UX responsive; server-side guards remain authoritative.
              this.loadSpaces();
              this.closeSpaceModal();
              this.spaceModalLoading.set(false);
            },
          });
        },
        error: err => {
          this.spaceModalError.set(err?.error?.message ?? 'Failed to create.');
          this.spaceModalLoading.set(false);
        },
      });
    }
  }

  confirmDeleteOrganization(): void {
    const org = this.organization();
    if (
      !org ||
      !confirm(
        `Delete organization "${org.name}" and all its spaces? This cannot be undone.`
      )
    )
      return;
    this.orgService.deleteOrganization(org.id).subscribe({
      next: () => {
        // Refresh auth profile so org_roles and memberships drop the deleted org.
        this.authService.refresh().subscribe({
          next: () => {
            this.orgContext.clearCurrentOrg();
            window.location.href = '/orgs';
          },
          error: () => {
            this.orgContext.clearCurrentOrg();
            window.location.href = '/orgs';
          },
        });
      },
      error: err => alert(err?.error?.message ?? 'Failed to delete.'),
    });
  }

  confirmDeleteSpace(space: OrganizationResponseDto): void {
    if (!confirm(`Delete space "${space.name}"? This cannot be undone.`))
      return;
    this.orgService.deleteOrganization(space.id).subscribe({
      next: () => {
        // Refresh auth profile so org_roles and memberships reflect removed space.
        this.authService.refresh().subscribe({
          next: () => this.loadSpaces(),
          error: () => this.loadSpaces(),
        });
      },
      error: err => alert(err?.error?.message ?? 'Failed to delete.'),
    });
  }

  revokeMember(userId: string): void {
    const orgId = this.membersOrgId() ?? this.parentId();
    if (!orgId || !confirm('Remove this member from the organization?')) return;
    const isSelf = userId === this.currentUserId();
    this.orgService.revokeMember(orgId, userId).subscribe({
      next: () => {
        if (isSelf) {
          // If user revoked their own membership, refresh auth profile and redirect.
          this.authService.refresh().subscribe({
            next: () => {
              this.orgContext.clearCurrentOrg();
              window.location.href = '/orgs';
            },
            error: () => {
              this.orgContext.clearCurrentOrg();
              window.location.href = '/orgs';
            },
          });
        } else {
          this.loadMembers();
        }
      },
      error: err => alert(err?.error?.message ?? 'Failed to remove.'),
    });
  }

  onMemberRoleChange(userId: string, newRole: string): void {
    const orgId = this.membersOrgId() ?? this.parentId();
    if (!orgId || (newRole !== 'admin' && newRole !== 'viewer')) return;
    this.memberRoleUpdating.set(userId);
    this.orgService
      .updateMemberRole(orgId, userId, newRole as 'admin' | 'viewer')
      .subscribe({
        next: () => {
          this.loadMembers();
          this.memberRoleUpdating.set(null);
        },
        error: err => {
          alert(err?.error?.message ?? 'Failed to update role.');
          this.memberRoleUpdating.set(null);
        },
      });
  }

  onMembersOrgChange(orgId: string): void {
    this.membersOrgId.set(orgId);
    this.loadMembers();
  }

  onInvitationsOrgChange(orgId: string): void {
    this.invitationsOrgId.set(orgId);
    this.loadInvitations();
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) return;
    const orgId = this.inviteForm.value['organizationId'] as string;
    if (!orgId) return;
    this.inviteLoading.set(true);
    this.inviteError.set(null);
    const v = this.inviteForm.value;
    this.invitationService
      .send({
        email: v.email,
        role: v.role,
        organizationId: orgId,
      })
      .subscribe({
        next: () => {
          this.invitationsOrgId.set(orgId);
          this.inviteForm.reset({
            email: '',
            role: RoleType.VIEWER,
            organizationId: orgId,
          });
          this.loadInvitations();
          this.inviteLoading.set(false);
        },
        error: err => {
          this.inviteError.set(err?.error?.message ?? 'Failed to send invite.');
          this.inviteLoading.set(false);
        },
      });
  }
}
