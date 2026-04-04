import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { BudgetService, CreateBudgetRequest } from './budget.service';
import { environment } from '../../../environments/environment';

describe('BudgetService', () => {
  let service: BudgetService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/budgets`;

  const mockApiBudgets = [
    {
      id: 'b1',
      categoryId: 'cat-1',
      limitAmount: 600,
      month: 3,
      year: 2026,
      spent: 250,
      category: { id: 'cat-1', name: 'Food & Dining', type: 'expense' },
    },
    {
      id: 'b2',
      categoryId: 'cat-2',
      limitAmount: 200,
      month: 3,
      year: 2026,
      spent: 180,
      category: { id: 'cat-2', name: 'Entertainment', type: 'expense' },
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), BudgetService],
    });

    service = TestBed.inject(BudgetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBudgets', () => {
    it('should fetch budgets from API and map fields', async () => {
      const promise = firstValueFrom(service.getBudgets());

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/status`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('month')).toBeTruthy();
      expect(req.request.params.get('year')).toBeTruthy();
      req.flush(mockApiBudgets);

      const budgets = await promise;
      expect(budgets.length).toBe(2);
      expect(budgets[0].category).toBe('Food & Dining');
      expect(budgets[0].limitAmount).toBe(600);
      expect(budgets[0].spent).toBe(250);
      expect(budgets[0].categoryId).toBe('cat-1');
    });

    it('should return empty array on HTTP error', async () => {
      const promise = firstValueFrom(service.getBudgets());

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/status`);
      req.error(new ProgressEvent('error'));

      await expect(promise).rejects.toThrow();
    });
  });

  describe('createBudget', () => {
    it('should POST to API and return mapped budget', async () => {
      const request: CreateBudgetRequest = {
        categoryId: 'cat-3',
        limitAmount: 500,
        month: 3,
        year: 2026,
      };

      const apiResponse = {
        id: 'b3',
        categoryId: 'cat-3',
        limitAmount: 500,
        month: 3,
        year: 2026,
        spent: 0,
        category: { id: 'cat-3', name: 'Transportation', type: 'expense' },
      };

      const promise = firstValueFrom(service.createBudget(request));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResponse);

      const budget = await promise;
      expect(budget.category).toBe('Transportation');
      expect(budget.limitAmount).toBe(500);
      expect(budget.categoryId).toBe('cat-3');
      expect(budget.icon).toBe('directions_car');
    });
  });
});
