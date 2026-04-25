import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { BudgetSectionComponent } from './budget-section.component';
import { BudgetService } from '../../../core/services/budget.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Budget } from '../../../shared/models/budget.model';

const EN_TRANSLATIONS = {
  'dashboard.budgets': 'Budgets',
  'dashboard.period': 'Period {{month}}',
  'dashboard.adjustBudgets': 'Adjust Budgets',
  'dashboard.nearLimit': 'Near monthly limit',
  'dashboard.exceededBy': 'Exceeded by ${{amount}}',
  'dashboard.paidFor': 'Paid for {{month}}',
};

describe('BudgetSectionComponent', () => {
  let component: BudgetSectionComponent;
  let fixture: ComponentFixture<BudgetSectionComponent>;

  const mockBudgets: Budget[] = [
    {
      id: '1',
      categoryId: 'cat-1',
      category: 'Food & Dining',
      limitAmount: 800,
      month: 3,
      year: 2026,
      spent: 740,
      icon: 'restaurant',
    },
    {
      id: '2',
      categoryId: 'cat-2',
      category: 'Rent & Utilities',
      limitAmount: 2100,
      month: 3,
      year: 2026,
      spent: 2100,
      icon: 'home',
    },
    {
      id: '3',
      categoryId: 'cat-3',
      category: 'Entertainment',
      limitAmount: 400,
      month: 3,
      year: 2026,
      spent: 650,
      icon: 'confirmation_number',
    },
  ];

  beforeEach(async () => {
    const mockBudgetService = {
      getBudgets: vi.fn().mockReturnValue(of(mockBudgets)),
    };
    const prefsServiceMock = {
      currency: signal('USD'),
      angularDateFormat: signal('MM/dd/yyyy'),
      getPreferences: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [
        BudgetSectionComponent,
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
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: PreferencesService, useValue: prefsServiceMock },
      ],
    }).compileComponents();

    // Ensure translations are set synchronously
    TestBed.inject(TranslocoService).setTranslation(EN_TRANSLATIONS, 'en');

    fixture = TestBed.createComponent(BudgetSectionComponent);
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
    expect(title.nativeElement.textContent.trim()).toBe('Budgets');
  });

  it('should display period label', () => {
    const content = fixture.nativeElement.textContent;
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    expect(content).toContain(currentMonth);
  });

  it('should render budgets from service', () => {
    fixture.detectChanges();

    const budgetCategories = fixture.debugElement.queryAll(
      By.css('.font-bold.font-headline.text-sm'),
    );
    expect(budgetCategories.length).toBeGreaterThan(0);
  });

  it('should display budget categories', () => {
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Food & Dining');
    expect(content).toContain('Rent & Utilities');
  });

  it('should display spent and limit amounts', () => {
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('$740');
    expect(content).toContain('$800');
  });

  it('should render progress bars', () => {
    fixture.detectChanges();

    const progressBars = fixture.debugElement.queryAll(By.css('.h-2, .h-3'));
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should show status labels for budgets', () => {
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Near monthly limit');
  });

  it('should have adjust budgets button', () => {
    const adjustLink = fixture.debugElement.query(By.css('a.uppercase.tracking-widest'));
    expect(adjustLink).toBeTruthy();
    expect(adjustLink.nativeElement.textContent.trim()).toContain('Adjust');
  });

  it('should calculate progress width correctly', () => {
    const budget = mockBudgets[0]; // 740/800 = 92.5%
    const width = component.progressWidth(budget);
    expect(width).toBe('92.5%');
  });

  it('should cap progress width at 100%', () => {
    const budget = mockBudgets[2]; // 650/400 = 162.5% -> capped at 100%
    const width = component.progressWidth(budget);
    expect(width).toBe('100%');
  });

  it('should apply correct color class for exceeded budget', () => {
    const exceededBudget = mockBudgets[2]; // spent > limit
    const colorClass = component.barColorClass(exceededBudget);
    expect(colorClass).toBe('bg-tertiary');
  });

  it('should apply correct color class for warning budget', () => {
    const warningBudget = mockBudgets[0]; // near limit
    const colorClass = component.barColorClass(warningBudget);
    expect(colorClass).toBe('bg-amber-500');
  });
});
