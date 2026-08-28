export type Timeframe = "15m" | "1h" | "4h" | "1d";
export type Side = "long" | "short" | "both";

export type Operand =
  | { kind: "close" }
  | { kind: "open" }
  | { kind: "high" }
  | { kind: "low" }
  | { kind: "volume" }
  | { kind: "value"; value: number }
  | { kind: "sma"; period: number }
  | { kind: "ema"; period: number }
  | { kind: "rsi"; period: number }
  | { kind: "macd_line"; fast: number; slow: number; signal: number }
  | { kind: "macd_signal"; fast: number; slow: number; signal: number }
  | { kind: "macd_hist"; fast: number; slow: number; signal: number }
  | { kind: "bb_upper"; period: number; stdev: number }
  | { kind: "bb_mid"; period: number; stdev: number }
  | { kind: "bb_lower"; period: number; stdev: number }
  | { kind: "atr"; period: number }
  | { kind: "donchian_high"; period: number }
  | { kind: "donchian_low"; period: number }
  | { kind: "stoch_k"; k: number; d: number }
  | { kind: "stoch_d"; k: number; d: number };

export type Op = "cross_above" | "cross_below" | "gt" | "lt" | "gte" | "lte";

export type Rule = {
  id: string;
  left: Operand;
  op: Op;
  right: Operand;
};

export type StrategySpec = {
  name: string;
  symbol: string;
  timeframe: Timeframe;
  side: Side;
  capital: number;
  riskPct: number;
  commissionPct: number;
  entry: Rule[];
  exit: Rule[];
  stopPct?: number;
  takePct?: number;
};

export type Bar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type Trade = {
  id: string;
  side: "long" | "short";
  entryTime: number;
  exitTime: number;
  entry: number;
  exit: number;
  shares: number;
  pnl: number;
  ret: number;
  barsHeld: number;
  reason: "signal" | "stop" | "take" | "eod";
};

export type EquityPoint = { t: number; equity: number; drawdown: number; close: number };

export type BacktestMetrics = {
  startEquity: number;
  endEquity: number;
  netProfit: number;
  totalReturn: number;
  cagr: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  trades: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  exposure: number;
  buyHold: number;
  bars: number;
};

export type BacktestResult = {
  spec: StrategySpec;
  bars: Bar[];
  equity: EquityPoint[];
  trades: Trade[];
  metrics: BacktestMetrics;
  source: "yahoo" | "synthetic";
};

export type ExportPack = {
  quantId: string;
  shortId: string;
  spec: StrategySpec;
  pinescript: string;
  python: string;
  thinkscript: string;
  easylanguage: string;
  webhook: string;
};

export type HorseMessage = {
  id: string;
  role: "user" | "horse";
  text: string;
  createdAt: number;
};

export type SavedStrategy = {
  id: string;
  spec: StrategySpec;
  notes: string;
  createdAt: number;
  updatedAt: number;
  lastMetrics?: BacktestMetrics;
};
