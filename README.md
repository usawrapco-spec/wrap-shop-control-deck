# USA Wrap Co Control Deck v0.7-vault

Stupid-simple **command station** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** Soft Ask.

First screen = three things only:
1. **What’s hot** (Delco Soft Ask #1)
2. **What to do next** (one plain-English line)
3. **GO / HOLD** (stubs — no live send)

**Vault / Batcomputer HUD** — matte black, cyan hairlines, monospace status. Main stage is a vertical **mission rail** (Lead → Quote → Soft Ask → Accept → Deposit → Install) with Delco as the active Soft Ask node and a ranked board list beside it. No 3D orbit island. **Brain thoughts** = companion think path in plain English. Lanes / rules / future under **More**.  
**AI stays OFF. No live customer sends. Outbound LinkedIn paused — not featured.**

## Open it (Chance)

Live: **https://usawrapco-spec.github.io/wrap-shop-control-deck/**

Or local:

```bash
cd /workspace/wrap-shop-control-deck-gh
python3 -m http.server 8878
```

Open **http://localhost:8878/** beside Wrapstart.

- Big red **AI OFF** badge = Engage OFF · Answer Off (hardcoded)
- **No customer send** — GO / HOLD toast *“Queued for Chance — no live send”*
- **Brain thoughts** = Delco Soft Ask think path (expandable)
- **Mission rail** = pipeline stages · Delco active · top board ranked beside
- **Board** = top jobs from internal snapshot (Delco first)
- No XP / achievements / arcade sounds / rarity toys / purple neon

## What’s preloaded

| Item | Value |
|---|---|
| Proposal | **PR-0014** |
| Hot job | Delco Soft Ask (#1 on board) |
| Status | not sent yet · HOLD auto-send |
| Default | Delco opens on load · Soft Ask rail node |

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app (no path exists).
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.
- Real Soft Ask / proposal send stays in Wrapstart (or your Gmail draft) when *you* choose.

## Files

- `index.html` — vault shell + mission rail + simple dock
- `app.js` — mission rail + brain companion + GO/HOLD stubs (no Three.js)
- `style.css` — Dark Knight / Wayne ops vault HUD
- `data/shop-brain.json` — lanes, stations, Delco job, boardSnapshot, companion script
- `README.md` — this file

Evolved from v0.6-brain (3D island → mission rail) · v0.5-game stripped · v0.4-simple first-screen shape kept.
