import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TransactionService, CreateTransactionRequest } from './transaction.service';
import { environment } from '../../../environments/environment';
import { Transaction, Category } from '../../shared/models/transaction.model';

describe('TransactionService with API', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

  const mockCategory: Category = {
    id: 'cat-1',
    name: 'Food & Dining',
    type: 'expense',
    userId: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockTransaction: Transaction = {
    id: 'tx-123',
    description: 'Test Transaction',
    amount: 100,
    type: 'expense',
    category: 'Food & Dining',
    categoryId: 'cat-1',
    date: '2024-03-29',
    icon: 'restaurant',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TransactionService],
    });

    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTransactions', () => {
    it('should fetch transactions from API', () => {
      const mockTransactions = [mockTransaction];

      service.getTransactions().subscribe((transactions) => {
        expect(transactions.length).toBe(1);
        expect(transactions[0].id).toBe('tx-123');
      });

      // First request for categories
      const categoriesReq = httpMock.expectOne(`${environment.apiUrl}/categories`);
      expect(categoriesReq.request.method).toBe('GET');
      categoriesReq.flush([mockCategory]);

      // Second request for transactions
      const transactionsReq = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(transactionsReq.request.method).toBe('GET');
      transactionsReq.flush(mockTransactions);
    });

    it('should resolve categoryId to category name', () => {
      const transactionWithCategoryId = {
        ...mockTransaction,
        category: undefined,
        categoryId: 'cat-1',
      };

      service.getTransactions().subscribe((transactions) => {
        expect(transactions[0].category).toBe('Food & Dining');
      });

      // Categories request
      const categoriesReq = httpMock.expectOne(`${environment.apiUrl}/categories`);
      categoriesReq.flush([mockCategory]);

      // Transactions request
      const transactionsReq = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      transactionsReq.flush([transactionWithCategoryId]);
    });

    it('should add icons to transactions without them', () => {
      const transactionWithoutIcon = { ...mockTransaction, icon: undefined };

      service.getTransactions().subscribe((transactions) => {
        expect(transactions[0].icon).toBe('restaurant'); // From CATEGORY_ICONS
      });

      // Categories request
      const categoriesReq = httpMock.expectOne(`${environment.apiUrl}/categories`);
      categoriesReq.flush([mockCategory]);

      // Transactions request
      const transactionsReq = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      transactionsReq.flush([transactionWithoutIcon]);
    });

    it('should filter by search term', () => {
      const transactions = [
        { ...mockTransaction, description: 'Grocery Store' },
        { ...mockTransaction, id: 'tx-2', description: 'Coffee Shop' },
      ];

      service.getTransactions({ search: 'grocery' }).subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].description).toBe('Grocery Store');
      });

      // Categories request
      const categoriesReq = httpMock.expectOne(`${environment.apiUrl}/categories`);
      categoriesReq.flush([mockCategory]);

      // Transactions request
      const transactionsReq = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      transactionsReq.flush(transactions);
    });

    it('should filter by type', () => {
      const incomeCategory = { id: 'cat-2', name: 'Salary', type: 'income', userId: 'u1', createdAt: '', updatedAt: '' };
      const transactions = [
        { ...mockTransaction, categoryId: 'cat-2', type: 'income' as const },
        { ...mockTransaction, id: 'tx-2', type: 'expense' as const },
      ];

      service.getTransactions({ type: 'income' }).subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('income');
      });

      // Categories request
      const categoriesReq = httpMock.expectOne(`${environment.apiUrl}/categories`);
      categoriesReq.flush([mockCategory, incomeCategory]);

      // Transactions request
      const transactionsReq = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      transactionsReq.flush(transactions);
    });
  });

  describe('createTransaction', () => {
    it('should create transaction via API', () => {
      const request: CreateTransactionRequest = {
        description: 'New Transaction',
        amount: 50,
        categoryId: 'cat-1',
        date: '2024-03-29',
      };

      service.createTransaction(request).subscribe((transaction) => {
        expect(transaction.description).toBe('New Transaction');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ ...mockTransaction, ...request });
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction via API', () => {
      const request = {
        id: 'tx-123',
        description: 'Updated Transaction',
        amount: 150,
        categoryId: 'cat-1',
        date: '2024-03-29',
      };

      service.updateTransaction(request).subscribe((transaction) => {
        expect(transaction.description).toBe('Updated Transaction');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/tx-123`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockTransaction, ...request });
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction via API', () => {
      service.deleteTransaction('tx-123').subscribe(() => {
        expect(true).toBe(true); // Success
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/tx-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getStats', () => {
    it('should calculate stats from transactions', () => {
      const transactions = [
        { ...mockTransaction, type: 'income' as const, amount: 1000 },
        { ...mockTransaction, id: 'tx-2', type: 'expense' as const, amount: 500 },
        { ...mockTransaction, id: 'tx-3', type: 'expense' as const, amount: 200 },
      ];

      service.getStats().subscribe((stats) => {
        expect(stats.totalIncome).toBe(1000);
        expect(stats.totalExpenses).toBe(700);
        expect(stats.count).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      req.flush(transactions);
    });
  });
});
