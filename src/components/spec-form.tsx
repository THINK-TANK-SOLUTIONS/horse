import { UNIVERSE } from "@/lib/quant/data";
import { operandLabel, opLabel } from "@/lib/quant/qid";
import type { Operand, Rule, StrategySpec, Timeframe } from "@/lib/quant/types";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const OPS: Rule["op"][] = ["cross_above", "cross_below", "gt", "lt", "gte", "lte"];

function emptyOperand(): Operand {
  return { kind: "sma", period: 20 };
}

function OperandFields({
  value,
  onChange,
}: {
  value: Operand;
  onChange: (o: Operand) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        className="h-10 rounded-sm border border-border bg-elevated px-2 text-sm"
        value={value.kind}
        onChange={(e) => {
          const kind = e.target.value as Operand["kind"];
          if (kind === "value") onChange({ kind, value: 30 });
          else if (kind === "sma" || kind === "ema" || kind === "rsi" || kind === "atr")
            onChange({ kind, period: 14 });
          else if (kind.startsWith("macd"))
            onChange({ kind: kind as "macd_line", fast: 12, slow: 26, signal: 9 });
          else if (kind.startsWith("bb"))
            onChange({ kind: kind as "bb_lower", period: 20, stdev: 2 });
          else if (kind.startsWith("donchian"))
            onChange({ kind: kind as "donchian_high", period: 20 });
          else if (kind.startsWith("stoch")) onChange({ kind: kind as "stoch_k", k: 14, d: 3 });
          else onChange({ kind: kind as "close" });
        }}
      >
        {[
          "close",
          "sma",
          "ema",
          "rsi",
          "macd_line",
          "macd_signal",
          "bb_upper",
          "bb_mid",
          "bb_lower",
          "donchian_high",
          "donchian_low",
          "stoch_k",
          "value",
        ].map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      {"period" in value ? (
        <input
          type="number"
          className="h-10 w-20 rounded-sm border border-border bg-elevated px-2 text-sm"
          value={value.period}
          onChange={(e) => onChange({ ...value, period: Number(e.target.value) })}
        />
      ) : null}
      {"value" in value && value.kind === "value" ? (
        <input
          type="number"
          className="h-10 w-24 rounded-sm border border-border bg-elevated px-2 text-sm"
          value={value.value}
          onChange={(e) => onChange({ kind: "value", value: Number(e.target.value) })}
        />
      ) : null}
    </div>
  );
}

function RuleRow({
  rule,
  onChange,
  onRemove,
}: {
  rule: Rule;
  onChange: (r: Rule) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-elevated p-3 lg:flex-row lg:items-center">
      <OperandFields value={rule.left} onChange={(left) => onChange({ ...rule, left })} />
      <select
        className="h-10 rounded-sm border border-border bg-surface px-2 text-sm"
        value={rule.op}
        onChange={(e) => onChange({ ...rule, op: e.target.value as Rule["op"] })}
      >
        {OPS.map((op) => (
          <option key={op} value={op}>
            {opLabel(op)}
          </option>
        ))}
      </select>
      <OperandFields value={rule.right} onChange={(right) => onChange({ ...rule, right })} />
      <Button variant="ghost" size="sm" onClick={onRemove} className="self-start lg:self-center">
        Remove
      </Button>
    </div>
  );
}

export function SpecForm({
  spec,
  onChange,
}: {
  spec: StrategySpec;
  onChange: (spec: StrategySpec) => void;
}) {
  function patch(p: Partial<StrategySpec>) {
    onChange({ ...spec, ...p });
  }
  function addRule(which: "entry" | "exit") {
    patch({
      [which]: [
        ...spec[which],
        {
          id: uid("r"),
          left: emptyOperand(),
          op: "cross_above" as const,
          right: { kind: "sma", period: 50 } satisfies Operand,
        },
      ],
    });
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs text-muted">
          Name
          <input
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm text-fg"
            value={spec.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </label>
        <label className="block text-xs text-muted">
          Symbol
          <select
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm"
            value={spec.symbol}
            onChange={(e) => patch({ symbol: e.target.value })}
          >
            {UNIVERSE.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol} — {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Timeframe
          <select
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm"
            value={spec.timeframe}
            onChange={(e) => patch({ timeframe: e.target.value as Timeframe })}
          >
            {(["1d", "4h", "1h", "15m"] as Timeframe[]).map((tf) => (
              <option key={tf}>{tf}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Side
          <select
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm"
            value={spec.side}
            onChange={(e) => patch({ side: e.target.value as StrategySpec["side"] })}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className="block text-xs text-muted">
          Capital
          <input
            type="number"
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm"
            value={spec.capital}
            onChange={(e) => patch({ capital: Number(e.target.value) })}
          />
        </label>
        <label className="block text-xs text-muted">
          Risk %
          <input
            type="number"
            step="0.1"
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm"
            value={spec.riskPct}
            onChange={(e) => patch({ riskPct: Number(e.target.value) })}
          />
        </label>
        <label className="block text-xs text-muted">
          Stop %
          <input
            type="number"
            step="0.1"
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm"
            value={spec.stopPct ?? ""}
            onChange={(e) => patch({ stopPct: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </label>
        <label className="block text-xs text-muted">
          Take %
          <input
            type="number"
            step="0.1"
            className="mt-1 h-10 w-full rounded-sm border border-border bg-elevated px-3 text-sm"
            value={spec.takePct ?? ""}
            onChange={(e) => patch({ takePct: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </label>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">Entry (all must be true)</h3>
          <Button size="sm" variant="outline" onClick={() => addRule("entry")}>
            Add rule
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {spec.entry.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onChange={(next) => patch({ entry: spec.entry.map((r) => (r.id === rule.id ? next : r)) })}
              onRemove={() => patch({ entry: spec.entry.filter((r) => r.id !== rule.id) })}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">Exit</h3>
          <Button size="sm" variant="outline" onClick={() => addRule("exit")}>
            Add rule
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {spec.exit.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onChange={(next) => patch({ exit: spec.exit.map((r) => (r.id === rule.id ? next : r)) })}
              onRemove={() => patch({ exit: spec.exit.filter((r) => r.id !== rule.id) })}
            />
          ))}
        </div>
      </section>

      <p className="text-sm text-muted">
        {spec.entry.map((r) => `${operandLabel(r.left)} ${opLabel(r.op)} ${operandLabel(r.right)}`).join(" AND ") ||
          "No entry rules"}
      </p>
    </div>
  );
}
