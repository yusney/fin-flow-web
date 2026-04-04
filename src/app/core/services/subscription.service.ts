import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Subscription, SubscriptionFrequency, SubscriptionType } from '../../shared/models/subscription.model';
import { environment } from '../../../environments/environment';

export interface UpdateSubscriptionRequest {
  amount?: number;
  description?: string;
  billingDay?: number;
  frequency?: SubscriptionFrequency;
  type?: SubscriptionType;
  serviceUrl?: string;
  categoryId?: string;
}

export interface CreateSubscriptionRequest {
  description: string;
  amount: number;
  billingDay: number;
  categoryId: string;
  startDate: string;
  endDate?: string;
  frequency?: SubscriptionFrequency;
  type?: SubscriptionType;
  serviceUrl?: string;
}

export interface SubscriptionSummary {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  upcomingPayments: Subscription[];
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/subscriptions`;

  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(this.apiUrl).pipe(
      map((subs) => subs.map((s) => ({ ...s, amount: Number(s.amount) }))),
      catchError((error) => {
        console.error('Error fetching subscriptions:', error);
        return throwError(() => error);
      }),
    );
  }

  createSubscription(request: CreateSubscriptionRequest): Observable<Subscription> {
    return this.http.post<Subscription>(this.apiUrl, request).pipe(
      catchError((error) => {
        console.error('Error creating subscription:', error);
        return throwError(() => error);
      }),
    );
  }

  /** PUT /api/subscriptions/{id}/toggle — toggles isActive */
  toggleStatus(id: string): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      catchError((error) => {
        console.error('Error toggling subscription:', error);
        return throwError(() => error);
      }),
    );
  }

  updateSubscription(id: string, request: UpdateSubscriptionRequest): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.apiUrl}/${id}`, request).pipe(
      catchError((error) => {
        console.error('Error updating subscription:', error);
        return throwError(() => error);
      }),
    );
  }

  getHistory(id: string): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/${id}/history`).pipe(
      map((subs) => subs.map((s) => ({ ...s, amount: Number(s.amount) }))),
      catchError((error) => {
        console.error('Error fetching subscription history:', error);
        return throwError(() => error);
      }),
    );
  }

  // TODO: PENDING API CONFIRMATION — DELETE endpoint not yet verified
  deleteSubscription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Error deleting subscription:', error);
        return throwError(() => error);
      }),
    );
  }
}
