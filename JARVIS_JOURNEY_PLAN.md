# USA Wrap Co Control Deck — Jarvis Journey Plan

**For:** Chance · **Date:** 2026-10-07 · **Approve to build**

---

## Executive summary (Chance)

1. Put the full sales journey (inquiry → review) in `shop-brain.json` as the deck’s only source of truth.
2. Jarvis = Cortana-*feel*: calm personality, hologram moves/points, talks straight to you; Grok Bot = voice, hologram = body.
3. Soft Ask emails live in Wrapstart only; deck never sends. Tone: casual-pro, occasional typo+fix, stern intent, push full-scope / bigger vehicles; Last Offer at review.
4. AI stays OFF. Deck GO / HOLD = stub until you send for real.
5. Soft Ask name stays. No rename, no mass blast, no Engage ON from the deck.
6. Build in four phases: brain + walkthrough → Cortana motion/chat → live Wrapstart read → Soft Ask/Last Offer with your GO.
7. Delco / MSA stay Chance-only forever.
8. Approve this plan → we ship Phase 1 against the brain you already have.

---

## Goal

Give Chance a Control Deck where **Jarvis** walks every job through the shop sales journey — inquiry/lead → capture info → quote → answer questions → proof/design → schedule → wait install → final payment → review — using `data/shop-brain.json` as the single source of truth. Jarvis feels like a calm Cortana-style ops companion (personality + motion + direct talk): **Grok Bot is the voice**, the **hologram wrap-guy is the body**. Soft Ask / emails stay Wrapstart-only; the deck’s GO is a stub until Chance sends. AI Engage stays OFF. Soft Ask name stays. Last Offer lands at review, still Chance-gated.

---

## Journey stages

| Stage | Station | Jarvis says | Chance does | Wrapstart object |
|-------|---------|-------------|-------------|------------------|
| 1. Inquiry / lead | Lead Lake (+ Front Desk) | “Lead just splashed in. We park it — nobody auto-pings. AI OFF until you say GO.” | Open lead card · confirm vehicle + scope hints · move to Capture | Lead / form intake (Receptionist; Lead Agent OFF) |
| 2. Capture information | Front Desk (+ Lead Lake) | “Fill the blanks before we price. Junk in = junk quotes.” | Complete intake (vehicle, area, fleet, zip, timeline, contact) · tag Delco/MSA Chance-only · hand to Quote Forge | Lead card / intake fields |
| 3. Get them a quote | Quote Forge (+ Margin Vault) | “Ballpark → real proposal. Soft Ask tone — full scope beats a cheap partial.” | Scrub proposal · Margin Guard (C+A tax 8.2%, margin pretax) · queue at Chance Gate · draft Soft Ask (no send) | Proposal / quote draft |
| 4. Answer questions | Chance Gate (+ Quote Forge) | “Soft Ask window. Warm call + proposal link. You alone send anything customer-facing.” | Soft Ask from Wrapstart (or yourself) · Mark Sent · HOLD auto-send · answer inbound Qs · deck GO = stub only | Soft Ask draft / outbound thread (Chance SEND) |
| 5. Create proof / design | Design Studio (+ Deposit Safe, Print Bay) | “Accept first → 50% deposit clears Deposit Safe → then Design. No free art on a handshake.” | Confirm deposit cleared · open Design · customer proof OK · release Print Bay | Accept + 50% deposit invoice · design / proof |
| 6. Schedule | Schedule Board (+ Install Bay) | “Lock the install window once design is signed. Wrap outside / upfit inside stay separate.” | Pick install slot · confirm with customer · stage materials | Install appointment / calendar |
| 7. Wait on install | Install Bay (+ Print Bay, Schedule Board) | “Install day. Quality over speed. Happy install = referrals.” | Crew + QC · finish photos · punch-list early · move to Final Pay | Job / install status |
| 8. Final payment | Final Pay (+ Deposit Safe) | “Balance due before keys roll. Deposit took 50% — Final Pay closes the rest.” | Invoice remaining all-in · collect · release vehicle (or Chance-approved terms) | Final invoice / receipt |
| 9. Get review | Review Radar (+ Install Bay) | “Ask for the review while the win is fresh. Last Offer sits here if we’re still closing a gap — still your SEND.” | Review Soft Ask out (Chance-approved) · optional Last Offer · log stars / referral · mark journey complete | Review Soft Ask · Last Offer (Chance SEND) |

**Tone rules (Soft Ask / emails — Wrapstart only)**  
Casual-pro · occasional typo + self-fix · stern intent · push full-scope / bigger vehicles · one lead, one Soft Ask · **Last Offer** only at review · never mass blast · Soft Ask **name stays**.

---

## Build phases

