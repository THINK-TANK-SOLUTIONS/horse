import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppChrome } from "@/components/chrome";
import { MetricsGrid } from "@/components/metrics";
import { Button } from "@/components/ui/button";
import { formatUsd, pnlClass } from "@/lib/format";
import { shortId, specSummary } from "@/lib/quant/qid";
import { useHorse } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitor")({ component: MonitorPage });

function MonitorPage() {
  const spec = useHorse((s) => s.spec);
  const result = useHorse((s) => s.result);
  const liveOn = useHorse((s) => s.liveOn);
  const setLive = useHorse((s) => s.setLive);
  const [tick, setTick] = useState(0);
  const [tape, setTape] = useState<string[]>([]);

  useEffect(() => {
    if (!liveOn) return;
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
      const hour = new Date().toLocaleTimeString("en-US", { hour12: false });
      const px = result?.bars.at(-1)?.c ?? 0;
      const noise = 1 + (Math.sin(Date.now() / 400) + Math.random() * 0.2) * 0.0008;
      setTape((rows) =>
        [`${hour}  ${spec.symbol}  ${(px * noise).toFixed(2)}  heartbeat ok`, ...rows].slice(0, 12),
      );
    }, 1200);
    return () => window.clearInterval(id);
  }, [liveOn, result, spec.symbol]);

  const last = result?.equity.at(-1);
  const dayPnl = useMemo(() => {
    if (!result || result.equity.length < 2) return 0;
    const eq = result.equity;
    const tail = eq[eq.length - 1]!.equity;
    const prev = eq[Math.max(0, eq.length - 2)]!.equity;
    return tail - prev + tick * 0.4;
  }, [result, tick]);

  return (
    <AppChrome>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Ops</p>
            <h1 className="mt-2 font-display text-4xl">Monitor</h1>
            <p className="mt-2 max-w-xl text-sm text-muted">{specSummary(spec)}</p>
          </div>
          <Button variant={liveOn ? "primary" : "outline"} onClick={() => setLive(!liveOn)}>
            {liveOn ? "Heartbeat on" : "Start heartbeat"}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-subtle">Mark</p>
            <p className="mt-2 font-mono text-2xl tabular-nums">{formatUsd(last?.equity ?? spec.capital)}</p>
            <p className="text-xs text-muted">{shortId(spec)}</p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-subtle">Session drift</p>
            <p className={cn("mt-2 font-mono text-2xl tabular-nums", pnlClass(dayPnl))}>
              {formatUsd(dayPnl)}
            </p>
            <p className="text-xs text-muted">Simulated tape — not a broker.</p>
          </article>
          <article className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-subtle">Flatten guard</p>
            <p className="mt-2 font-mono text-2xl tabular-nums">
              {result && result.metrics.totalReturn <= -0.03 ? "TRIP" : "ARMED"}
            </p>
            <p className="text-xs text-muted">Flatten if the path is down 3% from the spec start.</p>
          </article>
        </div>

        {result ? <MetricsGrid metrics={result.metrics} compact /> : null}

        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Paper tape</h2>
            <span className={cn("font-mono text-xs", liveOn ? "text-gain" : "text-subtle")}>
              {liveOn ? "LIVE" : "IDLE"}
            </span>
          </div>
          <pre className="mt-3 min-h-40 overflow-auto font-mono text-xs leading-6 text-muted">
            {tape.length
              ? tape.join("\n")
              : "Start the heartbeat to watch a local paper tape on the active spec."}
          </pre>
        </section>
      </div>
    </AppChrome>
  );
}
