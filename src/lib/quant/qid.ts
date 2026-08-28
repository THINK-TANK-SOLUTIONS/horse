import type { Operand, Rule, StrategySpec } from "./types";

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeQid(spec: StrategySpec): string {
  const json = JSON.stringify(spec);
  const bytes = new TextEncoder().encode(json);
  return `H1.${bytesToB64Url(bytes)}`;
}

export function decodeQid(raw: string): StrategySpec | null {
  const token = raw.trim();
  if (!token) return null;
  try {
    if (token.startsWith("{")) {
      const parsed = JSON.parse(token) as { spec?: StrategySpec } | StrategySpec;
      if (parsed && typeof parsed === "object" && "spec" in parsed && parsed.spec) {
        return hydrateSpec(parsed.spec);
      }
      return hydrateSpec(parsed as StrategySpec);
    }
    const body = token.startsWith("H1.") ? token.slice(3) : token;
    const json = new TextDecoder().decode(b64UrlToBytes(body));
    return hydrateSpec(JSON.parse(json) as StrategySpec);
  } catch {
    return null;
  }
}

export function shortId(spec: StrategySpec): string {
  const bits = spec.entry.slice(0, 2).map(ruleTag).filter(Boolean);
  const tag = bits.join("+") || "SPEC";
  return `HORSE-${spec.symbol}-${tag}`.replace(/\s+/g, "").slice(0, 36);
}

function ruleTag(rule: Rule): string {
  return `${opTag(rule.left)}${opSym(rule.op)}${opTag(rule.right)}`;
}

function opSym(op: Rule["op"]): string {
  switch (op) {
    case "cross_above":
      return "x";
    case "cross_below":
      return "xd";
    case "gt":
      return "gt";
    case "lt":
      return "lt";
    case "gte":
      return "ge";
    case "lte":
      return "le";
  }
}

function opTag(op: Operand): string {
  switch (op.kind) {
    case "sma":
      return `SMA${op.period}`;
    case "ema":
      return `EMA${op.period}`;
    case "rsi":
      return `RSI${op.period}`;
    case "value":
      return String(op.value);
    case "close":
      return "C";
    case "donchian_high":
      return `DCHhi${op.period}`;
    case "donchian_low":
      return `DCHlo${op.period}`;
    case "bb_lower":
      return `BBlo${op.period}`;
    case "bb_upper":
      return `BBup${op.period}`;
    case "macd_hist":
      return "MACDh";
    case "macd_line":
      return "MACD";
    default:
      return op.kind.slice(0, 4).toUpperCase();
  }
}

export function hydrateSpec(raw: Partial<StrategySpec>): StrategySpec | null {
  if (!raw || !raw.symbol || !Array.isArray(raw.entry)) return null;
  return {
    name: raw.name || `${raw.symbol} strategy`,
    symbol: String(raw.symbol).toUpperCase(),
    timeframe: (raw.timeframe as StrategySpec["timeframe"]) || "1d",
    side: raw.side || "long",
    capital: Number(raw.capital) || 100000,
    riskPct: Number(raw.riskPct) || 1,
    commissionPct: Number(raw.commissionPct) || 0.05,
    entry: raw.entry as StrategySpec["entry"],
    exit: Array.isArray(raw.exit) ? raw.exit : [],
    stopPct: raw.stopPct,
    takePct: raw.takePct,
  };
}

export function operandLabel(op: Operand): string {
  switch (op.kind) {
    case "close":
      return "Close";
    case "open":
      return "Open";
    case "high":
      return "High";
    case "low":
      return "Low";
    case "volume":
      return "Volume";
    case "value":
      return String(op.value);
    case "sma":
      return `SMA ${op.period}`;
    case "ema":
      return `EMA ${op.period}`;
    case "rsi":
      return `RSI ${op.period}`;
    case "macd_line":
      return `MACD(${op.fast},${op.slow},${op.signal})`;
    case "macd_signal":
      return `MACD sig`;
    case "macd_hist":
      return `MACD hist`;
    case "bb_upper":
      return `BB upper ${op.period}`;
    case "bb_mid":
      return `BB mid ${op.period}`;
    case "bb_lower":
      return `BB lower ${op.period}`;
    case "atr":
      return `ATR ${op.period}`;
    case "donchian_high":
      return `Donchian high ${op.period}`;
    case "donchian_low":
      return `Donchian low ${op.period}`;
    case "stoch_k":
      return `%K ${op.k}`;
    case "stoch_d":
      return `%D ${op.d}`;
  }
}

export function opLabel(op: Rule["op"]): string {
  switch (op) {
    case "cross_above":
      return "crosses above";
    case "cross_below":
      return "crosses below";
    case "gt":
      return ">";
    case "lt":
      return "<";
    case "gte":
      return "≥";
    case "lte":
      return "≤";
  }
}

export function ruleLabel(rule: Rule): string {
  return `${operandLabel(rule.left)} ${opLabel(rule.op)} ${operandLabel(rule.right)}`;
}

export function specSummary(spec: StrategySpec): string {
  const entries = spec.entry.map(ruleLabel).join(" AND ");
  const exits = spec.exit.map(ruleLabel).join(" AND ") || "opposite / stop";
  return `${spec.side} ${spec.symbol} ${spec.timeframe} · enter when ${entries} · exit when ${exits}`;
}
