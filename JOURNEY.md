# Sales journey walkthrough (Jarvis)

Chance clicks **→ / ←** (dock or Jarvis thoughts) to walk Soft Ask (Delco #1) then the full shop sales journey. The **live motion** screen on center stage changes with context — hot job, Soft Ask step, Chance Gate, or journey stage — so the panel is never a static empty board.

**Version:** `0.9.1-journey` · **AI Engage:** OFF · **Deck GO/HOLD:** stub only (no live send)

## How to walk it

1. Open the Control Deck (Pages or local).
2. Leave **JARVIS** ON — hologram + live motion rings wake up.
3. **Jarvis thoughts** opens with the companion script (not empty).
4. Steps **1–4** = Delco Soft Ask briefing (unchanged). Live motion = **HOT JOB** / **SOFT ASK** / **CHANCE GATE**.
5. Step **5** = journey intro. Motion shifts to **SALES JOURNEY** (teal).
6. Steps **6–14** = nine journey stages (inquiry → review). Whiteboard shows **SALES JOURNEY**; progress bar + rings track the stage.
7. Step **15** = back to Delco #1. Motion returns to **HOT JOB**.

Dock **→ / ←** advances the same script even if the thoughts panel is closed. Context HUD (mode · title · sub · progress) always updates.

Nothing in this walkthrough sends email, SMS, or Wrapstart messages.

## Live motion contexts

| Mode | When | Look |
|------|------|------|
| HOT JOB | Delco Soft Ask open / return to #1 | Gold pulse rings |
| SOFT ASK | Early Soft Ask chapters | Cyan orbit particles |
| CHANCE GATE | GO / HOLD chapter | Red/amber gate glow |
| SALES JOURNEY | Journey intro + 9 stages | Teal rings + journey progress |

## Nine stages (`salesJourney` in `data/shop-brain.json`)

| # | Stage | Station | Soft Ask? |
|---|--------|---------|-----------|
| 1 | Inquiry / lead | Lead Lake (+ Front Desk) | Name reserved for later |
| 2 | Capture information | Front Desk | — |
| 3 | Get them a quote | Quote Forge (+ Margin Vault) | Draft Soft Ask here |
| 4 | Answer questions | Chance Gate | Soft Ask send (Chance / Wrapstart) |
| 5 | Create proof / design | Design Studio (+ Deposit Safe, Print Bay) | Deposit before design |
| 6 | Schedule | Schedule Board | — |
| 7 | Wait on install | Install Bay | — |
| 8 | Final payment | Final Pay | — |
| 9 | Get review | Review Radar | Review Soft Ask (Chance-gated) |

Each stage object has: `id`, `label`, `stationId`, `jarvisLine`, `whatWeDo`, `whatCustomerSees`, `nextAction`, optional `softAskNote`.

## New / aligned stations

- **schedule-board** — install calendar after design sign-off
- **final-pay** — balance after 50% deposit
- **review-radar** — review / referral Soft Ask
- Existing stations keep their ids; blurbs tagged to journey stages.

## Hard rules (unchanged)

- `meta.aiEngage` = **off**
- GO / HOLD on deck = **stub toasts** only
- Soft Ask **name stays**
- Default job = **Delco PR-0014** (`job-delco-pr0014`) — `thinkPath` untouched
- No live customer sends from this app

## Files

- `data/shop-brain.json` — `salesJourney`, stations, `companionScript` c5–c15, version bump
- `app.js` — live motion + whiteboard / brief follow journey chapters
- `index.html` / `style.css` — live-motion canvas + context HUD
- `JOURNEY.md` — this note
