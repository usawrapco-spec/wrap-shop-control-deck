# Sales journey walkthrough (Jarvis) — clean layout

Chance opens on **Delco Soft Ask**. The **timeline map** (left) shows every bot step. **One next-step** command card center + **Next / Back**. Soft Ask blanks (`call?` / `email?`) are Chance-filled only. Grok narrates the **bot plan** — not chrome ops. Hologram stays ambient. Secondary chrome (Board / meters / tools) hides behind **⋯**.

**Version:** `0.9.3-clean` · **AI Engage:** OFF · **Deck GO/HOLD:** stub only (no live send)

## How to walk it

1. Open the Control Deck (Pages or local).
2. Leave **JARVIS** ON — hologram + live motion rings wake up.
3. **Command card** (center) shows the one next step + blanks when relevant.
4. **Timeline map** (left) = Delco Soft Ask bot plan, then journey stages.
5. Soft Ask steps show blanks: **call?** / **email?** — check when you act (local only).
6. Next pages = nine journey stages (inquiry → review). Whiteboard shows **SALES JOURNEY**.
7. At **review**, Last Offer appears as a **preview stub** only (no live send).
8. Final step returns to Delco #1.

Nothing in this walkthrough sends email, SMS, or Wrapstart messages.

## Live motion contexts

| Mode | When | Look |
|------|------|------|
| HOT JOB | Delco Soft Ask open / return to #1 | Gold pulse rings |
| SOFT ASK | Soft Ask timeline chapters | Cyan orbit particles |
| CHANCE GATE | GO / HOLD chapter | Red/amber gate glow |
| SALES JOURNEY | Journey intro + 9 stages | Teal rings + journey progress |

## Recommendations baked in

- **Synopsis + STUCK flag** on the timeline map (Delco stuck ~48h stall)
- **Soft Ask blanks** `call?` / `email?` — Chance fills only
- **Last Offer** at review stage only as preview stub
- **Clean hierarchy** — next-step center, map left, hologram secondary, chrome collapsed

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
| 9 | Get review | Review Radar | Review Soft Ask + Last Offer preview stub |

## Hard rules (unchanged)

- `meta.aiEngage` = **off**
- GO / HOLD on deck = **stub toasts** only
- Soft Ask **name stays**
- Default job = **Delco PR-0014** (`job-delco-pr0014`) — Soft Ask walk opens first
- No live customer sends from this app

## Files

- `data/shop-brain.json` — `timelineBranch`, `salesJourney`, stations, `companionScript`, synopsis/stuck, version bump
- `app.js` — timeline map + blanks + Last Offer stub + live motion + chrome toggle
- `index.html` / `style.css` — clean hierarchy
- `JOURNEY.md` — this note
