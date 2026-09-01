import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listInsights, refreshInsights } from '@/services/insights';
import { toast } from '@/components/ui/toast';
import type { Insight } from '@/types/domain';

export const insightKeys = {
  all: ['insights'] as const,
  list: () => [...insightKeys.all, 'list'] as const,
};

export function useInsights() {
  return useQuery<Insight[]>({
    queryKey: insightKeys.list(),
    queryFn: listInsights,
    staleTime: 1000 * 60 * 60 * 6,
  });
}

export function useRefreshInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refreshInsights,
    onSuccess: (data) => qc.setQueryData(insightKeys.list(), data),
    onError: (err) => toast.error(`Aggiornamento fallito: ${err.message}`),
  });
}