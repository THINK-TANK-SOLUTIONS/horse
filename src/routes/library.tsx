import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppChrome } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { formatPct, formatUsd, pnlClass } from "@/lib/format";
import { runBacktest } from "@/lib/quant/engine";
import { shortId } from "@/lib/quant/qid";
import { PRESETS } from "@/lib/quant/presets";
import { useHorse } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({ component: LibraryPage });

function LibraryPage() {
  const nav = useNavigate();
  const setSpec = useHorse((s) => s.setSpec);
  const library = useHorse((s) => s.library);
  const remove = useHorse((s) => s.removeSaved);

  function open(spec: (typeof PRESETS)[number]) {
    setSpec(spec);
    void nav({ to: "/studio" });
  }

  return (
    <AppChrome>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="font-display text-4xl">Strategy library</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Workhorses, not miracles. Load one, backtest without a cap, export a Quant ID that
          round-trips.
        </p>

        <h2 className="mt-10 text-xs uppercase tracking-[0.18em] text-subtle">Presets</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {PRESETS.map((p) => {
            const result = runBacktest(p);
            return (
              <article key={p.name} className="rounded-lg border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="mt-1 font-mono text-xs text-subtle">{shortId(p)}</p>
                  </div>
                  <Button size="sm" onClick={() => open(p)}>
                    Load
                  </Button>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-subtle">Return</dt>
                    <dd className={cn("font-mono tabular-nums", pnlClass(result.metrics.totalReturn))}>
                      {formatPct(result.metrics.totalReturn)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Sharpe</dt>
                    <dd className="font-mono tabular-nums">{result.metrics.sharpe.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Trades</dt>
                    <dd className="font-mono tabular-nums">{result.metrics.trades}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>

        <h2 className="mt-12 text-xs uppercase tracking-[0.18em] text-subtle">Saved in this browser</h2>
        {library.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Save from the studio. Nothing leaves this device.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {library.map((row) => (
              <article key={row.id} className="rounded-lg border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{row.spec.name}</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => open(row.spec)}>
                      Load
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(row.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                {row.lastMetrics ? (
                  <p className="mt-2 font-mono text-sm text-muted">
                    {formatPct(row.lastMetrics.totalReturn)} · {formatUsd(row.lastMetrics.endEquity)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppChrome>
  );
}
