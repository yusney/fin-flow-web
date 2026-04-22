import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BudgetService, CreateBudgetRequest } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { Budget, budgetStatus } from '../../shared/models/budget.model';
import { Category } from '../../shared/models/transaction.model';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Header -->
    <header class="bg-surface-container-low border-b border-outline-variant">
      <div class="p-4 lg:p-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold font-headline text-on-surface">Budgets</h1>
            <p class="text-sm text-on-surface-variant mt-1">
              Manage your spending limits by category
            </p>
          </div>

          <!-- Summary Cards -->
          <div class="flex gap-3 lg:gap-4">
            <div
              class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
            >
              <div class="text-xs text-on-surface-variant uppercase tracking-wider">
                Total Budget
              </div>
              <div class="text-lg font-bold text-on-surface tabular-nums">
                {{ summary().totalLimit | currency: prefs.currency() : 'symbol' : '1.0-0' }}
              </div>
            </div>
            <div
              class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
            >
              <div class="text-xs text-on-surface-variant uppercase tracking-wider">Spent</div>
              <div class="text-lg font-bold text-tertiary tabular-nums">
                {{ summary().totalSpent | currency: prefs.currency() : 'symbol' : '1.0-0' }}
              </div>
            </div>
            <div
              class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
            >
              <div class="text-xs text-on-surface-variant uppercase tracking-wider">Remaining</div>
              <div
                class="text-lg font-bold tabular-nums"
                [class.text-secondary]="summary().remaining >= 0"
                [class.text-tertiary]="summary().remaining < 0"
              >
                {{ summary().remaining | currency: prefs.currency() : 'symbol' : '1.0-0' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Filters -->
    <div class="p-4 lg:p-8 pb-0">
      <div
        class="bg-surface-container-low rounded-[var(--radius-card)] p-4 lg:p-6 shadow-[var(--shadow-card)]"
      >
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Search -->
          <div class="relative flex-1">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]"
            >
              search
            </span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search budgets..."
              class="w-full pl-10 pr-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <!-- Status Filter -->
          <select
            [(ngModel)]="selectedStatus"
            (ngModelChange)="onStatusChange($event)"
            class="px-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="ok">On Track</option>
            <option value="warning">Warning</option>
            <option value="exceeded">Exceeded</option>
          </select>
        </div>

        @if (hasActiveFilters()) {
          <div class="mt-4 pt-4 border-t border-outline-variant flex justify-end">
            <button
              (click)="clearFilters()"
              class="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <span class="material-symbols-outlined text-[16px]">close</span>
              Clear filters
            </button>
          </div>
        }
      </div>
    </div>

    <!-- Budgets List -->
    <div class="p-4 lg:p-8">
      <!-- Results count + Add button -->
      <div class="flex justify-between items-center mb-4">
        <span class="text-sm text-on-surface-variant">
          {{ filteredCount() }} budget{{ filteredCount() === 1 ? '' : 's' }} found
        </span>

        <button
          (click)="openCreateModal()"
          class="hidden lg:flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-full font-semibold transition-all shadow-lg shadow-primary/10"
        >
          <span class="material-symbols-outlined text-[20px]">add</span>
          Set Budget
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center py-12">
          <div
            class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
          ></div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && filteredBudgets().length === 0) {
        <div class="bg-surface-container-low rounded-[var(--radius-card)] p-12 text-center">
          <span class="material-symbols-outlined text-[48px] text-outline mb-4"
            >account_balance_wallet</span
          >
          <h3 class="text-lg font-bold font-headline text-on-surface mb-2">No budgets found</h3>
          <p class="text-sm text-on-surface-variant mb-4">
            Try adjusting your filters or set a new budget.
          </p>
          <button (click)="clearFilters()" class="text-primary font-semibold hover:underline">
            Clear filters
          </button>
        </div>
      }

      <!-- Budget Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        @for (budget of filteredBudgets(); track budget.id) {
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-5 lg:p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all"
          >
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center"
                  [class]="iconBgClass(budget)"
                >
                  <span class="material-symbols-outlined text-[24px]">
                    {{ budget.icon ?? 'account_balance_wallet' }}
                  </span>
                </div>
                <div>
                  <h3 class="font-bold font-headline text-on-surface text-base lg:text-lg">
                    {{ budget.category }}
                  </h3>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    [class]="statusBadgeClass(budget)"
                  >
                    {{ getStatusLabel(budget) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Amounts -->
            <div class="flex justify-between items-end mb-3">
              <div>
                <div class="text-xs text-on-surface-variant mb-1">Spent</div>
                <div
                  class="text-xl font-bold font-label tabular-nums"
                  [class]="spentTextClass(budget)"
                >
                  {{ budget.spent | currency: prefs.currency() : 'symbol' : '1.0-0' }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-on-surface-variant mb-1">Limit</div>
                <div class="text-lg font-semibold text-on-surface-variant tabular-nums">
                  {{ budget.limitAmount | currency: prefs.currency() : 'symbol' : '1.0-0' }}
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="relative h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                [class]="progressBarClass(budget)"
                [style.width.%]="getProgressPercentage(budget)"
              ></div>
            </div>

            <!-- Footer -->
            <div class="flex justify-between items-center mt-3 text-xs">
              <span class="text-on-surface-variant">
                {{ getProgressPercentage(budget) | number: '1.0-0' }}% used
              </span>
              <span
                class="font-medium"
                [class.text-secondary]="getRemaining(budget) >= 0"
                [class.text-tertiary]="getRemaining(budget) < 0"
              >
                {{ getRemaining(budget) >= 0 ? '+' : ''
                }}{{ getRemaining(budget) | currency: prefs.currency() : 'symbol' : '1.0-0' }}
                remaining
              </span>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Mobile FAB -->
    <button
      (click)="openCreateModal()"
      class="lg:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center shadow-[var(--shadow-elevated)] shadow-primary/30 z-40"
      aria-label="Set Budget"
    >
      <span class="material-symbols-outlined text-[24px]">add</span>
    </button>

    <!-- Create Modal -->
    @if (isModalOpen()) {
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        (click)="closeModal()"
      >
        <div
          class="bg-surface-container-lowest rounded-[var(--radius-card)] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between p-6 border-b border-outline-variant">
            <h2 class="text-xl font-bold font-headline text-on-surface">Set Budget</h2>
            <button
              (click)="closeModal()"
              class="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <form (ngSubmit)="saveBudget()" class="p-6 space-y-4">
            <!-- Category — shows name, sends UUID -->
            <div>
              <label
                class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
              >
                Category *
              </label>
              <select
                [(ngModel)]="formData.categoryId"
                name="categoryId"
                required
                class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">Select a category</option>
                @for (cat of expenseCategories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>

            <!-- Limit Amount -->
            <div>
              <label
                class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
              >
                Budget Limit *
              </label>
              <div class="relative">
                <input
                  type="number"
                  [(ngModel)]="formData.limitAmount"
                  name="limitAmount"
                  required
                  min="1"
                  step="1"
                  placeholder="0.00"
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <!-- Month / Year -->
            <div class="flex gap-4">
              <div class="flex-1">
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  Month
                </label>
                <select
                  [(ngModel)]="formData.month"
                  name="month"
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  @for (m of months; track m.value) {
                    <option [value]="m.value">{{ m.label }}</option>
                  }
                </select>
              </div>
              <div class="w-28">
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  Year
                </label>
                <input
                  type="number"
                  [(ngModel)]="formData.year"
                  name="year"
                  min="2020"
                  max="2030"
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <!-- Error Message -->
            @if (formError()) {
              <div class="flex items-center gap-2 text-tertiary text-sm">
                <span class="material-symbols-outlined text-[18px]">error</span>
                {{ formError() }}
              </div>
            }

            <!-- Actions -->
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                (click)="closeModal()"
                class="flex-1 px-4 py-3 bg-surface-container-low text-on-surface font-semibold rounded-[var(--radius-button)] hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSaving()"
                class="flex-1 px-4 py-3 bg-primary text-on-primary font-semibold rounded-[var(--radius-button)] hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                @if (isSaving()) {
                  <div
                    class="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"
                  ></div>
                }
                Set Budget
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Toast Notification -->
    @if (toast()) {
      <div
        class="fixed bottom-4 left-1/2 -translate-x-1/2 lg:bottom-8 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-[var(--shadow-elevated)] animate-fade-in"
        [class.bg-inverse-surface]="toast()?.type === 'success'"
        [class.bg-tertiary]="toast()?.type === 'error'"
      >
        <span class="material-symbols-outlined text-on-inverse-surface">
          {{ toast()?.type === 'success' ? 'check_circle' : 'error' }}
        </span>
        <span class="text-sm font-medium text-on-inverse-surface">{{ toast()?.message }}</span>
      </div>
    }
  `,
  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translate(-50%, 10px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      .animate-fade-in {
        animation: fade-in 200ms ease-out forwards;
      }
    `,
  ],
})
export class BudgetsComponent implements OnInit {
  private readonly budgetService = inject(BudgetService);
  private readonly categoryService = inject(CategoryService);
  readonly prefs = inject(PreferencesService);

  // Filters state
  readonly searchQuery = signal('');
  readonly selectedStatus = signal<'ok' | 'warning' | 'exceeded' | 'all'>('all');
  readonly isLoading = signal(false);

  // Modal state
  readonly isModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly formError = signal<string>('');

  // Toast state
  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form data
  formData = {
    categoryId: '',
    limitAmount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  };

  readonly months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Data signals
  readonly budgets = signal<Budget[]>([]);
  readonly allCategories = signal<Category[]>([]);

  // Only expense categories for budget creation
  readonly expenseCategories = computed(() =>
    this.allCategories().filter((c) => c.type === 'expense'),
  );

  readonly summary = computed(() => {
    const budgets = this.budgets();
    const totalLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    return { totalLimit, totalSpent, remaining: totalLimit - totalSpent };
  });

  readonly filteredBudgets = computed(() => {
    let result = [...this.budgets()];

    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      result = result.filter((b) => b.category.toLowerCase().includes(q));
    }

    if (this.selectedStatus() !== 'all') {
      result = result.filter((b) => budgetStatus(b) === this.selectedStatus());
    }

    return result.sort((a, b) => b.spent / b.limitAmount - a.spent / a.limitAmount);
  });

  readonly filteredCount = computed(() => this.filteredBudgets().length);

  readonly hasActiveFilters = computed(
    () => this.searchQuery() !== '' || this.selectedStatus() !== 'all',
  );

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }
  onStatusChange(value: string): void {
    this.selectedStatus.set(value as 'ok' | 'warning' | 'exceeded' | 'all');
  }
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
  }

  openCreateModal(): void {
    this.formData = {
      categoryId: '',
      limitAmount: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    };
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.formError.set('');
  }

  saveBudget(): void {
    if (!this.formData.categoryId) {
      this.formError.set('Category is required');
      return;
    }
    if (this.formData.limitAmount <= 0) {
      this.formError.set('Limit must be greater than 0');
      return;
    }

    this.isSaving.set(true);

    const request: CreateBudgetRequest = {
      categoryId: this.formData.categoryId,
      limitAmount: this.formData.limitAmount,
      month: this.formData.month,
      year: this.formData.year,
    };

    this.budgetService.createBudget(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.refreshData();
        this.showToast('Budget set successfully', 'success');
      },
      error: (error) => {
        this.isSaving.set(false);
        this.formError.set(error.error?.message || 'Failed to set budget');
      },
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.categoryService.getCategories().subscribe({
      next: (cats) => this.allCategories.set(cats),
      error: () => {},
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.budgetService.getBudgets().subscribe({
      next: (data) => {
        this.budgets.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private refreshData(): void {
    this.loadData();
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  // Style helpers
  getProgressPercentage(b: Budget): number {
    if (b.limitAmount === 0) return 0;
    return Math.min((b.spent / b.limitAmount) * 100, 100);
  }

  getRemaining(b: Budget): number {
    return b.limitAmount - b.spent;
  }

  getStatusLabel(b: Budget): string {
    const s = budgetStatus(b);
    return s === 'ok' ? 'On Track' : s === 'warning' ? 'Warning' : 'Exceeded';
  }

  iconBgClass(b: Budget): string {
    const s = budgetStatus(b);
    if (s === 'exceeded') return 'bg-tertiary-container/20 text-tertiary';
    if (s === 'warning') return 'bg-primary-container/20 text-primary';
    return 'bg-secondary-container/20 text-secondary';
  }

  statusBadgeClass(b: Budget): string {
    const s = budgetStatus(b);
    if (s === 'exceeded') return 'bg-tertiary-container/20 text-tertiary';
    if (s === 'warning') return 'bg-primary-container/20 text-primary';
    return 'bg-secondary-container/20 text-secondary';
  }

  spentTextClass(b: Budget): string {
    const s = budgetStatus(b);
    if (s === 'exceeded') return 'text-tertiary';
    if (s === 'warning') return 'text-primary';
    return 'text-on-surface';
  }

  progressBarClass(b: Budget): string {
    const s = budgetStatus(b);
    if (s === 'exceeded') return 'bg-tertiary';
    if (s === 'warning') return 'bg-primary';
    return 'bg-secondary';
  }
}
