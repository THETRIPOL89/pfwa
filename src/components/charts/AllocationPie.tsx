import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function AllocationPie({
  data,
}: {
  data: { name: string; valueCents: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="valueCents"
          nameKey="name"
          innerRadius="55%"
          outerRadius="90%"
          paddingAngle={2}
          stroke="hsl(var(--background))"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
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
          formatter={(v) => formatCurrency(v as number) as unknown as [string, string]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}