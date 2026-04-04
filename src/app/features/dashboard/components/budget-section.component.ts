import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { BudgetService } from '../../../core/services/budget.service';
import { Budget, BudgetStatus, budgetStatus } from '../../../shared/models/budget.model';
import { PreferencesService } from '../../../core/services/preferences.service';

@Component({
  selector: 'app-budget-section',
  imports: [CurrencyPipe, RouterLink, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div class="flex justify-between items-end mb-4 lg:mb-6">
        <h2 class="text-lg lg:text-2xl font-bold font-headline text-on-surface">
          {{ t('dashboard.budgets') }}
        </h2>
        <span class="text-xs lg:text-sm text-on-surface-variant">{{
          t('dashboard.period', { month: currentMonthLabel() })
        }}</span>
      </div>

      <div
        class="bg-surface-container-lowest p-4 lg:p-8 rounded-[var(--radius-card)] space-y-4 lg:space-y-8 shadow-[var(--shadow-card)]"
      >
        @for (budget of budgets(); track budget.id) {
          <div>
            <!-- Row: icon + label + amount -->
            <div class="flex justify-between mb-2 lg:mb-3">
              <div class="flex items-center gap-x-2">
                <span
                  class="material-symbols-outlined text-[20px] lg:text-[24px]"
                  [class]="iconColorClass(budget)"
                >
                  {{ budget.icon ?? 'category' }}
                </span>
                <span class="font-bold font-headline text-sm text-on-surface">
                  {{ budget.category }}
                </span>
              </div>
              <span class="text-xs font-label tabular-nums text-on-surface-variant">
                <span class="font-bold" [class]="spentColorClass(budget)">
                  {{ budget.spent | currency: prefs.currency() : 'symbol' : '1.0-0' }}
                </span>
                /
                {{ budget.limitAmount | currency: prefs.currency() : 'symbol' : '1.0-0' }}
              </span>
            </div>

            <!-- Progress bar -->
            <div
              class="w-full h-2 lg:h-3 bg-surface-container-highest rounded-[var(--radius-progress)] overflow-hidden"
            >
              <div
                class="h-full rounded-[var(--radius-progress)] transition-all"
                [class]="barColorClass(budget)"
                [style.width]="progressWidth(budget)"
              ></div>
            </div>

            <!-- Status label -->
            <p
              class="text-[10px] mt-1.5 lg:mt-2 font-bold uppercase tracking-wider"
              [class]="statusColorClass(budget)"
            >
              {{ statusLabel(budget) }}
            </p>
          </div>
        }

        <!-- Adjust Budgets CTA -->
        <a
          routerLink="/budgets"
          class="block w-full py-3 lg:py-4 bg-surface-container-low text-on-surface font-bold rounded-[var(--radius-xl)] hover:bg-surface-container-high transition-colors text-xs lg:text-sm uppercase tracking-widest text-center"
        >
          {{ t('dashboard.adjustBudgets') }}
        </a>
      </div>
    </ng-container>
  `,
})
export class BudgetSectionComponent {
  private readonly budgetService = inject(BudgetService);
  private readonly transloco = inject(TranslocoService);
  readonly prefs = inject(PreferencesService);

  currentMonthLabel(): string {
    const locale = this.transloco.getActiveLang() === 'es' ? 'es-ES' : 'en-US';
    return new Date().toLocaleString(locale, { month: 'long' });
  }

  readonly budgets = toSignal(this.budgetService.getBudgets(), {
    initialValue: [] as Budget[],
  });

  progressWidth(budget: Budget): string {
    const pct = Math.min((budget.spent / budget.limitAmount) * 100, 100);
    return `${pct}%`;
  }

  iconColorClass(budget: Budget): string {
    const status = budgetStatus(budget);
    if (status === 'exceeded') return 'text-tertiary';
    if (status === 'warning') return 'text-amber-500';
    return 'text-secondary';
  }

  barColorClass(budget: Budget): string {
    const status = budgetStatus(budget);
    if (status === 'exceeded') return 'bg-tertiary';
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-secondary';
  }

  statusColorClass(budget: Budget): string {
    const status = budgetStatus(budget);
    if (status === 'exceeded') return 'text-tertiary';
    if (status === 'warning') return 'text-amber-600';
    return 'text-secondary';
  }

  spentColorClass(budget: Budget): string {
    const status = budgetStatus(budget);
    if (status === 'exceeded') return 'text-tertiary';
    return 'text-on-surface';
  }

  statusLabel(budget: Budget): string {
    const status: BudgetStatus = budgetStatus(budget);
    if (status === 'exceeded') {
      const diff = budget.spent - budget.limitAmount;
      return this.transloco.translate('dashboard.exceededBy', { amount: diff.toFixed(0) });
    }
    if (status === 'warning') {
      return this.transloco.translate('dashboard.nearLimit');
    }
    return this.transloco.translate('dashboard.paidFor', { month: this.currentMonthLabel() });
  }
}
