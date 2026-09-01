import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
  type ListTransactionsArgs,
  type PaginatedTransactions,
} from '@/services/transactions';
import { toast } from '@/components/ui/toast';
import type { Transaction, TransactionInput } from '@/types/domain';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (args: ListTransactionsArgs) => [...transactionKeys.all, 'list', args] as const,
};

export function useTransactions(args: ListTransactionsArgs = {}) {
  return useQuery<PaginatedTransactions>({
    queryKey: transactionKeys.list(args),
    queryFn: () => listTransactions(args),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => createTransaction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
    onError: (err) => toast.error(`Salvataggio fallito: ${err.message}`),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TransactionInput> }) =>
      updateTransaction(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
    onError: (err) => toast.error(`Aggiornamento fallito: ${err.message}`),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onMutate: async (id: string) => {
      // Optimistic remove from all transaction queries
      const previous = qc.getQueriesData<PaginatedTransactions>({
        queryKey: transactionKeys.all,
      });
      previous.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<PaginatedTransactions>(key, {
          ...data,
          items: data.items.filter((t) => t.id !== id),
          total: data.total - 1,
        });
      });
      return { previous };
    },
    onError: (err, _id, ctx) => {
      // Roll back optimistic update.
      const previous = (ctx as { previous?: ReadonlyArray<readonly [readonly unknown[], unknown]> } | undefined)
        ?.previous;
      previous?.forEach(([key, data]) => {
        qc.setQueryData(key as readonly unknown[], data);
      });
      toast.error(`Eliminazione fallita: ${err.message}`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export type { Transaction, TransactionInput };