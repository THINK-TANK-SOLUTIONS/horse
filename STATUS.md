# HORSE — status

Last push: 2026-08-28

If a chat forgets where we are, start here. Do not republish. Do not invent a new repo. Do not fold this into SimuTrade, QuantVibe, or any other product.

## Where it lives

| Surface | Value |
|---|---|
| GitHub (source of truth) | https://github.com/THINK-TANK-SOLUTIONS/horse |
| Product | HORSE. Standalone. |

## Standing rules

- One product, this repo. Names that rhyme are not a merge.
- Push every working turn here. The owner picks up from GitHub, not from chat memory.
- Do not spray public links of untested builds.

## What is in this version

- Landing with SMA 20/50 demo backtest
- Studio: Horse chat, spec editor, export panel, backtest / strategy tester
- Dialects: Pine v5, Python, ThinkScript, EasyLanguage
- Quant ID round-trip (`H1.`)
- Unlimited local backtests (next-open fills, stop-first same bar, commission, risk sizing)
- Library, Stacks, Monitor (paper)
- Local keyword interpreter if Horse API is quiet

## Provenance

Built as a QuantIDE replacement: spec-first compiler instead of a quirky agent that emitted almost-Pine. Not tried/tested/proven by the owner yet. That is why it is not live.

## Next

1. Owner tries Studio / Backtest / Export in the working preview
2. Only then a controlled host, under HORSE, not under another product
3. Keep pushing this repo at the end of every working turn
