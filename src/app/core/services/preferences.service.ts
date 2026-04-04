import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import {
  UserPreferences,
  UpdatePreferencesRequest,
} from '../../shared/models/user-preferences.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/preferences`;

  private readonly _preferences = signal<UserPreferences | null>(null);
  readonly preferences = this._preferences.asReadonly();

  readonly isLoaded = signal(false);
  readonly currency = computed(() => this._preferences()?.currency ?? 'USD');
  readonly language = computed(() => this._preferences()?.language ?? 'en');

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

  getPreferences(): Observable<UserPreferences | null> {
    return this.http.get<UserPreferences>(this.apiUrl).pipe(
      tap((response) => {
        this.setPreferences(response);
        this.isLoaded.set(true);
      }),
      catchError((error) => {
        console.error('Error fetching preferences:', error);
        return of(null);
      }),
    );
  }

  updatePreferences(request: UpdatePreferencesRequest): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(this.apiUrl, request).pipe(
      tap((updatedPrefs) => {
        this.setPreferences(updatedPrefs);
        this.isLoaded.set(true);
      }),
      catchError((error) => {
        console.error('Error updating preferences:', error);
        return throwError(() => error);
      }),
    );
  }
}
