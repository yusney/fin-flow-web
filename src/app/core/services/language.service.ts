import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Language = 'en' | 'es';

const STORAGE_KEY = 'fin-flow-lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);

  readonly availableLanguages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ];

  init(): void {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    const lang = saved ?? 'en';
    this.transloco.setActiveLang(lang);
  }

  setLanguage(lang: Language): void {
    this.transloco.setActiveLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  getActiveLang(): Language {
    return this.transloco.getActiveLang() as Language;
  }
}
