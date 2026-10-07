# USA Wrap Co Control Deck v0.5-game

Stupid-simple **command station** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** close. Game HUD framing makes jobs feel playable; every beat maps to a real ops action.

First screen = three things only:
1. **What’s hot** (Delco boss)
2. **What to do next** (one plain-English line)
3. **GO / HOLD** (stubs — no live send)

Warm 3D shop map + quest markers, minimap, mission board under **Quests**. Steps / lanes / rules under **Show steps** / **More**.  
**AI stays OFF. No live customer sends.**

See **[GAME_DESIGN.md](./GAME_DESIGN.md)** for how the game layer maps to shop ops.

## Open it (Chance)

Live: **https://usawrapco-spec.github.io/wrap-shop-control-deck/**

Or local:

```bash
cd /workspace/wrap-shop-control-deck-2026-10-06
python3 -m http.server 8878
```

Open **http://localhost:8878/** beside Wrapstart.

- Big red **AI OFF** badge = Engage OFF · Answer Off (hardcoded)
- **No customer send** — GO / HOLD toast *“Queued for Chance — no live send”*
- **Quests** = Delco boss + side jobs with $ and next action
- **XP / streak** (localStorage) for scrub, Soft Ask steps, GO/HOLD stubs — not fake revenue
- Sound muted by default (🔇 toggle)

## What’s preloaded

| Item | Value |
|---|---|
| Proposal | **PR-0014** |
| Hot job | Delco close prep (Legendary / boss) |
| Status | not sent yet |
| Default | Delco opens on load |

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app (no path exists).
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.
- Real Soft Ask / proposal send stays in Wrapstart (or your Gmail draft) when *you* choose.

## Files

- `index.html` — simple dock + game HUD shell
- `app.js` — Three.js shop + companion + quest/XP layer + stubs
- `style.css` — neon shop polish
- `data/shop-brain.json` — lanes, stations, Delco job, companion script
- `GAME_DESIGN.md` — Chance-facing game ↔ ops map
- `README.md` — this file

Evolved from v0.4-simple · cues from wrap-shop-brain-sim / control-future.
