import { provideTransloco } from '@jsverse/transloco';

export function provideTranslocoTesting() {
  return provideTransloco({
    config: {
      availableLangs: ['en', 'es'],
      defaultLang: 'en',
      reRenderOnLangChange: true,
      prodMode: true,
    },
  });
}