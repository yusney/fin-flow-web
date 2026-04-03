import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Budget } from '../../shared/models/budget.model';
import { environment } from '../../../environments/environment';

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'restaurant',
  'Food & Dining': 'restaurant',
  Entertainment: 'confirmation_number',
  Shopping: 'shopping_cart',
  Transportation: 'directions_car',
  Utilities: 'bolt',
  Health: 'medical_services',
  Education: 'school',
  Housing: 'home',
  Travel: 'flight',
  Fitness: 'fitness_center',
  Gifts: 'redeem',
  Other: 'more_horiz',
};

/** Shape returned by POST /api/budgets or GET /api/budgets/status */
interface ApiBudget {
  id: string;
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  spent?: number;
  category?: { id: string; name: string; type: string };
}

export interface CreateBudgetRequest {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
}

export interface BudgetSummary {
  totalLimit: number;
  totalSpent: number;
  remaining: number;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/budgets`;

  getBudgets(month?: number, year?: number): Observable<Budget[]> {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    return this.http
      .get<ApiBudget[]>(`${this.apiUrl}/status`, {
        params: { month: m.toString(), year: y.toString() },
      })
      .pipe(
        map((budgets) => budgets.map((b) => this.fromApi(b))),
        catchError((error) => {
          console.error('Error fetching budgets:', error);
          return throwError(() => error);
        }),
      );
  }

  /** POST /api/budgets — acts as upsert for the same category+month+year */
  createBudget(request: CreateBudgetRequest): Observable<Budget> {
    return this.http.post<ApiBudget>(this.apiUrl, request).pipe(
      map((b) => this.fromApi(b)),
      catchError((error) => {
        console.error('Error creating budget:', error);
        return throwError(() => error);
      }),
    );
  }

  private fromApi(b: ApiBudget): Budget {
    const name = b.category?.name ?? '';
    return {
      id: b.id,
      categoryId: b.categoryId,
      category: name,
      limitAmount: Number(b.limitAmount),
      month: b.month,
      year: b.year,
      spent: Number(b.spent ?? 0),
      icon: CATEGORY_ICONS[name] ?? 'account_balance_wallet',
    };
  }
}
