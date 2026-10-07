# USA Wrap Co Control Deck v0.9-hologram

Stupid-simple **command station** for Chance — sits beside Wrapstart while you walk the **Delco PR-0014** Soft Ask.

**Jarvis** = calm ops companion with Cortana-*feel* (helpful hologram), **not** Cortana look.
- **Grok Bot** = voice
- **Hologram wrap-guy** = body (cyan/white scanline figure, pointing pose from USA Wrap Co ad vibe)
- **Whiteboard** in front of him cycles Soft Ask steps · job cards · Delco email draft preview (draws lines as he “briefs”)

First screen = three things only:
1. **What’s hot** (Delco Soft Ask #1)
2. **What to do next** (one plain-English line)
3. **GO / HOLD** (stubs — no live send)

**Vault / Batcomputer room lighting** stays — matte black, cyan hairlines. Cramped strip + mission-rail layout removed so the hologram owns center stage.

## How to turn Jarvis ON

1. Open the deck (live URL below, or local).
2. Tap **JARVIS** in the top bar (OFF → ON). Default is **ON**.
3. Center stage wakes: hologram wrap-guy + whiteboard Soft Ask walkthrough.
4. Walk steps with **→ / ←** on the dock (or Jarvis thoughts panel). Whiteboard lights steps as Jarvis briefs.
5. **BOARD VIEW** cycles whiteboard: Soft Ask → jobs → email draft.
6. Optional: **MUTE** / **BEEP**. **LISTEN** = UI listening state (Web Speech when allowed).

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
- No purple game UI / XP / arcade

## Safety (non-negotiable)

- Do **not** flip Wrapstart Engage / Answer ON from this app.
- Do **not** send email/SMS from this app (stubs only).
- Do **not** call live Wrapstart APIs from this static deck.

## Files

- `index.html` — vault shell + hologram stage + simple dock
- `app.js` — Three.js hologram + CanvasTexture whiteboard + GO/HOLD stubs
- `style.css` — vault HUD, center stage, dock
- `assets/wrap-guy-pointing.png` — stylized pointing wrap-guy hologram texture (no usable ad photo found on disk)
- `data/shop-brain.json` — lanes, Delco job, boardSnapshot, companion script
- `README.md` — this file

Evolved from v0.8.1-jarvis · v0.7-vault · v0.4-simple dock kept.
