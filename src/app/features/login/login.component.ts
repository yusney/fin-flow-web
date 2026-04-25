import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { switchMap } from 'rxjs';

import { AuthShellComponent } from '../../shared/components/auth-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { PreferencesService } from '../../core/services/preferences.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    RouterLink,
    AuthShellComponent,
  ],
  template: `
    <app-auth-shell
      [tagline]="transloco.translate('login.tagline')"
      [title]="transloco.translate('login.welcomeBack')"
      [subtitle]="transloco.translate('login.signInSubtitle')"
      [error]="error()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-xs font-medium text-on-surface-variant">
            {{ transloco.translate('login.email') }}
          </label>
          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="alex@example.com"
            class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-xs font-medium text-on-surface-variant">
            {{ transloco.translate('login.password') }}
          </label>
          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          [disabled]="form.invalid || loading()"
          class="w-full bg-primary hover:bg-primary-container text-on-primary font-semibold rounded-[var(--radius-button)] px-6 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          @if (loading()) {
            <span class="flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              {{ transloco.translate('login.signingIn') }}
            </span>
          } @else {
            {{ transloco.translate('login.signIn') }}
          }
        </button>
      </form>

      <p auth-footer class="text-center text-xs text-on-surface-variant mt-6">
        {{ transloco.translate('login.demoHint') }}
        <span class="font-medium">demo&#64;finflow.com</span> /
        <span class="font-medium">demo123</span>
      </p>

      <p auth-footer class="text-center text-xs text-on-surface-variant mt-3">
        {{ transloco.translate('login.noAccount') }}
        <a routerLink="/register" class="text-primary font-medium hover:underline">{{
          transloco.translate('login.createAccount')
        }}</a>
      </p>
    </app-auth-shell>
  `,
})
export class LoginComponent {
  readonly transloco = inject(TranslocoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly preferencesService = inject(PreferencesService);
  private readonly languageService = inject(LanguageService);

  private readonly _loading = signal(false);
  private readonly _error = signal('');

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this._loading.set(true);
    this._error.set('');

    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(
        switchMap(() => this.preferencesService.getPreferences()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (prefs) => {
          if (prefs) {
            this.languageService.setLanguage(prefs.language);
          }
          this._loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this._loading.set(false);
          this._error.set(this.transloco.translate('login.errorGeneric'));
        },
      });
  }
}
