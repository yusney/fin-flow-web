import { Component } from '@angular/core';

import { HeaderComponent } from '../components/header.component';
import { BalanceCardComponent } from '../components/balance-card.component';
import { SubscriptionCardComponent } from '../components/subscription-card.component';
import { TransactionListComponent } from '../components/transaction-list.component';
import { BudgetSectionComponent } from '../components/budget-section.component';
import { FooterComponent } from '../components/footer.component';

@Component({
  selector: 'app-dashboard-shell',
  imports: [
    HeaderComponent,
    BalanceCardComponent,
    SubscriptionCardComponent,
    TransactionListComponent,
    BudgetSectionComponent,
    FooterComponent,
  ],
  template: `
    <div class="p-4 lg:p-12">
      <!-- Desktop Header -->
      <app-header />

      <!-- Bento grid — Balance + Subscription -->
      <section class="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 mb-8 lg:mb-12">
        <div class="lg:col-span-8">
          <app-balance-card />
        </div>
        <div class="lg:col-span-4">
          <app-subscription-card />
        </div>
      </section>

      <!-- Transactions + Budgets -->
      <div class="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
        <section class="lg:col-span-7">
          <app-transaction-list />
        </section>
        <section class="lg:col-span-5">
          <app-budget-section />
        </section>
      </div>

      <!-- Footer -->
      <app-footer />
    </div>
  `,
})
export class DashboardPageComponent {}
