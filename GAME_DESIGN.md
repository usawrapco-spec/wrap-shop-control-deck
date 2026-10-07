# Control Deck game layer — Chance cheat sheet

**v0.5-game** keeps the stupid-simple first screen and adds a **useful** command HUD so walking jobs feels like a playable shop — not a toy.

## First screen (unchanged shape)

| UI | Real shop meaning |
|---|---|
| **What’s hot** | The job that needs you *now* (default: Delco PR-0014) |
| **What to do next** | One plain-English next action for that job |
| **▶ GO / ⏸ HOLD** | Your gate call — **stubs only**. Toast: queued for Chance. **No** Wrapstart / Gmail / SMS send |
| **AI OFF** | Engage OFF · Answer Off — hardcoded. Never flips live AI ON |

Steps, think-path, lanes, rules stay under **Show steps** / **More**.

## How “game” maps to ops

| Game thing | Real meaning |
|---|---|
| **Boss quest** | Delco close — Fixed $29,807 / Folding $44,232 pretax · Soft Ask path |
| **Side quests** | Other open jobs that still need Chance (Amit SEND, Transit Soft Ask, DekWave, practice) |
| **Tier (Legendary → Common)** | Deal weight: fleet / $ size / pending SEND — not cosmetics |
| **Quest markers + minimap** | Where on the shop map a job is parked that needs you |
| **OBJ arrow** | Points at Delco — tonight’s main close |
| **Need you meter** | Count of jobs in close-prep / pending-send / hold / Delco |
| **Delco meter** | Stall clock (~48h) — competitors in play |
| **XP / level / streak** | Local progress for **real actions**: scrub, Soft Ask step, GO stub, HOLD stub — **not** fake revenue |
| **Achievements** | Milestones: first scrub, Delco packet focused, AI OFF confirmed, first GO/HOLD stub, Soft Ask draft walked, 3-day streak |
| **Companion** | One-line NPC voice for the Delco Soft Ask script — drafts only |
| **Sound (muted default)** | Soft beeps on GO / HOLD / level-up — optional |
| **Particles / light shake** | Feedback when you tap **GO** stub — tasteful, no spam |

## Earning XP (localStorage only)

| Action | XP | Notes |
|---|---|---|
| Advance companion / think step | +15 | Clearing a real next line |
| Scrub / open job details | +25 | Proposal scrub path |
| Soft Ask companion step | +40 | Draft readiness — still no send |
| ▶ GO stub | +60 | Queued for Chance — **no live send** |
| ⏸ HOLD stub | +20 | Parked on purpose |
| Focus Delco boss | +5 | Orient on the close |

Progress saves in `localStorage` key `wrapShopControlDeckGame_v05`. Clear site data to reset.

## Safety (non-negotiable)

1. **No live customer send** from this deck.
2. **AI stays OFF** — badge is honest; no Engage ON path.
3. Real Soft Ask / proposal send = Wrapstart (or your draft) when *you* choose.
4. Practice traffic stays on **wallco92**.

## How to play a close (tonight)

1. Open the deck — dock shows Delco + next action + GO/HOLD.
2. Tap **Quests** for boss + side board with $ and next lines.
3. **Show steps** for companion Soft Ask script (one line at a time).
4. Tap **GO** or **HOLD** when you’ve decided — juice + XP, toast only.
5. **More** for lanes, hard rules, future, export feedback.

Fun = clearing real next steps. Useful = never losing the simple gate.
