# USA Wrap Co Control Deck v0.9.2-timeline

Stupid-simple **command station** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** Soft Ask.

**Jarvis** = calm ops companion with Cortana-*feel* (helpful hologram), **not** Cortana look.
- **Grok Bot** = voice — narrates the **bot plan** (not chrome ops)
- **Hologram wrap-guy** = body (cyan/white scanline figure, pointing pose from USA Wrap Co ad vibe)
- **Timeline rail** = all bot steps visible; one next-step page + Next/Back
- **Soft Ask blanks** = `call?` / `email?` — Chance fills only (local, never sends)
- **Last Offer** = review-stage preview stub only

First screen = three things only:
1. **What’s hot** (Delco Soft Ask #1)
2. **What to do next** (one plain-English line)
3. **GO / HOLD** (stubs — no live send)

**Vault / Batcomputer room lighting** stays — matte black, cyan hairlines.

## How to turn Jarvis ON

1. Open the deck (live URL below, or local).
2. Tap **JARVIS** in the top bar (OFF → ON). Default is **ON**.
3. Center stage wakes: hologram wrap-guy + whiteboard Soft Ask walkthrough.
4. **Timeline** shows every bot step. Walk with **→ / ←** (one next-step page).
5. Fill Soft Ask blanks (`call?` / `email?`) when you act — Chance only.
6. **BOARD VIEW** cycles whiteboard: Soft Ask → jobs → email draft.
7. Optional: **MUTE** / **BEEP**. **LISTEN** = UI listening state (Web Speech when allowed).

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
- Soft Ask **name stays**
- Synopsis + **STUCK** flag per job
- Last Offer = review preview stub only
- No purple game UI / XP / arcade

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app.
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.

## Files

- `index.html` — vault shell + hologram stage + simple dock + timeline
- `app.js` — Three.js hologram + CanvasTexture whiteboard + GO/HOLD stubs + blanks
- `style.css` — vault HUD, center stage, dock, timeline rail
- `assets/wrap-guy-pointing.png` — stylized pointing wrap-guy hologram texture
- `data/shop-brain.json` — lanes, Delco job, boardSnapshot, salesJourney, timelineBranch, companion script
- `JOURNEY.md` — sales journey + timeline walkthrough
- `JARVIS_JOURNEY_PLAN.md` — approved Jarvis plan
- `README.md` — this file

Evolved from v0.9.1-journey · v0.9-hologram · v0.8.1-jarvis · v0.7-vault · v0.4-simple dock kept.
