import type { Bar, Operand, Op } from "./types";

export function sma(values: number[], period: number): number[] {
  const out = Array.from({ length: values.length }, () => Number.NaN);
  if (period < 1) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out = Array.from({ length: values.length }, () => Number.NaN);
  if (period < 1 || values.length === 0) return out;
  const k = 2 / (period + 1);
  let prev = values[0]!;
  out[0] = prev;
  for (let i = 1; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  for (let i = 0; i < period - 1 && i < out.length; i++) out[i] = Number.NaN;
  return out;
}

export function stdev(values: number[], period: number): number[] {
  const mean = sma(values, period);
  const out = Array.from({ length: values.length }, () => Number.NaN);
  for (let i = period - 1; i < values.length; i++) {
    let acc = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = values[j]! - mean[i]!;
      acc += d * d;
    }
    out[i] = Math.sqrt(acc / period);
  }
  return out;
}

export function rsi(closes: number[], period = 14): number[] {
  const out = Array.from({ length: closes.length }, () => Number.NaN);
  if (closes.length < period + 1) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i]! - closes[i - 1]!;
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    gain = (gain * (period - 1) + g) / period;
    loss = (loss * (period - 1) + l) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function atr(bars: Bar[], period = 14): number[] {
  const tr = bars.map((b, i) => {
    if (i === 0) return b.h - b.l;
    const prev = bars[i - 1]!.c;
    return Math.max(b.h - b.l, Math.abs(b.h - prev), Math.abs(b.l - prev));
  });
  const out = Array.from({ length: bars.length }, () => Number.NaN);
  if (tr.length < period) return out;
  let acc = 0;
  for (let i = 0; i < period; i++) acc += tr[i]!;
  out[period - 1] = acc / period;
  for (let i = period; i < tr.length; i++) {
    out[i] = (out[i - 1]! * (period - 1) + tr[i]!) / period;
  }
  return out;
}

export function rollingMax(values: number[], period: number, shift = 1): number[] {
  const out = Array.from({ length: values.length }, () => Number.NaN);
  for (let i = 0; i < values.length; i++) {
    const end = i - shift;
    const start = end - period + 1;
    if (start < 0 || end < 0) continue;
    let m = -Infinity;
    for (let j = start; j <= end; j++) m = Math.max(m, values[j]!);
    out[i] = m;
  }
  return out;
}

export function rollingMin(values: number[], period: number, shift = 1): number[] {
  const out = Array.from({ length: values.length }, () => Number.NaN);
  for (let i = 0; i < values.length; i++) {
    const end = i - shift;
    const start = end - period + 1;
    if (start < 0 || end < 0) continue;
    let m = Infinity;
    for (let j = start; j <= end; j++) m = Math.min(m, values[j]!);
    out[i] = m;
  }
  return out;
}

export function stoch(bars: Bar[], kPeriod: number, dPeriod: number): { k: number[]; d: number[] } {
  const highs = bars.map((b) => b.h);
  const lows = bars.map((b) => b.l);
  const hh = rollingMax(highs, kPeriod, 0);
  const ll = rollingMin(lows, kPeriod, 0);
  const k = bars.map((b, i) => {
    const range = hh[i]! - ll[i]!;
    if (!Number.isFinite(range) || range === 0) return Number.NaN;
    return ((b.c - ll[i]!) / range) * 100;
  });
  return { k, d: sma(k.map((v) => (Number.isFinite(v) ? v : 0)), dPeriod) };
}

const cache = new WeakMap<Bar[], Map<string, number[]>>();

function keyOf(op: Operand): string {
  return JSON.stringify(op);
}

