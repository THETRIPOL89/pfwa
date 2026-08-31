import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsCard } from '@/components/news/NewsCard';
import { useNews } from '@/hooks/useNews';
import type { NewsArticle } from '@/types/domain';

type CategoryFilter = 'all' | NonNullable<NewsArticle['category']>;

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'mercati', label: 'Mercati' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'aziende', label: 'Aziende' },
  { value: 'economia', label: 'Economia' },
  { value: 'personale', label: 'Personale' },
];

export function NewsPage() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const news = useNews(filter === 'all' ? undefined : (filter as NewsArticle['category']));

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notizie di mercato</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggiornamenti finanziari da Google News RSS, aggregati
            server-side via Edge Function.
          </p>
        </div>
        <Segmented<CategoryFilter>
          value={filter}
          onChange={setFilter}
          options={CATEGORIES}
          className="flex-wrap"
        />
      </header>

      {news.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : !news.data || news.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nessuna notizia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Prova a cambiare categoria o controlla più tardi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {news.data.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}