import { Component, inject, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction } from '../../../shared/models/transaction.model';
import { PreferencesService } from '../../../core/services/preferences.service';

@Component({
  selector: 'app-transaction-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div class="flex justify-between items-end mb-4 lg:mb-6">
        <h2 class="text-lg lg:text-2xl font-bold font-headline text-on-surface">
          {{ t('dashboard.recentTransactions') }}
        </h2>
        <a
          routerLink="/transactions"
          class="text-xs lg:text-sm font-semibold text-primary hover:underline"
        >
          <span class="hidden sm:inline">{{ t('dashboard.viewAllLedger') }}</span>
          <span class="sm:hidden">{{ t('dashboard.viewAll') }}</span>
        </a>
      </div>

      <div class="space-y-3 lg:space-y-4">
        @for (tx of transactions(); track tx.id; let i = $index) {
          <div
            [class]="
              i % 2 === 0
                ? 'bg-surface-container-lowest p-3 lg:p-5 rounded-[var(--radius-card)] flex items-center justify-between transition-transform hover:scale-[1.01] cursor-pointer'
                : 'bg-surface-container-low p-3 lg:p-5 rounded-[var(--radius-card)] flex items-center justify-between transition-transform hover:scale-[1.01] cursor-pointer'
            "
          >
            <!-- Icon + Info -->
            <div class="flex items-center gap-x-3 lg:gap-x-4 min-w-0 flex-1">
              <div
                [class]="iconBgClass(tx)"
                class="w-9 h-9 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0"
              >
                <span class="material-symbols-outlined text-[18px] lg:text-[24px]">
                  {{ tx.icon ?? 'payments' }}
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold font-headline text-on-surface text-sm lg:text-base truncate">
                  {{ tx.description }}
                </div>
                <div class="text-xs text-on-surface-variant truncate">
                  <span class="hidden sm:inline"
                    >{{ tx.date | date: prefs.angularDateFormat() }} •
                  </span>
                  <span class="sm:hidden">{{ tx.date | date: prefs.angularDateFormat() }} • </span>
                  {{ tx.category }}
                </div>
              </div>
            </div>

            <!-- Amount -->
            <div
              [class]="
                tx.type === 'income'
                  ? 'text-secondary font-bold font-label tabular-nums text-sm lg:text-base shrink-0 ml-2'
                  : 'text-on-surface font-bold font-label tabular-nums text-sm lg:text-base shrink-0 ml-2'
              "
            >
              {{ tx.type === 'income' ? '+' : '-'
              }}{{ tx.amount | currency: prefs.currency() : 'symbol' : '1.2-2' }}
            </div>
          </div>
        }
      </div>
    </ng-container>
  `,
})
export class TransactionListComponent {
  private readonly txService = inject(TransactionService);
  readonly prefs = inject(PreferencesService);

  private readonly now = new Date();
  private readonly monthFrom = new Date(this.now.getFullYear(), this.now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  private readonly monthTo = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  private readonly allTransactions = toSignal(this.txService.getTransactions(), {
    initialValue: [] as Transaction[],
  });

  readonly transactions = computed(() =>
    this.allTransactions()
      .filter((t) => t.date >= this.monthFrom && t.date <= this.monthTo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  );

  iconBgClass(tx: Transaction): string {
    if (tx.type === 'income') {
      return 'bg-secondary-container/20 text-secondary';
    }
    if (tx.category.toLowerCase().includes('entertain')) {
      return 'bg-primary-container/20 text-primary';
    }
    return 'bg-tertiary-container/20 text-tertiary';
  }
}
