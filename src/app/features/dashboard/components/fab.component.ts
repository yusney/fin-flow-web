import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-fab',
  template: `
    <div class="fixed bottom-4 right-4 lg:bottom-12 lg:right-12 z-40">
      <!-- Tooltip - solo en desktop, posicionado absolutamente -->
      @if (tooltipVisible()) {
        <div
          class="hidden lg:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-inverse-surface text-inverse-on-surface text-xs font-medium px-3 py-1.5 rounded-full shadow-[var(--shadow-elevated)] whitespace-nowrap animate-fade-in pointer-events-none"
          role="tooltip"
        >
          Add Quick Record
        </div>
      }

      <!-- FAB Button -->
      <button
        class="
          w-14 h-14 lg:w-16 lg:h-16 rounded-full
          bg-gradient-to-br from-primary to-primary-container
          text-on-primary
          flex items-center justify-center
          shadow-[var(--shadow-elevated)] shadow-primary/30
          lg:hover:scale-110 active:scale-95
          transition-transform duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          touch-manipulation
        "
        aria-label="Add Quick Record"
        (mouseenter)="showTooltip()"
        (mouseleave)="hideTooltip()"
        (focus)="showTooltip()"
        (blur)="hideTooltip()"
      >
        <span class="material-symbols-outlined text-[24px] lg:text-[28px] select-none">add</span>
      </button>
    </div>
  `,
  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in {
        animation: fade-in 150ms ease-out forwards;
      }
    `,
  ],
})
export class FabComponent {
  protected tooltipVisible = signal(false);

  showTooltip(): void {
    this.tooltipVisible.set(true);
  }

  hideTooltip(): void {
    this.tooltipVisible.set(false);
  }
}
