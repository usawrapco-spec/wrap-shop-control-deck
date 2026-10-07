# USA Wrap Co Control Deck v0.3

**Always-on (GitHub Pages):** https://usawrapco-spec.github.io/wrap-shop-control-deck/

Jarvis-style **companion** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** close.

Warm game-toy shop map (Three.js) + think-path feedback + **Grok thinking** script panel.  
**AI stays OFF. No live customer sends.**

## Open it (Chance)

Open the Pages URL anytime (HTTPS, no local server):

**https://usawrapco-spec.github.io/wrap-shop-control-deck/**

Optional local copy:

```bash
python3 -m http.server 8878
```

Then open **http://localhost:8878/** beside Wrapstart.

- Big red **AI OFF** badge = Engage OFF · Answer Off (hardcoded — never wires live AI ON)
- **No customer send** — GO / HOLD buttons toast *“Coming — no live send tonight”*
- Companion panel narrates the Delco Soft Ask → GO → accept → 50% deposit path (UI only)

## What’s preloaded

| Item | Value |
|---|---|
| Proposal | **PR-0014** |
| Fixed option | **$29,807** pretax |
| Folding option | **$44,232** pretax |
| Status | `close-prep` at Chance Gate |
| Default job | Delco opens on load |

## How to use tonight

1. Open the URL — Delco job drawer + companion should already be open.
2. **Think path** (right panel): click any glowing step → leave feedback (localStorage `wrapShopControlDeckFeedback_v03`) → **Export feedback JSON**.
3. **Grok thinking** (bottom dock): step with **Next →** through Soft Ask draft → waiting GO → stub send → deposit path.
4. Tap **GO Soft Ask** / **HOLD** anytime — stub toast only; nothing hits Wrapstart, Gmail, or SMS.
5. Mic button = **voice coming** (disabled placeholder).

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app (no path exists).
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.
- Real Soft Ask / proposal send stays in Wrapstart (or your Gmail draft) when *you* choose.
- No API keys in this repo. AI OFF stays hardcoded in the UI.

## Files

- `index.html` — shell + companion dock
- `app.js` — Three.js shop + think-path + companion script
- `style.css` — warm Nunito / Space Grotesk toy aesthetic
- `data/shop-brain.json` — lanes, stations, Delco job, companion script
- `README.md` — this file

Hosted from `main` / root via GitHub Pages.

Evolved from `wrap-shop-brain-sim-2026-10-06/` · cues from `wrap-shop-control-future-2026-10-06/`.
