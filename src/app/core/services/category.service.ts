import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, catchError, of } from 'rxjs';

import { Category } from '../../shared/models/transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  // Session-scoped cache — one request per app lifetime
  private cache$?: Observable<Category[]>;

  getCategories(): Observable<Category[]> {
    if (!this.cache$) {
      this.cache$ = this.http.get<Category[]>(this.apiUrl).pipe(
        shareReplay(1),
        catchError(() => of([] as Category[])),
      );
    }
    return this.cache$;
  }

  /** Invalidate cache (e.g. after creating a new category) */
  invalidate(): void {
    this.cache$ = undefined;
  }
}
