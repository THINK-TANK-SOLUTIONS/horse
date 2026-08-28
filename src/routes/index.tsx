import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SparkEquity } from "@/components/charts";
import { HorseMark, HorseWordmark } from "@/components/logo";
import { formatPct, formatUsd, pnlClass } from "@/lib/format";
import { runBacktest } from "@/lib/quant/engine";
import { PRESETS, SHELVES, STACKS } from "@/lib/quant/presets";
import type { BacktestResult } from "@/lib/quant/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const FAQ = [
  {
    q: "Do I need to know how to code?",
    a: "No. Describe the idea in English. Horse writes a spec you can read, then compiles Pine, Python, ThinkScript, and EasyLanguage from that spec. If you already code, you skip the agent and edit the spec directly.",
  },
  {
    q: "Why did the other IDE's Quant IDs fail to import?",
    a: "They asked an agent to emit platform code as a one-shot. Agents wander. HORSE compiles dialects from a structured spec, then lints Pine v5 before you copy it. The Quant ID is the spec, not a vibe.",
  },
  {
    q: "How do I get this into TradingView?",
    a: "Studio → Export → TradingView → Copy. Open TradingView → Pine Editor → New → paste → Add to chart. The script is strategy() with alert() JSON for a webhook stack.",
  },
  {
    q: "Are backtests unlimited?",
    a: "Yes. The engine runs in this browser. There is no monthly meter, no queue, and no cloud runtime to bill you for. Change a rule, run it again.",
  },
  {
    q: "Is the history real?",
    a: "When Yahoo answers from this host, bars are live history and labelled as such. If the feed is quiet, HORSE uses a deterministic simulator and says so. It will not mix the two without a badge.",
  },
  {
    q: "What about my broker?",
    a: "HORSE does not hold your keys and does not place live orders. Name the venue, install the stack, export the dialect. You run it on your machine, VPS, or webhook bridge.",
  },
  {
    q: "Is my strategy private?",
    a: "Specs and Quant IDs live in this browser's local storage. Horse API calls send the English prompt to compile a spec — not your keys, not a hosted strategy file.",
  },
  {
    q: "What does it cost?",
    a: "This studio is free to use here. No credit card. Unlimited local backtests. That was the point of replacing a metered subscription.",
  },
  {
    q: "I am already profitable manually.",
    a: "Then you already have the edge. HORSE is the bandwidth. The 24-hour tape on this page is the argument: the setup does not check whether you are awake.",
  },
  {
    q: "Who is Horse?",
    a: "The compiler. Dry on purpose. The last agent was quirky. Horse returns a spec or it gets out of the way.",
  },
];

