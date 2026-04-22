import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-service-unavailable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoDirective],
  template: `
    <ng-container *transloco="let t">
      <div class="min-h-screen bg-background flex items-center justify-center p-6">
        <div class="max-w-md w-full text-center">
          <!-- Icon -->
          <div class="flex justify-center mb-6">
            <div
              class="w-24 h-24 rounded-full bg-tertiary-container/30 flex items-center justify-center"
            >
              <span class="material-symbols-outlined text-[48px] text-tertiary">cloud_off</span>
            </div>
          </div>

          <!-- Title -->
          <h1 class="text-2xl lg:text-3xl font-bold font-headline text-on-surface mb-3">
            {{ t('error.title') }}
          </h1>

          <!-- Message -->
          <p class="text-on-surface-variant text-sm lg:text-base leading-relaxed mb-2">
            {{ t('error.message') }}
          </p>
          <p class="text-on-surface-variant text-sm mb-8">
            {{ t('error.hint') }}
          </p>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              (click)="retry()"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary font-semibold rounded-full hover:bg-primary-container transition-colors"
            >
              <span class="material-symbols-outlined text-[20px]">refresh</span>
              {{ t('error.retry') }}
            </button>

            <button
              (click)="goBack()"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-surface-container-low text-on-surface font-semibold rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span class="material-symbols-outlined text-[20px]">arrow_back</span>
              {{ t('error.goBack') }}
            </button>
          </div>

          <!-- App name -->
          <p class="mt-12 text-xs font-headline font-bold">
            <span class="text-[#2563EB]">Fin</span><span class="text-[#10B981]">Flow</span>
          </p>
        </div>
      </div>
    </ng-container>
  `,
})
export class ServiceUnavailableComponent {
  private readonly router = inject(Router);

  retry(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    history.back();
  }
}
