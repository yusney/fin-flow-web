import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import {
  SubscriptionService,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '../../core/services/subscription.service';
import { CategoryService } from '../../core/services/category.service';
import {
  Subscription,
  SubscriptionFrequency,
  SubscriptionType,
  getMonthlyCost,
  getYearlyCost,
  getDaysUntilBilling,
} from '../../shared/models/subscription.model';
import { Category } from '../../shared/models/transaction.model';

@Component({
  selector: 'app-subscriptions',
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
                {{ t('subscriptions.title') }}
              </h1>
              <p class="text-sm text-on-surface-variant mt-1">
                {{ t('subscriptions.subtitle') }}
              </p>
            </div>

            <!-- Summary Cards -->
            <div class="flex gap-3 lg:gap-4 flex-wrap">
              <div
                class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
              >
                <div class="text-xs text-on-surface-variant uppercase tracking-wider">
                  {{ t('subscriptions.monthly') }}
                </div>
                <div class="text-lg font-bold text-on-surface tabular-nums">
                  {{ summary().totalMonthly | currency: 'USD' : 'symbol' : '1.0-0' }}
                </div>
              </div>
              <div
                class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
              >
                <div class="text-xs text-on-surface-variant uppercase tracking-wider">
                  {{ t('subscriptions.yearly') }}
                </div>
                <div class="text-lg font-bold text-tertiary tabular-nums">
                  {{ summary().totalYearly | currency: 'USD' : 'symbol' : '1.0-0' }}
                </div>
              </div>
              <div
                class="bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
              >
                <div class="text-xs text-on-surface-variant uppercase tracking-wider">
                  {{ t('subscriptions.active') }}
                </div>
                <div class="text-lg font-bold text-secondary tabular-nums">
                  {{ summary().activeCount }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Upcoming Payments Alert -->
      @if (upcomingPayments().length > 0) {
        <div class="px-4 lg:px-8 pt-4">
          <div
            class="bg-primary-container/20 border border-primary/20 rounded-[var(--radius-card)] p-4"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-primary">notifications</span>
              <span class="font-semibold text-primary">{{
                t('subscriptions.upcomingPayments')
              }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              @for (sub of upcomingPayments().slice(0, 3); track sub.id) {
                <span class="text-sm bg-surface-container-lowest px-3 py-1 rounded-full">
                  {{ sub.description }} ({{ getDaysUntilBilling(sub) }}
                  {{ t('subscriptions.days') }})
                </span>
              }
              @if (upcomingPayments().length > 3) {
                <span class="text-sm text-on-surface-variant px-2 py-1">
                  +{{ upcomingPayments().length - 3 }} more
                </span>
              }
            </div>
          </div>
        </div>
      }

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
                [placeholder]="t('subscriptions.searchPlaceholder')"
                class="w-full pl-10 pr-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <!-- Status Filter -->
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onStatusChange($event)"
              class="px-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">{{ t('subscriptions.filterAllStatus') }}</option>
              <option value="active">{{ t('subscriptions.filterActive') }}</option>
              <option value="paused">{{ t('subscriptions.filterPaused') }}</option>
            </select>

            <!-- Frequency Filter -->
            <select
              [(ngModel)]="selectedFrequency"
              (ngModelChange)="onFrequencyChange($event)"
              class="px-4 py-3 bg-surface-container-lowest rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">{{ t('subscriptions.filterAllFrequencies') }}</option>
              <option value="MONTHLY">{{ t('subscriptions.filterMonthly') }}</option>
              <option value="ANNUAL">{{ t('subscriptions.filterAnnual') }}</option>
            </select>
          </div>

          @if (hasActiveFilters()) {
            <div class="mt-4 pt-4 border-t border-outline-variant flex justify-end">
              <button
                (click)="clearFilters()"
                class="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <span class="material-symbols-outlined text-[16px]">close</span>
                {{ t('common.clearFilters') }}
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Subscriptions List -->
      <div class="p-4 lg:p-8">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm text-on-surface-variant">
            {{ t('subscriptions.resultsFound', { count: filteredCount() }) }}
          </span>

          <button
            (click)="openCreateModal()"
            class="hidden lg:flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-full font-semibold transition-all shadow-lg shadow-primary/10"
          >
            <span class="material-symbols-outlined text-[20px]">add</span>
            {{ t('subscriptions.addSubscription') }}
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
        @if (!isLoading() && filteredSubscriptions().length === 0) {
          <div class="bg-surface-container-low rounded-[var(--radius-card)] p-12 text-center">
            <span class="material-symbols-outlined text-[48px] text-outline mb-4">repeat</span>
            <h3 class="text-lg font-bold font-headline text-on-surface mb-2">
              {{ t('subscriptions.emptyTitle') }}
            </h3>
            <p class="text-sm text-on-surface-variant mb-4">
              {{ t('subscriptions.emptySubtitle') }}
            </p>
            <button (click)="clearFilters()" class="text-primary font-semibold hover:underline">
              {{ t('common.clearFilters') }}
            </button>
          </div>
        }

        <!-- Subscription Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          @for (subscription of filteredSubscriptions(); track subscription.id) {
            <div
              class="bg-surface-container-lowest rounded-[var(--radius-card)] p-5 lg:p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all"
              [class.opacity-60]="!subscription.isActive"
            >
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center"
                  >
                    <span class="material-symbols-outlined text-[24px] text-on-surface-variant">
                      {{ subscription.type === 'DIGITAL_SERVICE' ? 'cloud' : 'event_repeat' }}
                    </span>
                  </div>
                  <div>
                    <h3 class="font-bold font-headline text-on-surface text-base lg:text-lg">
                      {{ subscription.description }}
                    </h3>
                    @if (subscription.category) {
                      <p class="text-xs text-on-surface-variant">
                        {{ subscription.category.name }}
                      </p>
                    }
                  </div>
                </div>

                <!-- Status Badge -->
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  [class.bg-secondary-container/20]="subscription.isActive"
                  [class.text-secondary]="subscription.isActive"
                  [class.bg-surface-container-high]="!subscription.isActive"
                  [class.text-on-surface-variant]="!subscription.isActive"
                >
                  {{
                    subscription.isActive ? t('subscriptions.active') : t('subscriptions.paused')
                  }}
                </span>
              </div>

              <!-- Amount & Frequency -->
              <div class="flex justify-between items-center mb-4">
                <div>
                  <div class="text-2xl font-bold font-label tabular-nums text-on-surface">
                    {{ subscription.amount | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </div>
                  <div class="text-xs text-on-surface-variant">
                    {{
                      subscription.frequency === 'ANNUAL'
                        ? t('subscriptions.yearly')
                        : t('subscriptions.monthly')
                    }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-on-surface-variant">
                    {{ getMonthlyCost(subscription) | currency: 'USD' : 'symbol' : '1.0-0'
                    }}{{ t('subscriptions.perMonth') }}
                  </div>
                </div>
              </div>

              <!-- Next Billing Day -->
              <div
                class="flex items-center gap-2 text-sm mb-4 p-3 bg-surface-container-low rounded-[var(--radius-input)]"
              >
                <span class="material-symbols-outlined text-[18px] text-on-surface-variant"
                  >event</span
                >
                <span class="text-on-surface-variant">{{ t('subscriptions.billingDay') }}:</span>
                <span
                  class="font-medium ml-auto"
                  [class.text-tertiary]="getDaysUntilBilling(subscription) <= 3"
                >
                  {{ t('subscriptions.day') }} {{ subscription.billingDay }}
                  @if (subscription.isActive) {
                    <span class="text-xs ml-1"
                      >({{ getDaysUntilBilling(subscription) }} {{ t('subscriptions.days') }})</span
                    >
                  }
                </span>
              </div>

              <!-- Card Actions -->
              <div class="flex items-center gap-1 pt-4 border-t border-outline-variant">
                <!-- Edit -->
                <button
                  (click)="openEditModal(subscription)"
                  class="flex items-center justify-center p-2 rounded-[var(--radius-button)] text-sm font-medium transition-colors bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  [title]="t('common.edit')"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>

                <!-- History -->
                <button
                  (click)="openHistoryModal(subscription)"
                  class="flex items-center justify-center p-2 rounded-[var(--radius-button)] text-sm font-medium transition-colors bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  [title]="t('subscriptions.historyTitle')"
                >
                  <span class="material-symbols-outlined text-[18px]">schedule</span>
                </button>

                <!-- Toggle (pause/resume) -->
                <button
                  (click)="toggleStatus(subscription)"
                  [disabled]="togglingId() === subscription.id"
                  class="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors disabled:opacity-50"
                  [class.bg-secondary-container]="subscription.isActive"
                  [class.text-on-secondary-container]="subscription.isActive"
                  [class.bg-primary-container]="!subscription.isActive"
                  [class.text-on-primary-container]="!subscription.isActive"
                >
                  @if (togglingId() === subscription.id) {
                    <div
                      class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                    ></div>
                  } @else {
                    <span class="material-symbols-outlined text-[18px]">
                      {{ subscription.isActive ? 'pause' : 'play_arrow' }}
                    </span>
                    {{
                      subscription.isActive ? t('subscriptions.pause') : t('subscriptions.resume')
                    }}
                  }
                </button>

                <!-- Delete -->
                <button
                  (click)="openDeleteModal(subscription)"
                  class="flex items-center justify-center p-2 rounded-[var(--radius-button)] text-sm font-medium transition-colors bg-surface-container-low text-on-surface-variant hover:text-tertiary hover:bg-tertiary/10"
                  [title]="t('common.delete')"
                >
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Mobile FAB -->
      <button
        (click)="openCreateModal()"
        class="lg:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center shadow-[var(--shadow-elevated)] shadow-primary/30 z-40"
        [attr.aria-label]="t('subscriptions.addSubscription')"
      >
        <span class="material-symbols-outlined text-[24px]">add</span>
      </button>

      <!-- Create / Edit Modal -->
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
                    ? t('subscriptions.modalTitleCreate')
                    : t('subscriptions.modalTitleEdit')
                }}
              </h2>
              <button
                (click)="closeModal()"
                class="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="saveSubscription()" class="p-6 space-y-4">
              <!-- Description (name) -->
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  {{ t('subscriptions.fieldName') }}
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.description"
                  name="description"
                  required
                  [placeholder]="t('subscriptions.placeholderName')"
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <!-- Amount -->
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  {{ t('subscriptions.fieldAmount') }}
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    >$</span
                  >
                  <input
                    type="number"
                    [(ngModel)]="formData.amount"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    class="w-full pl-8 pr-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <!-- Category — shows name, sends UUID -->
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  {{ t('subscriptions.fieldCategory') }}
                </label>
                <select
                  [(ngModel)]="formData.categoryId"
                  name="categoryId"
                  required
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">{{ t('subscriptions.selectCategory') }}</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <!-- Frequency -->
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  {{ t('subscriptions.fieldFrequency') }}
                </label>
                <div class="flex gap-3">
                  @for (freq of frequencies(); track freq.value) {
                    <button
                      type="button"
                      (click)="formData.frequency = freq.value"
                      class="flex-1 px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium transition-all"
                      [class.bg-primary]="formData.frequency === freq.value"
                      [class.text-on-primary]="formData.frequency === freq.value"
                      [class.bg-surface-container-low]="formData.frequency !== freq.value"
                      [class.text-on-surface]="formData.frequency !== freq.value"
                    >
                      {{ freq.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Billing Day -->
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  {{ t('subscriptions.fieldBillingDay') }}
                </label>
                <input
                  type="number"
                  [(ngModel)]="formData.billingDay"
                  name="billingDay"
                  required
                  min="1"
                  max="31"
                  placeholder="15"
                  class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <!-- Start Date (hidden in edit mode) -->
              @if (modalMode() === 'create') {
                <div>
                  <label
                    class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                  >
                    {{ t('subscriptions.fieldStartDate') }}
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="formData.startDate"
                    name="startDate"
                    required
                    class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              }

              <!-- Type -->
              <div>
                <label
                  class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                >
                  {{ t('subscriptions.fieldType') }}
                </label>
                <div class="flex gap-3">
                  @for (tp of types(); track tp.value) {
                    <button
                      type="button"
                      (click)="formData.type = tp.value"
                      class="flex-1 px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium transition-all"
                      [class.bg-primary]="formData.type === tp.value"
                      [class.text-on-primary]="formData.type === tp.value"
                      [class.bg-surface-container-low]="formData.type !== tp.value"
                      [class.text-on-surface]="formData.type !== tp.value"
                    >
                      {{ tp.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Service URL (only for DIGITAL_SERVICE) -->
              @if (formData.type === 'DIGITAL_SERVICE') {
                <div>
                  <label
                    class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                  >
                    {{ t('subscriptions.fieldServiceUrl') }}
                  </label>
                  <input
                    type="url"
                    [(ngModel)]="formData.serviceUrl"
                    name="serviceUrl"
                    placeholder="https://netflix.com"
                    class="w-full px-4 py-3 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              }

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

      <!-- History Modal -->
      @if (historyModalOpen()) {
        <div
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          (click)="closeHistoryModal()"
        >
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] w-full max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between p-6 border-b border-outline-variant">
              <h2 class="text-xl font-bold font-headline text-on-surface">
                {{ t('subscriptions.historyTitle') }}
                @if (historySubscription()) {
                  <span class="font-normal text-on-surface-variant">
                    — {{ historySubscription()!.description }}</span
                  >
                }
              </h2>
              <button
                (click)="closeHistoryModal()"
                class="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="p-6">
              @if (isLoadingHistory()) {
                <div class="flex justify-center py-8">
                  <div
                    class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  ></div>
                </div>
              } @else if (historyVersions().length === 0) {
                <p class="text-sm text-on-surface-variant text-center py-8">
                  {{ t('subscriptions.historyEmpty') }}
                </p>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (version of historyVersions(); track version.id; let i = $index) {
                    <div
                      class="p-4 rounded-[var(--radius-card)] flex items-start justify-between gap-3"
                      [class.bg-surface-container-lowest]="i % 2 === 0"
                      [class.bg-surface-container-low]="i % 2 !== 0"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-bold text-on-surface tabular-nums">
                            {{ version.amount | currency: 'USD' : 'symbol' : '1.2-2' }}
                          </span>
                          <span class="text-xs text-on-surface-variant"
                            >·
                            {{
                              version.frequency === 'ANNUAL'
                                ? t('subscriptions.yearly')
                                : t('subscriptions.monthly')
                            }}</span
                          >
                        </div>
                        <div class="text-xs text-on-surface-variant">
                          {{ version.startDate }} →
                          {{ version.endDate ?? t('subscriptions.historyActiveBadge') }}
                        </div>
                        @if (version.description) {
                          <div class="text-xs text-on-surface-variant mt-1 truncate">
                            {{ version.description }}
                          </div>
                        }
                      </div>
                      @if (version.endDate === null) {
                        <span
                          class="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-secondary-container/20 text-secondary"
                        >
                          {{ t('subscriptions.active') }}
                        </span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirm Modal -->
      @if (deleteModalOpen()) {
        <div
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          (click)="closeDeleteModal()"
        >
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] w-full max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto shadow-[var(--shadow-elevated)]"
            (click)="$event.stopPropagation()"
          >
            <div class="p-6 text-center">
              <span class="material-symbols-outlined text-[48px] text-tertiary mb-4 block"
                >delete_forever</span
              >
              <h2 class="text-xl font-bold font-headline text-on-surface mb-2">
                {{ t('subscriptions.deleteTitle') }}
              </h2>
              <p class="text-sm text-on-surface-variant mb-6">
                {{
                  t('subscriptions.deleteConfirm', { name: subscriptionToDelete()?.description })
                }}
              </p>
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="closeDeleteModal()"
                  class="flex-1 px-4 py-3 bg-surface-container-low text-on-surface font-semibold rounded-[var(--radius-button)] hover:bg-surface-container-high transition-all"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  type="button"
                  (click)="executeDeleteSubscription()"
                  [disabled]="isDeleting()"
                  class="flex-1 px-4 py-3 bg-tertiary text-on-tertiary font-semibold rounded-[var(--radius-button)] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
export class SubscriptionsComponent {
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly categoryService = inject(CategoryService);
  private readonly transloco = inject(TranslocoService);

  // Filters state
  readonly searchQuery = signal('');
  readonly selectedStatus = signal<'active' | 'paused' | 'all'>('all');
  readonly selectedFrequency = signal<SubscriptionFrequency | 'all'>('all');
  readonly isLoading = signal(false);
  readonly togglingId = signal<string | null>(null);

  // Modal state
  readonly isModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly formError = signal<string>('');

  // Edit mode signals
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingSubscription = signal<Subscription | null>(null);

  // History signals
  readonly historyModalOpen = signal(false);
  readonly historySubscription = signal<Subscription | null>(null);
  readonly historyVersions = signal<Subscription[]>([]);
  readonly isLoadingHistory = signal(false);

  // Delete signals
  readonly deleteModalOpen = signal(false);
  readonly subscriptionToDelete = signal<Subscription | null>(null);
  readonly isDeleting = signal(false);

  // Toast state
  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form data
  formData = {
    description: '',
    amount: 0,
    categoryId: '',
    frequency: 'MONTHLY' as SubscriptionFrequency,
    billingDay: 1,
    startDate: new Date().toISOString().split('T')[0],
    type: 'GENERAL' as SubscriptionType,
    serviceUrl: '',
  };

  readonly frequencies = computed<{ value: SubscriptionFrequency; label: string }[]>(() => [
    { value: 'MONTHLY', label: this.transloco.translate('subscriptions.monthly') },
    { value: 'ANNUAL', label: this.transloco.translate('subscriptions.yearly') },
  ]);

  readonly types = computed<{ value: SubscriptionType; label: string }[]>(() => [
    { value: 'GENERAL', label: this.transloco.translate('subscriptions.typeGeneral') },
    { value: 'DIGITAL_SERVICE', label: this.transloco.translate('subscriptions.typeDigital') },
  ]);

  constructor() {
    this.loadData();
  }

  // Data signals
  readonly subscriptions = signal<Subscription[]>([]);

  readonly categories = toSignal(this.categoryService.getCategories(), {
    initialValue: [] as Category[],
  });

  readonly summary = computed(() => {
    const active = this.subscriptions().filter((s) => s.isActive);
    return {
      totalMonthly: active.reduce((sum, s) => sum + getMonthlyCost(s), 0),
      totalYearly: active.reduce((sum, s) => sum + getYearlyCost(s), 0),
      activeCount: active.length,
    };
  });

  readonly upcomingPayments = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.subscriptions()
      .filter((s) => s.isActive && getDaysUntilBilling(s) <= 7)
      .sort((a, b) => getDaysUntilBilling(a) - getDaysUntilBilling(b));
  });

  readonly filteredSubscriptions = computed(() => {
    let result = [...this.subscriptions()];

    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      result = result.filter((s) => s.description.toLowerCase().includes(q));
    }

    if (this.selectedStatus() !== 'all') {
      const active = this.selectedStatus() === 'active';
      result = result.filter((s) => s.isActive === active);
    }

    if (this.selectedFrequency() !== 'all') {
      result = result.filter((s) => s.frequency === this.selectedFrequency());
    }

    return result.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return getDaysUntilBilling(a) - getDaysUntilBilling(b);
    });
  });

  readonly filteredCount = computed(() => this.filteredSubscriptions().length);

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery() !== '' ||
      this.selectedStatus() !== 'all' ||
      this.selectedFrequency() !== 'all',
  );

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }
  onStatusChange(value: string): void {
    this.selectedStatus.set(value as 'active' | 'paused' | 'all');
  }
  onFrequencyChange(value: string): void {
    this.selectedFrequency.set(value as SubscriptionFrequency | 'all');
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedFrequency.set('all');
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editingSubscription.set(null);
    this.formData = {
      description: '',
      amount: 0,
      categoryId: '',
      frequency: 'MONTHLY',
      billingDay: 1,
      startDate: new Date().toISOString().split('T')[0],
      type: 'GENERAL',
      serviceUrl: '',
    };
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  openEditModal(sub: Subscription): void {
    this.modalMode.set('edit');
    this.editingSubscription.set(sub);
    this.formData = {
      description: sub.description,
      amount: sub.amount,
      categoryId: sub.categoryId,
      frequency: sub.frequency,
      billingDay: sub.billingDay,
      startDate: sub.startDate,
      type: sub.type,
      serviceUrl: sub.serviceUrl ?? '',
    };
    this.formError.set('');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.formError.set('');
    this.modalMode.set('create');
    this.editingSubscription.set(null);
  }

  openHistoryModal(sub: Subscription): void {
    this.historySubscription.set(sub);
    this.isLoadingHistory.set(true);
    this.historyModalOpen.set(true);
    this.subscriptionService.getHistory(sub.id).subscribe({
      next: (versions) => {
        this.historyVersions.set(versions);
        this.isLoadingHistory.set(false);
      },
      error: () => {
        this.isLoadingHistory.set(false);
        this.showToast(this.transloco.translate('subscriptions.toastHistoryError'), 'error');
      },
    });
  }

  closeHistoryModal(): void {
    this.historyModalOpen.set(false);
    this.historyVersions.set([]);
    this.historySubscription.set(null);
  }

  openDeleteModal(sub: Subscription): void {
    this.subscriptionToDelete.set(sub);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.subscriptionToDelete.set(null);
  }

  saveSubscription(): void {
    if (!this.formData.description.trim()) {
      this.formError.set(this.transloco.translate('subscriptions.errorName'));
      return;
    }
    if (this.formData.amount <= 0) {
      this.formError.set(this.transloco.translate('subscriptions.errorAmount'));
      return;
    }
    if (!this.formData.categoryId) {
      this.formError.set(this.transloco.translate('subscriptions.errorCategory'));
      return;
    }
    if (
      !this.formData.billingDay ||
      this.formData.billingDay < 1 ||
      this.formData.billingDay > 31
    ) {
      this.formError.set(this.transloco.translate('subscriptions.errorBillingDay'));
      return;
    }
    if (this.modalMode() === 'create' && !this.formData.startDate) {
      this.formError.set(this.transloco.translate('subscriptions.errorStartDate'));
      return;
    }
    if (this.formData.type === 'DIGITAL_SERVICE' && !this.formData.serviceUrl.trim()) {
      this.formError.set(this.transloco.translate('subscriptions.errorServiceUrl'));
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode() === 'edit') {
      const editId = this.editingSubscription()!.id;
      const updateRequest: UpdateSubscriptionRequest = {
        description: this.formData.description.trim(),
        amount: this.formData.amount,
        categoryId: this.formData.categoryId,
        frequency: this.formData.frequency,
        billingDay: this.formData.billingDay,
        type: this.formData.type,
        serviceUrl: this.formData.serviceUrl.trim() || undefined,
      };

      this.subscriptionService.updateSubscription(editId, updateRequest).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadData();
          this.showToast(this.transloco.translate('subscriptions.toastUpdated'), 'success');
        },
        error: (error) => {
          this.isSaving.set(false);
          this.formError.set(
            error.error?.message || this.transloco.translate('subscriptions.toastUpdateError'),
          );
        },
      });
    } else {
      const createRequest: CreateSubscriptionRequest = {
        description: this.formData.description.trim(),
        amount: this.formData.amount,
        categoryId: this.formData.categoryId,
        frequency: this.formData.frequency,
        billingDay: this.formData.billingDay,
        startDate: this.formData.startDate,
        type: this.formData.type,
        serviceUrl: this.formData.serviceUrl.trim() || undefined,
      };

      this.subscriptionService.createSubscription(createRequest).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadData();
          this.showToast(this.transloco.translate('subscriptions.toastCreated'), 'success');
        },
        error: (error) => {
          this.isSaving.set(false);
          this.formError.set(
            error.error?.message || this.transloco.translate('subscriptions.toastCreateError'),
          );
        },
      });
    }
  }

  executeDeleteSubscription(): void {
    const sub = this.subscriptionToDelete();
    if (!sub) return;

    this.isDeleting.set(true);
    this.subscriptionService.deleteSubscription(sub.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadData();
        this.showToast(this.transloco.translate('subscriptions.toastDeleted'), 'success');
      },
      error: () => {
        this.isDeleting.set(false);
        this.showToast(this.transloco.translate('subscriptions.toastDeleteError'), 'error');
      },
    });
  }

  toggleStatus(subscription: Subscription): void {
    this.togglingId.set(subscription.id);
    this.subscriptionService.toggleStatus(subscription.id).subscribe({
      next: () => {
        this.togglingId.set(null);
        this.loadData();
        const key = subscription.isActive
          ? 'subscriptions.toastPaused'
          : 'subscriptions.toastResumed';
        this.showToast(this.transloco.translate(key), 'success');
      },
      error: () => {
        this.togglingId.set(null);
        this.showToast(this.transloco.translate('subscriptions.toastToggleError'), 'error');
      },
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.subscriptionService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showToast(this.transloco.translate('subscriptions.toastLoadError'), 'error');
      },
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  // Helper methods from model
  getMonthlyCost = getMonthlyCost;
  getDaysUntilBilling = getDaysUntilBilling;
}
