import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface-container flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-10">
          <img src="/logo.svg" alt="FinFlow" class="w-16 h-16 mb-4" />
          <h1 class="text-2xl font-bold font-headline tracking-tight">
            <span class="text-[#2563EB]">Fin</span><span class="text-[#10B981]">Flow</span>
          </h1>
          <p class="text-sm text-on-surface-variant mt-1">{{ tagline() }}</p>
        </div>

        <!-- Card -->
        <div
          class="bg-surface-container-lowest rounded-[var(--radius-card)] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.1)] border border-outline-variant/40"
        >
          <h2 class="text-lg font-semibold font-headline text-on-surface mb-1">
            {{ title() }}
          </h2>
          <p class="text-sm text-on-surface-variant mb-6">{{ subtitle() }}</p>

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
              class="flex items-center gap-2 bg-success-container text-on-success-container text-sm rounded-[var(--radius-xl)] px-4 py-3 mb-6"
            >
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              {{ success() }}
            </div>
          }

          <ng-content />
        </div>

        <ng-content select="[auth-footer]" />
      </div>
    </div>
  `,
})
export class AuthShellComponent {
  readonly tagline = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly error = input('');
  readonly success = input('');
}
