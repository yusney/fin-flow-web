import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { TranslocoDirective } from '@jsverse/transloco';

import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  readonly key: string;
  readonly icon: string;
  readonly route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <!-- Mobile overlay -->
      @if (isOpen()) {
        <div class="lg:hidden fixed inset-0 bg-black/30 z-40" (click)="close.emit()"></div>
      }

      <aside
        class="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col p-8 gap-y-6 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0"
        [class.-translate-x-full]="!isOpen()"
      >
        <!-- Close button for mobile -->
        <button
          class="lg:hidden absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high"
          (click)="close.emit()"
        >
          <span class="material-symbols-outlined text-[24px]">close</span>
        </button>

        <!-- Logo -->
        <div class="flex items-center gap-x-3 mb-8">
          <img src="/logo.svg" alt="FinFlow" class="w-8 h-8" />
          <span class="text-2xl font-bold font-headline tracking-tight">
            <span class="text-[#2563EB]">Fin</span><span class="text-[#10B981]">Flow</span>
          </span>
        </div>

        <!-- Navigation -->
        <nav class="flex flex-col gap-y-2 flex-1">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="text-on-surface font-bold translate-x-1"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-x-3 text-on-surface-variant font-medium font-headline hover:text-on-surface transition-all px-3 py-2.5 rounded-[var(--radius-xl)]"
              (click)="onNavClick()"
            >
              <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
              <span>{{ t('nav.' + item.key) }}</span>
            </a>
          }

          <!-- Settings — pushed to bottom -->
          <a
            routerLink="/settings"
            routerLinkActive="text-on-surface font-bold translate-x-1"
            class="flex items-center gap-x-3 text-on-surface-variant font-medium font-headline hover:text-on-surface transition-all px-3 py-2.5 rounded-[var(--radius-xl)] mt-auto"
            (click)="onNavClick()"
          >
            <span class="material-symbols-outlined text-[22px]">settings</span>
            <span>{{ t('nav.settings') }}</span>
          </a>
        </nav>

        <!-- User Profile -->
        <div class="pt-2">
          <div class="text-xs uppercase tracking-widest text-outline mb-2">
            {{ t('common.account') }}
          </div>
          <div class="flex items-center gap-x-3">
            <div
              class="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center text-on-surface-variant shrink-0"
            >
              <span class="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-on-surface truncate">
                {{ currentUser()?.name ?? '' }}
              </div>
              <div class="text-xs text-on-surface-variant truncate">
                {{ currentUser()?.email ?? '' }}
              </div>
            </div>
            <button
              (click)="logout()"
              class="p-1.5 rounded-[var(--radius-xl)] text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0"
              [attr.aria-label]="t('sidebar.signOut')"
              [title]="t('sidebar.signOut')"
            >
              <span class="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </ng-container>
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.auth.currentUser;

  // Mobile controls
  readonly isOpen = input<boolean>(true);
  readonly close = output<void>();

  readonly navItems: NavItem[] = [
    { key: 'dashboard', icon: 'dashboard', route: '/dashboard' },
    { key: 'transactions', icon: 'receipt_long', route: '/transactions' },
    { key: 'budgets', icon: 'account_balance_wallet', route: '/budgets' },
    { key: 'subscriptions', icon: 'event_repeat', route: '/subscriptions' },
  ];

  onNavClick(): void {
    // Close sidebar on mobile when navigating
    this.close.emit();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
