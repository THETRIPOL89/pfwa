import { useQuery } from '@tanstack/react-query';
import { listNews } from '@/services/news';
import type { NewsArticle } from '@/types/domain';

export const newsKeys = {
  all: ['news'] as const,
  list: (category?: NewsArticle['category']) =>
    [...newsKeys.all, 'list', category ?? 'all'] as const,
};

export function useNews(category?: NewsArticle['category']) {
  return useQuery<NewsArticle[]>({
    queryKey: newsKeys.list(category),
    queryFn: () => listNews({ category }),
    staleTime: 1000 * 60 * 15,
  });
}