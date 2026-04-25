import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { BalanceCardComponent } from './balance-card.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

const mockTransactions = [
  {
    id: '1',
    description: 'Salary',
    amount: 12400,
    type: 'income' as const,
    category: 'Income',
    date: `${currentYear}-${currentMonth}-01`,
    icon: 'payments',
  },
  {
    id: '2',
    description: 'Rent',
    amount: 4822.15,
    type: 'expense' as const,
    category: 'Housing',
    date: `${currentYear}-${currentMonth}-02`,
    icon: 'home',
  },
];

const EN_TRANSLATIONS = {
  'dashboard.balance': 'Balance {{month}}',
  'dashboard.monthlyIncome': 'Monthly Income',
  'dashboard.monthlyExpenses': 'Monthly Expenses',
  'dashboard.addTransaction': 'Add Transaction',
  'common.add': 'Add',
};

describe('BalanceCardComponent', () => {
  let component: BalanceCardComponent;
  let fixture: ComponentFixture<BalanceCardComponent>;

  beforeEach(async () => {
    const txServiceMock = { getTransactions: vi.fn().mockReturnValue(of(mockTransactions)) };
    const prefsServiceMock = { currency: signal('USD'), getPreferences: vi.fn().mockReturnValue(of(null)) };

    await TestBed.configureTestingModule({
      imports: [
        BalanceCardComponent,
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
        { provide: TransactionService, useValue: txServiceMock },
        { provide: PreferencesService, useValue: prefsServiceMock },
      ],
    }).compileComponents();

    TestBed.inject(TranslocoService).setTranslation(EN_TRANSLATIONS, 'en');

    fixture = TestBed.createComponent(BalanceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display total balance', () => {
    const content = fixture.nativeElement.textContent;
    // totalBalance = income - expenses = 12400 - 4822.15 = 7577.85
    expect(content).toContain('$7,577.85');
  });

  it('should display monthly income', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Monthly Income');
    expect(content).toContain('+$12,400');
  });

  it('should display monthly expenses', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Monthly Expenses');
    expect(content).toContain('-$4,822');
  });

  it('should have add transaction button', () => {
    const addButton = fixture.debugElement.query(By.css('a[routerLink="/transactions"]'));
    expect(addButton).toBeTruthy();
    expect(addButton.nativeElement.textContent).toContain('Add');
  });

  it('should apply correct styling classes', () => {
    const cardContainer = fixture.debugElement.query(By.css('.bg-surface-container-lowest'));
    expect(cardContainer).toBeTruthy();
  });

  it('should use tabular nums for balance display', () => {
    const balanceAmount = fixture.debugElement.query(By.css('.tabular-nums'));
    expect(balanceAmount).toBeTruthy();
  });
});

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

const mockTransactions = [
  {
    id: '1',
    description: 'Salary',
    amount: 12400,
    type: 'income' as const,
    category: 'Income',
    date: `${currentYear}-${currentMonth}-01`,
    icon: 'payments',
  },
  {
    id: '2',
    description: 'Rent',
    amount: 4822.15,
    type: 'expense' as const,
    category: 'Housing',
    date: `${currentYear}-${currentMonth}-02`,
    icon: 'home',
  },
];

describe('BalanceCardComponent', () => {
  let component: BalanceCardComponent;
  let fixture: ComponentFixture<BalanceCardComponent>;

  beforeEach(async () => {
    const txServiceMock = { getTransactions: vi.fn().mockReturnValue(of(mockTransactions)) };
    const prefsServiceMock = { currency: signal('USD'), getPreferences: vi.fn().mockReturnValue(of(null)) };

    await TestBed.configureTestingModule({
      imports: [
        BalanceCardComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              dashboard: {
                balance: 'Balance {{month}}',
                monthlyIncome: 'Monthly Income',
                monthlyExpenses: 'Monthly Expenses',
                addTransaction: 'Add Transaction',
              },
              common: { add: 'Add' },
            },
          },
          translocoConfig: { defaultLang: 'en' }, preloadLangs: true,
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: txServiceMock },
        { provide: PreferencesService, useValue: prefsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display total balance', () => {
    const content = fixture.nativeElement.textContent;
    // totalBalance = income - expenses = 12400 - 4822.15 = 7577.85
    expect(content).toContain('$7,577.85');
  });

  it('should display monthly income', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Monthly Income');
    expect(content).toContain('+$12,400');
  });

  it('should display monthly expenses', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Monthly Expenses');
    expect(content).toContain('-$4,822');
  });

  it('should have add transaction button', () => {
    const addButton = fixture.debugElement.query(By.css('a[routerLink="/transactions"]'));
    expect(addButton).toBeTruthy();
    expect(addButton.nativeElement.textContent).toContain('Add');
  });

  it('should apply correct styling classes', () => {
    const cardContainer = fixture.debugElement.query(By.css('.bg-surface-container-lowest'));
    expect(cardContainer).toBeTruthy();
  });

  it('should use tabular nums for balance display', () => {
    const balanceAmount = fixture.debugElement.query(By.css('.tabular-nums'));
    expect(balanceAmount).toBeTruthy();
  });
});
