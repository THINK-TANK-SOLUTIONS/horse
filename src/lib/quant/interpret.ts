import { uid } from "@/lib/utils";
import { UNIVERSE } from "./data";
import type { Operand, Rule, StrategySpec, Timeframe } from "./types";

const SYMBOLS = UNIVERSE.map((t) => t.symbol);

function rule(left: Operand, op: Rule["op"], right: Operand): Rule {
  return { id: uid("r"), left, op, right };
}

function pickSymbol(text: string): string {
  const up = text.toUpperCase();
  const hit = SYMBOLS.find((s) => new RegExp(`\\b${s.replace("-", "[- ]?")}\\b`, "i").test(up));
  if (hit) return hit;
  if (/\bBTC\b|BITCOIN/.test(up)) return "BTC-USD";
  if (/\bETH\b|ETHEREUM/.test(up)) return "ETH-USD";
  const ticker = up.match(/\b([A-Z]{2,5})\b/);
  return ticker?.[1] ?? "SPY";
}

function pickTf(text: string): Timeframe {
  if (/15\s*m/.test(text)) return "15m";
  if (/4\s*h/.test(text)) return "4h";
  if (/1\s*h|hour/.test(text)) return "1h";
  return "1d";
}

function periods(text: string, fallback: number[]): number[] {
  const nums = [...text.matchAll(/\b(\d{1,3})\b/g)].map((m) => Number(m[1]));
  const useful = nums.filter((n) => n >= 2 && n <= 400);
  if (useful.length >= fallback.length) return useful.slice(0, fallback.length);
  if (useful.length === 1) return [useful[0]!, fallback[1] ?? useful[0]!];
  return fallback;
}

function sideOf(text: string): StrategySpec["side"] {
  if (/\bshort only\b|\bshort-only\b/.test(text)) return "short";
  if (/\bboth\b|long and short/.test(text)) return "both";
  if (/\bshort\b/.test(text) && !/\blong\b/.test(text)) return "short";
  return "long";
}

function stopTake(text: string): { stopPct?: number; takePct?: number } {
  const stop = text.match(/stop(?:\s*loss)?(?:\s*(?:of|at))?\s*(\d+(?:\.\d+)?)\s*%/i);
  const take = text.match(/(?:take(?:\s*profit)?|target)(?:\s*(?:of|at))?\s*(\d+(?:\.\d+)?)\s*%/i);
  const risk = text.match(/(\d+(?:\.\d+)?)\s*%\s*risk/i);
  return {
    stopPct: stop ? Number(stop[1]) : risk ? Number(risk[1]) * 2 : 2,
    takePct: take ? Number(take[1]) : 6,
  };
}

