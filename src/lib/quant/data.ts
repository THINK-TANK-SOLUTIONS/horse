import type { Bar, Timeframe } from "./types";

export type TickerProfile = {
  symbol: string;
  name: string;
  kind: "equity" | "etf" | "crypto" | "fx" | "future";
  start: number;
  mu: number;
  vol: number;
};

export const UNIVERSE: TickerProfile[] = [
  { symbol: "SPY", name: "S&P 500 ETF", kind: "etf", start: 428, mu: 0.00042, vol: 0.0102 },
  { symbol: "QQQ", name: "Nasdaq 100 ETF", kind: "etf", start: 392, mu: 0.00055, vol: 0.0135 },
  { symbol: "IWM", name: "Russell 2000 ETF", kind: "etf", start: 198, mu: 0.00028, vol: 0.0148 },
  { symbol: "AAPL", name: "Apple", kind: "equity", start: 178, mu: 0.00048, vol: 0.016 },
  { symbol: "MSFT", name: "Microsoft", kind: "equity", start: 372, mu: 0.0005, vol: 0.014 },
  { symbol: "NVDA", name: "NVIDIA", kind: "equity", start: 86, mu: 0.0011, vol: 0.028 },
  { symbol: "TSLA", name: "Tesla", kind: "equity", start: 178, mu: 0.0004, vol: 0.032 },
  { symbol: "AMZN", name: "Amazon", kind: "equity", start: 168, mu: 0.00046, vol: 0.018 },
  { symbol: "META", name: "Meta", kind: "equity", start: 462, mu: 0.00058, vol: 0.02 },
  { symbol: "GLD", name: "Gold ETF", kind: "etf", start: 191, mu: 0.00022, vol: 0.009 },
  { symbol: "TLT", name: "20Y Treasury", kind: "etf", start: 94, mu: -0.00005, vol: 0.0095 },
  { symbol: "BTC-USD", name: "Bitcoin", kind: "crypto", start: 42800, mu: 0.0007, vol: 0.036 },
  { symbol: "ETH-USD", name: "Ethereum", kind: "crypto", start: 2480, mu: 0.00055, vol: 0.04 },
  { symbol: "EURUSD", name: "Euro / Dollar", kind: "fx", start: 1.084, mu: 0.00002, vol: 0.0048 },
];

const BARS: Record<Timeframe, { count: number; ms: number; perYear: number }> = {
  "15m": { count: 1800, ms: 15 * 60 * 1000, perYear: 252 * 26 },
  "1h": { count: 1600, ms: 60 * 60 * 1000, perYear: 252 * 6.5 },
  "4h": { count: 1400, ms: 4 * 60 * 60 * 1000, perYear: 252 * 1.6 },
  "1d": { count: 1260, ms: 24 * 60 * 60 * 1000, perYear: 252 },
};

export function barsPerYear(tf: Timeframe, crypto: boolean): number {
  if (crypto) {
    if (tf === "1d") return 365;
    if (tf === "4h") return 365 * 6;
    if (tf === "1h") return 365 * 24;
    return 365 * 24 * 4;
  }
  return BARS[tf].perYear;
}

export function profileOf(symbol: string): TickerProfile {
  const hit = UNIVERSE.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
  if (hit) return hit;
  let h = 2166136261;
  for (let i = 0; i < symbol.length; i++) h = Math.imul(h ^ symbol.charCodeAt(i), 16777619);
  const u = (h >>> 0) / 2 ** 32;
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    kind: "equity",
    start: 40 + (h % 400),
    mu: 0.0002 + u * 0.0006,
    vol: 0.012 + (1 - u) * 0.02,
  };
}

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(symbol: string, timeframe: Timeframe): number {
  const s = `${symbol}:${timeframe}:horse-v1`;
  let h = 1779033703;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
  return h >>> 0;
}

function gauss(rng: () => number): number {
  const u = Math.max(rng(), 1e-9);
  const v = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function isCrypto(kind: TickerProfile["kind"]): boolean {
  return kind === "crypto" || kind === "fx";
}

export function generateBars(symbol: string, timeframe: Timeframe, count?: number): Bar[] {
  const profile = profileOf(symbol);
  const meta = BARS[timeframe];
  const n = count ?? meta.count;
  const rng = mulberry32(seedFrom(symbol, timeframe));
  const crypto = isCrypto(profile.kind);
  const bars: Bar[] = [];
  let price = profile.start;
  let vol = profile.vol;
  const end = Date.UTC(2026, 7, 27, 20, 0, 0);
  let t = end - n * (timeframe === "1d" ? 24 * 60 * 60 * 1000 : meta.ms);

  while (bars.length < n) {
    const day = new Date(t);
    if (!crypto && timeframe === "1d") {
      const wd = day.getDay();
      if (wd === 0 || wd === 6) {
        t += 24 * 60 * 60 * 1000;
        continue;
      }
    }
    vol = Math.min(profile.vol * 2.8, Math.max(profile.vol * 0.45, vol * (0.94 + 0.12 * rng())));
    const jump = rng() < 0.012 ? gauss(rng) * vol * 4 : 0;
    const ret = profile.mu + vol * gauss(rng) + jump;
    const o = price * (1 + gauss(rng) * vol * 0.15);
    let c = Math.max(0.01, o * (1 + ret));
    const wick = vol * (0.35 + rng() * 0.9);
    const h = Math.max(o, c) * (1 + Math.abs(gauss(rng)) * wick);
    const l = Math.max(0.01, Math.min(o, c) * (1 - Math.abs(gauss(rng)) * wick));
    const v = Math.round((8_000_000 + rng() * 40_000_000) * (0.6 + vol / profile.vol));
    bars.push({ t, o, h, l, c, v });
    price = c;
    t += timeframe === "1d" ? 24 * 60 * 60 * 1000 : meta.ms;
  }
  return bars.slice(-n);
}

export function resampleTo(bars: Bar[], timeframe: Timeframe): Bar[] {
  if (timeframe === "1d") return bars;
  return bars;
}

const yahooCache = new Map<string, { at: number; bars: Bar[] }>();

export function cacheBars(symbol: string, timeframe: Timeframe, bars: Bar[]) {
  yahooCache.set(`${symbol}:${timeframe}`, { at: Date.now(), bars });
}

export function cachedBars(symbol: string, timeframe: Timeframe): Bar[] | null {
  const hit = yahooCache.get(`${symbol}:${timeframe}`);
  if (!hit) return null;
  if (Date.now() - hit.at > 30 * 60 * 1000) return null;
  return hit.bars;
}

export function loadBars(symbol: string, timeframe: Timeframe): Bar[] {
  return cachedBars(symbol, timeframe) ?? generateBars(symbol, timeframe);
}
