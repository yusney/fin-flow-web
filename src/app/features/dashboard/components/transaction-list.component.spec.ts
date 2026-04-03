import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { of } from 'rxjs';
import { Transaction } from '../../../shared/models/transaction.model';

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

  beforeEach(async () => {
    const mockTransactionService = {
      getTransactions: vi.fn().mockReturnValue(of(mockTransactions)),
    };

    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section title', () => {
    const title = fixture.debugElement.query(By.css('h2'));
    expect(title.nativeElement.textContent.trim()).toBe('Recent Transactions');
  });

  it('should display "View all" link', () => {
    const viewAllLink = fixture.debugElement.query(By.css('a'));
    expect(viewAllLink.nativeElement.textContent.trim()).toContain('View');
  });

  it('should render transactions from service', () => {
    fixture.detectChanges();

    const transactionItems = fixture.debugElement.queryAll(
      By.css('.bg-surface-container-lowest, .bg-surface-container-low'),
    );
    expect(transactionItems.length).toBeGreaterThan(0);
  });

  it('should display transaction descriptions', () => {
    fixture.detectChanges();

    const descriptions = fixture.debugElement.queryAll(By.css('.font-bold.font-headline'));
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('should display income transactions', () => {
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Monthly Salary');
    expect(content).toContain('+');
  });

  it('should display expense transactions', () => {
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Grocery Store');
    expect(content).toContain('-');
  });

  it('should display transaction icons', () => {
    fixture.detectChanges();

    const icons = fixture.debugElement.queryAll(By.css('.material-symbols-outlined'));
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should alternate background colors for transactions', () => {
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(
      By.css('.bg-surface-container-lowest, .bg-surface-container-low'),
    );

    if (items.length >= 2) {
      const firstClass = items[0].classes['bg-surface-container-lowest'];
      const secondClass = items[1].classes['bg-surface-container-low'];
      expect(firstClass || secondClass).toBeTruthy();
    }
  });
});
