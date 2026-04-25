import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TranslocoDirective } from '@jsverse/transloco';

import { AuthService } from '../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value as string;
  const confirm = control.get('confirmPassword')?.value as string;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoDirective, RouterLink],
  template: `
    <ng-container *transloco="let t">
      <div class="min-h-screen bg-surface-container flex items-center justify-center p-6">
        <div class="w-full max-w-sm">
          <!-- Logo -->
          <div class="flex flex-col items-center mb-10">
            <img src="/logo.svg" alt="FinFlow" class="w-16 h-16 mb-4" />
            <h1 class="text-2xl font-bold font-headline tracking-tight">
              <span class="text-[#2563EB]">Fin</span><span class="text-[#10B981]">Flow</span>
            </h1>
            <p class="text-sm text-on-surface-variant mt-1">{{ t('login.tagline') }}</p>
          </div>

          <!-- Card -->
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.1)] border border-outline-variant/40"
          >
            <h2 class="text-lg font-semibold font-headline text-on-surface mb-1">
              {{ t('register.title') }}
            </h2>
            <p class="text-sm text-on-surface-variant mb-6">{{ t('register.subtitle') }}</p>

            @if (error()) {
              <div
                class="flex items-center gap-2 bg-error-container text-on-error-container text-sm rounded-[var(--radius-xl)] px-4 py-3 mb-6"
              >
                <span class="material-symbols-outlined text-[18px]">error</span>
                {{ error() }}
              </div>
            }

            @if (success()) {
              <div
                class="flex items-center gap-2 bg-[#dcfce7] text-[#166534] text-sm rounded-[var(--radius-xl)] px-4 py-3 mb-6"
              >
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
                {{ t('register.successMessage') }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
              <!-- Name -->
              <div class="flex flex-col gap-1.5">
                <label for="name" class="text-xs font-medium text-on-surface-variant">
                  {{ t('register.name') }}
                </label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  autocomplete="name"
                  placeholder="Alex Smith"
                  class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <!-- Email -->
              <div class="flex flex-col gap-1.5">
                <label for="email" class="text-xs font-medium text-on-surface-variant">
                  {{ t('login.email') }}
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

              <!-- Password -->
              <div class="flex flex-col gap-1.5">
                <label for="password" class="text-xs font-medium text-on-surface-variant">
                  {{ t('login.password') }}
                </label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                  placeholder="••••••••"
                  class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                />
                @if (form.get('password')?.hasError('minlength') && form.get('password')?.dirty) {
                  <p class="text-xs text-error mt-0.5">{{ t('register.passwordMinLength') }}</p>
                }
              </div>

              <!-- Confirm Password -->
              <div class="flex flex-col gap-1.5">
                <label for="confirmPassword" class="text-xs font-medium text-on-surface-variant">
                  {{ t('register.confirmPassword') }}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  placeholder="••••••••"
                  class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                />
                @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.dirty) {
                  <p class="text-xs text-error mt-0.5">{{ t('register.passwordMismatch') }}</p>
                }
              </div>

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="form.invalid || loading()"
                class="w-full bg-primary hover:bg-primary-container text-on-primary font-semibold rounded-[var(--radius-button)] px-6 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                @if (loading()) {
                  <span class="flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[18px] animate-spin"
                      >progress_activity</span
                    >
                    {{ t('register.registering') }}
                  </span>
                } @else {
                  {{ t('register.register') }}
                }
              </button>
            </form>
          </div>

          <!-- Link to login -->
          <p class="text-center text-xs text-on-surface-variant mt-6">
            {{ t('register.alreadyHaveAccount') }}
            <a routerLink="/login" class="text-primary font-medium hover:underline">{{
              t('register.signIn')
            }}</a>
          </p>
        </div>
      </div>
    </ng-container>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private readonly _loading = signal(false);
  private readonly _error = signal('');
  private readonly _success = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly success = this._success.asReadonly();

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  onSubmit(): void {
    if (this.form.invalid) return;

    this._loading.set(true);
    this._error.set('');

    const { name, email, password } = this.form.getRawValue();

    this.auth.register(name, email, password).subscribe({
      next: () => {
        this._loading.set(false);
        this._success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err: unknown) => {
        this._loading.set(false);
        if (err instanceof HttpErrorResponse) {
          const msg = (err.error as { message?: string })?.message;
          this._error.set(msg ?? 'Registration failed. Try again.');
        } else {
          this._error.set('Registration failed. Try again.');
        }
      },
    });
  }
}
