import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createInvestment,
  deleteInvestment,
  listDividends,
  listInvestments,
  updateInvestment,
} from '@/services/investments';
import { toast } from '@/components/ui/toast';
import type { Dividend, Investment, InvestmentInput } from '@/types/domain';

export const investmentKeys = {
  all: ['investments'] as const,
  list: () => [...investmentKeys.all, 'list'] as const,
  dividends: () => [...investmentKeys.all, 'dividends'] as const,
};

export function useInvestments() {
  return useQuery<Investment[]>({
    queryKey: investmentKeys.list(),
    queryFn: listInvestments,
  });
}

export function useDividends() {
  return useQuery<Dividend[]>({
    queryKey: investmentKeys.dividends(),
    queryFn: listDividends,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InvestmentInput) => createInvestment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: investmentKeys.all }),
    onError: (err) => toast.error(`Salvataggio fallito: ${err.message}`),
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<InvestmentInput> }) =>
      updateInvestment(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: investmentKeys.all }),
    onError: (err) => toast.error(`Aggiornamento fallito: ${err.message}`),
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInvestment,
    onSuccess: () => qc.invalidateQueries({ queryKey: investmentKeys.all }),
    onError: (err) => toast.error(`Eliminazione fallita: ${err.message}`),
  });
}