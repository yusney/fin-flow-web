import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <div class="mt-12 lg:mt-20 bg-surface-container-low rounded-xl lg:rounded-2xl">
      <footer
        class="px-4 lg:px-8 py-4 lg:py-6 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center text-on-surface-variant"
      >
        <!-- Quote -->
        <div class="text-xs lg:text-sm font-label italic max-w-md">
          "The art of economics consists in looking not merely at the immediate but at the longer
          effects."
        </div>

        <!-- Links -->
        <div
          class="flex gap-x-4 lg:gap-x-6 text-[10px] lg:text-xs font-bold uppercase tracking-widest"
        >
          <a href="#" class="hover:text-primary transition-colors"> Export CSV </a>
          <a href="#" class="hover:text-primary transition-colors"> Privacy </a>
          <a href="#" class="hover:text-primary transition-colors"> Support </a>
        </div>
      </footer>
    </div>
  `,
})
export class FooterComponent {}
