import { encodeQid, operandLabel, opLabel, shortId, specSummary } from "./qid";
import type { ExportPack, Operand, Rule, StrategySpec } from "./types";

type Lang = "pine" | "python" | "think" | "el";

function ident(op: Operand, lang: Lang, i: number): { name: string; decl: string } {
  const n = `${op.kind.replace(/_/g, "")}${i}`;
  switch (op.kind) {
    case "close":
      return {
        name: lang === "pine" ? "close" : lang === "python" ? "c" : lang === "think" ? "close" : "Close",
        decl: "",
      };
    case "open":
      return {
        name: lang === "pine" ? "open" : lang === "python" ? "o" : lang === "think" ? "open" : "Open",
        decl: "",
      };
    case "high":
      return {
        name: lang === "pine" ? "high" : lang === "python" ? "h" : lang === "think" ? "high" : "High",
        decl: "",
      };
    case "low":
      return {
        name: lang === "pine" ? "low" : lang === "python" ? "l" : lang === "think" ? "low" : "Low",
        decl: "",
      };
    case "volume":
      return {
        name: lang === "pine" ? "volume" : lang === "python" ? "v" : lang === "think" ? "volume" : "Volume",
        decl: "",
      };
    case "value":
      return { name: String(op.value), decl: "" };
    case "sma":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.sma(close, ${op.period})`
            : lang === "python"
              ? `${n} = sma(c, ${op.period})`
              : lang === "think"
                ? `${n} = Average(close, ${op.period})`
                : `${n} = Average(Close, ${op.period})`,
      };
    case "ema":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.ema(close, ${op.period})`
            : lang === "python"
              ? `${n} = ema(c, ${op.period})`
              : lang === "think"
                ? `${n} = ExpAverage(close, ${op.period})`
                : `${n} = XAverage(Close, ${op.period})`,
      };
    case "rsi":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.rsi(close, ${op.period})`
            : lang === "python"
              ? `${n} = rsi(c, ${op.period})`
              : lang === "think"
                ? `${n} = RSI(close, ${op.period})`
                : `${n} = RSI(Close, ${op.period})`,
      };
    case "macd_line":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.macd(close, ${op.fast}, ${op.slow}, ${op.signal})[0]`
            : lang === "python"
              ? `${n}, _, _ = macd(c, ${op.fast}, ${op.slow}, ${op.signal})`
              : lang === "think"
                ? `${n} = MACD(close, ${op.fast}, ${op.slow}, ${op.signal})`
                : `${n} = MACD(Close, ${op.fast}, ${op.slow}) of Data`,
      };
    case "macd_signal":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.macd(close, ${op.fast}, ${op.slow}, ${op.signal})[1]`
            : lang === "python"
              ? `_, ${n}, _ = macd(c, ${op.fast}, ${op.slow}, ${op.signal})`
              : `${n} = 0`,
      };
    case "macd_hist":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.macd(close, ${op.fast}, ${op.slow}, ${op.signal})[2]`
            : lang === "python"
              ? `_, _, ${n} = macd(c, ${op.fast}, ${op.slow}, ${op.signal})`
              : `${n} = 0`,
      };
    case "bb_upper":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.sma(close, ${op.period}) + ${op.stdev} * ta.stdev(close, ${op.period})`
            : lang === "python"
              ? `${n} = sma(c, ${op.period}) + ${op.stdev} * stdev(c, ${op.period})`
              : `${n} = BollingerBands(close, ${op.period}).UpperBand`,
      };
    case "bb_mid":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.sma(close, ${op.period})`
            : lang === "python"
              ? `${n} = sma(c, ${op.period})`
              : `${n} = Average(close, ${op.period})`,
      };
    case "bb_lower":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.sma(close, ${op.period}) - ${op.stdev} * ta.stdev(close, ${op.period})`
            : lang === "python"
              ? `${n} = sma(c, ${op.period}) - ${op.stdev} * stdev(c, ${op.period})`
              : `${n} = BollingerBands(close, ${op.period}).LowerBand`,
      };
    case "atr":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.atr(${op.period})`
            : lang === "python"
              ? `${n} = atr(h, l, c, ${op.period})`
              : `${n} = ATR(${op.period})`,
      };
    case "donchian_high":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.highest(high, ${op.period})[1]`
            : lang === "python"
              ? `${n} = rolling_max(h, ${op.period}, 1)`
              : `${n} = Highest(high, ${op.period})[1]`,
      };
    case "donchian_low":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.lowest(low, ${op.period})[1]`
            : lang === "python"
              ? `${n} = rolling_min(l, ${op.period}, 1)`
              : `${n} = Lowest(low, ${op.period})[1]`,
      };
    case "stoch_k":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.stoch(close, high, low, ${op.k})`
            : lang === "python"
              ? `${n} = stoch_k(h, l, c, ${op.k})`
              : `${n} = StochasticSlow(${op.k}, ${op.d}).SlowK`,
      };
    case "stoch_d":
      return {
        name: n,
        decl:
          lang === "pine"
            ? `${n} = ta.sma(ta.stoch(close, high, low, ${op.k}), ${op.d})`
            : lang === "python"
              ? `${n} = sma(stoch_k(h, l, c, ${op.k}), ${op.d})`
              : `${n} = StochasticSlow(${op.k}, ${op.d}).SlowD`,
      };
  }
}

function collect(spec: StrategySpec, lang: Lang) {
  const decls: string[] = [];
  const seen = new Map<string, string>();
  let i = 0;
  const nameOf = (op: Operand) => {
    const k = JSON.stringify(op);
    const hit = seen.get(k);
    if (hit) return hit;
    const { name, decl } = ident(op, lang, i++);
    seen.set(k, name);
    if (decl) decls.push(decl);
    return name;
  };
  const expr = (rule: Rule) => {
    const L = nameOf(rule.left);
    const R = nameOf(rule.right);
    if (lang === "pine") {
      if (rule.op === "cross_above") return `ta.crossover(${L}, ${R})`;
      if (rule.op === "cross_below") return `ta.crossunder(${L}, ${R})`;
      if (rule.op === "gt") return `${L} > ${R}`;
      if (rule.op === "lt") return `${L} < ${R}`;
      if (rule.op === "gte") return `${L} >= ${R}`;
      return `${L} <= ${R}`;
    }
    if (lang === "python") {
      if (rule.op === "cross_above") return `xover(${L}, ${R}, i)`;
      if (rule.op === "cross_below") return `xunder(${L}, ${R}, i)`;
      if (rule.op === "gt") return `gt(${L}, ${R}, i)`;
      if (rule.op === "lt") return `lt_(${L}, ${R}, i)`;
      if (rule.op === "gte") return `gte(${L}, ${R}, i)`;
      return `lte(${L}, ${R}, i)`;
    }
    const cross = rule.op === "cross_above" || rule.op === "cross_below";
    const cmp =
      rule.op === "gt" ? ">" : rule.op === "lt" ? "<" : rule.op === "gte" ? ">=" : "<=";
    if (lang === "think") {
      if (rule.op === "cross_above") return `${L} crosses above ${R}`;
      if (rule.op === "cross_below") return `${L} crosses below ${R}`;
      return `${L} ${cmp} ${R}`;
    }
    if (cross) {
      return rule.op === "cross_above"
        ? `${L} crosses above ${R}`
        : `${L} crosses below ${R}`;
    }
    return `${L} ${cmp} ${R}`;
  };
  return { decls, entry: spec.entry.map(expr), exit: spec.exit.map(expr) };
}

export function compilePine(spec: StrategySpec): string {
  const { decls, entry, exit } = collect(spec, "pine");
  const qid = shortId(spec);
  const isLong = spec.side !== "short";
  const isShort = spec.side === "short";
  const stopLong = spec.stopPct
    ? `    strategy.exit("XR", from_entry="Long", stop=strategy.position_avg_price * (1 - ${spec.stopPct}/100)${spec.takePct ? `, limit=strategy.position_avg_price * (1 + ${spec.takePct}/100)` : ""})`
    : "";
  const stopShort = spec.stopPct
    ? `    strategy.exit("XS", from_entry="Short", stop=strategy.position_avg_price * (1 + ${spec.stopPct}/100)${spec.takePct ? `, limit=strategy.position_avg_price * (1 - ${spec.takePct}/100)` : ""})`
    : "";
  const dir = isShort ? "short" : "long";
  const id = isShort ? "Short" : "Long";
  return `//@version=5
