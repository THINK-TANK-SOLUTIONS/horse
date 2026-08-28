# HORSE

Private product. Its own repo. Do not merge with `quantvibe`, `simutrade-labs`, or anything else because the words look related.

You can't play in the NFL, but you can smell like it.

HORSE is a spec-first quant workhorse. Describe a strategy in English. Horse compiles a structured spec, then emits **Pine Script v5**, **Python**, **ThinkScript**, and **EasyLanguage** from that spec — files that actually paste into TradingView and the rest. Unlimited local backtests. No monthly meter.

## Source of truth

- **Repo:** https://github.com/THINK-TANK-SOLUTIONS/horse
- **Continuity:** [`STATUS.md`](./STATUS.md)

Do not publish a public URL of an untested build. GitHub holds the version. A controlled host comes later, when the owner says it is proven.

## What this version has

- Studio: Horse chat (English → spec), spec editor, export, backtest
- Compiler dialects: Pine v5 (`strategy()` + `alert()` JSON), Python, ThinkScript, EasyLanguage
- Quant ID pack (`H1.` token) that round-trips
- Unlimited client-side backtests
- Library, Stacks, Monitor (paper heartbeat only)

## Honest limits

- Not a broker. Does not hold keys. Does not place live orders.
- Monitor tape is paper, on purpose.
- When Yahoo answers, bars are live history and labelled. If the feed is quiet, a seeded engine runs and says so.

## Local

```bash
npm install
npm run dev
```
