import { toast } from "sonner";
import { CodePane } from "@/components/code-pane";
import { Button } from "@/components/ui/button";
import { compileAll, pineLooksValid } from "@/lib/quant/compile";
import { decodeQid } from "@/lib/quant/qid";
import type { StrategySpec } from "@/lib/quant/types";
import { useHorse } from "@/lib/store";
import { useMemo, useState } from "react";

const TABS = [
  { id: "pine", label: "TradingView", file: (s: string) => `${s}.pine` },
  { id: "python", label: "Python", file: (s: string) => `${s}.py` },
  { id: "think", label: "thinkorswim", file: (s: string) => `${s}.ts` },
  { id: "el", label: "EasyLanguage", file: (s: string) => `${s}.el` },
  { id: "qid", label: "Quant ID", file: () => "HORSE.json" },
] as const;

export function ExportPanel({ spec }: { spec: StrategySpec }) {
  const pack = useMemo(() => compileAll(spec), [spec]);
  const lint = pineLooksValid(pack.pinescript);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pine");
  const [importText, setImportText] = useState("");
  const setSpec = useHorse((s) => s.setSpec);

  const body =
    tab === "pine"
      ? pack.pinescript
      : tab === "python"
        ? pack.python
        : tab === "think"
          ? pack.thinkscript
          : tab === "el"
            ? pack.easylanguage
            : JSON.stringify(
                {
                  quantId: pack.quantId,
                  shortId: pack.shortId,
                  spec: pack.spec,
                  webhook: JSON.parse(pack.webhook),
                },
                null,
                2,
              );

  const filename = TABS.find((t) => t.id === tab)!.file(pack.shortId);

  function download() {
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport() {
    const specIn = decodeQid(importText);
    if (!specIn) {
      toast.error("Could not read that Quant ID or pack");
      return;
    }
    setSpec(specIn);
    toast.success(`Imported ${specIn.name}`);
  }

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-sm bg-accent px-3 py-2 text-sm text-accent-fg"
                : "rounded-sm px-3 py-2 text-sm text-muted hover:text-fg"
            }
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-muted">{pack.shortId}</span>
      </div>

      {tab === "pine" ? (
        <div
          className={
            lint.ok
              ? "rounded-sm border border-border bg-gain-dim px-3 py-2 text-sm text-gain"
              : "rounded-sm border border-border bg-loss-dim px-3 py-2 text-sm text-loss"
          }
        >
          {lint.ok
            ? "Pine v5 lint passed — paste into TradingView Pine Editor, then Add to chart."
            : `Lint: ${lint.issues.join(" · ")}`}
        </div>
      ) : null}

      {tab === "qid" ? (
        <ol className="list-decimal space-y-1 pl-4 text-sm text-muted">
          <li>Copy the short ID or the full H1 token.</li>
          <li>Paste it back here or into another HORSE studio to rebuild the spec.</li>
          <li>Dialects are compiled from the spec, so TradingView / TOS / TS stay in lockstep.</li>
        </ol>
      ) : null}

      <CodePane value={body} filename={filename} onCopy={() => toast.success("Copied")} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={download}>
          Download {filename}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(pack.quantId);
            toast.success("Full Quant ID copied");
          }}
        >
          Copy full QID
        </Button>
      </div>

      <div className="rounded-md border border-border bg-surface p-3">
        <p className="text-xs uppercase tracking-wide text-subtle">Import Quant ID or .json pack</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="mt-2 h-24 w-full rounded-sm border border-border bg-elevated p-2 font-mono text-xs"
          placeholder="H1.… or paste a HORSE JSON pack"
        />
        <Button className="mt-2" size="sm" variant="outline" onClick={doImport}>
          Import
        </Button>
      </div>
    </div>
  );
}
