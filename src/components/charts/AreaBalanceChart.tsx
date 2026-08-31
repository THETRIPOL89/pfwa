import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BalancePoint } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';

export function AreaBalanceChart({ data }: { data: BalancePoint[] }) {
  // Sample every ~7th day so labels stay readable.
  const sampled = data.filter((_, i) => i % 7 === 0 || i === data.length - 1);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={sampled} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v, 'it-IT').split(' ')[0]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v as number, 'EUR', 'it-IT', { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 4' }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => formatDate(v as string, 'it-IT')}
          formatter={(v) => [formatCurrency(v as number), 'Saldo'] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="balanceCents"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#balanceGradient)"
          isAnimationActive
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}