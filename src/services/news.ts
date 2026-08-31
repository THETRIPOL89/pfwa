import { API_BASE_URL, USE_MOCKS } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { NewsArticle } from '@/types/domain';

export async function listNews(opts?: { category?: NewsArticle['category'] }): Promise<NewsArticle[]> {
  if (USE_MOCKS) {
    await networkDelay(180);
    let rows = db.news.slice();
    if (opts?.category) rows = rows.filter((n) => n.category === opts.category);
    rows.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    return rows;
  }
  const params = new URLSearchParams();
  if (opts?.category) params.set('category', opts.category);
  const url = `${API_BASE_URL}/news-feed${params.toString() ? `?${params}` : ''}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`News fetch failed: ${resp.status}`);
  return (await resp.json()) as NewsArticle[];
}