### Phase 1 — Brain JSON + walkthrough UI
- Treat `data/shop-brain.json` as source of truth (`salesJourney`, stations, hardRules, companionScript, jobs, boardSnapshot).
- Deck loads journey 1→9: station highlight, Jarvis line, Chance next action, Wrapstart object label.
- Whiteboard walkthrough + dock “What’s hot / next / GO·HOLD” stay; GO/HOLD remain stubs.
- Delco PR-0014 stays #1 on the board while journey map is walkable for any job.
- **Ship gate:** Chance can click station-by-station and see the full path without sending anything.

### Phase 2 — Cortana motion / chat
- Jarvis personality: calm ops companion, talks **directly to Chance** (“you,” not third person).
- Hologram body moves/points at active station + whiteboard step; Grok Bot = voice (LISTEN / MUTE / BEEP as today).
- Chat / thoughts panel walks the journey; BOARD VIEW still cycles Soft Ask · jobs · email draft preview.
- Look stays cyan/white scanline wrap-guy — Cortana-*feel*, not Cortana costume.
- **Ship gate:** Chance can “talk” the journey with Jarvis and see the body react; still AI OFF, still no live send.

### Phase 3 — Live Wrapstart read (no send)
- Deck **reads** Wrapstart job/lead/proposal state into the brain snapshot (or overlay) so stations show live stage.
- **No** write/send/Engage flip from the deck. No Gmail/SMS. No customer-facing action.
- Map live fields → journey stage ids (`sj-inquiry` … `sj-review`).
- **Ship gate:** Chance sees real job position on the journey map; SEND still only in Wrapstart by Chance.

### Phase 4 — Soft Ask / Last Offer from deck with Chance GO
- Deck can stage Soft Ask + Last Offer drafts for Chance review (preview on whiteboard).
- **Chance GO** = the only path that triggers a real Wrapstart send (never auto). Until that wiring is live, GO stays stub toast: “Queued for Chance — no live send.”
- Last Offer = review-stage Soft Ask variant (same name family, same one-customer rule).
- Soft Ask tone pack encoded in brain (casual-pro, typo+fix, stern intent, full-scope / bigger vehicles).
- **Ship gate:** Chance approves a Soft Ask or Last Offer in the deck → real send only via Wrapstart after explicit GO; AI still OFF unless Chance flips Engage elsewhere on purpose.

---

## Do-NOT list

- Do **not** flip Wrapstart AI Engage / Answer ON from this app.
- Do **not** send email, SMS, or Soft Ask from the deck until Phase 4 + Chance GO (Phases 1–3 = stubs / read-only).
- Do **not** rename Soft Ask.
- Do **not** mass-blast or spray Soft Asks.
- Do **not** auto-route Delco / MSA — Chance-only forever.
- Do **not** open Design before accept + 50% deposit.
- Do **not** put deposit lines on quotes.
- Do **not** call live Wrapstart **write** APIs from the static deck before Phase 4 GO wiring.
- Do **not** add purple game UI / XP / arcade.
- Do **not** hard-close spam; Soft Ask stays warm with stern intent.
- Do **not** invent a second brain — deck loads `shop-brain.json` only.

---

## Done-when checklist

- [ ] Full 9-stage journey lives in `shop-brain.json` and the deck renders it without hardcoding stage copy in JS.
- [ ] Chance can walk inquiry → review with Jarvis lines + next actions for Delco and any job.
- [ ] Jarvis ON: hologram body + Grok voice hub; talks directly to Chance; moves/points with the active stage (Phase 2).
- [ ] AI OFF badge stays true; Engage / Answer never flipped by the deck.
- [ ] GO / HOLD = stub until Chance authorizes real Wrapstart send (Phase 4).
- [ ] Soft Ask name kept; emails Soft Ask-only path via Wrapstart; Last Offer at review only.
- [ ] Tone pack in brain: casual-pro · typo+fix · stern intent · full-scope / bigger vehicles.
- [ ] Margin / tax / deposit / Delco rules still match hardRules.
- [ ] README + this plan match shipped behavior.
- [ ] Chance says GO on this plan (and again per Soft Ask send).

---

## Open decisions

1. **Phase 3 read path** — Pull Wrapstart via approved connector / export into `shop-brain.json` (or a live overlay file), vs. Chance pasting board snapshots. Prefer read-only sync when credentials exist; until then, brain JSON snapshot stays authoritative.
2. **Phase 4 GO wiring** — Deck GO opens / focuses Wrapstart SEND for the staged Soft Ask (Chance clicks send there), vs. deck calling a Wrapstart send API after GO. Default recommendation: **open Wrapstart SEND** so the deck never holds send credentials.
3. **Last Offer copy** — Confirm one-line intent for Last Offer (final scope/price nudge at review) so tone pack can ship with Soft Ask; otherwise Phase 4 ships Soft Ask only and Last Offer follows in a small add-on.

---

*Approve this plan to start Phase 1. AI OFF · no live send · Soft Ask name stays · brain is truth.*
