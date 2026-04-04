import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  TransactionService,
  TransactionFilters,
  CreateTransactionRequest,
} from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { Transaction, Category } from '../../shared/models/transaction.model';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <!-- Header -->
      <header class="bg-surface-container-low border-b border-outline-variant">
        <div class="p-4 lg:p-8">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold font-headline text-on-surface">
                {{ t('transactions.title') }}
              </h1>
              <p class="text-sm text-on-surface-variant mt-1">
                {{ t('transactions.subtitle') }}
              </p>
            </div>

            <!-- Stats Cards -->
            <div class="flex gap-3 lg:gap-4">
              <div
                class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
              >
                <div class="text-xs text-on-surface-variant uppercase tracking-wider">
                  {{ t('transactions.income') }}
                </div>
                <div class="text-lg font-bold text-secondary tabular-nums">
                  +{{ stats().totalIncome | currency: prefs.currency() : 'symbol' : '1.0-0' }}
                </div>
              </div>
              <div
                class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
              >
                <div class="text-xs text-on-surface-variant uppercase tracking-wider">
                  {{ t('transactions.expenses') }}
                </div>
                <div class="text-lg font-bold text-tertiary tabular-nums">
                  -{{ stats().totalExpenses | currency: prefs.currency() : 'symbol' : '1.0-0' }}
                </div>
              </div>
              <div
                class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] hidden sm:block"
              >
                <div class="text-xs text-on-surface-variant uppercase tracking-wider">
                  {{ t('transactions.total') }}
                </div>
                <div class="text-lg font-bold text-on-surface tabular-nums">
                  {{ stats().count }}
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
                >search</span
              >
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                [placeholder]="t('transactions.searchPlaceholder')"
                class="w-full pl-10 pr-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <!-- Type Filter -->
            <select
              [(ngModel)]="selectedType"
              (ngModelChange)="onTypeChange($event)"
              class="px-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">{{ t('transactions.filterAllTypes') }}</option>
              <option value="income">{{ t('transactions.filterIncome') }}</option>
              <option value="expense">{{ t('transactions.filterExpense') }}</option>
            </select>

            <!-- Category Filter -->
            <select
              [(ngModel)]="selectedCategoryId"
              (ngModelChange)="onCategoryChange($event)"
              class="px-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">{{ t('transactions.filterAllCategories') }}</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Date Range -->
          <div class="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-outline-variant">
            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
              <span class="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>{{ t('transactions.dateRange') }}</span>
            </div>
            <input
              type="date"
              [(ngModel)]="dateFrom"
              (ngModelChange)="onDateFromChange($event)"
              class="px-3 py-2 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span class="text-on-surface-variant self-center">{{
              t('transactions.dateSeparator')
            }}</span>
            <input
              type="date"
              [(ngModel)]="dateTo"
              (ngModelChange)="onDateToChange($event)"
              class="px-3 py-2 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            @if (hasActiveFilters()) {
              <button
                (click)="clearFilters()"
                class="ml-auto flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <span class="material-symbols-outlined text-[16px]">close</span>
                {{ t('common.clearFilters') }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Transactions List -->
      <div class="p-4 lg:p-8">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm text-on-surface-variant">
            {{ t('transactions.resultsFound', { count: filteredCount() }) }}
          </span>
          <button
            (click)="openCreateModal()"
            class="hidden lg:flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-full font-semibold transition-all shadow-lg shadow-primary/10"
          >
            <span class="material-symbols-outlined text-[20px]">add</span>
            {{ t('transactions.addTransaction') }}
          </button>
        </div>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div
              class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
        }

        @if (!isLoading() && filteredTransactions().length === 0) {
          <div class="bg-surface-container-low rounded-[var(--radius-card)] p-12 text-center">
            <span class="material-symbols-outlined text-[48px] text-outline mb-4"
              >receipt_long</span
            >
            <h3 class="text-lg font-bold font-headline text-on-surface mb-2">
              {{ t('transactions.emptyTitle') }}
            </h3>
            <p class="text-sm text-on-surface-variant mb-4">
              {{ t('transactions.emptySubtitle') }}
            </p>
            <button (click)="clearFilters()" class="text-primary font-semibold hover:underline">
              {{ t('common.clearFilters') }}
            </button>
          </div>
        }

        <div class="space-y-3">
          @for (transaction of filteredTransactions(); track transaction.id; let i = $index) {
            <div
              [class]="
                i % 2 === 0
                  ? 'bg-surface-container-lowest p-4 lg:p-5 rounded-[var(--radius-card)] flex items-center justify-between transition-all hover:shadow-[var(--shadow-elevated)] cursor-pointer group'
                  : 'bg-surface-container-low p-4 lg:p-5 rounded-[var(--radius-card)] flex items-center justify-between transition-all hover:shadow-[var(--shadow-elevated)] cursor-pointer group'
              "
            >
              <div
                class="flex items-center gap-x-3 lg:gap-x-4 min-w-0 flex-1"
                (click)="openEditModal(transaction)"
              >
                <div
                  [class]="iconBgClass(transaction)"
                  class="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0"
                >
                  <span class="material-symbols-outlined text-[18px] lg:text-[24px]">{{
                    transaction.icon ?? 'payments'
                  }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div
                    class="font-bold font-headline text-on-surface text-sm lg:text-base truncate"
                  >
                    {{ transaction.description }}
                  </div>
                  <div class="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span>{{ transaction.date | date: prefs.angularDateFormat() }}</span>
                    <span class="w-1 h-1 rounded-full bg-outline"></span>
                    <span class="truncate">{{ transaction.category }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-x-4 shrink-0">
                <div
                  [class]="
                    transaction.type === 'income'
                      ? 'text-secondary font-bold font-label tabular-nums text-sm lg:text-base'
                      : 'text-on-surface font-bold font-label tabular-nums text-sm lg:text-base'
                  "
                  (click)="openEditModal(transaction)"
                >
                  {{ transaction.type === 'income' ? '+' : '-' }}
                  {{ transaction.amount | currency: prefs.currency() : 'symbol' : '1.2-2' }}
                </div>
                <div class="flex items-center gap-1">
                  <button
                    (click)="openEditModal(transaction); $event.stopPropagation()"
                    class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                    [title]="t('common.edit')"
                  >
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    (click)="confirmDelete(transaction); $event.stopPropagation()"
                    class="p-2 text-on-surface-variant hover:text-tertiary hover:bg-tertiary/5 rounded-full transition-colors"
                    [title]="t('common.delete')"
                  >
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Mobile FAB -->
      <button
        (click)="openCreateModal()"
        class="lg:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center shadow-[var(--shadow-elevated)] shadow-primary/30 z-40"
        [attr.aria-label]="t('transactions.addTransaction')"
      >
        <span class="material-symbols-outlined text-[24px]">add</span>
      </button>

      <!-- Create/Edit Modal -->
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
              <h2 class="text-xl font-bold font-headline text-on-surface">
                {{
                  modalMode() === 'create'
                    ? t('transactions.modalTitleCreate')
                    : t('transactions.modalTitleEdit')
                }}
              </h2>
              <button
                (click)="closeModal()"
                class="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="saveTransaction()" class="p-6 space-y-4">
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                  >{{ t('transactions.fieldDescription') }}</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.description"
                  name="description"
                  required
                  [placeholder]="t('transactions.placeholderDescription')"
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                  >{{ t('transactions.fieldAmount') }}</label
                >
                <div class="relative">
                  <input
                    type="number"
                    [(ngModel)]="formData.amount"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                  >{{ t('transactions.fieldType') }}</label
                >
                <div class="flex gap-3">
                  <label
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-input)] cursor-pointer transition-all border-2"
                    [class.border-secondary]="formData.type === 'income'"
                    [class.bg-secondary-container/10]="formData.type === 'income'"
                    [class.border-outline-variant]="formData.type !== 'income'"
                    [class.bg-surface-container-low]="formData.type !== 'income'"
                  >
                    <input
                      type="radio"
                      [(ngModel)]="formData.type"
                      name="type"
                      value="income"
                      class="hidden"
                      (ngModelChange)="onFormTypeChange()"
                    />
                    <span class="material-symbols-outlined text-secondary">trending_up</span>
                    <span class="font-medium" [class.text-secondary]="formData.type === 'income'">{{
                      t('transactions.typeIncome')
                    }}</span>
                  </label>
                  <label
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-input)] cursor-pointer transition-all border-2"
                    [class.border-tertiary]="formData.type === 'expense'"
                    [class.bg-tertiary-container/10]="formData.type === 'expense'"
                    [class.border-outline-variant]="formData.type !== 'expense'"
                    [class.bg-surface-container-low]="formData.type !== 'expense'"
                  >
                    <input
                      type="radio"
                      [(ngModel)]="formData.type"
                      name="type"
                      value="expense"
                      class="hidden"
                      (ngModelChange)="onFormTypeChange()"
                    />
                    <span class="material-symbols-outlined text-tertiary">trending_down</span>
                    <span class="font-medium" [class.text-tertiary]="formData.type === 'expense'">{{
                      t('transactions.typeExpense')
                    }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                  >{{ t('transactions.fieldCategory') }}</label
                >
                <select
                  [(ngModel)]="formData.categoryId"
                  name="categoryId"
                  required
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">{{ t('transactions.selectCategory') }}</option>
                  @for (cat of filteredFormCategories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                  >{{ t('transactions.fieldDate') }}</label
                >
                <input
                  type="date"
                  [(ngModel)]="formData.date"
                  name="date"
                  required
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              @if (formError()) {
                <div class="flex items-center gap-2 text-tertiary text-sm">
                  <span class="material-symbols-outlined text-[18px]">error</span>
                  {{ formError() }}
                </div>
              }

              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="flex-1 px-4 py-3 bg-surface-container-low text-on-surface font-semibold rounded-[var(--radius-button)] hover:bg-surface-container-high transition-all"
                >
                  {{ t('common.cancel') }}
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
                  {{ modalMode() === 'create' ? t('common.add') : t('common.save') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteModalOpen()) {
        <div
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          (click)="closeDeleteModal()"
        >
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] w-full max-w-sm p-6 shadow-[var(--shadow-elevated)]"
            (click)="$event.stopPropagation()"
          >
            <div class="text-center">
              <div
                class="w-12 h-12 bg-tertiary-container/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="material-symbols-outlined text-tertiary text-[24px]"
                  >delete_forever</span
                >
              </div>
              <h3 class="text-lg font-bold font-headline text-on-surface mb-2">
                {{ t('transactions.deleteTitle') }}
              </h3>
              <p class="text-sm text-on-surface-variant mb-6">
                {{ t('transactions.deleteConfirm', { name: transactionToDelete()?.description }) }}
              </p>
              <div class="flex gap-3">
                <button
                  (click)="closeDeleteModal()"
                  class="flex-1 px-4 py-3 bg-surface-container-low text-on-surface font-semibold rounded-[var(--radius-button)] hover:bg-surface-container-high transition-all"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  (click)="executeDelete()"
                  [disabled]="isDeleting()"
                  class="flex-1 px-4 py-3 bg-tertiary text-on-tertiary font-semibold rounded-[var(--radius-button)] hover:bg-tertiary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  @if (isDeleting()) {
                    <div
                      class="w-4 h-4 border-2 border-on-tertiary border-t-transparent rounded-full animate-spin"
                    ></div>
                  }
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Toast -->
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
    </ng-container>
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
export class TransactionsComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly transloco = inject(TranslocoService);
  readonly prefs = inject(PreferencesService);

  // Filters state
  readonly searchQuery = signal('');
  readonly selectedType = signal<'income' | 'expense' | 'all'>('all');
  readonly selectedCategoryId = signal<string>('all');
  readonly dateFrom = signal<string>(
    (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    })(),
  );
  readonly dateTo = signal<string>(
    (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    })(),
  );
  readonly isLoading = signal(false);

  // Modal state
  readonly isModalOpen = signal(false);
  readonly modalMode = signal<ModalMode>('create');
  readonly editingTransaction = signal<Transaction | null>(null);
  readonly isSaving = signal(false);
  readonly formError = signal<string>('');

  // Delete modal state
  readonly deleteModalOpen = signal(false);
  readonly transactionToDelete = signal<Transaction | null>(null);
  readonly isDeleting = signal(false);

  // Toast state
  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form data
  formData = {
    description: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
  };

  constructor() {
    this.loadData();
  }

  // Reactive signal for the form type — drives category filter
  readonly formType = signal<'income' | 'expense'>('expense');

  // All categories from API
  readonly categories = toSignal(this.categoryService.getCategories(), {
    initialValue: [] as Category[],
  });

  // Categories filtered by selected type in the form
  readonly filteredFormCategories = computed(() =>
    this.categories().filter((c) => c.type === this.formType()),
  );

  readonly filters = computed<TransactionFilters>(() => ({
    search: this.searchQuery() || undefined,
    type: this.selectedType(),
    categoryId: this.selectedCategoryId(),
    dateFrom: this.dateFrom() || undefined,
    dateTo: this.dateTo() || undefined,
  }));

  readonly transactions = signal<Transaction[]>([]);

  readonly stats = signal({ totalIncome: 0, totalExpenses: 0, count: 0 });

  readonly filteredTransactions = computed(() => {
    const filters = this.filters();
    let result = [...this.transactions()];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
      );
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter((t) => t.type === filters.type);
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      result = result.filter((t) => t.categoryId === filters.categoryId);
    }

    if (filters.dateFrom) result = result.filter((t) => t.date >= filters.dateFrom!);
    if (filters.dateTo) result = result.filter((t) => t.date <= filters.dateTo!);

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly filteredCount = computed(() => this.filteredTransactions().length);

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery() !== '' ||
      this.selectedType() !== 'all' ||
      this.selectedCategoryId() !== 'all' ||
      this.dateFrom() !== '' ||
      this.dateTo() !== '',
  );

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }
  onTypeChange(value: string): void {
    this.selectedType.set(value as 'income' | 'expense' | 'all');
  }
  onCategoryChange(value: string): void {
    this.selectedCategoryId.set(value);
  }
  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
  }
  onDateToChange(value: string): void {
    this.dateTo.set(value);
  }

  onFormTypeChange(): void {
    // Sync signal so filteredFormCategories recomputes
    this.formType.set(this.formData.type);
    // Reset category when type changes — avoid sending wrong categoryId
    this.formData.categoryId = '';
  }

  clearFilters(): void {
    const now = new Date();
    this.searchQuery.set('');
    this.selectedType.set('all');
    this.selectedCategoryId.set('all');
    this.dateFrom.set(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    this.dateTo.set(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editingTransaction.set(null);
    this.formData = {
      description: '',
      amount: 0,
      type: 'expense',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
    };
    this.formType.set('expense');
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  openEditModal(transaction: Transaction): void {
    this.modalMode.set('edit');
    this.editingTransaction.set(transaction);
    this.formData = {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId ?? '',
      date: transaction.date,
    };
    this.formType.set(transaction.type);
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.formError.set('');
  }

  validateForm(): boolean {
    const t = (k: string) => this.transloco.translate(k);
    if (!this.formData.description.trim()) {
      this.formError.set(t('transactions.errorDescription'));
      return false;
    }
    if (this.formData.amount <= 0) {
      this.formError.set(t('transactions.errorAmount'));
      return false;
    }
    if (!this.formData.categoryId) {
      this.formError.set(t('transactions.errorCategory'));
      return false;
    }
    if (!this.formData.date) {
      this.formError.set(t('transactions.errorDate'));
      return false;
    }
    return true;
  }

  saveTransaction(): void {
    if (!this.validateForm()) return;

    this.isSaving.set(true);

    const request: CreateTransactionRequest = {
      description: this.formData.description.trim(),
      amount: Number(this.formData.amount),
      categoryId: this.formData.categoryId,
      date: this.formData.date,
    };

    if (this.modalMode() === 'create') {
      this.transactionService.createTransaction(request).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadData();
          this.showToast(this.transloco.translate('transactions.toastCreated'), 'success');
        },
        error: (error) => {
          this.isSaving.set(false);
          this.formError.set(
            error.error?.message || this.transloco.translate('transactions.toastCreateError'),
          );
        },
      });
    } else {
      const transaction = this.editingTransaction();
      if (transaction) {
        this.transactionService.updateTransaction({ ...request, id: transaction.id }).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.closeModal();
            this.loadData();
            this.showToast(this.transloco.translate('transactions.toastUpdated'), 'success');
          },
          error: (error) => {
            this.isSaving.set(false);
            this.formError.set(
              error.error?.message || this.transloco.translate('transactions.toastUpdateError'),
            );
          },
        });
      }
    }
  }

  confirmDelete(transaction: Transaction): void {
    this.transactionToDelete.set(transaction);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.transactionToDelete.set(null);
  }

  executeDelete(): void {
    const transaction = this.transactionToDelete();
    if (!transaction) return;

    this.isDeleting.set(true);
    this.transactionService.deleteTransaction(transaction.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadData();
        this.showToast(this.transloco.translate('transactions.toastDeleted'), 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.showToast(
          error.error?.message || this.transloco.translate('transactions.toastDeleteError'),
          'error',
        );
      },
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.transactionService.getTransactions().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.isLoading.set(false);
        this.transactionService.getStats().subscribe({
          next: (s) => this.stats.set(s),
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.showToast(this.transloco.translate('transactions.toastLoadError'), 'error');
      },
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  iconBgClass(transaction: Transaction): string {
    if (transaction.type === 'income') return 'bg-secondary-container/20 text-secondary';
    if (transaction.category?.toLowerCase().includes('entertain'))
      return 'bg-primary-container/20 text-primary';
    return 'bg-surface-container-high text-on-surface-variant';
  }
}