// HORSE compiled strategy — paste into TradingView → Pine Editor → Add to chart
// Quant ID: ${qid}
// ${specSummary(spec)}
strategy(${JSON.stringify(spec.name)}, overlay=true,
     initial_capital=${spec.capital},
     default_qty_type=strategy.percent_of_equity,
     default_qty_value=${Math.min(99, Math.max(5, spec.riskPct * 8))},
     commission_type=strategy.commission.percent,
     commission_value=${spec.commissionPct},
     pyramiding=0,
     calc_on_every_tick=false)

${decls.join("\n")}

enterSignal = ${entry.length ? entry.join(" and ") : "false"}
exitSignal  = ${exit.length ? exit.join(" and ") : "false"}

if enterSignal
    strategy.entry("${id}", strategy.${dir})
    alert('{"action":"${isShort ? "sell" : "buy"}","symbol":"${spec.symbol}","qid":"${qid}"}', alert.freq_once_per_bar_close)

if exitSignal
    strategy.close("${id}")
    alert('{"action":"flatten","symbol":"${spec.symbol}","qid":"${qid}"}', alert.freq_once_per_bar_close)
${isLong && stopLong ? `\nif strategy.position_size > 0\n${stopLong}` : ""}${isShort && stopShort ? `\nif strategy.position_size < 0\n${stopShort}` : ""}
`;
}

export function compilePython(spec: StrategySpec): string {
  const { decls, entry, exit } = collect(spec, "python");
  const qid = shortId(spec);
  return `#!/usr/bin/env python3
