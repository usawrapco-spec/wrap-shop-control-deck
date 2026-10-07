# USA Wrap Co Control Deck v0.4-simple

Stupid-simple **companion** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** close.

First screen = three things only:
1. **What’s hot** (Delco)
2. **What to do next** (one plain-English line)
3. **GO / HOLD** (stubs — no live send)

Warm 3D shop map stays. Steps, lanes, rules, future live under **Show steps** / **More**.  
**AI stays OFF. No live customer sends.**

## Open it (Chance)

Live: **https://usawrapco-spec.github.io/wrap-shop-control-deck/**

Or local:

```bash
cd /workspace/wrap-shop-control-deck-2026-10-06
python3 -m http.server 8878
```

Open **http://localhost:8878/** beside Wrapstart.

- Big red **AI OFF** badge = Engage OFF · Answer Off (hardcoded — never wires live AI ON)
- **No customer send** — GO / HOLD toast *“Coming — no live send tonight”*
- **Show steps** expands the Delco Soft Ask companion path (one step at a time)
- **More** = lanes, hard rules, future roadmap, export feedback, reset camera

## What’s preloaded

| Item | Value |
|---|---|
| Proposal | **PR-0014** |
| Hot job | Delco close prep |
| Status | not sent yet |
| Default | Delco opens on load |

## How to use tonight

1. Open the URL — dock shows Delco + next action + GO/HOLD.
2. Tap **What’s hot** to focus Delco on the map.
3. Tap **GO** or **HOLD** anytime — stub toast only; nothing hits Wrapstart, Gmail, or SMS.
4. Need detail? **Show steps** → optional **Show job details** / think-path feedback.
5. **More** for lanes, rules, future, export JSON (localStorage `wrapShopControlDeckFeedback_v03`).

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app (no path exists).
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.
- Real Soft Ask / proposal send stays in Wrapstart (or your Gmail draft) when *you* choose.

## Files

- `index.html` — simple shell + dock
- `app.js` — Three.js shop + companion + stubs
- `style.css` — clean first-screen UI
- `data/shop-brain.json` — lanes, stations, Delco job, companion script
- `README.md` — this file

Evolved from `wrap-shop-brain-sim-2026-10-06/` · cues from `wrap-shop-control-future-2026-10-06/`.
