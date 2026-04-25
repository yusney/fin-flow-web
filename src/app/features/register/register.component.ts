import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { AuthShellComponent } from '../../shared/components/auth-shell.component';
import { AuthService } from '../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value as string;
  const confirm = control.get('confirmPassword')?.value as string;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoDirective, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell
      [tagline]="transloco.translate('register.tagline')"
      [title]="transloco.translate('register.title')"
      [subtitle]="transloco.translate('register.subtitle')"
      [error]="error()"
      [success]="successMessage()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
        <div class="flex flex-col gap-1.5">
          <label for="name" class="text-xs font-medium text-on-surface-variant">
            {{ transloco.translate('register.name') }}
          </label>
          <input id="name" type="text" formControlName="name" autocomplete="name" placeholder="Alex Smith"
            class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-xs font-medium text-on-surface-variant">
            {{ transloco.translate('register.email') }}
          </label>
          <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="alex@example.com"
            class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-xs font-medium text-on-surface-variant">
            {{ transloco.translate('register.password') }}
          </label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" placeholder="••••••••"
            class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors" />
          @if (passwordControl.hasError('minlength') && passwordControl.dirty) {
            <p class="text-xs text-error mt-0.5">{{ transloco.translate('register.passwordMinLength') }}</p>
          }
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="confirmPassword" class="text-xs font-medium text-on-surface-variant">
            {{ transloco.translate('register.confirmPassword') }}
          </label>
          <input id="confirmPassword" type="password" formControlName="confirmPassword" autocomplete="new-password" placeholder="••••••••"
            class="w-full bg-surface-container px-4 py-3 rounded-[var(--radius-input)] text-sm text-on-surface placeholder:text-outline-variant border border-outline-variant focus:border-primary focus:outline-none transition-colors" />
          @if (form.hasError('passwordMismatch') && confirmPasswordControl.dirty) {
            <p class="text-xs text-error mt-0.5">{{ transloco.translate('register.passwordMismatch') }}</p>
          }
        </div>
        <button type="submit" [disabled]="loading()"
          class="w-full bg-primary hover:bg-primary-container text-on-primary font-semibold rounded-[var(--radius-button)] px-6 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
          @if (loading()) {
            <span class="flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              {{ transloco.translate('register.registering') }}
            </span>
          } @else {
            {{ transloco.translate('register.register') }}
          }
        </button>
      </form>

      <p auth-footer class="text-center text-xs text-on-surface-variant mt-6">
        {{ transloco.translate('register.alreadyHaveAccount') }}
        <a routerLink="/login" class="text-primary font-medium hover:underline">{{
          transloco.translate('register.signIn')
        }}</a>
      </p>
    </app-auth-shell>
  `,
})
export class RegisterComponent implements OnDestroy {
  readonly transloco = inject(TranslocoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private redirectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private readonly _loading = signal(false);
  private readonly _error = signal('');
  private readonly _success = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = computed(() =>
    this._success() ? this.transloco.translate('register.successMessage') : '',
  );

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  get passwordControl() {
    return this.form.controls['password'];
  }
  get confirmPasswordControl() {
    return this.form.controls['confirmPassword'];
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.redirectTimer !== null) clearTimeout(this.redirectTimer);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this._loading.set(true);
    this._error.set('');

    const { name, email, password } = this.form.getRawValue();

    this.auth.register(name, email, password).subscribe({
      next: () => {
        this._loading.set(false);
        this._success.set(true);
        this.redirectTimer = setTimeout(() => {
          if (!this.destroyed) void this.router.navigate(['/login']);
        }, 2500);
      },
      error: (err: unknown) => {
        this._loading.set(false);
        if (err instanceof HttpErrorResponse) {
          const msg = (err.error as { message?: string })?.message;
          this._error.set(msg ?? this.transloco.translate('register.errorGeneric'));
        } else {
          this._error.set(this.transloco.translate('register.errorGeneric'));
        }
      },
    });
  }
}
