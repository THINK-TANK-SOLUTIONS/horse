import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import { runBacktest } from "@/lib/quant/engine";
import { interpretPrompt } from "@/lib/quant/interpret";
import { PRESETS } from "@/lib/quant/presets";
import { hydrateSpec } from "@/lib/quant/qid";
import type {
  BacktestResult,
  Bar,
  HorseMessage,
  SavedStrategy,
  StrategySpec,
} from "@/lib/quant/types";

type HorseState = {
  spec: StrategySpec;
  result: BacktestResult | null;
  messages: HorseMessage[];
  library: SavedStrategy[];
  installed: string[];
  draft: string;
  busy: boolean;
  liveOn: boolean;
  setDraft: (v: string) => void;
  setSpec: (spec: StrategySpec, bars?: Bar[], source?: BacktestResult["source"]) => void;
  run: (bars?: Bar[], source?: BacktestResult["source"]) => void;
  ask: (prompt: string, remote?: unknown) => void;
  saveCurrent: () => void;
  loadSaved: (id: string) => void;
  removeSaved: (id: string) => void;
  toggleStack: (id: string) => void;
  setLive: (on: boolean) => void;
};

function greet(): HorseMessage[] {
  return [
    {
      id: uid("m"),
      role: "horse",
      createdAt: Date.now(),
      text: "I am Horse. Describe a strategy in English. I compile a spec, then emit Pine, Python, ThinkScript, and EasyLanguage from that spec — so the file you paste into TradingView is not a vibe, it is a compiler output. Unlimited backtests. No monthly meter.",
    },
  ];
}

const initial = PRESETS[0]!;

export const useHorse = create<HorseState>()(
  persist(
    (set, get) => ({
      spec: initial,
      result: null,
      messages: greet(),
      library: [],
      installed: ["tv", "bt", "risk", "yahoo"],
      draft: "",
      busy: false,
      liveOn: false,
      setDraft: (v) => set({ draft: v }),
      setSpec: (spec, bars, source) => {
        const result = runBacktest(spec, bars);
        if (source) result.source = source;
        set({ spec, result });
      },
      run: (bars, source) => {
        const result = runBacktest(get().spec, bars);
        if (source) result.source = source;
        set({ result });
      },
      ask: (prompt, remote) => {
        const user: HorseMessage = {
          id: uid("m"),
          role: "user",
          text: prompt,
          createdAt: Date.now(),
        };
        let spec: StrategySpec | null = null;
        let note = "";
        if (remote && typeof remote === "object") {
          spec = hydrateSpec(remote as Partial<StrategySpec>);
          const maybeNote = (remote as { note?: string }).note;
          note = maybeNote || "Compiled from Horse.";
        }
        if (!spec) {
          const local = interpretPrompt(prompt);
          spec = local.spec;
          note = note || local.note;
        }
        const result = runBacktest(spec);
        const horse: HorseMessage = {
          id: uid("m"),
          role: "horse",
          createdAt: Date.now(),
          text: `${note}\n\n${spec.name} · ${spec.symbol} ${spec.timeframe} · ${result.metrics.trades} trades · ${
            Number.isFinite(result.metrics.totalReturn)
              ? (result.metrics.totalReturn * 100).toFixed(1)
              : "—"
          }% · Sharpe ${result.metrics.sharpe.toFixed(2)}. Export the Quant ID when the numbers are boring enough to trust.`,
        };
        set({
          spec,
          result,
          messages: [...get().messages, user, horse],
          draft: "",
          busy: false,
        });
      },
      saveCurrent: () => {
        const { spec, result, library } = get();
        const row: SavedStrategy = {
          id: uid("st"),
          spec,
          notes: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastMetrics: result?.metrics,
        };
        set({ library: [row, ...library].slice(0, 40) });
      },
      loadSaved: (id) => {
        const row = get().library.find((s) => s.id === id);
        if (!row) return;
        const result = runBacktest(row.spec);
        set({ spec: row.spec, result });
      },
      removeSaved: (id) => set({ library: get().library.filter((s) => s.id !== id) }),
      toggleStack: (id) => {
        const has = get().installed.includes(id);
        set({
          installed: has ? get().installed.filter((x) => x !== id) : [...get().installed, id],
        });
      },
      setLive: (on) => set({ liveOn: on }),
    }),
    {
      name: "horse-quant-v1",
      partialize: (s) => ({
        spec: s.spec,
        library: s.library,
        installed: s.installed,
        messages: s.messages.slice(-24),
      }),
    },
  ),
);
