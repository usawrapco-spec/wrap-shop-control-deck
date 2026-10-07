# USA Wrap Co Control Deck v0.9.3-clean

Stupid-simple **command station** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** Soft Ask.

**Layout hierarchy (clean):**
1. **One next-step** + Soft Ask blanks + Next/Back + GO/HOLD — center command card
2. **Timeline map** — left rail, all bot steps visible
3. **Hologram** — ambient secondary (wrap-guy + live motion)
4. **Chrome** — Board / meters / mute / listen / MORE behind **⋯**

**Jarvis** = calm ops companion with Cortana-*feel* (helpful hologram), **not** Cortana look.
- **Grok Bot** = voice — narrates the **bot plan** (not chrome ops)
- **Hologram wrap-guy** = body (cyan/white scanline figure)
- **Soft Ask blanks** = `call?` / `email?` — Chance fills only (local, never sends)
- **Last Offer** = review-stage preview stub only

**Vault / Batcomputer room lighting** stays — matte black, cyan hairlines, breathable spacing.

## How to turn Jarvis ON

1. Open the deck (live URL below, or local).
2. Tap **JARVIS** in the top bar (OFF → ON). Default is **ON**.
3. Center **command card** shows the one next step. Timeline map on the left.
4. Walk with **Next / Back**. Fill Soft Ask blanks when you act.
5. Tap **⋯** for Board, meters, mute, listen, whiteboard cycle, MORE.
6. Optional: **LISTEN** = UI listening state (Web Speech when allowed).

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
- Synopsis + **STUCK** flag on the map
- Last Offer = review preview stub only
- No purple game UI / XP / arcade

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app.
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.

## Files

- `index.html` — vault shell · timeline map · command center · hologram stage
- `app.js` — Three.js hologram + CanvasTexture whiteboard + GO/HOLD stubs + blanks
- `style.css` — clean hierarchy HUD
- `assets/wrap-guy-pointing.png` — stylized pointing wrap-guy hologram texture
- `data/shop-brain.json` — lanes, Delco job, boardSnapshot, salesJourney, timelineBranch, companion script
- `JOURNEY.md` — sales journey + timeline walkthrough
- `JARVIS_JOURNEY_PLAN.md` — approved Jarvis plan
- `README.md` — this file

Evolved from v0.9.2-timeline · v0.9.1-journey · v0.9-hologram · v0.8.1-jarvis · v0.7-vault · v0.4-simple dock kept.
