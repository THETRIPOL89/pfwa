import { useQuery } from '@tanstack/react-query';
import { listCategories } from '@/services/categories';
import type { Category } from '@/types/domain';

export const categoryKeys = {
  all: ['categories'] as const,
};

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: categoryKeys.all,
    queryFn: listCategories,
    staleTime: 1000 * 60 * 60,
  });
}