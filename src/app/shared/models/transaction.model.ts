export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  /** ISO 8601 date string, e.g. "2024-08-01" */
  date: string;
  type: TransactionType;
  /** Material Symbol icon name, e.g. "payments", "shopping_cart" */
  icon?: string;
  /** Category ID from API */
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  userId: string;
  createdAt: string;
  updatedAt: string;
}
