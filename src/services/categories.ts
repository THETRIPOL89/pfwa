import { supabase, USE_MOCKS } from '@/lib/supabase';
import { db, networkDelay } from './_db';
import type { Category, CategoryKind } from '@/types/domain';

type CategoryRow = {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  is_default: boolean;
};

function rowToCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    kind: r.kind,
    parentId: r.parent_id,
    isDefault: r.is_default,
  };
}

export async function listCategories(): Promise<Category[]> {
  if (USE_MOCKS) {
    await networkDelay(80);
    return [...db.categories];
  }
  // RLS lets every user see `user_id IS NULL` (defaults) + their own.
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw error;
  return (data ?? []).map(rowToCategory);
}