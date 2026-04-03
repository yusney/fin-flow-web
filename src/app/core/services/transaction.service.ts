import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

import { Transaction, Category } from '../../shared/models/transaction.model';
import { CategoryService } from './category.service';
import { environment } from '../../../environments/environment';

const CATEGORY_ICONS: Record<string, string> = {
  Income: 'payments',
  'Food & Dining': 'restaurant',
  Entertainment: 'smart_display',
  Health: 'local_pharmacy',
  Education: 'school',
  Investment: 'trending_up',
  Transportation: 'local_gas_station',
  Utilities: 'bolt',
  'Dining Out': 'restaurant',
  Shopping: 'shopping_cart',
  Groceries: 'shopping_basket',
  Travel: 'flight',
  Housing: 'home',
  Insurance: 'shield',
  Personal: 'person',
  Gifts: 'card_giftcard',
  Donations: 'volunteer_activism',
  Taxes: 'account_balance',
  Fees: 'receipt',
  Other: 'category',
};

export interface TransactionFilters {
  search?: string;
  type?: 'income' | 'expense' | 'all';
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  categoryId: string; // UUID — sent to API
  date: string;
}

export interface UpdateTransactionRequest extends CreateTransactionRequest {
  id: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly categoryService = inject(CategoryService);
  private readonly apiUrl = `${environment.apiUrl}/transactions`;

  private transactionsCache = new BehaviorSubject<Transaction[]>([]);

  getTransactions(filters?: TransactionFilters): Observable<Transaction[]> {
    return this.categoryService.getCategories().pipe(
      switchMap((categories) => {
        const categoryMap = new Map(categories.map((c) => [c.id, c]));

        return this.http.get<Transaction[]>(this.apiUrl).pipe(
          map((transactions) =>
            transactions.map((t) => {
              const cat = categoryMap.get(t.categoryId ?? '');
              return {
                ...t,
                amount: Number(t.amount),
                category: cat?.name ?? t.category ?? 'Unknown',
                type: (cat?.type ?? t.type ?? 'expense') as 'income' | 'expense',
                icon: t.icon || CATEGORY_ICONS[cat?.name ?? ''] || 'payments',
              };
            }),
          ),
          tap((transactions) => this.transactionsCache.next(transactions)),
          map((transactions) => {
            let result = [...transactions];

            if (filters?.search) {
              const q = filters.search.toLowerCase();
              result = result.filter(
                (t) =>
                  t.description.toLowerCase().includes(q) ||
                  t.category.toLowerCase().includes(q),
              );
            }

            if (filters?.type && filters.type !== 'all') {
              result = result.filter((t) => t.type === filters.type);
            }

            if (filters?.categoryId && filters.categoryId !== 'all') {
              result = result.filter((t) => t.categoryId === filters.categoryId);
            }

            if (filters?.dateFrom) {
              result = result.filter((t) => t.date >= filters.dateFrom!);
            }
            if (filters?.dateTo) {
              result = result.filter((t) => t.date <= filters.dateTo!);
            }

            return result.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
          }),
        );
      }),
      catchError((error) => {
        console.error('Error fetching transactions:', error);
        return throwError(() => error);
      }),
    );
  }

  createTransaction(request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, request).pipe(
      catchError((error) => {
        console.error('Error creating transaction:', error);
        return throwError(() => error);
      }),
    );
  }

  updateTransaction(request: UpdateTransactionRequest): Observable<Transaction> {
    const { id, ...data } = request;
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}`, data).pipe(
      catchError((error) => {
        console.error(`Error updating transaction ${id}:`, error);
        return throwError(() => error);
      }),
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting transaction ${id}:`, error);
        return throwError(() => error);
      }),
    );
  }

  getStats(): Observable<TransactionStats> {
    const cached = this.transactionsCache.value;
    if (cached.length > 0) {
      return of(this.calculateStats(cached));
    }
    return this.http.get<Transaction[]>(this.apiUrl).pipe(
      map((transactions) => this.calculateStats(transactions)),
      catchError(() => of({ totalIncome: 0, totalExpenses: 0, count: 0 })),
    );
  }

  private calculateStats(transactions: Transaction[]): TransactionStats {
    return {
      totalIncome: transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      totalExpenses: transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      count: transactions.length,
    };
  }
}
