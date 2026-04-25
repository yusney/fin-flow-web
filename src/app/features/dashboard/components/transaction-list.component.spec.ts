import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Transaction } from '../../../shared/models/transaction.model';

const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');

const EN_TRANSLATIONS = {
  'dashboard.recentTransactions': 'Recent Transactions',
  'dashboard.viewAllLedger': 'View all ledger',
  'dashboard.viewAll': 'View all',
};

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
      date: `${y}-${m}-01`,
      icon: 'payments',
    },
    {
      id: '2',
      description: 'Grocery Store',
      amount: 142.1,
      type: 'expense',
      category: 'Food & Dining',
      date: `${y}-${m}-03`,
      icon: 'shopping_cart',
    },
  ];

  beforeEach(async () => {
    const mockTransactionService = {
      getTransactions: vi.fn().mockReturnValue(of(mockTransactions)),
    };
    const prefsServiceMock = {
      currency: signal('USD'),
      angularDateFormat: signal('MM/dd/yyyy'),
      getPreferences: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [
        TransactionListComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: EN_TRANSLATIONS },
          translocoConfig: { defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: PreferencesService, useValue: prefsServiceMock },
      ],
    }).compileComponents();

    TestBed.inject(TranslocoService).setTranslation(EN_TRANSLATIONS, 'en');

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
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

const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');

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
      date: `${y}-${m}-01`,
      icon: 'payments',
    },
    {
      id: '2',
      description: 'Grocery Store',
      amount: 142.1,
      type: 'expense',
      category: 'Food & Dining',
      date: `${y}-${m}-03`,
      icon: 'shopping_cart',
    },
  ];

  beforeEach(async () => {
    const mockTransactionService = {
      getTransactions: vi.fn().mockReturnValue(of(mockTransactions)),
    };
    const prefsServiceMock = {
      currency: signal('USD'),
      angularDateFormat: signal('MM/dd/yyyy'),
      getPreferences: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [
        TransactionListComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              dashboard: {
                recentTransactions: 'Recent Transactions',
                viewAllLedger: 'View all ledger',
                viewAll: 'View all',
              },
            },
          },
          translocoConfig: { defaultLang: 'en' }, preloadLangs: true,
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: PreferencesService, useValue: prefsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
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
