import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { Transaction } from '../../../shared/models/transaction.model';
import { provideTranslocoTesting } from '../../../testing';

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      description: 'Monthly Salary',
      amount: 8500,
      type: 'income',
      category: 'Income',
      date: '2024-08-01',
      icon: 'payments',
    },
    {
      id: '2',
      description: 'Grocery Store',
      amount: 142.1,
      type: 'expense',
      category: 'Food & Dining',
      date: '2024-08-03',
      icon: 'shopping_cart',
    },
  ];

  const mockTransactionService = {
    getTransactions: vi.fn().mockReturnValue(of(mockTransactions)),
  };

  const mockPreferencesService = {
    currency: signal('USD'),
    language: signal('en'),
    angularDateFormat: signal('MM/dd/yyyy'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslocoTesting(),
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: PreferencesService, useValue: mockPreferencesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});