import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BudgetSectionComponent } from './budget-section.component';
import { BudgetService } from '../../../core/services/budget.service';
import { of } from 'rxjs';
import { Budget } from '../../../shared/models/budget.model';

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

    await TestBed.configureTestingModule({
      imports: [BudgetSectionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BudgetService, useValue: mockBudgetService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetSectionComponent);
    component = fixture.componentInstance;
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
    expect(content).toContain('August');
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
    const adjustButton = fixture.debugElement.query(By.css('button.uppercase.tracking-widest'));
    expect(adjustButton).toBeTruthy();
    expect(adjustButton.nativeElement.textContent.trim()).toContain('Adjust');
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
