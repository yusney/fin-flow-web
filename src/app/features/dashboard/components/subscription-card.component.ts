import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-subscription-card',
  imports: [TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div
        class="bg-surface-container-low p-4 lg:p-6 rounded-[var(--radius-card)] flex flex-row lg:flex-col justify-between lg:border-l-4 lg:border-primary h-full min-h-[120px] lg:min-h-[240px] shadow-[var(--shadow-card)]"
      >
        <!-- Header row -->
        <div class="flex-1 lg:flex-none">
          <div class="flex justify-between items-start mb-2 lg:mb-4">
            <!-- Icon -->
            <div
              class="w-10 h-10 lg:w-12 lg:h-12 bg-surface-container-lowest rounded-[var(--radius-xl)] flex items-center justify-center text-primary shadow-[var(--shadow-card)]"
            >
              <span class="material-symbols-outlined text-[22px] lg:text-[28px]"> event_repeat </span>
            </div>

            <!-- Badge -->
            <span
              class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest hidden lg:inline"
            >
              {{ t('dashboard.upcoming') }}
            </span>
          </div>

          <h3 class="text-base lg:text-lg font-bold font-headline text-on-surface">
            Netflix Premium
          </h3>
          <p class="text-xs lg:text-sm text-on-surface-variant">Due in 2 days</p>
        </div>

        <!-- Amount + CTA -->
        <div
          class="flex flex-col items-end lg:items-stretch justify-center lg:justify-start mt-0 lg:mt-4"
        >
          <div class="text-xl lg:text-2xl font-bold tabular-nums text-on-surface">$19.99</div>
          <button
            class="mt-2 lg:mt-4 py-1.5 lg:py-2 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors rounded-[var(--radius-lg)] lg:w-full"
          >
            <span class="hidden lg:inline">{{ t('dashboard.viewDetails') }}</span>
            <span class="lg:hidden text-[10px]">{{ t('dashboard.view') }}</span>
          </button>
        </div>
      </div>
    </ng-container>
  `,
})
export class SubscriptionCardComponent {}
