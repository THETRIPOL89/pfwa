import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '@/services';
import { formatCurrency } from '@/lib/utils';
import type { Category } from '@/types/domain';

export function DonutCategories({
  data,
  categories,
}: {
  data: CategoryBreakdown[];
  categories: Category[];
}) {
  const enriched = data
    .map((d) => {
      const cat = categories.find((c) => c.id === d.categoryId);
      return {
        ...d,
        name: cat?.name ?? 'Senza categoria',
        color: cat ? `hsl(var(--${cat.color.replace('cat-', '')}))` : 'hsl(var(--muted-foreground))',
      };
    })
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={enriched}
          dataKey="amountCents"
          nameKey="name"
          innerRadius="60%"
          outerRadius="92%"
          paddingAngle={2}
          stroke="hsl(var(--background))"
          strokeWidth={2}
          isAnimationActive
        >
          {enriched.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v, n) => [formatCurrency(v as number), n as string] as [string, string]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}