"""HORSE compiled strategy — ${spec.name}
Quant ID: ${qid}
${specSummary(spec)}

pip install pandas numpy yfinance
python strategy.py
"""
from __future__ import annotations
import numpy as np
import pandas as pd

try:
    import yfinance as yf
except ImportError as exc:
    raise SystemExit("pip install yfinance pandas numpy") from exc

SYMBOL = ${JSON.stringify(spec.symbol)}
CAPITAL = ${spec.capital}
COMMISSION = ${spec.commissionPct} / 100.0
STOP_PCT = ${spec.stopPct ?? "None"}
TAKE_PCT = ${spec.takePct ?? "None"}
SIDE = ${JSON.stringify(spec.side)}

def sma(x, n):
    return pd.Series(x).rolling(n).mean().to_numpy()

def ema(x, n):
    return pd.Series(x).ewm(span=n, adjust=False).mean().to_numpy()

def stdev(x, n):
    return pd.Series(x).rolling(n).std(ddof=0).to_numpy()

def rsi(x, n=14):
    s = pd.Series(x)
    d = s.diff()
    up = d.clip(lower=0).ewm(alpha=1/n, adjust=False).mean()
    dn = (-d.clip(upper=0)).ewm(alpha=1/n, adjust=False).mean()
    rs = up / dn.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).to_numpy()

def macd(x, fast=12, slow=26, signal=9):
    line = ema(x, fast) - ema(x, slow)
    sig = ema(line, signal)
    return line, sig, line - sig

def atr(h, l, c, n=14):
    prev = np.r_[c[0], c[:-1]]
    tr = np.maximum(h - l, np.maximum(np.abs(h - prev), np.abs(l - prev)))
    return pd.Series(tr).ewm(alpha=1/n, adjust=False).mean().to_numpy()

