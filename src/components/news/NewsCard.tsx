import { ExternalLink, Newspaper } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { timeAgo } from '@/lib/utils';
import type { NewsArticle } from '@/types/domain';

export function NewsCard({ article }: { article: NewsArticle }) {
  const sourceColor: Record<string, string> = {
    'Il Sole 24 Ore': 'bg-warning/15 text-warning',
    'Reuters Italia': 'bg-info/15 text-info',
    'CoinDesk': 'bg-amber-500/15 text-amber-600',
    'La Stampa': 'bg-destructive/15 text-destructive',
    Morningstar: 'bg-primary/15 text-primary',
    'Corriere della Sera': 'bg-rose-500/15 text-rose-500',
    Bloomberg: 'bg-slate-500/15 text-slate-500',
    Reuters: 'bg-info/15 text-info',
    'Personal Finance Lab': 'bg-emerald-500/15 text-emerald-500',
    Eurostat: 'bg-blue-500/15 text-blue-500',
  };
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block transition-transform hover:-translate-y-0.5"
    >
      <Card className="h-full p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge variant="outline" className={sourceColor[article.source] ?? ''}>
            <Newspaper className="mr-1 size-3" />
            {article.source}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(article.publishedAt)}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
            {article.summary}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Apri <ExternalLink className="size-3" />
        </div>
      </Card>
    </a>
  );
}