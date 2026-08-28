import { createServerFn } from "@tanstack/react-start";
import type { Bar, Timeframe } from "./types";

const RANGE: Record<Timeframe, { interval: string; range: string }> = {
  "1d": { interval: "1d", range: "5y" },
  "4h": { interval: "1h", range: "6mo" },
  "1h": { interval: "1h", range: "6mo" },
  "15m": { interval: "15m", range: "1mo" },
};

type YahooChart = {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators?: {
        quote?: {
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }[];
      };
    }[];
  };
};

export const fetchYahooHistory = createServerFn({ method: "POST" })
  .validator((input: { symbol: string; timeframe: Timeframe }) => input)
  .handler(async ({ data }): Promise<{ ok: true; bars: Bar[] } | { ok: false; error: string }> => {
    const { interval, range } = RANGE[data.timeframe] ?? RANGE["1d"];
    const symbol = encodeURIComponent(data.symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 HORSE/1.0",
          Accept: "application/json",
        },
      });
      if (!res.ok) return { ok: false, error: `Yahoo ${res.status}` };
      const body = (await res.json()) as YahooChart;
      const result = body.chart?.result?.[0];
      const ts = result?.timestamp ?? [];
      const q = result?.indicators?.quote?.[0];
      if (!ts.length || !q) return { ok: false, error: "Empty chart" };
      const bars: Bar[] = [];
      for (let i = 0; i < ts.length; i++) {
        const o = q.open?.[i];
        const h = q.high?.[i];
        const l = q.low?.[i];
        const c = q.close?.[i];
        const v = q.volume?.[i] ?? 0;
        if ([o, h, l, c].some((x) => x == null || !Number.isFinite(x))) continue;
        bars.push({ t: ts[i]! * 1000, o: o!, h: h!, l: l!, c: c!, v: v ?? 0 });
      }
      if (bars.length < 30) return { ok: false, error: "Not enough bars" };
      return { ok: true, bars };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Yahoo failed" };
    }
  });
