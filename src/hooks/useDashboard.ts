import { useQuery } from '@tanstack/react-query';
import {
  getBalanceTimeline,
  getCategoryBreakdown,
  getMonthlyTotals,
  type BalancePoint,
  type CategoryBreakdown,
} from '@/services';

export const dashboardKeys = {
  balance: (months: number) => ['dashboard', 'balance', months] as const,
  categories: (month?: string) => ['dashboard', 'categories', month ?? 'current'] as const,
  monthly: (months: number) => ['dashboard', 'monthly', months] as const,
};

export function useBalanceTimeline(months = 6) {
  return useQuery<BalancePoint[]>({
    queryKey: dashboardKeys.balance(months),
    queryFn: () => getBalanceTimeline(months),
  });
}

export function useCategoryBreakdown() {
  return useQuery<CategoryBreakdown[]>({
    queryKey: dashboardKeys.categories(),
    queryFn: () => getCategoryBreakdown(),
  });
}

export function useMonthlyTotals(months = 6) {
  return useQuery({
    queryKey: dashboardKeys.monthly(months),
    queryFn: () => getMonthlyTotals(months),
  });
}