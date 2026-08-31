import { Area, AreaChart, ResponsiveContainer } from 'recharts';

/** Tiny sparkline used in KPI cards / holding rows. */
export function Sparkline({
  data,
  color = 'hsl(var(--primary))',
}: {
  data: number[];
  color?: string;
}) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          fill={`url(#spark-${color})`}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}