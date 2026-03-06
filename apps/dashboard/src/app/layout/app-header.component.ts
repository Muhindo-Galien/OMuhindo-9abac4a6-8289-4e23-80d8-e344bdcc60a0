import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InitialsAvatarComponent } from '../shared/components/initials-avatar.component';
import { getInitialsForUser } from '../shared/utils/string.utils';
import { AuthService } from '../services/auth.service';
import { OrgContextService } from '../services/org-context.service';
import { RoleType } from '@data';

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, InitialsAvatarComponent],
  template: `
    <header
      class="bg-turbovets-navy text-white border-b border-white/10 shadow-sm sticky top-0 z-40"
    >
      <div class="flex items-center justify-between h-14 px-4 sm:px-6">
        <!-- Mobile menu button -->
        <button
          type="button"
          (click)="menuClick.emit()"
          class="lg:hidden p-2 -ml-2 rounded-lg text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Toggle menu"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <!-- Logo -->
        <a
          [routerLink]="['/orgs']"
          class="flex items-center min-w-0 flex-shrink"
          aria-label="Sites"
        >
          <img
            [src]="logoUrl()"
            alt="Turbovets"
            class="h-6 w-auto max-h-8 object-contain sm:h-8 sm:max-h-9"
          />
        </a>

        <!-- Right: Settings + Avatar -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Settings dropdown -->
          @if (showSettings()) {
            <div class="relative" #settingsTrigger>
              <button
                type="button"
                (click)="settingsOpen.set(!settingsOpen())"
                class="p-2 rounded-lg text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                [attr.aria-expanded]="settingsOpen()"
                aria-haspopup="true"
              >
                <svg
                  class="w-5 h-5"
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
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              @if (settingsOpen()) {
              <div
                class="absolute right-0 mt-1 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50"
                role="menu"
              >
                <a
                  routerLink="/orgs"
                  (click)="settingsOpen.set(false)"
                  class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                >
                  Organization
                </a>
                @if (canCreateChild()) {
                <button
                  type="button"
                  (click)="createOrgClick.emit(); settingsOpen.set(false)"
                  class="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  role="menuitem"
                >
                  Create space
                </button>
                }
              </div>
              }
            </div>
          }

          <!-- Avatar dropdown -->
          <div class="relative">
            <button
              type="button"
              (click)="avatarOpen.set(!avatarOpen())"
              class="flex items-center gap-2 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30"
              [attr.aria-expanded]="avatarOpen()"
              aria-haspopup="true"
            >
              <app-initials-avatar
                [initials]="getUserInitials()"
                size="md"
                bgClass="bg-turbovets-red"
                [ariaLabel]="getUserDisplayName()"
              />
            </button>
            @if (avatarOpen()) {
            <div
              class="absolute right-0 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50"
              role="menu"
            >
              <button
                type="button"
                (click)="profileClick.emit(); avatarOpen.set(false)"
                class="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                role="menuitem"
              >
                Profile
              </button>
              <button
                type="button"
                (click)="logoutClick.emit(); avatarOpen.set(false)"
                class="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                role="menuitem"
              >
                Logout
              </button>
            </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class AppHeaderComponent {
  private authService = inject(AuthService);
  private orgContext = inject(OrgContextService);

  logoUrl = input('/vets.png');
  showSettings = input(true);

  settingsOpen = signal(false);
  avatarOpen = signal(false);

  menuClick = output<void>();
  createOrgClick = output<void>();
  profileClick = output<void>();
  logoutClick = output<void>();

  private elRef = inject(ElementRef<HTMLElement>);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (!this.elRef.nativeElement.contains(target)) {
      this.settingsOpen.set(false);
      this.avatarOpen.set(false);
    }
  }

  getUserDisplayName(): string | null {
    const u = this.authService.getCurrentUser();
    if (!u) return null;
    const first = u.firstName ?? '';
    const last = u.lastName ?? '';
    return [first, last].filter(Boolean).join(' ') || null;
  }

  getUserInitials(): string {
    const u = this.authService.getCurrentUser();
    return getInitialsForUser(u?.firstName, u?.lastName, u?.email);
  }

  /** Show Create space if user has admin/owner on the site (effective parent). Visible regardless of selected space. */
  canCreateChild(): boolean {
    const parentId = this.orgContext.getEffectiveParentId();
    if (!parentId) return false;
    const u = this.authService.getCurrentUser();
    const role =
      u?.org_roles?.[parentId] ??
      u?.memberships?.find((m) => m.organizationId === parentId)?.role;
    return role === RoleType.ADMIN || role === RoleType.OWNER;
  }
}