def rolling_max(x, n, shift=1):
    return pd.Series(x).shift(shift).rolling(n).max().to_numpy()

def rolling_min(x, n, shift=1):
    return pd.Series(x).shift(shift).rolling(n).min().to_numpy()

def stoch_k(h, l, c, n):
    hh = pd.Series(h).rolling(n).max()
    ll = pd.Series(l).rolling(n).min()
    return ((pd.Series(c) - ll) / (hh - ll).replace(0, np.nan) * 100).to_numpy()

def xover(a, b, i):
    return i > 0 and np.isfinite([a[i-1], b[i-1], a[i], b[i]]).all() and a[i-1] <= b[i-1] and a[i] > b[i]

def xunder(a, b, i):
    return i > 0 and np.isfinite([a[i-1], b[i-1], a[i], b[i]]).all() and a[i-1] >= b[i-1] and a[i] < b[i]

def gt(a, b, i):
    return np.isfinite([a[i], b[i]]).all() and a[i] > b[i]

def lt_(a, b, i):
    return np.isfinite([a[i], b[i]]).all() and a[i] < b[i]

def gte(a, b, i):
    return np.isfinite([a[i], b[i]]).all() and a[i] >= b[i]

def lte(a, b, i):
    return np.isfinite([a[i], b[i]]).all() and a[i] <= b[i]

