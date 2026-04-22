import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { BalanceCardComponent } from './balance-card.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { provideTranslocoTesting } from '../../../testing';

describe('BalanceCardComponent', () => {
  let component: BalanceCardComponent;
  let fixture: ComponentFixture<BalanceCardComponent>;

  const mockTransactionService = {
    getTransactions: vi.fn().mockReturnValue(of([])),
    getStats: vi.fn().mockReturnValue(of({ totalIncome: 0, totalExpenses: 0, count: 0 })),
  };

  const mockPreferencesService = {
    currency: signal('USD'),
    language: signal('en'),
    angularDateFormat: signal('MM/dd/yyyy'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslocoTesting(),
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: PreferencesService, useValue: mockPreferencesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});