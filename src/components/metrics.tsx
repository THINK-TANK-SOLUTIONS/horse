import { formatNum, formatPct, formatUsd, pnlClass } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BacktestMetrics } from "@/lib/quant/types";

const CELLS: { key: keyof BacktestMetrics; label: string; fmt: (m: BacktestMetrics) => string; signed?: boolean }[] = [
  { key: "totalReturn", label: "Return", fmt: (m) => formatPct(m.totalReturn), signed: true },
  { key: "cagr", label: "CAGR", fmt: (m) => formatPct(m.cagr), signed: true },
  { key: "sharpe", label: "Sharpe", fmt: (m) => formatNum(m.sharpe) },
  { key: "maxDrawdown", label: "Max DD", fmt: (m) => formatPct(m.maxDrawdown), signed: true },
  { key: "winRate", label: "Win rate", fmt: (m) => formatPct(m.winRate) },
  { key: "profitFactor", label: "Profit factor", fmt: (m) => formatNum(m.profitFactor) },
  { key: "trades", label: "Trades", fmt: (m) => String(m.trades) },
  { key: "buyHold", label: "Buy & hold", fmt: (m) => formatPct(m.buyHold), signed: true },
  { key: "netProfit", label: "Net P&L", fmt: (m) => formatUsd(m.netProfit), signed: true },
  { key: "exposure", label: "Exposure", fmt: (m) => formatPct(m.exposure) },
];

export function MetricsGrid({ metrics, compact }: { metrics: BacktestMetrics; compact?: boolean }) {
  const rows = compact ? CELLS.slice(0, 6) : CELLS;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
      {rows.map((cell) => {
        const raw = metrics[cell.key];
        const n = typeof raw === "number" ? raw : 0;
        return (
          <div key={cell.key} className="bg-surface px-3 py-3">
            <dt className="text-[11px] uppercase tracking-wide text-subtle">{cell.label}</dt>
            <dd
              className={cn(
                "mt-1 font-mono text-sm tabular-nums",
                cell.signed ? pnlClass(n) : "text-fg",
              )}
            >
              {cell.fmt(metrics)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
