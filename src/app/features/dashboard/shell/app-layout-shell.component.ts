import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../components/sidebar.component';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div
      class="min-h-screen bg-background font-body text-on-surface lg:grid lg:grid-cols-[240px_1fr]"
    >
      <!-- Sidebar -->
      <app-sidebar [isOpen]="isSidebarOpen()" (close)="closeSidebar()" />

      <!-- Main canvas -->
      <main class="min-h-screen pt-14 lg:pt-0">
        <!-- Mobile Header -->
        <header
          class="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface-container-low z-30 flex items-center justify-between px-4 border-b border-outline-variant"
        >
          <div class="flex items-center gap-x-3">
            <button
              class="p-2 -ml-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high"
              (click)="openSidebar()"
            >
              <span class="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <span class="text-lg font-bold font-headline text-on-surface">fin-flow</span>
          </div>
          <button
            class="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container-high"
          >
            <span class="material-symbols-outlined text-[22px]">notifications</span>
          </button>
        </header>

        <!-- Page content via router -->
        <router-outlet />
      </main>

    </div>
  `,
})
export class AppLayoutShellComponent {
  readonly isSidebarOpen = signal(false);

  openSidebar(): void {
    this.isSidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
