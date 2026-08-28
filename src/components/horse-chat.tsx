import { askHorse } from "@/lib/ai/ask-horse";
import { useHorse } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Buy SPY when the 20-day SMA crosses above the 50-day, 2% stop, 6% target",
  "RSI 14 below 30 on QQQ, exit above 55, 1% risk",
  "BTC Donchian 20 breakout, 6% stop",
  "NVDA MACD crossover, 4% stop 12% take",
];

export function HorseChat() {
  const draft = useHorse((s) => s.draft);
  const setDraft = useHorse((s) => s.setDraft);
  const messages = useHorse((s) => s.messages);
  const busy = useHorse((s) => s.busy);
  const ask = useHorse((s) => s.ask);

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    useHorse.setState({ busy: true, draft: "" });
    try {
      const res = await askHorse({ data: { prompt } });
      if (res && typeof res === "object" && "ok" in res && res.ok === true && "spec" in res) {
        ask(prompt, res.spec);
      } else {
        ask(prompt);
      }
    } catch {
      ask(prompt);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="border-b border-border px-4 py-3">
        <p className="font-display text-lg">Horse</p>
        <p className="text-xs text-muted">Compiler, not a chatbot. Spec first, dialects second.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[42rem] whitespace-pre-wrap rounded-md px-3 py-2 text-sm leading-relaxed",
              m.role === "horse" ? "bg-elevated text-fg" : "ml-auto bg-panel text-fg",
            )}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="rounded-sm border border-border px-2 py-1 text-left text-[11px] text-muted hover:text-fg"
            onClick={() => send(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Describe the strategy in English"
          className="h-11 min-w-0 flex-1 rounded-sm border border-border bg-elevated px-3 text-sm outline-none"
        />
        <Button type="submit" disabled={busy || !draft.trim()}>
          {busy ? "Compiling" : "Compile"}
        </Button>
      </form>
    </div>
  );
}