export function seriesOf(bars: Bar[], operand: Operand): number[] {
  if (operand.kind === "value") return bars.map(() => operand.value);
  let bag = cache.get(bars);
  if (!bag) {
    bag = new Map();
    cache.set(bars, bag);
  }
  const key = keyOf(operand);
  const hit = bag.get(key);
  if (hit) return hit;

  const closes = bars.map((b) => b.c);
  const opens = bars.map((b) => b.o);
  const highs = bars.map((b) => b.h);
  const lows = bars.map((b) => b.l);
  const vols = bars.map((b) => b.v);

  let out: number[];
  switch (operand.kind) {
    case "close":
      out = closes;
      break;
    case "open":
      out = opens;
      break;
    case "high":
      out = highs;
      break;
    case "low":
      out = lows;
      break;
    case "volume":
      out = vols;
      break;
    case "sma":
      out = sma(closes, operand.period);
      break;
    case "ema":
      out = ema(closes, operand.period);
      break;
    case "rsi":
      out = rsi(closes, operand.period);
      break;
    case "macd_line":
    case "macd_signal":
    case "macd_hist": {
      const fast = ema(closes, operand.fast);
      const slow = ema(closes, operand.slow);
      const line = fast.map((v, i) => v - slow[i]!);
      const signal = ema(
        line.map((v) => (Number.isFinite(v) ? v : 0)),
        operand.signal,
      );
      if (operand.kind === "macd_line") out = line;
      else if (operand.kind === "macd_signal") out = signal;
      else out = line.map((v, i) => v - signal[i]!);
      break;
    }
    case "bb_mid":
      out = sma(closes, operand.period);
      break;
    case "bb_upper": {
      const mid = sma(closes, operand.period);
      const sd = stdev(closes, operand.period);
      out = mid.map((v, i) => v + operand.stdev * sd[i]!);
      break;
    }
    case "bb_lower": {
      const mid = sma(closes, operand.period);
      const sd = stdev(closes, operand.period);
      out = mid.map((v, i) => v - operand.stdev * sd[i]!);
      break;
    }
    case "atr":
      out = atr(bars, operand.period);
      break;
    case "donchian_high":
      out = rollingMax(highs, operand.period, 1);
      break;
    case "donchian_low":
      out = rollingMin(lows, operand.period, 1);
      break;
    case "stoch_k":
      out = stoch(bars, operand.k, operand.d).k;
      break;
    case "stoch_d":
      out = stoch(bars, operand.k, operand.d).d;
      break;
    default:
      out = closes;
  }
  bag.set(key, out);
  return out;
}

export function crossedAbove(left: number[], right: number[], i: number): boolean {
  if (i < 1) return false;
  const a0 = left[i - 1]!;
  const b0 = right[i - 1]!;
  const a1 = left[i]!;
  const b1 = right[i]!;
  if (![a0, b0, a1, b1].every(Number.isFinite)) return false;
  return a0 <= b0 && a1 > b1;
}

export function crossedBelow(left: number[], right: number[], i: number): boolean {
  if (i < 1) return false;
  const a0 = left[i - 1]!;
  const b0 = right[i - 1]!;
  const a1 = left[i]!;
  const b1 = right[i]!;
  if (![a0, b0, a1, b1].every(Number.isFinite)) return false;
  return a0 >= b0 && a1 < b1;
}

export function evalOp(
  left: number[],
  right: number[],
  op: Op,
  i: number,
  firstValid = false,
): boolean {
  if (firstValid && (op === "cross_above" || op === "cross_below")) {
    if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) return false;
    return op === "cross_above" ? left[i]! > right[i]! : left[i]! < right[i]!;
  }
  switch (op) {
    case "cross_above":
      return crossedAbove(left, right, i);
    case "cross_below":
      return crossedBelow(left, right, i);
    case "gt":
      return Number.isFinite(left[i]) && Number.isFinite(right[i]) && left[i]! > right[i]!;
    case "lt":
      return Number.isFinite(left[i]) && Number.isFinite(right[i]) && left[i]! < right[i]!;
    case "gte":
      return Number.isFinite(left[i]) && Number.isFinite(right[i]) && left[i]! >= right[i]!;
    case "lte":
      return Number.isFinite(left[i]) && Number.isFinite(right[i]) && left[i]! <= right[i]!;
  }
}
