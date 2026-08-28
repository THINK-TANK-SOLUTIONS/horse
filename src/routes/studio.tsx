import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppChrome } from "@/components/chrome";
import { DrawdownChart, EquityChart } from "@/components/charts";
import { ExportPanel } from "@/components/export-panel";
import { HorseChat } from "@/components/horse-chat";
import { MetricsGrid } from "@/components/metrics";
import { SpecForm } from "@/components/spec-form";
import { Button } from "@/components/ui/button";
import { fetchYahooHistory } from "@/lib/quant/yahoo";
import { cacheBars } from "@/lib/quant/data";
import { formatUsd } from "@/lib/format";
import { useHorse } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({ component: StudioPage });

type Tab = "spec" | "export" | "results" | "horse";

function StudioPage() {
  const spec = useHorse((s) => s.spec);
  const result = useHorse((s) => s.result);
  const setSpec = useHorse((s) => s.setSpec);
  const run = useHorse((s) => s.run);
  const saveCurrent = useHorse((s) => s.saveCurrent);
  const [tab, setTab] = useState<Tab>("spec");
  const [hydrated, setHydrated] = useState(false);
  const [feed, setFeed] = useState<"idle" | "yahoo" | "synthetic">("idle");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setFeed("idle");
    void (async () => {
      try {
        const res = await fetchYahooHistory({
          data: { symbol: spec.symbol, timeframe: spec.timeframe },
        });
        if (cancelled) return;
        if (res.ok) {
          cacheBars(spec.symbol, spec.timeframe, res.bars);
          setSpec(spec, res.bars, "yahoo");
          setFeed("yahoo");
          return;
        }
      } catch {
        /* synthetic */
      }
      if (!cancelled) {
        run();
        setFeed("synthetic");
      }
    })();
    return () => {
      cancelled = true;
    };
    // symbol/timeframe only — spec object identity would loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, spec.symbol, spec.timeframe]);

  const tabs: { id: Tab; label: string; mobile?: boolean }[] = [
    { id: "horse", label: "Horse", mobile: true },
    { id: "spec", label: "Spec" },
    { id: "export", label: "Export" },
    { id: "results", label: "Backtest" },
  ];

  return (
    <AppChrome>
      <div className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 lg:grid-cols-12">
        <aside
          className={cn(
            "min-h-0 border-b border-border bg-surface lg:col-span-4 lg:border-b-0 lg:border-r xl:col-span-3",
            tab === "horse" ? "flex h-[62vh] flex-col lg:h-auto" : "hidden lg:flex lg:flex-col",
          )}
        >
          {hydrated ? <HorseChat /> : <div className="flex-1 bg-surface" />}
        </aside>
        <main
          className={cn(
            "min-h-0 min-w-0 flex-col overflow-hidden bg-bg lg:col-span-8 xl:col-span-9",
            tab === "horse" ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "h-9 rounded-sm px-3 text-sm",
                  t.mobile ? "lg:hidden" : "",
                  tab === t.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-subtle">
                {feed === "yahoo" ? "Yahoo history" : feed === "synthetic" ? "Seeded engine" : "…"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  run();
                  toast.message("Backtest complete");
                }}
              >
                Run backtest
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  saveCurrent();
                  toast.success("Saved to library");
                }}
              >
                Save
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!hydrated ? (
              <div className="h-64 animate-pulse rounded-md bg-surface" />
            ) : tab === "spec" ? (
              <SpecForm spec={spec} onChange={(next) => setSpec(next, result?.bars, result?.source)} />
            ) : tab === "export" ? (
              <ExportPanel spec={spec} />
            ) : tab === "results" && result ? (
              <div className="flex flex-col gap-4">
                <MetricsGrid metrics={result.metrics} />
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-subtle">Equity</p>
                  <EquityChart result={result} />
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-subtle">Drawdown</p>
                  <DrawdownChart result={result} />
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-elevated text-xs uppercase tracking-wide text-subtle">
                      <tr>
                        {["Side", "Entry", "Exit", "P&L", "Bars", "Why"].map((h) => (
                          <th key={h} className="px-3 py-2 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.slice(-40).reverse().map((t) => (
                        <tr key={t.id} className="border-t border-border">
                          <td className="px-3 py-2 capitalize">{t.side}</td>
                          <td className="px-3 py-2 font-mono tabular-nums">{t.entry.toFixed(2)}</td>
                          <td className="px-3 py-2 font-mono tabular-nums">{t.exit.toFixed(2)}</td>
                          <td
                            className={cn(
                              "px-3 py-2 font-mono tabular-nums",
                              t.pnl >= 0 ? "text-gain" : "text-loss",
                            )}
                          >
                            {formatUsd(t.pnl)}
                          </td>
                          <td className="px-3 py-2 font-mono">{t.barsHeld}</td>
                          <td className="px-3 py-2 text-muted">{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Run a backtest to populate results.</p>
            )}
          </div>
        </main>
      </div>
    </AppChrome>
  );
}
