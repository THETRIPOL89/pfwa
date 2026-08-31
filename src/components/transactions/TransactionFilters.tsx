import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import type { Account, Category, TransactionKind } from '@/types/domain';

export type FiltersState = {
  search: string;
  accountId: string;
  categoryId: string;
  kind: 'all' | TransactionKind;
  from: string;
  to: string;
};

export function TransactionFilters({
  accounts,
  categories,
  value,
  onChange,
}: {
  accounts: Account[];
  categories: Category[];
  value: FiltersState;
  onChange: (next: FiltersState) => void;
}) {
  const accountOptions = useMemo(
    () => [{ value: '', label: 'Tutti i conti' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))],
    [accounts],
  );
  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Tutte le categorie' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories],
  );

  const hasAnyFilter =
    value.search !== '' ||
    value.accountId !== '' ||
    value.categoryId !== '' ||
    value.kind !== 'all' ||
    value.from !== '' ||
    value.to !== '';

  const reset = () =>
    onChange({
      search: '',
      accountId: '',
      categoryId: '',
      kind: 'all',
      from: '',
      to: '',
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cerca per beneficiario, note, tag…"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
          />
        </div>
        <Segmented<'all' | TransactionKind>
          value={value.kind}
          onChange={(v) => onChange({ ...value, kind: v })}
          options={[
            { value: 'all', label: 'Tutte' },
            { value: 'expense', label: 'Uscite' },
            { value: 'income', label: 'Entrate' },
          ]}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={value.accountId}
          onChange={(v) => onChange({ ...value, accountId: v })}
          options={accountOptions}
        />
        <Select
          value={value.categoryId}
          onChange={(v) => onChange({ ...value, categoryId: v })}
          options={categoryOptions}
        />
        <Input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
        <Input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </div>

      {hasAnyFilter && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Filtri attivi.</span>
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="size-3.5" /> Reimposta
          </Button>
        </div>
      )}
    </div>
  );
}