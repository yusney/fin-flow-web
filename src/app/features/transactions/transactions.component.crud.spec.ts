import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { signal } from '@angular/core';
import { TransactionsComponent } from './transactions.component';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { of, throwError } from 'rxjs';
import { Transaction, Category } from '../../shared/models/transaction.model';

const EN_TRANSLATIONS = {
  'transactions.errorDescription': 'Description is required',
  'transactions.errorAmount': 'Amount must be greater than 0',
  'transactions.errorCategory': 'Category is required',
  'transactions.errorDate': 'Date is required',
};

describe('TransactionsComponent CRUD', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;
  let transactionServiceSpy: {
    getTransactions: ReturnType<typeof vi.fn>;
    createTransaction: ReturnType<typeof vi.fn>;
    updateTransaction: ReturnType<typeof vi.fn>;
    deleteTransaction: ReturnType<typeof vi.fn>;
    getStats: ReturnType<typeof vi.fn>;
  };

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      description: 'Monthly Salary',
      amount: 8500,
      type: 'income',
      category: 'Income',
      categoryId: 'cat-1',
      date: '2024-08-01',
      icon: 'payments',
    },
    {
      id: 'tx-2',
      description: 'Grocery Store',
      amount: 142.1,
      type: 'expense',
      category: 'Food & Dining',
      categoryId: 'cat-2',
      date: '2024-08-03',
      icon: 'shopping_cart',
    },
  ];

  const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Income', type: 'income', userId: 'u1', createdAt: '', updatedAt: '' },
    { id: 'cat-2', name: 'Food & Dining', type: 'expense', userId: 'u1', createdAt: '', updatedAt: '' },
  ];

  beforeEach(async () => {
    transactionServiceSpy = {
      getTransactions: vi.fn().mockReturnValue(of(mockTransactions)),
      createTransaction: vi.fn().mockReturnValue(of(mockTransactions[0])),
      updateTransaction: vi.fn().mockReturnValue(of(mockTransactions[0])),
      deleteTransaction: vi.fn().mockReturnValue(of(void 0)),
      getStats: vi.fn().mockReturnValue(of({ totalIncome: 8500, totalExpenses: 142.1, count: 2 })),
    };

    const categoryServiceSpy = {
      getCategories: vi.fn().mockReturnValue(of(mockCategories)),
    };
    const prefsServiceMock = {
      currency: signal('USD'),
      angularDateFormat: signal('MM/dd/yyyy'),
      getPreferences: vi.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [
        TransactionsComponent,
        NoopAnimationsModule,
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
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: PreferencesService, useValue: prefsServiceMock },
      ],
    }).compileComponents();

    TestBed.inject(TranslocoService).setTranslation(EN_TRANSLATIONS, 'en');

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Create Transaction', () => {
    it('should open create modal', () => {
      component.openCreateModal();
      expect(component.isModalOpen()).toBe(true);
      expect(component.modalMode()).toBe('create');
    });

    it('should validate form before submit', () => {
      component.openCreateModal();
      component.formData = {
        description: '',
        amount: 0,
        type: 'expense',
        categoryId: '',
        date: '',
      };

      component.saveTransaction();

      expect(component.formError()).toBe('Description is required');
      expect(transactionServiceSpy.createTransaction).not.toHaveBeenCalled();
    });

    it('should create transaction with valid form', () => {
      component.openCreateModal();
      component.formData = {
        description: 'New Transaction',
        amount: 100,
        type: 'expense',
        categoryId: 'cat-2',
        date: '2024-03-29',
      };

      component.saveTransaction();

      expect(transactionServiceSpy.createTransaction).toHaveBeenCalledWith({
        description: 'New Transaction',
        amount: 100,
        categoryId: 'cat-2',
        date: '2024-03-29',
      });
    });

    it('should show error when creation fails', () => {
      transactionServiceSpy.createTransaction.mockReturnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );

      component.openCreateModal();
      component.formData = {
        description: 'New Transaction',
        amount: 100,
        type: 'expense',
        categoryId: 'cat-2',
        date: '2024-03-29',
      };

      component.saveTransaction();

      expect(component.formError()).toBe('Server error');
      expect(component.isSaving()).toBe(false);
    });
  });

  describe('Edit Transaction', () => {
    it('should open edit modal with transaction data', () => {
      const transaction = mockTransactions[0];
      component.openEditModal(transaction);

      expect(component.isModalOpen()).toBe(true);
      expect(component.modalMode()).toBe('edit');
      expect(component.formData.description).toBe(transaction.description);
      expect(component.formData.amount).toBe(transaction.amount);
    });

    it('should update transaction', () => {
      component.openEditModal(mockTransactions[0]);
      component.formData.description = 'Updated Description';

      component.saveTransaction();

      expect(transactionServiceSpy.updateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx-1',
          description: 'Updated Description',
        }),
      );
    });
  });

  describe('Delete Transaction', () => {
    it('should open delete confirmation modal', () => {
      component.confirmDelete(mockTransactions[0]);

      expect(component.deleteModalOpen()).toBe(true);
      expect(component.transactionToDelete()).toEqual(mockTransactions[0]);
    });

    it('should delete transaction on confirm', () => {
      component.confirmDelete(mockTransactions[0]);
      component.executeDelete();

      expect(transactionServiceSpy.deleteTransaction).toHaveBeenCalledWith('tx-1');
    });

    it('should show error when deletion fails', () => {
      transactionServiceSpy.deleteTransaction.mockReturnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } })),
      );

      component.confirmDelete(mockTransactions[0]);
      component.executeDelete();

      // Toast should show error
      expect(component.toast()).toEqual({ message: 'Cannot delete', type: 'error' });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.openCreateModal();
    });

    it('should require description', () => {
      component.formData = {
        description: '',
        amount: 100,
        type: 'expense',
        categoryId: 'cat-2',
        date: '2024-03-29',
      };
      component.saveTransaction();
      expect(component.formError()).toBe('Description is required');
    });

    it('should require amount > 0', () => {
      component.formData = {
        description: 'Test',
        amount: 0,
        type: 'expense',
        categoryId: 'cat-2',
        date: '2024-03-29',
      };
      component.saveTransaction();
      expect(component.formError()).toBe('Amount must be greater than 0');
    });

    it('should require category', () => {
      component.formData = {
        description: 'Test',
        amount: 100,
        type: 'expense',
        categoryId: '',
        date: '2024-03-29',
      };
      component.saveTransaction();
      expect(component.formError()).toBe('Category is required');
    });

    it('should require date', () => {
      component.formData = {
        description: 'Test',
        amount: 100,
        type: 'expense',
        categoryId: 'cat-2',
        date: '',
      };
      component.saveTransaction();
      expect(component.formError()).toBe('Date is required');
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast', () => {
      component.showToast('Success!', 'success');
      expect(component.toast()).toEqual({ message: 'Success!', type: 'success' });
    });

    it('should show error toast', () => {
      component.showToast('Error!', 'error');
      expect(component.toast()).toEqual({ message: 'Error!', type: 'error' });
    });

    it('should clear toast after 3 seconds', () => {
      vi.useFakeTimers();
      component.showToast('Test', 'success');
      expect(component.toast()).not.toBeNull();

      vi.advanceTimersByTime(3000);
      expect(component.toast()).toBeNull();
      vi.useRealTimers();
    });
  });
});
