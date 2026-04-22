import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { BudgetSectionComponent } from './budget-section.component';
import { BudgetService } from '../../../core/services/budget.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { Budget } from '../../../shared/models/budget.model';
import { provideTranslocoTesting } from '../../../testing';

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

  const mockBudgetService = {
    getBudgets: vi.fn().mockReturnValue(of(mockBudgets)),
  };

  const mockPreferencesService = {
    currency: signal('USD'),
    language: signal('en'),
    angularDateFormat: signal('MM/dd/yyyy'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetSectionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslocoTesting(),
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: PreferencesService, useValue: mockPreferencesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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