import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div class="min-h-screen bg-surface-container flex items-center justify-center p-6">
        <div class="w-full max-w-sm">
          <!-- Logo -->
          <div class="flex flex-col items-center mb-10">
            <img src="/logo.svg" alt="FinFlow" class="w-16 h-16 mb-4" />
            <h1 class="text-2xl font-bold font-headline text-on-surface tracking-tight">
              fin-flow
            </h1>
            <p class="text-sm text-on-surface-variant mt-1">{{ t('login.tagline') }}</p>
          </div>

          <!-- Card -->
          <div
            class="bg-surface-container-lowest rounded-[var(--radius-card)] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.1)] border border-outline-variant/40"
          >
            <h2 class="text-lg font-semibold font-headline text-on-surface mb-1">
              {{ t('login.welcomeBack') }}
            </h2>
            <p class="text-sm text-on-surface-variant mb-6">{{ t('login.signInSubtitle') }}</p>

            @if (error()) {
              <div
                class="flex items-center gap-2 bg-error-container text-on-error-container text-sm rounded-[var(--radius-xl)] px-4 py-3 mb-6"
              >
                <span class="material-symbols-outlined text-[18px]">error</span>
                {{ error() }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
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
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors"
                />
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
                    {{ t('login.signingIn') }}
                  </span>
                } @else {
                  {{ t('login.signIn') }}
                }
              </button>
            </form>
          </div>

          <!-- Demo hint -->
          <p class="text-center text-xs text-on-surface-variant mt-6">
            {{ t('login.demoHint') }}
            <span class="font-medium">demo&#64;finflow.com</span> /
            <span class="font-medium">demo123</span>
          </p>
        </div>
      </div>
    </ng-container>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  readonly loading = signal(false);
  readonly error = signal('');

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const msg = err instanceof Error ? err.message : 'Invalid credentials. Try again.';
        this.error.set(msg);
      },
    });
  }
}
