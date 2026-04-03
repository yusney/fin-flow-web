import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div
      class="min-h-screen bg-background flex items-center justify-center p-6"
    >
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-12">
          <span
            class="text-3xl font-bold font-headline text-on-surface tracking-tight"
          >
            fin-flow
          </span>
          <p class="text-sm text-on-surface-variant mt-2">
            The Digital Ledger
          </p>
        </div>

        <!-- Card -->
        <div class="bg-surface-container-low rounded-[var(--radius-card)] p-8 shadow-[var(--shadow-elevated)]">
          <h1 class="text-xl font-bold font-headline text-on-surface mb-2">
            Welcome back
          </h1>
          <p class="text-sm text-on-surface-variant mb-8">
            Sign in to your premium ledger
          </p>

          @if (error()) {
            <div
              class="bg-error-container text-on-error-container text-sm rounded-[var(--radius-xl)] px-4 py-3 mb-6"
            >
              {{ error() }}
            </div>
          }

          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            class="flex flex-col gap-y-5"
          >
            <!-- Email -->
            <div class="flex flex-col gap-y-2">
              <label
                for="email"
                class="text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="alex@example.com"
                class="w-full bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-y-2">
              <label
                for="password"
                class="text-xs font-semibold uppercase tracking-widest text-on-surface-variant"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-surface-container-lowest px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full bg-primary hover:bg-primary-container text-on-primary font-bold rounded-[var(--radius-button)] px-6 py-3 text-sm transition-all shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              @if (loading()) {
                Signing in…
              } @else {
                Sign In
              }
            </button>
          </form>
        </div>

        <!-- Demo hint -->
        <p class="text-center text-xs text-on-surface-variant mt-6">
          Demo: demo@finflow.com / demo123
        </p>
      </div>
    </div>
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
        const msg =
          err instanceof Error ? err.message : 'Invalid credentials. Try again.';
        this.error.set(msg);
      },
    });
  }
}
