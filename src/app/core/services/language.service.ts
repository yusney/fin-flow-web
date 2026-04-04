import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Language = 'en' | 'es';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);

  readonly availableLanguages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ];

  setLanguage(lang: Language): void {
    this.transloco.setActiveLang(lang);
  }

  getActiveLang(): Language {
    return this.transloco.getActiveLang() as Language;
  }
}
