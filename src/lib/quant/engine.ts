import { uid } from "@/lib/utils";
import { barsPerYear, cachedBars, loadBars, profileOf } from "./data";
import { evalOp, seriesOf } from "./series";
import type {
  BacktestMetrics,
  BacktestResult,
  Bar,
  EquityPoint,
  StrategySpec,
  Trade,
} from "./types";

function allRules(
  spec: StrategySpec,
  bars: Bar[],
  which: "entry" | "exit",
  i: number,
  firstValid = false,
): boolean {
  const rules = spec[which];
  if (rules.length === 0) return false;
  return rules.every((rule) =>
    evalOp(seriesOf(bars, rule.left), seriesOf(bars, rule.right), rule.op, i, firstValid),
  );
}

function finiteRules(spec: StrategySpec, bars: Bar[], i: number): boolean {
  const ops = [...spec.entry, ...spec.exit].flatMap((r) => [r.left, r.right]);
  return ops.every((op) => Number.isFinite(seriesOf(bars, op)[i]));
}

export function runBacktest(spec: StrategySpec, bars?: Bar[]): BacktestResult {
  const cached = cachedBars(spec.symbol, spec.timeframe);
  const data = bars && bars.length > 20 ? bars : cached ?? loadBars(spec.symbol, spec.timeframe);
  const source: BacktestResult["source"] =
    (bars && bars.length > 20) || cached ? "yahoo" : "synthetic";
  const trades: Trade[] = [];
  const equity: EquityPoint[] = [];

  let cash = spec.capital;
  let shares = 0;
  let side: 0 | 1 | -1 = 0;
  let entryPrice = 0;
  let entryTime = 0;
  let entryBar = 0;
  let pending: "long" | "short" | "flat" | null = null;
  let peak = spec.capital;
  let timeIn = 0;
  let seenValid = false;

  const commission = spec.commissionPct / 100;

  function markToMarket(i: number): number {
    const px = data[i]!.c;
    if (side === 1) return cash + shares * px;
    if (side === -1) return cash - shares * px;
    return cash;
  }

  function closePosition(i: number, price: number, reason: Trade["reason"]) {
    if (side === 0 || shares === 0) return;
    const pnlGross = side === 1 ? (price - entryPrice) * shares : (entryPrice - price) * shares;
    const fee = Math.abs(price * shares) * commission;
    const pnl = pnlGross - fee;
    cash += side === 1 ? shares * price : -shares * price;
    cash -= fee;
    trades.push({
      id: uid("tr"),
      side: side === 1 ? "long" : "short",
      entryTime,
      exitTime: data[i]!.t,
      entry: entryPrice,
      exit: price,
      shares,
      pnl,
      ret: entryPrice === 0 ? 0 : (side === 1 ? price / entryPrice - 1 : entryPrice / price - 1),
      barsHeld: i - entryBar,
      reason,
    });
    shares = 0;
    side = 0;
    entryPrice = 0;
  }

  function openPosition(i: number, dir: 1 | -1, price: number) {
    if (side !== 0) closePosition(i, price, "signal");
    const eq = cash;
    let notional: number;
    if (spec.stopPct && spec.stopPct > 0) {
      const risk = eq * (spec.riskPct / 100);
      const perShare = price * (spec.stopPct / 100);
      notional = perShare > 0 ? (risk / perShare) * price : eq * 0.95;
    } else {
      notional = eq * Math.min(0.99, Math.max(0.05, spec.riskPct / 20));
    }
    notional = Math.min(notional, eq * 0.99);
    const qty = Math.max(0, Math.floor((notional / price) * 100) / 100);
    if (qty <= 0) return;
    const fee = qty * price * commission;
    if (dir === 1) cash -= qty * price + fee;
    else cash += qty * price - fee;
    shares = qty;
    side = dir;
    entryPrice = price;
    entryTime = data[i]!.t;
    entryBar = i;
  }

  for (let i = 0; i < data.length; i++) {
    const bar = data[i]!;

    if (side !== 0) {
      if (spec.stopPct && spec.stopPct > 0) {
        if (side === 1) {
          const stop = entryPrice * (1 - spec.stopPct / 100);
          if (bar.l <= stop) closePosition(i, stop, "stop");
        } else {
          const stop = entryPrice * (1 + spec.stopPct / 100);
          if (bar.h >= stop) closePosition(i, stop, "stop");
        }
      }
      if (side !== 0 && spec.takePct && spec.takePct > 0) {
        if (side === 1) {
          const tp = entryPrice * (1 + spec.takePct / 100);
          if (bar.h >= tp) closePosition(i, tp, "take");
        } else {
          const tp = entryPrice * (1 - spec.takePct / 100);
          if (bar.l <= tp) closePosition(i, tp, "take");
        }
      }
    }

    if (pending && i > 0) {
      const fill = bar.o;
      if (pending === "flat") closePosition(i, fill, "signal");
      else if (pending === "long" && (spec.side === "long" || spec.side === "both"))
        openPosition(i, 1, fill);
      else if (pending === "short" && (spec.side === "short" || spec.side === "both"))
        openPosition(i, -1, fill);
      pending = null;
    }

    if (i > 8 && finiteRules(spec, data, i)) {
      const firstValid = !seenValid;
      seenValid = true;
      const enter = allRules(spec, data, "entry", i, firstValid);
      const leave = allRules(spec, data, "exit", i, false);
      if (side !== 0 && leave) pending = "flat";
      else if (side === 0 && enter) {
        pending = spec.side === "short" ? "short" : "long";
        if (spec.side === "both") pending = "long";
      }
    }

    const eq = markToMarket(i);
    peak = Math.max(peak, eq);
    const dd = peak === 0 ? 0 : eq / peak - 1;
    if (side !== 0) timeIn += 1;
    equity.push({ t: bar.t, equity: eq, drawdown: dd, close: bar.c });
  }

  if (side !== 0) closePosition(data.length - 1, data[data.length - 1]!.c, "eod");

  const metrics = computeMetrics(spec, data, equity, trades, timeIn);
  return { spec, bars: data, equity, trades, metrics, source };
}

