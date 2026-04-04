import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <header class="hidden lg:flex justify-between items-center w-full mb-8 lg:mb-12">
        <!-- Title block -->
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold font-headline tracking-tight text-on-surface">
            {{ t('dashboard.title') }}
          </h1>
          <p class="text-sm lg:text-base text-on-surface-variant mt-1">
            {{ t('dashboard.welcome', { name: firstName() }) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-x-4">
          <!-- Search -->
          <div class="relative">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]"
            >
              search
            </span>
            <input
              type="text"
              [placeholder]="t('dashboard.searchPlaceholder')"
              class="pl-10 pr-4 py-2 bg-surface-container-high rounded-[var(--radius-xl)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 xl:w-64 transition-all"
            />
          </div>

          <!-- Notifications -->
          <button
            class="p-2 rounded-[var(--radius-xl)] hover:bg-surface-container-high transition-colors text-on-surface-variant"
            aria-label="Notifications"
          >
            <span class="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <!-- Mobile Header -->
      <div class="lg:hidden mb-4">
        <h1 class="text-xl font-bold font-headline text-on-surface">{{ t('dashboard.title') }}</h1>
        <p class="text-xs text-on-surface-variant">{{ t('dashboard.welcomeMobile', { name: firstName() }) }}</p>
      </div>
    </ng-container>
  `,
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);

  firstName(): string {
    const name = this.auth.currentUser()?.name ?? 'Alex';
    return name.split(' ')[0];
  }
}
