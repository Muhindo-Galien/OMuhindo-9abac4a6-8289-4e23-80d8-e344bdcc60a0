import {
  Component,
  inject,
  OnInit,
  input,
  output,
  signal,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OrganizationResponseDto, RoleType } from '@data';
import { OrgContextService } from '../services/org-context.service';
import { OrganizationService } from '../services/organization.service';
import { AuthService } from '../services/auth.service';
import { getInitialsFromWords } from '../shared/utils/string.utils';
import { InitialsAvatarComponent } from '../shared/components/initials-avatar.component';

/**
 * Sidebar reserved for Spaces (child orgs) only. Shows list of spaces with + and ... menu.
 * Board/List/Audit are in the content bar, not here.
 */
@Component({
  selector: 'app-app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, InitialsAvatarComponent],
  template: `
    @if (mobileOpen()) {
    <div
      class="fixed inset-0 z-30 bg-black/20 lg:hidden"
      (click)="close.emit()"
      aria-hidden="true"
    ></div>
    }
    <aside
      class="w-56 flex-shrink-0 border-r border-gray-200 bg-white fixed lg:relative inset-y-0 left-0 z-40 pt-14 lg:pt-0 transform transition-transform duration-200 ease-out -translate-x-full lg:translate-x-0"
      [class.translate-x-0]="mobileOpen()"
    >
      <nav
        class="p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col"
      >
        <!-- Spaces header: title + + and ... (more) -->
        <div class="border-b border-gray-100">
          <div class="flex items-center justify-between gap-2 px-3 py-2">
            <span
              class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >Spaces</span
            >

            <div class="flex items-center gap-0.5">
              <button
                type="button"
                (click)="spacesMenuOpen.set(!spacesMenuOpen())"
                class="p-1.5 rounded text-gray-500 hover:bg-gray-100 focus:outline-none"
                [attr.aria-expanded]="spacesMenuOpen()"
                aria-label="Spaces options"
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
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <!-- Expand-down menu (inline, not overlay) -->
          @if (spacesMenuOpen()) {
          <div class="border-t border-gray-100 bg-gray-50/80 py-1" role="menu">
            @if (canCreateChild()) {
            <a
              routerLink="/app/manage"
              (click)="spacesMenuOpen.set(false); close.emit()"
              class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded mx-1"
              role="menuitem"
            >
              <svg
                class="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
              </svg>
              Manage spaces
            </a>
            <button
              type="button"
              (click)="
                createClick.emit(); spacesMenuOpen.set(false); close.emit()
              "
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left rounded mx-1"
              role="menuitem"
            >
              <svg
                class="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create space
            </button>
            }
          </div>
          }
        </div>

        <!-- Recent / list of spaces -->
        <div class="py-2 flex-1 min-h-0">
          <p
            class="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Recent
          </p>
          @if (loading()) {
          <div class="px-3 py-4 text-sm text-gray-500">Loading...</div>
          } @else if (childOrgs().length === 0) {
          <p class="px-3 py-2 text-sm text-gray-500">No spaces yet</p>
          } @else {
          <ul class="space-y-0.5">
            @for (org of childOrgs(); track org.id) {
            <li>
              <button
                type="button"
                (click)="goToOrg(org); close.emit()"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors"
                [class.bg-turbovets-sky-light]="isCurrentOrg(org.id)"
                [class.text-turbovets-navy]="isCurrentOrg(org.id)"
                [class.border-l-4]="isCurrentOrg(org.id)"
                [class.border-l-turbovets-red]="isCurrentOrg(org.id)"
                [class.text-gray-700]="!isCurrentOrg(org.id)"
                [class.hover:bg-gray-100]="!isCurrentOrg(org.id)"
              >
                <app-initials-avatar
                  [initials]="getInitials(org.name)"
                  size="sm"
                  shape="square"
                  bgClass="bg-turbovets-navy"
                />
                <span class="truncate flex-1">{{ org.name }}</span>
              </button>
            </li>
            }
          </ul>
          }
        </div>
      </nav>
    </aside>
  `,
})
export class AppSidebarComponent implements OnInit {
  private orgContext = inject(OrgContextService);
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private elRef = inject(ElementRef<HTMLElement>);

  mobileOpen = input<boolean>(false);
  close = output<void>();
  createClick = output<void>();

  spacesMenuOpen = signal(false);
  loading = signal(true);
  childOrgs = signal<OrganizationResponseDto[]>([]);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target as Node)) {
      this.spacesMenuOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.loadChildren();
  }

  get currentOrgId(): string | null {
    return this.orgContext.getCurrentOrgId();
  }

  isCurrentOrg(orgId: string): boolean {
    return this.currentOrgId === orgId;
  }

  getInitials(name: string): string {
    return getInitialsFromWords(name);
  }

  /** Load spaces: children of current org if it's a workspace, or siblings if current org is a space. */
  loadChildren(): void {
    const org = this.orgContext.getCurrentOrg();
    const parentId = org?.parentId ?? org?.id;
    if (!parentId) {
      this.loading.set(false);
      this.childOrgs.set([]);
      return;
    }
    this.loading.set(true);
    this.orgService.getSpaces(parentId).subscribe({
      next: list => {
        this.childOrgs.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.childOrgs.set([]);
        this.loading.set(false);
      },
    });
  }

  goToOrg(org: OrganizationResponseDto): void {
    this.orgContext.setCurrentOrg({
      id: org.id,
      name: org.name,
      description: org.description,
      parentId: org.parentId,
      owner: org.owner,
    });
    this.router.navigate(['/app/dashboard']);
  }

  /** Show Create space if user has admin/owner on the site (effective parent). Visible regardless of selected space so the button does not disappear. */
  canCreateChild(): boolean {
    const parentId = this.orgContext.getEffectiveParentId();
    if (!parentId) return false;
    const user = this.authService.getCurrentUser();
    const role =
      user?.org_roles?.[parentId] ??
      user?.memberships?.find(m => m.organizationId === parentId)?.role;
    return role === RoleType.ADMIN || role === RoleType.OWNER;
  }
}
