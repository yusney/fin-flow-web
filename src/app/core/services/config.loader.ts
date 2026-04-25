import { environment } from '../../../environments/environment';

export interface AppConfig {
  apiUrl: string;
}

/**
 * Validates the shape of the parsed config object.
 * Requires `apiUrl` to be a non-empty string.
 */
function isValidConfig(cfg: unknown): cfg is AppConfig {
  return (
    typeof cfg === 'object' &&
    cfg !== null &&
    typeof (cfg as Record<string, unknown>)['apiUrl'] === 'string' &&
    ((cfg as AppConfig).apiUrl ?? '').trim().length > 0
  );
}

/**
 * Loads runtime configuration from /config.json.
 *
 * CONSTRAINT: `environment.apiUrl` is mutated intentionally here because Angular's
 * APP_INITIALIZER runs before any service that consumes `environment.apiUrl`.
 * This is the standard runtime-config pattern for Angular + Docker deployments.
 * Mutation is safe as long as this initializer runs once before any HTTP calls.
 */
export function loadConfig(): () => Promise<AppConfig> {
  return () =>
    fetch('/config.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`config.json fetch failed: ${res.status} ${res.statusText}`);
        }
        return res.json() as Promise<unknown>;
      })
      .then((cfg) => {
        if (!isValidConfig(cfg)) {
          throw new Error('config.json is invalid: missing or empty apiUrl');
        }
        (environment as { apiUrl: string }).apiUrl = cfg.apiUrl;
        return cfg;
      })
      .catch((err: unknown) => {
        // Log to console but do not propagate — fall back to compiled-in apiUrl.
        console.warn('[loadConfig] Falling back to environment.apiUrl.', err);
        return { apiUrl: environment.apiUrl } satisfies AppConfig;
      });
}
