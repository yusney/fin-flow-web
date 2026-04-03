export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface Budget {
  id: string;
  categoryId: string;
  category: string;    // name for display — derived from API response
  limitAmount: number; // was 'limit'
  month: number;
  year: number;
  spent: number;
  icon?: string;
}

/**
 * Computes the status of a budget based on the spent/limitAmount ratio.
 */
export function budgetStatus(budget: Budget): BudgetStatus {
  if (budget.spent > budget.limitAmount) return 'exceeded';
  if (budget.limitAmount > 0 && budget.spent / budget.limitAmount > 0.8) return 'warning';
  return 'ok';
}
