# USA Wrap Co Control Deck v0.8.1-jarvis

Stupid-simple **command station** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** Soft Ask.

**Jarvis** = calm ops companion. **Grok Bot is the voice**; the Control Deck UI is the **body** (whiteboard + Soft Ask visual walkthrough). Labeled **Jarvis · Grok hub**. Not cartoon. Soft Ask name stays. Pipeline stays (not circle). GO/HOLD still stubs (no live send). **AI OFF**.

First screen = three things only:
1. **What’s hot** (Delco Soft Ask #1)
2. **What to do next** (one plain-English line)
3. **GO / HOLD** (stubs — no live send)

**Vault / Batcomputer HUD** — matte black, cyan hairlines, monospace status. Main stage is a vertical **mission rail** (Lead → Quote → Soft Ask → Accept → Deposit → Install) with Delco as the active Soft Ask node and a ranked board list beside it. **Jarvis thoughts** = companion think path with subtle typing reveal. **Whiteboard** lights Soft Ask steps as Jarvis briefs.

## How to turn Jarvis ON

1. Open the deck (live URL below, or local).
2. Tap the **JARVIS** toggle in the top bar (shows **OFF** → **ON**).
3. Jarvis strip appears: status (`standby` / `briefing Delco` / `listening`), one-line briefing, and the **Soft Ask whiteboard**.
4. Walk steps with **Next / Back** (or tap whiteboard numbers) — steps light up as Jarvis briefs.
5. Optional: **MUTE** / **BEEP** (muted by default). **LISTEN** = UI listening state; uses Web Speech when the browser allows, otherwise visual-only — no live STT actions.
6. Preference sticks in `localStorage` for next visit.

Jarvis OFF = companion standby; Soft Ask path and GO/HOLD stubs still available under **Jarvis thoughts**.

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
- **JARVIS** toggle wakes the companion + whiteboard
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
| Companion | Jarvis · Grok hub (toggle OFF by default) |

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app (no path exists).
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.
- Real Soft Ask / proposal send stays in Wrapstart (or your Gmail draft) when *you* choose.

## Files

- `index.html` — vault shell + Jarvis strip + Soft Ask whiteboard + mission rail + simple dock
- `app.js` — Jarvis mode + whiteboard + typing reveal + mission rail + GO/HOLD stubs (no Three.js)
- `style.css` — Dark Knight / Wayne ops vault HUD + Jarvis glass board
- `data/shop-brain.json` — lanes, stations, Delco job, boardSnapshot, companion script
- `README.md` — this file

Evolved from v0.7-vault · v0.6-brain · v0.5-game stripped · v0.4-simple first-screen shape kept.
