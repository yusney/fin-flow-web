import { Component, inject, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-balance-card',
  imports: [CurrencyPipe, RouterLink, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div
        class="bg-surface-container-lowest p-5 lg:p-8 rounded-[var(--radius-card)] flex flex-col justify-between min-h-[200px] lg:min-h-[240px] shadow-[var(--shadow-card)]"
      >
        <!-- Balance amount -->
        <div>
          <span
            class="text-xs lg:text-sm font-semibold text-on-surface-variant uppercase tracking-wider"
          >
            {{ t('dashboard.balance', { month: currentMonthLabel() }) }}
          </span>
          <div
            class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-headline mt-1 lg:mt-2 tabular-nums tracking-tighter text-on-surface"
          >
            {{ totalBalance() | currency: 'USD' : 'symbol' : '1.2-2' }}
          </div>
        </div>

        <!-- Income / Expenses / CTA -->
        <div
          class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-x-6 lg:gap-x-8 mt-6 lg:mt-8"
        >
          <!-- Income & Expenses row on mobile -->
          <div class="flex items-center gap-x-6 sm:gap-x-6 lg:gap-x-8">
            <!-- Income -->
            <div class="flex flex-col">
              <span class="text-xs text-on-surface-variant mb-0.5 lg:mb-1">{{ t('dashboard.monthlyIncome') }}</span>
              <span class="text-secondary text-lg lg:text-xl font-bold font-headline tabular-nums">
                +{{ monthlyIncome() | currency: 'USD' : 'symbol' : '1.0-0' }}
              </span>
            </div>

            <!-- Expenses -->
            <div class="flex flex-col">
              <span class="text-xs text-on-surface-variant mb-0.5 lg:mb-1">{{ t('dashboard.monthlyExpenses') }}</span>
              <span class="text-tertiary text-lg lg:text-xl font-bold font-headline tabular-nums">
                -{{ monthlyExpenses() | currency: 'USD' : 'symbol' : '1.0-0' }}
              </span>
            </div>
          </div>

          <!-- Add Transaction CTA -->
          <div class="sm:ml-auto flex gap-x-2 mt-2 sm:mt-0">
            <a
              routerLink="/transactions"
              class="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary px-4 lg:px-6 py-2.5 lg:py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-x-2 shadow-lg shadow-primary/10 text-sm lg:text-base"
            >
              <span class="material-symbols-outlined text-[18px] lg:text-[20px]"> add_circle </span>
              <span class="hidden sm:inline">{{ t('dashboard.addTransaction') }}</span>
              <span class="sm:hidden">{{ t('common.add') }}</span>
            </a>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class BalanceCardComponent {
  private readonly txService = inject(TransactionService);
  private readonly transloco = inject(TranslocoService);

  private readonly now = new Date();
  private readonly monthFrom = new Date(this.now.getFullYear(), this.now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  private readonly monthTo = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  currentMonthLabel(): string {
    const locale = this.transloco.getActiveLang() === 'es' ? 'es-ES' : 'en-US';
    return new Date().toLocaleString(locale, { month: 'long' });
  }

  private readonly allTransactions = toSignal(this.txService.getTransactions(), {
    initialValue: [],
  });

  readonly totalBalance = computed(() => this.monthlyIncome() - this.monthlyExpenses());

  readonly monthlyIncome = computed(() =>
    this.allTransactions()
      .filter((t) => t.type === 'income' && t.date >= this.monthFrom && t.date <= this.monthTo)
      .reduce((sum, t) => sum + t.amount, 0),
  );

  readonly monthlyExpenses = computed(() =>
    this.allTransactions()
      .filter((t) => t.type === 'expense' && t.date >= this.monthFrom && t.date <= this.monthTo)
      .reduce((sum, t) => sum + t.amount, 0),
  );
}
