import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      @if (label() || hint()) {
        <div>
          @if (label()) {
            <div class="font-medium text-on-surface">{{ label() }}</div>
          }
          @if (hint()) {
            <div class="text-sm text-on-surface-variant">{{ hint() }}</div>
          }
        </div>
      }
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="checked()"
        [attr.aria-label]="label() ?? 'Toggle'"
        (click)="onToggle()"
        (keydown.space)="onToggle(); $event.preventDefault()"
        (keydown.enter)="onToggle()"
        class="relative w-11 h-6 rounded-full transition-colors duration-200"
        [class.bg-secondary]="checked()"
        [class.bg-surface-container-high]="!checked()"
      >
        <span
          class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200"
          [class.translate-x-5]="checked()"
          [class.translate-x-0]="!checked()"
        ></span>
      </button>
    </div>
  `,
})
export class ToggleComponent {
  readonly checked = input<boolean>(false);
  readonly label = input<string>();
  readonly hint = input<string>();

  readonly toggled = output<boolean>();

  protected onToggle(): void {
    this.toggled.emit(!this.checked());
  }
}
