import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createBudget,
  deleteBudget,
  listBudgets,
  updateBudget,
} from '@/services/budgets';
import { toast } from '@/components/ui/toast';
import type { Budget, BudgetInput } from '@/types/domain';

export const budgetKeys = {
  all: ['budgets'] as const,
};

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: budgetKeys.all,
    queryFn: listBudgets,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => createBudget(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
    onError: (err) => toast.error(`Salvataggio fallito: ${err.message}`),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BudgetInput> }) =>
      updateBudget(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
    onError: (err) => toast.error(`Aggiornamento fallito: ${err.message}`),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
    onError: (err) => toast.error(`Eliminazione fallita: ${err.message}`),
  });
}