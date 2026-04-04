import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { of, catchError, tap } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { TranslocoHttpLoader } from './core/transloco-loader';
import { PreferencesService } from './core/services/preferences.service';
import { LanguageService } from './core/services/language.service';

export function initializePreferences() {
  return () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return of(null);
    }

    const preferencesService = inject(PreferencesService);
    const languageService = inject(LanguageService);

    return preferencesService.getPreferences().pipe(
      tap((prefs) => {
        if (prefs) {
          languageService.setLanguage(prefs.language);
        }
      }),
      catchError(() => of(null)),
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializePreferences,
      multi: true,
      deps: [],
    },
  ],
};
