import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { LanguageService } from '../../core/services/language.service';
import { UserService } from '../../core/services/user.service';
import { UpdateProfileDto, User } from '../../shared/models/user.model';
import {
  Currency,
  DateFormat,
  PreferencesLanguage,
  UserPreferences,
} from '../../shared/models/user-preferences.model';

interface AppSettings {
  currency: Currency;
  dateFormat: DateFormat;
  language: PreferencesLanguage;
  emailNotifications: boolean;
  pushNotifications: boolean;
  budgetAlerts: boolean;
  subscriptionReminders: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <!-- Header -->
      <header class="bg-surface-container-low border-b border-outline-variant">
        <div class="p-4 lg:p-8">
          <h1 class="text-2xl lg:text-3xl font-bold font-headline text-on-surface">
            {{ t('settings.title') }}
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">{{ t('settings.subtitle') }}</p>
        </div>
      </header>

      <!-- Settings Content -->
      <div class="p-4 lg:p-8 max-w-4xl">
        <div class="space-y-6">
          <!-- Profile Section -->
          <section
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]"
          >
            <div class="flex items-center gap-4 mb-6">
              <div
                class="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center"
              >
                <span class="material-symbols-outlined text-[32px] text-primary">person</span>
              </div>
              <div>
                <h2 class="text-xl font-bold font-headline text-on-surface">
                  {{ currentUser()?.name || 'User' }}
                </h2>
                <p class="text-sm text-on-surface-variant">{{ currentUser()?.email }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-surface-container-low rounded-[var(--radius-input)]">
                <div class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                  {{ t('settings.userId') }}
                </div>
                <div class="text-sm font-medium text-on-surface truncate">
                  {{ currentUser()?.id }}
                </div>
              </div>
              <div class="p-4 bg-surface-container-low rounded-[var(--radius-input)]">
                <div class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                  {{ t('settings.accountStatus') }}
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-secondary"></span>
                  <span class="text-sm font-medium text-on-surface">{{
                    t('settings.active')
                  }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Preferences Section -->
          <section
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]"
          >
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary text-[24px]">tune</span>
              <h2 class="text-lg font-bold font-headline text-on-surface">
                {{ t('settings.preferences') }}
              </h2>
            </div>

            <div class="space-y-4">
              <!-- Currency -->
              <div
                class="flex items-center justify-between py-3 border-b border-outline-variant last:border-0"
              >
                <div>
                  <div class="font-medium text-on-surface">{{ t('settings.currency') }}</div>
                  <div class="text-sm text-on-surface-variant">
                    {{ t('settings.currencyHint') }}
                  </div>
                </div>
                <select
                  [ngModel]="settings().currency"
                  (ngModelChange)="updateSetting('currency', $event)"
                  class="px-4 py-2 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[120px]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="ARS">ARS ($)</option>
                </select>
              </div>

              <!-- Date Format -->
              <div
                class="flex items-center justify-between py-3 border-b border-outline-variant last:border-0"
              >
                <div>
                  <div class="font-medium text-on-surface">{{ t('settings.dateFormat') }}</div>
                  <div class="text-sm text-on-surface-variant">
                    {{ t('settings.dateFormatHint') }}
                  </div>
                </div>
                <select
                  [ngModel]="settings().dateFormat"
                  (ngModelChange)="updateSetting('dateFormat', $event)"
                  class="px-4 py-2 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[140px]"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <!-- Language -->
              <div class="flex items-center justify-between py-3">
                <div>
                  <div class="font-medium text-on-surface">{{ t('settings.language') }}</div>
                  <div class="text-sm text-on-surface-variant">
                    {{ t('settings.languageHint') }}
                  </div>
                </div>
                <select
                  [ngModel]="settings().language"
                  (ngModelChange)="updateSetting('language', $event)"
                  class="px-4 py-2 bg-surface-container-low rounded-[var(--radius-input)] text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[140px]"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Notifications Section -->
          <section
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]"
          >
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary text-[24px]">notifications</span>
              <h2 class="text-lg font-bold font-headline text-on-surface">
                {{ t('settings.notifications') }}
              </h2>
            </div>

            <div class="space-y-4">
              <!-- Email Notifications -->
              <div class="flex items-center justify-between py-3 border-b border-outline-variant">
                <div>
                  <div class="font-medium text-on-surface">
                    {{ t('settings.emailNotifications') }}
                  </div>
                  <div class="text-sm text-on-surface-variant">
                    {{ t('settings.emailNotificationsHint') }}
                  </div>
                </div>
                <button
                  (click)="toggleSetting('emailNotifications')"
                  class="relative w-12 h-6 rounded-full transition-colors duration-200"
                  [class.bg-secondary]="settings().emailNotifications"
                  [class.bg-surface-container-high]="!settings().emailNotifications"
                >
                  <span
                    class="absolute top-1 w-4 h-4 rounded-full bg-on-secondary transition-transform duration-200"
                    [class.translate-x-7]="settings().emailNotifications"
                    [class.translate-x-1]="!settings().emailNotifications"
                  ></span>
                </button>
              </div>

              <!-- Push Notifications -->
              <div class="flex items-center justify-between py-3 border-b border-outline-variant">
                <div>
                  <div class="font-medium text-on-surface">
                    {{ t('settings.pushNotifications') }}
                  </div>
                  <div class="text-sm text-on-surface-variant">
                    {{ t('settings.pushNotificationsHint') }}
                  </div>
                </div>
                <button
                  (click)="toggleSetting('pushNotifications')"
                  class="relative w-12 h-6 rounded-full transition-colors duration-200"
                  [class.bg-secondary]="settings().pushNotifications"
                  [class.bg-surface-container-high]="!settings().pushNotifications"
                >
                  <span
                    class="absolute top-1 w-4 h-4 rounded-full bg-on-secondary transition-transform duration-200"
                    [class.translate-x-7]="settings().pushNotifications"
                    [class.translate-x-1]="!settings().pushNotifications"
                  ></span>
                </button>
              </div>

              <!-- Budget Alerts -->
              <div class="flex items-center justify-between py-3 border-b border-outline-variant">
                <div>
                  <div class="font-medium text-on-surface">{{ t('settings.budgetAlerts') }}</div>
                  <div class="text-sm text-on-surface-variant">
                    {{ t('settings.budgetAlertsHint') }}
                  </div>
                </div>
                <button
                  (click)="toggleSetting('budgetAlerts')"
                  class="relative w-12 h-6 rounded-full transition-colors duration-200"
                  [class.bg-secondary]="settings().budgetAlerts"
                  [class.bg-surface-container-high]="!settings().budgetAlerts"
                >
                  <span
                    class="absolute top-1 w-4 h-4 rounded-full bg-on-secondary transition-transform duration-200"
                    [class.translate-x-7]="settings().budgetAlerts"
                    [class.translate-x-1]="!settings().budgetAlerts"
                  ></span>
                </button>
              </div>

              <!-- Subscription Reminders -->
              <div class="flex items-center justify-between py-3">
                <div>
                  <div class="font-medium text-on-surface">
                    {{ t('settings.subscriptionReminders') }}
                  </div>
                  <div class="text-sm text-on-surface-variant">
                    {{ t('settings.subscriptionRemindersHint') }}
                  </div>
                </div>
                <button
                  (click)="toggleSetting('subscriptionReminders')"
                  class="relative w-12 h-6 rounded-full transition-colors duration-200"
                  [class.bg-secondary]="settings().subscriptionReminders"
                  [class.bg-surface-container-high]="!settings().subscriptionReminders"
                >
                  <span
                    class="absolute top-1 w-4 h-4 rounded-full bg-on-secondary transition-transform duration-200"
                    [class.translate-x-7]="settings().subscriptionReminders"
                    [class.translate-x-1]="!settings().subscriptionReminders"
                  ></span>
                </button>
              </div>
            </div>
          </section>

          <!-- Data Management Section -->
          <section
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]"
          >
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary text-[24px]">database</span>
              <h2 class="text-lg font-bold font-headline text-on-surface">
                {{ t('settings.dataManagement') }}
              </h2>
            </div>

            <div class="space-y-3">
              <button
                (click)="exportData()"
                class="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-[var(--radius-input)] hover:bg-surface-container-high transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-on-surface-variant">download</span>
                  <div class="text-left">
                    <div class="font-medium text-on-surface">{{ t('settings.exportData') }}</div>
                    <div class="text-sm text-on-surface-variant">
                      {{ t('settings.exportDataHint') }}
                    </div>
                  </div>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </button>

              <button
                (click)="showClearDataConfirm = true"
                class="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-[var(--radius-input)] hover:bg-surface-container-high transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-on-surface-variant"
                    >delete_sweep</span
                  >
                  <div class="text-left">
                    <div class="font-medium text-on-surface">
                      {{ t('settings.clearLocalData') }}
                    </div>
                    <div class="text-sm text-on-surface-variant">
                      {{ t('settings.clearLocalDataHint') }}
                    </div>
                  </div>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </button>
            </div>
          </section>

          <!-- Account Actions Section -->
          <section
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]"
          >
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary text-[24px]"
                >manage_accounts</span
              >
              <h2 class="text-lg font-bold font-headline text-on-surface">
                {{ t('settings.account') }}
              </h2>
            </div>

            <div class="space-y-3">
              <button
                (click)="showLogoutConfirm = true"
                class="w-full flex items-center justify-center gap-2 p-4 bg-surface-container-low text-on-surface rounded-[var(--radius-button)] hover:bg-surface-container-high transition-colors font-medium"
              >
                <span class="material-symbols-outlined">logout</span>
                {{ t('settings.signOut') }}
              </button>

              <button
                (click)="showDeleteAccountConfirm = true"
                class="w-full flex items-center justify-center gap-2 p-4 bg-tertiary-container text-on-tertiary-container rounded-[var(--radius-button)] hover:bg-tertiary-container/80 transition-colors font-medium"
              >
                <span class="material-symbols-outlined">delete_forever</span>
                {{ t('settings.deleteAccount') }}
              </button>
            </div>
          </section>

          <!-- App Info -->
          <section class="text-center py-6">
            <p class="text-sm text-on-surface-variant">
              {{ t('settings.version', { version: '1.0.0' }) }}
            </p>
            <p class="text-xs text-on-surface-variant mt-1">
              {{ t('settings.builtWith') }} Angular 21
            </p>
          </section>
        </div>
      </div>

      <!-- Clear Data Confirmation Modal -->
      @if (showClearDataConfirm) {
        <div
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          (click)="showClearDataConfirm = false"
        >
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] w-full max-w-sm p-6 shadow-[var(--shadow-elevated)]"
            (click)="$event.stopPropagation()"
          >
            <div class="text-center">
              <div
                class="w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="material-symbols-outlined text-primary text-[24px]">delete_sweep</span>
              </div>
              <h3 class="text-lg font-bold font-headline text-on-surface mb-2">
                {{ t('settings.clearLocalDataTitle') }}
              </h3>
              <p class="text-sm text-on-surface-variant mb-6">
                {{ t('settings.clearLocalDataConfirm') }}
              </p>
              <div class="flex gap-3">
                <button
                  (click)="showClearDataConfirm = false"
                  class="flex-1 px-4 py-3 bg-surface-container-low text-on-surface font-semibold rounded-[var(--radius-button)] hover:bg-surface-container-high transition-all"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  (click)="clearLocalData()"
                  class="flex-1 px-4 py-3 bg-primary text-on-primary font-semibold rounded-[var(--radius-button)] hover:bg-primary-container transition-all"
                >
                  {{ t('common.confirm') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Logout Confirmation Modal -->
      @if (showLogoutConfirm) {
        <div
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          (click)="showLogoutConfirm = false"
        >
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] w-full max-w-sm p-6 shadow-[var(--shadow-elevated)]"
            (click)="$event.stopPropagation()"
          >
            <div class="text-center">
              <div
                class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span class="material-symbols-outlined text-on-surface-variant text-[24px]">
                  logout
                </span>
              </div>
              <h3 class="text-lg font-bold font-headline text-on-surface mb-2">
                {{ t('settings.signOutTitle') }}
              </h3>
              <p class="text-sm text-on-surface-variant mb-6">{{ t('settings.signOutConfirm') }}</p>
              <div class="flex gap-3">
                <button
                  (click)="showLogoutConfirm = false"
                  class="flex-1 px-4 py-3 bg-surface-container-low text-on-surface font-semibold rounded-[var(--radius-button)] hover:bg-surface-container-high transition-all"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  (click)="logout()"
                  class="flex-1 px-4 py-3 bg-primary text-on-primary font-semibold rounded-[var(--radius-button)] hover:bg-primary-container transition-all"
                >
                  {{ t('settings.signOut') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Delete Account Confirmation Modal -->
      @if (showDeleteAccountConfirm) {
        <div
          class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          (click)="showDeleteAccountConfirm = false"
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
                {{ t('settings.deleteAccountTitle') }}
              </h3>
              <p class="text-sm text-on-surface-variant mb-2">
                {{ t('settings.deleteAccountConfirm') }}
              </p>
              <p class="text-xs text-tertiary mb-6">{{ t('settings.featureNotImplemented') }}</p>
              <div class="flex gap-3">
                <button
                  (click)="showDeleteAccountConfirm = false"
                  class="flex-1 px-4 py-3 bg-surface-container-low text-on-surface font-semibold rounded-[var(--radius-button)] hover:bg-surface-container-high transition-all"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  disabled
                  class="flex-1 px-4 py-3 bg-tertiary/50 text-on-tertiary/50 font-semibold rounded-[var(--radius-button)] cursor-not-allowed"
                >
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
          class="fixed bottom-4 left-1/2 -translate-x-1/2 lg:bottom-8 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-[var(--shadow-elevated)] animate-fade-in bg-inverse-surface"
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
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly languageService = inject(LanguageService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly currentUser = this.authService.currentUser;

  // Settings state from API — signal so Angular detects changes after HTTP response
  readonly settings = signal<AppSettings>({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
    budgetAlerts: true,
    subscriptionReminders: true,
  });

  // Loading states
  readonly isLoadingPreferences = signal(false);
  readonly isSavingPreferences = signal(false);
  readonly isLoadingUser = signal(false);

  showClearDataConfirm = false;
  showLogoutConfirm = false;
  showDeleteAccountConfirm = false;

  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit user state
  readonly isEditingProfile = signal(false);
  editProfileData: UpdateProfileDto = {};

  ngOnInit(): void {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    this.isLoadingPreferences.set(true);
    this.preferencesService.getPreferences().subscribe({
      next: (prefs) => {
        if (prefs) {
          this.settings.set({
            currency: prefs.currency,
            dateFormat: prefs.dateFormat,
            language: prefs.language,
            emailNotifications: prefs.emailNotifications,
            pushNotifications: prefs.pushNotifications,
            budgetAlerts: prefs.budgetAlerts,
            subscriptionReminders: prefs.subscriptionReminders,
          });
        }
        this.isLoadingPreferences.set(false);
      },
      error: () => {
        this.isLoadingPreferences.set(false);
        this.showToast(this.transloco.translate('settings.toastLoadError'), 'error');
      },
    });
  }

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings.update((s) => ({ ...s, [key]: value }));
    this.saveSettings();
  }

  saveSettings(): void {
    this.isSavingPreferences.set(true);
    this.preferencesService.updatePreferences(this.settings()).subscribe({
      next: (updatedPrefs) => {
        this.isSavingPreferences.set(false);
        this.languageService.setLanguage(this.settings().language);
        this.preferencesService.setPreferences(updatedPrefs);
        this.showToast(this.transloco.translate('settings.toastSaved'), 'success');
      },
      error: () => {
        this.isSavingPreferences.set(false);
        this.showToast(this.transloco.translate('settings.toastSaveError'), 'error');
      },
    });
  }

  toggleSetting(key: keyof AppSettings): void {
    const current = this.settings();
    if (typeof current[key] === 'boolean') {
      this.settings.update((s) => ({ ...s, [key]: !s[key] }));
      this.saveSettings();
    }
  }

  startEditProfile(): void {
    const user = this.currentUser();
    if (user) {
      this.editProfileData = { name: user.name, email: user.email };
      this.isEditingProfile.set(true);
    }
  }

  cancelEditProfile(): void {
    this.isEditingProfile.set(false);
    this.editProfileData = {};
  }

  saveProfile(): void {
    this.isLoadingUser.set(true);
    this.userService.updateMe(this.editProfileData).subscribe({
      next: (updatedUser) => {
        // Update auth service with new user data
        this.authService.updateCurrentUser(updatedUser);
        this.isLoadingUser.set(false);
        this.isEditingProfile.set(false);
        this.showToast(this.transloco.translate('settings.profileSuccess'), 'success');
      },
      error: () => {
        this.isLoadingUser.set(false);
        this.showToast(this.transloco.translate('settings.profileError'), 'error');
      },
    });
  }

  exportData(): void {
    const data = {
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      budgets: JSON.parse(localStorage.getItem('budgets') || '[]'),
      subscriptions: JSON.parse(localStorage.getItem('subscriptions') || '[]'),
      settings: this.settings(),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finflow-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(this.transloco.translate('settings.exportSuccess'), 'success');
  }

  clearLocalData(): void {
    // Clear all app data except auth
    const keysToKeep = ['token', 'user'];
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    this.showClearDataConfirm = false;
    this.showToast(this.transloco.translate('settings.clearLocalDataSuccess'), 'success');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
