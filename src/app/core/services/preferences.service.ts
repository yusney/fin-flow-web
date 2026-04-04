import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UserPreferences, UpdatePreferencesRequest } from '../../shared/models/user-preferences.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/preferences`;

  private readonly _preferences = signal<UserPreferences | null>(null);
  readonly preferences = this._preferences.asReadonly();

  readonly currency = computed(() => this._preferences()?.currency ?? 'USD');

  readonly angularDateFormat = computed(() => {
    const fmt = this._preferences()?.dateFormat;
    const map: Record<string, string> = {
      'MM/DD/YYYY': 'MM/dd/yyyy',
      'DD/MM/YYYY': 'dd/MM/yyyy',
      'YYYY-MM-DD': 'yyyy-MM-dd',
    };
    return map[fmt ?? ''] ?? 'MM/dd/yyyy';
  });

  setPreferences(prefs: UserPreferences): void {
    this._preferences.set(prefs);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching preferences:', error);
        return throwError(() => error);
      }),
    );
  }

  updatePreferences(request: UpdatePreferencesRequest): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(this.apiUrl, request).pipe(
      catchError((error) => {
        console.error('Error updating preferences:', error);
        return throwError(() => error);
      }),
    );
  }
}