export function interpretPrompt(text: string): { spec: StrategySpec; note: string } {
  const t = text.toLowerCase();
  const symbol = pickSymbol(text);
  const timeframe = pickTf(t);
  const side = sideOf(t);
  const { stopPct, takePct } = stopTake(t);
  const capital = /\$?(\d{2,3}),?(\d{3})/.test(text)
    ? Number(text.replace(/,/g, "").match(/(\d{4,7})/)?.[1] ?? 100000)
    : 100000;

  let entry: Rule[] = [];
  let exit: Rule[] = [];
  let name = "";
  let note = "";

  if (/golden cross|death cross|sma\s*cross|ma cross|moving average cross|crossover/.test(t) || (/sma|ema|moving average/.test(t) && /cross/.test(t))) {
    const useEma = /\bema\b/.test(t);
    const [fast, slow] = periods(t, useEma ? [12, 26] : [20, 50]);
    const a: Operand = useEma ? { kind: "ema", period: fast } : { kind: "sma", period: fast };
    const b: Operand = useEma ? { kind: "ema", period: slow } : { kind: "sma", period: slow };
    const death = /death cross/.test(t) || side === "short";
    entry = [rule(a, death ? "cross_below" : "cross_above", b)];
    exit = [rule(a, death ? "cross_above" : "cross_below", b)];
    name = `${symbol} ${useEma ? "EMA" : "SMA"} ${fast}/${slow} ${death ? "death" : "golden"} cross`;
    note = `Compiled a ${useEma ? "EMA" : "SMA"} crossover on ${symbol}. Fast ${fast}, slow ${slow}. This is the spec — Horse compiles it to Pine, Python, ThinkScript, and EasyLanguage so the export is valid even if the English was messy.`;
  } else if (/donchian|breakout|channel break|turtle/.test(t)) {
    const [n] = periods(t, [20]);
    entry = [rule({ kind: "close" }, "gt", { kind: "donchian_high", period: n })];
    exit = [rule({ kind: "close" }, "lt", { kind: "donchian_low", period: n })];
    name = `${symbol} Donchian ${n} breakout`;
    note = `Donchian breakout on ${symbol}, lookback ${n}. Entry is a close above the prior-period high so there is no lookahead.`;
  } else if (/bollinger|bb squeeze|mean reversion/.test(t) || (/rsi/.test(t) && /bollinger|band/.test(t))) {
    const [n] = periods(t, [20]);
    entry = [
      rule({ kind: "close" }, "lt", { kind: "bb_lower", period: n, stdev: 2 }),
      rule({ kind: "rsi", period: 14 }, "lt", { kind: "value", value: 35 }),
    ];
    exit = [rule({ kind: "close" }, "gt", { kind: "bb_mid", period: n, stdev: 2 })];
    name = `${symbol} Bollinger mean reversion`;
    note = `Fade the lower band on ${symbol} when RSI is washed out, cover at the midline.`;
  } else if (/\brsi\b/.test(t)) {
    const [n] = periods(t, [14]);
    const low = /overbought/.test(t) ? 70 : 30;
    const high = 70;
    if (/overbought|fade the rip/.test(t) && !/oversold/.test(t)) {
      entry = [rule({ kind: "rsi", period: n }, "gt", { kind: "value", value: high })];
      exit = [rule({ kind: "rsi", period: n }, "lt", { kind: "value", value: 50 })];
      name = `${symbol} RSI ${n} fade`;
    } else {
      entry = [rule({ kind: "rsi", period: n }, "lt", { kind: "value", value: low })];
      exit = [rule({ kind: "rsi", period: n }, "gt", { kind: "value", value: high })];
      name = `${symbol} RSI ${n} mean reversion`;
    }
    note = `RSI ${n} on ${symbol}. Horse sized a ${stopPct}% stop and ${takePct}% target so the export carries risk instead of a naked oscillator.`;
  } else if (/\bmacd\b/.test(t)) {
    entry = [rule({ kind: "macd_line", fast: 12, slow: 26, signal: 9 }, "cross_above", { kind: "macd_signal", fast: 12, slow: 26, signal: 9 })];
    exit = [rule({ kind: "macd_line", fast: 12, slow: 26, signal: 9 }, "cross_below", { kind: "macd_signal", fast: 12, slow: 26, signal: 9 })];
    name = `${symbol} MACD crossover`;
    note = `MACD 12/26/9 on ${symbol}. The spec is the source of truth; every platform dialect is compiled from it.`;
  } else if (/stoch/.test(t)) {
    entry = [rule({ kind: "stoch_k", k: 14, d: 3 }, "lt", { kind: "value", value: 20 })];
    exit = [rule({ kind: "stoch_k", k: 14, d: 3 }, "gt", { kind: "value", value: 80 })];
    name = `${symbol} Stochastic swing`;
    note = `Stochastic %K oversold entry on ${symbol}.`;
  } else if (/price crosses above the 20|crosses above the 20-day|20-day moving/.test(t) && /rsi/.test(t)) {
    entry = [
      rule({ kind: "rsi", period: 14 }, "lt", { kind: "value", value: 30 }),
      rule({ kind: "close" }, "cross_above", { kind: "sma", period: 20 }),
    ];
    exit = [rule({ kind: "close" }, "cross_below", { kind: "sma", period: 20 })];
    name = `${symbol} RSI + SMA 20`;
    note = `Your exact pattern: RSI below 30 and price crossing the 20-day average. This is the example that should just work.`;
  } else {
    const [fast, slow] = periods(t, [20, 50]);
    entry = [rule({ kind: "sma", period: fast }, "cross_above", { kind: "sma", period: slow })];
    exit = [rule({ kind: "sma", period: fast }, "cross_below", { kind: "sma", period: slow })];
    name = `${symbol} SMA ${fast}/${slow}`;
    note = `I didn't hear a specific oscillator, so I compiled a workhorse SMA crossover on ${symbol}. Tighten it in the spec panel or tell me RSI, MACD, Donchian, or Bollinger.`;
  }

  if (/and rsi/.test(t) && !entry.some((r) => r.left.kind === "rsi")) {
    entry.push(rule({ kind: "rsi", period: 14 }, "lt", { kind: "value", value: 40 }));
  }

  const spec: StrategySpec = {
    name,
    symbol,
    timeframe,
    side,
    capital,
    riskPct: 1,
    commissionPct: 0.05,
    entry,
    exit,
    stopPct,
    takePct,
  };
  return { spec, note };
}
