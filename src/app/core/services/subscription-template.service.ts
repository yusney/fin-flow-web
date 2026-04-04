import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import {
  SubscriptionTemplate,
  SubscriptionTemplatePrefill,
  TemplateCategory,
} from '../../shared/models/subscription.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubscriptionTemplateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/subscription-templates`;

  private readonly cache = new Map<TemplateCategory | 'ALL', Observable<SubscriptionTemplate[]>>();

  getTemplates(category?: TemplateCategory): Observable<SubscriptionTemplate[]> {
    const key = category ?? 'ALL';
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    let url = this.apiUrl;
    if (category) {
      url += `?category=${category}`;
    }

    const obs = this.http.get<SubscriptionTemplate[]>(url).pipe(
      catchError((error) => {
        this.cache.delete(key);
        return throwError(() => error);
      }),
      shareReplay(1),
    );

    this.cache.set(key, obs);
    return obs;
  }

  getTemplatePrefill(id: string): Observable<SubscriptionTemplatePrefill> {
    return this.http.get<SubscriptionTemplatePrefill>(`${this.apiUrl}/${id}/prefill`).pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }
}
