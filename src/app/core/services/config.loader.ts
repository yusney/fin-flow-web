import { environment } from '../../../environments/environment';

export interface AppConfig {
  apiUrl: string;
}

export function loadConfig(): () => Promise<AppConfig> {
  return () =>
    fetch('/config.json')
      .then<AppConfig>((res) => res.json())
      .then((cfg) => {
        (environment as { apiUrl: string }).apiUrl = cfg.apiUrl;
        return cfg;
      })
      .catch(() => {
        return { apiUrl: environment.apiUrl } as AppConfig;
      });
}