function computeMetrics(
  spec: StrategySpec,
  bars: Bar[],
  equity: EquityPoint[],
  trades: Trade[],
  timeIn: number,
): BacktestMetrics {
  const startEquity = spec.capital;
  const endEquity = equity[equity.length - 1]?.equity ?? startEquity;
  const netProfit = endEquity - startEquity;
  const totalReturn = startEquity === 0 ? 0 : endEquity / startEquity - 1;
  const crypto = profileOf(spec.symbol).kind === "crypto" || profileOf(spec.symbol).kind === "fx";
  const bpy = barsPerYear(spec.timeframe, crypto);
  const years = Math.max(1 / bpy, bars.length / bpy);
  const cagr = years > 0 && startEquity > 0 ? Math.pow(endEquity / startEquity, 1 / years) - 1 : 0;

  const rets: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    const prev = equity[i - 1]!.equity;
    if (prev > 0) rets.push(equity[i]!.equity / prev - 1);
  }
  const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const variance =
    rets.length > 1 ? rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length - 1) : 0;
  const std = Math.sqrt(variance);
  const sharpe = std === 0 ? 0 : (mean / std) * Math.sqrt(bpy);
  const neg = rets.filter((r) => r < 0);
  const downVar = neg.length ? neg.reduce((a, r) => a + r * r, 0) / neg.length : 0;
  const downStd = Math.sqrt(downVar);
  const sortino = downStd === 0 ? 0 : (mean / downStd) * Math.sqrt(bpy);
  const maxDrawdown = equity.reduce((m, p) => Math.min(m, p.drawdown), 0);

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const winSum = wins.reduce((a, t) => a + t.pnl, 0);
  const lossSum = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const first = bars[0]?.c ?? 1;
  const last = bars[bars.length - 1]?.c ?? first;
  const buyHold = first === 0 ? 0 : last / first - 1;

  return {
    startEquity,
    endEquity,
    netProfit,
    totalReturn,
    cagr,
    sharpe,
    sortino,
    maxDrawdown,
    winRate: trades.length ? wins.length / trades.length : 0,
    profitFactor: lossSum === 0 ? (winSum > 0 ? 99 : 0) : winSum / lossSum,
    trades: trades.length,
    avgTrade: trades.length ? netProfit / trades.length : 0,
    avgWin: wins.length ? winSum / wins.length : 0,
    avgLoss: losses.length ? -lossSum / losses.length : 0,
    exposure: bars.length ? timeIn / bars.length : 0,
    buyHold,
    bars: bars.length,
  };
}
