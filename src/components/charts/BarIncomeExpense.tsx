import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function BarIncomeExpense({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={(v) => {
            const d = new Date(`${v}-01`);
            return d.toLocaleDateString('it-IT', { month: 'short' });
          }}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v as number, 'EUR', 'it-IT', { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) =>
            new Date(`${v}-01`).toLocaleDateString('it-IT', {
              month: 'long',
              year: 'numeric',
            })
          }
          formatter={(v, n) =>
            [formatCurrency(v as number), n === 'income' ? 'Entrate' : 'Uscite'] as [
              string,
              string,
            ]
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v) => (v === 'income' ? 'Entrate' : 'Uscite')}
        />
        <Bar
          dataKey="income"
          fill="hsl(var(--success))"
          radius={[4, 4, 0, 0]}
          animationDuration={500}
        />
        <Bar
          dataKey="expense"
          fill="hsl(var(--destructive))"
          radius={[4, 4, 0, 0]}
          animationDuration={500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}