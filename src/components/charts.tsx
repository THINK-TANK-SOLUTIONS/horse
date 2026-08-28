import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPct, formatUsd } from "@/lib/format";
import type { BacktestResult } from "@/lib/quant/types";

function day(t: number) {
  return new Date(t).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function EquityChart({ result }: { result: BacktestResult }) {
  const data = result.equity.map((p) => ({
    t: p.t,
    equity: p.equity,
    dd: p.drawdown * 100,
  }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-fg)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-fg)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={day}
            tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={48}
          />
          <YAxis
            tickFormatter={(v) => formatUsd(Number(v), true)}
            tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-fg)",
              fontSize: 12,
            }}
            labelFormatter={(v) => new Date(Number(v)).toLocaleDateString()}
            formatter={(v) => [formatUsd(Number(v)), "Equity"]}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="var(--color-fg)"
            fill="url(#eq)"
            strokeWidth={1.4}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DrawdownChart({ result }: { result: BacktestResult }) {
  const data = result.equity.map((p) => ({ t: p.t, dd: p.drawdown }));
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis
            tickFormatter={(v) => formatPct(Number(v))}
            tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [formatPct(Number(v)), "Drawdown"]}
            labelFormatter={(v) => new Date(Number(v)).toLocaleDateString()}
          />
          <Area
            type="monotone"
            dataKey="dd"
            stroke="var(--color-loss)"
            fill="var(--color-loss-dim)"
            strokeWidth={1.2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SparkEquity({ result }: { result: BacktestResult }) {
  const data = result.equity.filter((_, i) => i % 8 === 0 || i === result.equity.length - 1);
  const up = result.metrics.totalReturn >= 0;
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="equity"
            stroke={up ? "var(--color-gain)" : "var(--color-loss)"}
            fill={up ? "var(--color-gain-dim)" : "var(--color-loss-dim)"}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