def load(symbol):
    df = yf.download(symbol, period="5y", interval="1d", auto_adjust=True, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [str(c[0]).lower() for c in df.columns]
    else:
        df.columns = [str(c).lower() for c in df.columns]
    return df.dropna()

def run(df: pd.DataFrame):
    o = df["open"].to_numpy()
    h = df["high"].to_numpy()
    l = df["low"].to_numpy()
    c = df["close"].to_numpy()
    v = df["volume"].to_numpy() if "volume" in df.columns else np.zeros(len(df))
${decls.map((d) => "    " + d).join("\n")}
    cash, shares, side, entry = float(CAPITAL), 0.0, 0, 0.0
    pending = None
    trades = []
    equity = []
    for i in range(len(c)):
        if pending == "flat" and shares:
            px = float(o[i])
            cash += shares * px * side - abs(shares * px) * COMMISSION
            trades.append(cash)
            shares, side = 0.0, 0
            pending = None
        elif pending in ("long", "short") and shares == 0:
            px = float(o[i])
            qty = (cash * 0.95) / px
            fee = qty * px * COMMISSION
            if pending == "long":
                cash -= qty * px + fee
                side = 1
            else:
                cash += qty * px - fee
                side = -1
            shares, entry = qty, px
            pending = None
        if STOP_PCT and shares:
            stop = entry * (1 - STOP_PCT / 100) if side == 1 else entry * (1 + STOP_PCT / 100)
            if side == 1 and l[i] <= stop:
                cash += shares * float(stop)
                shares, side = 0.0, 0
            elif side == -1 and h[i] >= stop:
                cash -= shares * float(stop)
                shares, side = 0.0, 0
        if TAKE_PCT and shares:
            tp = entry * (1 + TAKE_PCT / 100) if side == 1 else entry * (1 - TAKE_PCT / 100)
            if side == 1 and h[i] >= tp:
                cash += shares * float(tp)
                shares, side = 0.0, 0
            elif side == -1 and l[i] <= tp:
                cash -= shares * float(tp)
                shares, side = 0.0, 0
        try:
            enter = ${entry.length ? entry.join(" and ") : "False"}
            leave = ${exit.length ? exit.join(" and ") : "False"}
        except Exception:
            enter, leave = False, False
        if shares == 0 and enter:
            pending = "short" if SIDE == "short" else "long"
        elif shares != 0 and leave:
            pending = "flat"
        mt = cash + (shares * float(c[i]) if side == 1 else 0.0)
        if side == -1:
            mt = cash - shares * float(c[i])
        equity.append(mt)
    eq = pd.Series(equity, index=df.index[:len(equity)])
    ret = eq.iloc[-1] / CAPITAL - 1
    print(f"HORSE {qid}")
    print(f"Return {ret:.2%}  marks {len(trades)}  end {eq.iloc[-1]:,.2f}")
    return eq

if __name__ == "__main__":
    run(load(SYMBOL))
`;
}

export function compileThinkScript(spec: StrategySpec): string {
  const { decls, entry, exit } = collect(spec, "think");
  const qid = shortId(spec);
  return `# HORSE compiled ThinkScript — paste into thinkorswim Study / Strategy
# Quant ID: ${qid}
# ${specSummary(spec)}
# Open thinkorswim → Studies → Create → Strategy → paste → save as ${qid}

${decls.join(";\n")}${decls.length ? ";" : ""}

def enterLong = ${entry.length ? entry.join(" and ") : "no"};
def exitLong = ${exit.length ? exit.join(" and ") : "no"};

AddOrder(OrderType.BUY_TO_OPEN, enterLong, open[-1], 100, Color.WHITE, Color.WHITE, "HORSE long");
AddOrder(OrderType.SELL_TO_CLOSE, exitLong, open[-1], 100, Color.WHITE, Color.WHITE, "HORSE exit");
${spec.stopPct ? `AddOrder(OrderType.SELL_TO_CLOSE, low <= EntryPrice() * (1 - ${spec.stopPct}/100), EntryPrice() * (1 - ${spec.stopPct}/100), 100, Color.RED, Color.RED, "stop");` : ""}
`;
}

export function compileEasyLanguage(spec: StrategySpec): string {
  const { decls, entry, exit } = collect(spec, "el");
  const qid = shortId(spec);
  return `{ HORSE compiled EasyLanguage — TradeStation / MultiCharts }
{ Quant ID: ${qid} }
{ ${specSummary(spec)} }

${decls.map((d) => d.replace(/^(.*?)\s*=/, "Vars: $1(0);\n$1 =")).join(";\n")};

If ${entry.length ? entry.join(" and ") : "False"} then Buy next bar at market;
If ${exit.length ? exit.join(" and ") : "False"} then Sell next bar at market;
${spec.stopPct ? `SetStopLoss(${spec.stopPct} * 100);` : ""}
${spec.takePct ? `SetProfitTarget(${spec.takePct} * 100);` : ""}
`;
}

export function compileWebhook(spec: StrategySpec): string {
  const qid = shortId(spec);
  return `{
  "comment": "TradingView alert() payload HORSE emits from the compiled Pine. Point the alert webhook at your broker bridge / stack.",
  "quantId": ${JSON.stringify(qid)},
  "symbol": ${JSON.stringify(spec.symbol)},
  "timeframe": ${JSON.stringify(spec.timeframe)},
  "buy": { "action": "buy", "symbol": ${JSON.stringify(spec.symbol)}, "qid": ${JSON.stringify(qid)} },
  "flatten": { "action": "flatten", "symbol": ${JSON.stringify(spec.symbol)}, "qid": ${JSON.stringify(qid)} }
}`;
}

function lintPine(src: string): string {
  const lines = src.split("\n").filter((l) => !l.startsWith("undefined") && l.trim() !== "undefined");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function compileAll(spec: StrategySpec): ExportPack {
  return {
    quantId: encodeQid(spec),
    shortId: shortId(spec),
    spec,
    pinescript: lintPine(compilePine(spec)),
    python: compilePython(spec),
    thinkscript: compileThinkScript(spec),
    easylanguage: compileEasyLanguage(spec),
    webhook: compileWebhook(spec),
  };
}

export function pineLooksValid(src: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!src.includes("//@version=5")) issues.push("Missing //@version=5");
  if (!src.includes("strategy(")) issues.push("Missing strategy() header");
  if (src.includes("undefined")) issues.push("Unresolved identifier");
  if (src.length < 80) issues.push("Script too short");
  return { ok: issues.length === 0, issues };
}