function Home() {
  const [demo, setDemo] = useState<BacktestResult | null>(null);
  useEffect(() => {
    setDemo(runBacktest(PRESETS[0]!));
  }, []);

  return (
    <div className="bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <HorseWordmark />
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-fg">
              How
            </a>
            <a href="#export" className="hover:text-fg">
              Export
            </a>
            <a href="#stacks" className="hover:text-fg">
              Stacks
            </a>
            <a href="#faq" className="hover:text-fg">
              FAQ
            </a>
          </nav>
          <Link
            to="/studio"
            className="inline-flex h-9 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            Open studio
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Quant workhorse</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Describe a strategy. Get a file that pastes.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            I am Horse. Describe a strategy in English. I compile a spec, then emit Pine, Python,
            ThinkScript, and EasyLanguage from that spec — files that actually paste into TradingView
            and the rest. Unlimited backtests. No monthly meter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/studio"
              className="inline-flex h-12 items-center rounded-md bg-accent px-5 font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96]"
            >
              Open the studio
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center rounded-md border border-border-strong px-5 text-fg"
            >
              See the compiler
            </a>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-subtle">Backtests</dt>
              <dd className="mt-1 font-medium">Unlimited, local</dd>
            </div>
            <div>
              <dt className="text-subtle">Export</dt>
              <dd className="mt-1 font-medium">Four dialects + QID</dd>
            </div>
            <div>
              <dt className="text-subtle">Agent</dt>
              <dd className="mt-1 font-medium">Spec first. Not quirky.</dd>
            </div>
          </dl>
        </div>
        <aside className="rounded-xl border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-mono">SPY · SMA 20/50</span>
            <span>{demo?.source === "yahoo" ? "Yahoo history" : "Seeded engine"}</span>
          </div>
          {demo ? (
            <>
              <SparkEquity result={demo} />
              <div className="mt-2 flex items-end justify-between">
                <p className={cn("font-mono text-2xl tabular-nums", pnlClass(demo.metrics.totalReturn))}>
                  {formatPct(demo.metrics.totalReturn)}
                </p>
                <p className="text-sm text-muted">
                  Sharpe {demo.metrics.sharpe.toFixed(2)} · {demo.metrics.trades} trades ·{" "}
                  {formatUsd(demo.metrics.endEquity, true)}
                </p>
              </div>
            </>
          ) : (
            <div className="h-40 animate-pulse rounded-md bg-elevated" />
          )}
          <p className="mt-3 text-xs text-subtle">
            Live compile of the default workhorse. Open the studio and export the Pine in one copy.
          </p>
        </aside>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Manual_Session 24H</p>
            <h2 className="mt-3 font-display text-4xl">Your edge is real. Your bandwidth isn't.</h2>
            <p className="mt-4 text-muted">
              The market runs longer than you do. The rules you wrote are not the rules you traded
              after 2 a.m. HORSE does not get tired, and it does not invent a different strategy at
              the open.
            </p>
          </div>
          <ol className="space-y-3 font-mono text-sm">
            {[
              ["03:14", "Setup printed. You were asleep.", "Entry taken. Rule matched."],
              ["07:52", "Opened 38 minutes late.", "Already in. Size from the spec."],
              ["11:20", "Moved the stop because it felt right.", "Stop still 2%."],
              ["16:01", "Flat, because the close is a ritual.", "Still on unless the rule said exit."],
            ].map(([t, man, sys]) => (
              <li key={t} className="grid grid-cols-[3rem_1fr] gap-3 rounded-md border border-border p-3">
                <span className="text-subtle">{t}</span>
                <div>
                  <p className="text-loss">{man}</p>
                  <p className="text-gain">{sys}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Compiler, not a muse</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl md:text-5xl">
          English becomes a spec. The spec becomes code that imports.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {[
            ["01", "Say it", "Buy when RSI is under 30 and price crosses the 20-day average."],
            ["02", "Read the spec", "Rules, stop, target, symbol. Visible. Editable. Not hidden in chat."],
            ["03", "Backtest here", "Unlimited. Next-open fills, stop-first on the same bar, commission."],
            ["04", "Export a QID", "Pine v5 linted. Python with yfinance. ThinkScript. EasyLanguage."],
          ].map(([n, t, d]) => (
            <article key={n} className="rounded-lg border border-border bg-surface p-5">
              <p className="font-mono text-xs text-subtle">{n}</p>
              <h3 className="mt-2 font-medium">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="export" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-display text-4xl">Working Quant IDs. Finally.</h2>
          <p className="mt-4 max-w-2xl text-muted">
            The last agent wrote almost-Pine. Horse writes a spec, then a compiler writes the
            dialects. One source of truth, four paste targets, a portable H1 token you can import
            back.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["TradingView", "Pine Script v5 strategy() + alert() JSON"],
              ["Python", "pandas + yfinance runner you can actually execute"],
              ["thinkorswim", "ThinkScript AddOrder strategy"],
              ["TradeStation", "EasyLanguage next-bar orders"],
            ].map(([t, d]) => (
              <article key={t} className="rounded-lg border border-border bg-bg p-5">
                <h3 className="font-medium">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stacks" className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">The shelf</p>
            <h2 className="mt-3 font-display text-4xl">Install a stack, or describe one.</h2>
          </div>
          <Link to="/stacks" className="hidden text-sm text-muted hover:text-fg md:inline">
            Open the shelf
          </Link>
        </div>
        <div className="mt-10 space-y-8">
          {SHELVES.map((shelf) => (
            <div key={shelf}>
              <h3 className="text-xs uppercase tracking-[0.18em] text-subtle">{shelf}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {STACKS.filter((s) => s.shelf === shelf).map((s) => (
                  <article key={s.id} className="rounded-md border border-border bg-surface p-4">
                    <h4 className="text-sm font-medium">{s.name}</h4>
                    <p className="mt-1 text-sm text-muted">{s.blurb}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2">
          <article className="rounded-lg border border-border bg-bg p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-loss">Everyone else</p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>A fixed broker list somebody else chose.</li>
              <li>Their cloud, their runtime, their monthly meter on backtests.</li>
              <li>An agent that writes code you cannot paste.</li>
            </ul>
          </article>
          <article className="rounded-lg border border-border bg-bg p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-gain">HORSE</p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>Name the venue. Install the stack. Keys stay in this browser.</li>
              <li>Unlimited local backtests. No queue.</li>
              <li>A compiler. Spec → dialects. Quant IDs that round-trip.</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="font-display text-4xl">Straight answers.</h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {FAQ.map((item, i) => (
            <details key={item.q} className="group py-4">
              <summary className="cursor-pointer list-none text-sm font-medium">
                <span className="mr-3 font-mono text-xs text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.q}
              </summary>
              <p className="mt-3 pl-8 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <HorseMark className="mx-auto size-10" />
          <h2 className="mt-6 font-display text-4xl md:text-6xl">Stop searching. Start compiling.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            You already know what works. Horse will write the file you can paste, and backtest it
            until you are bored of the number.
          </p>
          <Link
            to="/studio"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-6 font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            Open the studio
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-subtle">
        HORSE. Not a broker. Not investment advice. Past paths in this engine are not a promise.
      </footer>
    </div>
  );
}
