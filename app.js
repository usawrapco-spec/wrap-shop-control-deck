const FEEDBACK_KEY = "wrapShopControlDeckFeedback_v03";
const STUB_TOAST_GO = "Queued for Chance — no live send";
const STUB_TOAST_HOLD = "Parked — HOLD queued for Chance";
const DATA_URL = "./data/shop-brain.json";
const VERSION_TAG = "v0.8.1-jarvis";
const JARVIS_KEY = "wrapShopControlDeckJarvis_v08";
const JARVIS_MUTE_KEY = "wrapShopControlDeckJarvisMute_v08";

/** Soft Ask whiteboard path — lights up as Jarvis briefs */
const WHITEBOARD_STEPS = [
  { id: "wb1", label: "Soft Ask ready", detail: "Warm call + proposal link · Fixed / Folding pretax · nothing sent" },
  { id: "wb2", label: "Why tonight", detail: "Competitors in play · ~48h stall · Delco is the close that moves first" },
  { id: "wb3", label: "GO or HOLD", detail: "Deck GO = stub queue only · real Soft Ask stays in Wrapstart" },
  { id: "wb4", label: "If they accept", detail: "50% deposit invoice → then Design · no free art on a handshake" },
];

/** One-line Jarvis briefings per Soft Ask step */
const JARVIS_BRIEFS = [
  "Briefing Delco — Soft Ask draft is ready. Nothing sent. AI OFF.",
  "Competitors already in play. Stall clock ~48h. Delco first.",
  "Your call — GO queues a stub; HOLD parks it. No live send.",
  "Accept path — 50% deposit, then Design. Soft Ask name stays.",
];

/** Pipeline stages for the vault mission rail */
const RAIL_STAGES = [
  { id: "lead", label: "Lead" },
  { id: "quote", label: "Quote" },
  { id: "soft-ask", label: "Soft Ask" },
  { id: "accept", label: "Accept" },
  { id: "deposit", label: "Deposit" },
  { id: "install", label: "Install" },
];

/** @type {any} */
let shopData = null;
/** @type {Array} */
let feedbackStore = loadFeedback();

const tooltip = document.getElementById("tooltip");
const detailPanel = document.getElementById("detail-panel");
const thinkPathEl = document.getElementById("think-path");
const detailHeader = document.getElementById("detail-header");
const confidenceMeter = document.getElementById("confidence-meter");
const feedbackModal = document.getElementById("feedback-modal");
const fbText = document.getElementById("fb-text");
const fbStepLabel = document.getElementById("fb-step-label");
const toast = document.getElementById("toast");

let activeJob = null;
let activeStep = null;
let toastTimer = null;
let companionStep = 0;
let companionRevealed = 0;
/** @type {string} */
let activeStageId = "soft-ask";
/** Jarvis mode — Grok Bot is the voice; deck UI is the body */
let jarvisOn = loadJarvisOn();
let jarvisMuted = loadJarvisMuted();
let jarvisListening = false;
/** @type {number|null} */
let typeTimer = null;
/** @type {SpeechRecognition|null} */
let speechRec = null;
let jarvisStatusMode = "standby"; // standby | listening | briefing

function jobNeedsChance(job) {
  if (!job) return false;
  const s = job.status || "";
  return s === "close-prep" || s === "ready" || s === "pending-send" || s === "hold" || !!job.id?.includes("delco");
}

function moneyLine(job) {
  if (job?.pricing) {
    return `Fixed $${Number(job.pricing.fixedPretax).toLocaleString()} · Folding $${Number(job.pricing.foldingPretax).toLocaleString()} pretax`;
  }
  if (job?.id?.includes("delco")) return "Fixed $29,807 · Folding $44,232 pretax · Soft Ask ready";
  if (job?.status === "pending-send") return "Proposal scrubbed · waiting Chance";
  if (job?.type === "practice") return "Sandbox only · wallco92";
  return job?.summary?.slice(0, 80) || "";
}

function nextActionForJob(job, stepIndex) {
  if (!job) return "Pick a job on the rail or Board.";
  if (job.boardNext && (stepIndex || 0) === 0) return `Next: ${job.boardNext}`;
  if (job.id?.includes("delco")) {
    const lines = [
      "Next: Soft Ask Delco — call + email, then Mark Sent. HOLD auto-send.",
      "Next: You decide — GO queues Soft Ask for Chance, or HOLD parks it.",
      "Next: GO is queue-only tonight. Real send stays in Wrapstart.",
      "Next: After they accept — take 50% deposit, then design.",
    ];
    const i = Math.max(0, Math.min(stepIndex || 0, lines.length - 1));
    return lines[i];
  }
  if (job.status === "pending-send") return "Next: Review packet, then GO when ready (stub queues only).";
  if (job.status === "hold") return "Next: Unblock HOLD — check margin / scope, then re-queue.";
  if (job.status === "active" && job.type === "wrap") return "Next: Finish Soft Ask draft, Margin Guard, park at Chance Gate.";
  if (job.type === "dekwave") return "Next: Soft Ask ballpark on DekWave — deposit before design.";
  if (job.status === "practice") return "Next: Practice on wallco92 only — never touch real customers.";
  const step = (job.thinkPath || [])[0];
  return step ? `Next: ${step.label}` : `Next: Open ${job.title.split("—")[0].trim()}`;
}

function syncOpsMeters() {
  const need = document.getElementById("meter-need-you");
  const delco = document.getElementById("meter-delco");
  if (!shopData) return;
  const snap = shopData.boardSnapshot;
  const needing = snap?.sendReadyWaitingChanceGO
    ?? shopData.jobs.filter((j) => jobNeedsChance(j)).length;
  if (need) need.textContent = String(needing);
  if (delco) {
    const stall = (shopData.meta && shopData.meta.delcoStallHours) || 48;
    delco.textContent = `~${stall}h stall`;
  }
}

function loadFeedback() {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFeedback() {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbackStore));
}

function loadJarvisOn() {
  try {
    const v = localStorage.getItem(JARVIS_KEY);
    if (v === null) return true; // default ON — Chance: wake Jarvis unless user turned it off
    return v === "on";
  } catch {
    return true;
  }
}

function saveJarvisOn() {
  try {
    localStorage.setItem(JARVIS_KEY, jarvisOn ? "on" : "off");
  } catch { /* ignore */ }
}

function loadJarvisMuted() {
  try {
    const v = localStorage.getItem(JARVIS_MUTE_KEY);
    if (v === null) return true; // muted by default
    return v !== "off";
  } catch {
    return true;
  }
}

function saveJarvisMuted() {
  try {
    localStorage.setItem(JARVIS_MUTE_KEY, jarvisMuted ? "on" : "off");
  } catch { /* ignore */ }
}

function showToast(msg, kind) {
  toast.textContent = msg;
  toast.classList.remove("hidden", "toast-go", "toast-hold", "toast-xp");
  if (kind === "go") toast.classList.add("toast-go");
  if (kind === "hold") toast.classList.add("toast-hold");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2400);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Infer mission-rail stage from board row or job */
function stageForBoardRow(row) {
  const next = String(row?.next || "").toLowerCase();
  const who = String(row?.who || "").toLowerCase();
  if (who.includes("delco") || next.includes("soft ask call")) return "soft-ask";
  if (next.includes("deposit")) return "deposit";
  if (next.includes("watch accept") || next.includes("accept")) return "accept";
  if (next.includes("draft") || next.includes("media polish")) return "quote";
  if (next.includes("install") || next.includes("production")) return "install";
  if (next.includes("soft ask")) return "soft-ask";
  return "quote";
}

function stageForJob(job) {
  if (!job) return "lead";
  if (job.id?.includes("delco") || job.status === "close-prep") return "soft-ask";
  if (job.status === "pending-send") return "accept";
  if (job.status === "practice") return "lead";
  if (job.type === "dekwave") return "quote";
  if (job.status === "active") return "soft-ask";
  if (job.status === "hold") return "quote";
  const st = job.station || "";
  if (st === "front-desk" || st === "lead-lake") return "lead";
  if (st === "quote-forge" || st === "margin-vault" || st === "dekwave-dock") return "quote";
  if (st === "chance-gate") return job.status === "pending-send" ? "accept" : "soft-ask";
  if (st === "deposit-safe") return "deposit";
  if (st === "bay" || st === "install-bay") return "install";
  return "quote";
}

function stageIndex(id) {
  const i = RAIL_STAGES.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i;
}

function boardRows() {
  const snap = shopData?.boardSnapshot;
  if (snap?.top5?.length) {
    return snap.top5.map((row, i) => ({
      ...row,
      rank: i + 1,
      stage: stageForBoardRow(row),
      jobId: matchJobId(row),
    }));
  }
  return (shopData?.jobs || []).map((j, i) => ({
    id: j.wrapstart?.proposalId || j.id,
    who: (j.title || "").split("—")[0].trim(),
    next: j.boardNext || plainStatus(j),
    rank: j.boardRank || i + 1,
    stage: stageForJob(j),
    jobId: j.id,
  }));
}

function matchJobId(row) {
  const jobs = shopData?.jobs || [];
  const id = String(row?.id || "");
  const who = String(row?.who || "").toLowerCase();
  const byProp = jobs.find((j) => j.wrapstart?.proposalId === id);
  if (byProp) return byProp.id;
  if (who.includes("delco")) {
    const d = jobs.find((j) => j.id?.includes("delco"));
    if (d) return d.id;
  }
  if (who.includes("amit")) {
    const a = jobs.find((j) => j.id?.includes("amit"));
    if (a) return a.id;
  }
  return "";
}

function renderMissionRail() {
  const rail = document.getElementById("mission-rail");
  if (!rail || !shopData) return;
  const rows = boardRows();
  const activeIdx = stageIndex(activeStageId);

  rail.innerHTML = RAIL_STAGES.map((stage, idx) => {
    const jobsHere = rows.filter((r) => r.stage === stage.id);
    const state =
      stage.id === activeStageId ? "active" : idx < activeIdx ? "done" : "upcoming";
    const chips = jobsHere
      .map((r) => {
        const isActive =
          (activeJob && r.jobId && activeJob.id === r.jobId) ||
          (!activeJob && r.who?.toLowerCase().includes("delco") && stage.id === "soft-ask");
        return `<button type="button" class="rail-chip ${isActive ? "active-job" : ""}" data-rank="${r.rank}" data-job="${escapeHtml(r.jobId || "")}" data-stage="${stage.id}" title="${escapeHtml(r.next)}">${escapeHtml(r.who)} · ${escapeHtml(r.id)}</button>`;
      })
      .join("");
    return `
      <article class="rail-node ${state} ${jobsHere.length ? "has-jobs" : ""}" data-stage="${stage.id}">
        <div class="rail-spine">
          <span class="rail-dot" aria-hidden="true"></span>
          <span class="rail-line" aria-hidden="true"></span>
        </div>
        <div class="rail-body">
          <div class="rail-label-row">
            <span class="rail-label">${escapeHtml(stage.label)}</span>
            <span class="rail-idx">0${idx + 1}</span>
          </div>
          ${chips ? `<div class="rail-jobs">${chips}</div>` : `<p class="rail-empty">${state === "done" ? "cleared" : state === "active" ? "active gate" : "standby"}</p>`}
        </div>
      </article>`;
  }).join("");

  rail.querySelectorAll(".rail-chip").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const jobId = btn.getAttribute("data-job");
      const stage = btn.getAttribute("data-stage");
      if (stage) activeStageId = stage;
      if (jobId) focusJobById(jobId);
      else {
        const who = btn.textContent.split("·")[0].trim();
        showToast(`Focused · ${who} @ ${stageLabel(stage)}`);
        renderMissionRail();
        renderRankList();
      }
    });
  });
  rail.querySelectorAll(".rail-node.has-jobs").forEach((node) => {
    node.addEventListener("click", () => {
      const stage = node.getAttribute("data-stage");
      if (!stage) return;
      activeStageId = stage;
      const first = rows.find((r) => r.stage === stage && r.jobId);
      if (first?.jobId) focusJobById(first.jobId);
      else {
        renderMissionRail();
        renderRankList();
      }
    });
  });
}

function stageLabel(id) {
  return RAIL_STAGES.find((s) => s.id === id)?.label || id;
}

function renderRankList() {
  const list = document.getElementById("rank-list");
  const asof = document.getElementById("rank-asof");
  if (!list || !shopData) return;
  const snap = shopData.boardSnapshot;
  if (asof) asof.textContent = snap?.asOf || shopData.meta?.date || "";
  const rows = boardRows();
  list.innerHTML = rows
    .map((r) => {
      const isActive =
        (activeJob && r.jobId && activeJob.id === r.jobId) ||
        (!!r.who?.toLowerCase().includes("delco") && (!activeJob || activeJob.id?.includes("delco")));
      return `<button type="button" class="rank-row ${isActive ? "active" : ""}" data-job="${escapeHtml(r.jobId || "")}" data-stage="${r.stage}">
        <span class="rank-num">#${r.rank}</span>
        <span>
          <span class="rank-who">${escapeHtml(r.who)}<span class="rank-id">${escapeHtml(r.id)}</span></span>
          <p class="rank-next">${escapeHtml(r.next)}</p>
          <span class="rank-stage">${escapeHtml(stageLabel(r.stage))}</span>
        </span>
      </button>`;
    })
    .join("");
  list.querySelectorAll(".rank-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const jobId = btn.getAttribute("data-job");
      const stage = btn.getAttribute("data-stage");
      if (stage) activeStageId = stage;
      if (jobId) focusJobById(jobId);
      else {
        renderMissionRail();
        renderRankList();
        showToast(`Board · ${btn.querySelector(".rank-who")?.childNodes[0]?.textContent || "row"}`);
      }
    });
  });
}

function setBoardOpen(open) {
  const board = document.getElementById("board-panel");
  if (board) board.classList.toggle("hidden", !open);
  if (open) renderBoardPanel();
}

function renderBoardPanel() {
  const hotEl = document.getElementById("board-hot");
  const listEl = document.getElementById("board-list");
  if (!hotEl || !listEl || !shopData) return;
  const jobs = shopData.jobs || [];
  const boss = jobs.find((j) => j.id === ((shopData.meta && shopData.meta.defaultJobId) || "job-delco-pr0014")) || jobs[0];
  const sides = jobs.filter((j) => j !== boss);
  hotEl.innerHTML = boss ? boardCardHtml(boss, true) : "";
  const snap = shopData.boardSnapshot;
  if (snap?.top5?.length) {
    listEl.innerHTML =
      snap.top5
        .slice(1)
        .map((row) => {
          const match = jobs.find(
            (j) =>
              (j.wrapstart && j.wrapstart.proposalId === row.id) ||
              j.id?.includes(row.id.toLowerCase().replace("-", ""))
          );
          if (match) return boardCardHtml(match, false);
          return `<button type="button" class="board-card" data-job="" disabled>
        <div class="bc-top"><span class="bc-title">${escapeHtml(row.who)} · ${escapeHtml(row.id)}</span></div>
        <p class="bc-next">${escapeHtml(row.next)}</p>
      </button>`;
        })
        .join("") +
      sides
        .filter(
          (j) =>
            !snap.top5.some(
              (t) => j.wrapstart?.proposalId === t.id || j.id?.includes("delco")
            )
        )
        .slice(0, 4)
        .map((j) => boardCardHtml(j, false))
        .join("");
  } else {
    listEl.innerHTML = sides.map((j) => boardCardHtml(j, false)).join("");
  }
  document.querySelectorAll("#board-panel .board-card[data-job]").forEach((btn) => {
    const id = btn.getAttribute("data-job");
    if (!id) return;
    btn.addEventListener("click", () => focusJobById(id));
  });
}

function boardCardHtml(job, isHot) {
  const next = nextActionForJob(job, job.id?.includes("delco") ? companionStep : 0);
  const short = (job.title || "").split("—")[0].trim();
  const rank = job.boardRank ? `#${job.boardRank} · ` : isHot ? "#1 · " : "";
  return `<button type="button" class="board-card ${isHot ? "hot" : ""}" data-job="${escapeHtml(job.id)}">
    <div class="bc-top">
      <span class="bc-title">${rank}${escapeHtml(short)}</span>
      <span class="bc-status">${escapeHtml(plainStatus(job))}</span>
    </div>
    <p class="bc-next">${escapeHtml(next)}</p>
    <div class="bc-money">${escapeHtml(moneyLine(job))}</div>
  </button>`;
}

function focusJobById(id) {
  if (!shopData || !id) return;
  const job = shopData.jobs.find((j) => j.id === id);
  if (!job) return;
  activeStageId = stageForJob(job);
  openJob(job);
  setBoardOpen(false);
  renderMissionRail();
  renderRankList();
  showToast(`Focused · ${job.title.split("—")[0].trim()}`);
}

function shortMission(m) {
  const raw = String(m || "");
  if (raw.length <= 78) return raw;
  const cut = raw.slice(0, 78);
  const sp = cut.lastIndexOf(" ");
  return (sp > 40 ? cut.slice(0, sp) : cut) + "…";
}

function populateUI() {
  const snap = shopData.boardSnapshot;
  const mission =
    snap && snap.hot
      ? `${snap.hot.label} #${snap.hot.rank} · ${snap.sendReadyWaitingChanceGO} waiting GO · outbound paused · AI OFF`
      : shopData.meta.mission || "Kind + profitable. Soft Ask. AI OFF.";
  const chip = document.getElementById("mission-chip");
  const textEl = chip?.querySelector(".mission-text");
  if (textEl) textEl.textContent = shortMission(mission);
  else if (chip) chip.textContent = shortMission(mission);
  if (chip) chip.title = shopData.meta.mission || mission;

  const lanesList = document.getElementById("lanes-list");
  lanesList.innerHTML = "";
  for (const lane of shopData.lanes) {
    const card = document.createElement("div");
    card.className = "lane-card";
    card.style.setProperty("--lane-color", lane.color);
    card.innerHTML = `
      <h3>${lane.name}</h3>
      <p>${lane.summary}</p>
      <div class="roles">${lane.roles.map((r) => `<span class="role-pill">${r}</span>`).join("")}</div>
    `;
    lanesList.appendChild(card);
  }

  const rulesList = document.getElementById("rules-list");
  rulesList.innerHTML = "";
  for (const rule of shopData.hardRules) {
    const chipEl = document.createElement("span");
    chipEl.className = "rule-chip";
    chipEl.setAttribute("role", "listitem");
    chipEl.textContent = rule.title;
    chipEl.title = rule.detail;
    rulesList.appendChild(chipEl);
  }

  const flow = document.getElementById("flow-strip");
  if (flow) {
    flow.innerHTML = (shopData.leadFlow || [])
      .map((s) => `<span class="flow-step">${s}</span>`)
      .join("");
  }

  populateFutureCards();
  syncAiOffBadge();
  syncHotCard(null);
  renderMissionRail();
  renderRankList();
}

function populateFutureCards() {
  const wrap = document.getElementById("future-cards");
  if (!wrap) return;
  const cards = shopData.futureCards || [];
  wrap.innerHTML = cards
    .map(
      (c) => `
    <article class="future-card phase-${escapeHtml(c.phase)}">
      <span class="phase-pill">Phase ${escapeHtml(c.phase)}</span>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.blurb)}</p>
    </article>`
    )
    .join("");
}

function syncAiOffBadge() {
  const badge = document.getElementById("ai-off-badge");
  if (!badge) return;
  badge.innerHTML = 'AI OFF<span class="ai-off-sub">Engage OFF · Answer Off</span>';
  badge.title = "Engage OFF · Answer calls Off · hardcoded — never wire live AI ON";
  badge.style.background = "";
}

function openFuturePanel() {
  populateFutureCards();
  setMoreOpen(true);
  showToast("Future is under More — AI stays OFF");
}

function closeFuturePanel() {
  const panel = document.getElementById("future-panel");
  if (panel) panel.classList.add("hidden");
}

function confClass(c) {
  if (c === "high") return "high";
  if (c === "low") return "low";
  return "medium";
}

function confLabel(c) {
  if (c === "high") return "High — process / rules solid";
  if (c === "low") return "Low / HOLD — Chance judgment";
  return "Medium — quoting judgment";
}

function getFeedbackForStep(jobId, stepId) {
  return feedbackStore.filter((f) => f.jobId === jobId && f.stepId === stepId);
}

function plainStatus(job) {
  const s = job.status || "";
  if (job.id?.includes("delco")) return "Soft Ask · not sent";
  if (s === "close-prep") return "Close prep · not sent";
  if (s === "ready") return "Ready · waiting on you";
  if (s === "pending-send") return "Waiting send · your call";
  if (s === "hold") return "On hold";
  if (s === "active") return "Active Soft Ask";
  if (s === "practice") return "Practice only";
  return s.replace(/-/g, " ") || "In shop";
}

function syncHotCard(job) {
  const titleEl = document.getElementById("hot-title");
  const subEl = document.getElementById("hot-sub");
  if (!titleEl || !subEl) return;
  const j =
    job ||
    (shopData &&
      shopData.jobs.find(
        (x) => x.id === ((shopData.meta && shopData.meta.defaultJobId) || "job-delco-pr0014")
      ));
  if (!j) {
    titleEl.textContent = "No hot job";
    subEl.textContent = "Pick a node on the rail";
    return;
  }
  const short = (j.title || "").split("—")[0].trim() || j.title;
  const prop = j.wrapstart && j.wrapstart.proposalId ? ` ${j.wrapstart.proposalId}` : "";
  titleEl.textContent = short.includes("Delco") ? `Delco${prop || " PR-0014"}` : short;
  const boardNext = j.boardNext || plainStatus(j);
  subEl.textContent = j.id?.includes("delco")
    ? "Soft Ask · not sent · HOLD auto-send"
    : boardNext;
}

function nextActionPlain(stepIndex) {
  const job =
    activeJob ||
    (shopData &&
      shopData.jobs.find(
        (x) => x.id === ((shopData.meta && shopData.meta.defaultJobId) || "job-delco-pr0014")
      ));
  return nextActionForJob(job, stepIndex);
}

function syncNextAction() {
  const el = document.getElementById("next-action");
  if (el) el.textContent = nextActionPlain(companionStep);
  const board = document.getElementById("board-panel");
  if (board && !board.classList.contains("hidden")) renderBoardPanel();
  syncOpsMeters();
}

function openJob(job) {
  activeJob = job;
  activeStageId = stageForJob(job);
  if (detailPanel) detailPanel.classList.remove("hidden");
  syncHotCard(job);

  const ws = job.wrapstart || {};
  const pricing = job.pricing || null;
  const pricingHtml = pricing
    ? `<div class="pricing-chips">
        <span class="pricing-chip">Fixed $${Number(pricing.fixedPretax).toLocaleString()} pretax</span>
        <span class="pricing-chip alt">Folding $${Number(pricing.foldingPretax).toLocaleString()} pretax</span>
      </div>`
    : "";
  const idsHtml = ws.proposalId
    ? `<p class="ws-ids">Wrapstart · <code>${escapeHtml(ws.proposalId)}</code>${
        ws.quoteId ? ` · <code>${escapeHtml(ws.quoteId)}</code>` : ""
      }${ws.company ? ` · ${escapeHtml(ws.company)}` : ""}</p>`
    : "";

  if (detailHeader) {
    detailHeader.innerHTML = `
      <div class="job-title">${escapeHtml(job.title)}</div>
      <div class="job-meta">
        <span class="badge status-${escapeHtml(job.status)}">${escapeHtml(job.status)}</span>
        <span class="badge type-${escapeHtml(job.type)}">${escapeHtml(job.type)}</span>
        <span class="badge">${escapeHtml(job.vehicle)}</span>
      </div>
      ${idsHtml}
      ${pricingHtml}
      <p class="summary">${escapeHtml(job.summary)}</p>
    `;
  }

  const cc = confClass(job.confidenceOverall);
  if (confidenceMeter) {
    confidenceMeter.innerHTML = `
      <div class="cm-label">Jarvis confidence</div>
      <div class="cm-bar"><div class="cm-fill ${cc}"></div></div>
      <div class="cm-text ${cc}">${confLabel(job.confidenceOverall)}</div>
    `;
  }

  const gate = document.getElementById("gate-controls");
  if (gate) {
    const showGate =
      job.status === "close-prep" ||
      job.status === "ready" ||
      job.status === "pending-send" ||
      job.id.includes("delco");
    gate.classList.toggle("hidden", !showGate);
  }

  if (thinkPathEl) {
    thinkPathEl.innerHTML = "";
    for (const step of job.thinkPath || []) {
      const li = document.createElement("li");
      const fbs = getFeedbackForStep(job.id, step.id);
      if (fbs.length) li.classList.add("has-feedback");
      li.innerHTML = `
        <div class="step-label">${escapeHtml(step.label)}</div>
        <div class="step-detail">${escapeHtml(step.detail)}</div>
        <span class="step-conf ${confClass(step.confidence)}">${escapeHtml(step.confidence)} · ${escapeHtml(step.stage)}</span>
        ${fbs.map((f) => `<div class="fb-preview">💬 ${escapeHtml(f.text)}</div>`).join("")}
      `;
      li.addEventListener("click", () => openFeedbackModal(job, step));
      thinkPathEl.appendChild(li);
    }
  }

  if (job.id === "job-delco-pr0014" || (job.wrapstart && job.wrapstart.proposalId === "PR-0014")) {
    renderCompanion(true);
  }
  syncNextAction();
  renderMissionRail();
  renderRankList();
}

function openFeedbackModal(job, step) {
  activeStep = { job, step };
  fbStepLabel.textContent = `${job.title} → ${step.label}`;
  fbText.value = "";
  feedbackModal.classList.remove("hidden");
  fbText.focus();
}

function closeFeedbackModal() {
  feedbackModal.classList.add("hidden");
  activeStep = null;
}

function exportFeedback() {
  const payload = {
    exportedAt: new Date().toISOString(),
    shop: shopData.meta.title,
    version: VERSION_TAG,
    count: feedbackStore.length,
    feedback: feedbackStore,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `wrap-shop-control-deck-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(`Exported ${feedbackStore.length} note(s)`);
}

document.getElementById("fb-cancel")?.addEventListener("click", closeFeedbackModal);
document.getElementById("fb-save")?.addEventListener("click", () => {
  if (!activeStep) return;
  const text = fbText.value.trim();
  if (!text) {
    showToast("Type a note first");
    return;
  }
  feedbackStore.push({
    at: new Date().toISOString(),
    jobId: activeStep.job.id,
    stepId: activeStep.step.id,
    stepLabel: activeStep.step.label,
    text,
  });
  saveFeedback();
  openJob(activeStep.job);
  closeFeedbackModal();
  showToast("Feedback saved locally");
});
document.getElementById("btn-export")?.addEventListener("click", exportFeedback);
document.getElementById("btn-close-future")?.addEventListener("click", closeFuturePanel);
document.getElementById("ai-off-badge")?.addEventListener("click", () => {
  showToast("AI OFF locked — Engage OFF · Answer Off · never ON from deck");
});

function stubGateAction(source) {
  const isGo = String(source).includes("go");
  showToast(isGo ? STUB_TOAST_GO : STUB_TOAST_HOLD, isGo ? "go" : "hold");
}

function getCompanionSteps() {
  const script = shopData?.companionScript;
  if (Array.isArray(script)) return script;
  if (script?.steps) return script.steps;
  return [];
}

function typeReveal(el, fullText, onDone) {
  if (!el) {
    if (onDone) onDone();
    return;
  }
  if (typeTimer) {
    clearInterval(typeTimer);
    typeTimer = null;
  }
  if (!jarvisOn) {
    el.textContent = fullText;
    if (onDone) onDone();
    return;
  }
  el.textContent = "";
  el.classList.add("typing");
  let i = 0;
  const step = Math.max(1, Math.floor(fullText.length / 60));
  typeTimer = setInterval(() => {
    i = Math.min(fullText.length, i + step);
    el.textContent = fullText.slice(0, i);
    if (i >= fullText.length) {
      clearInterval(typeTimer);
      typeTimer = null;
      el.classList.remove("typing");
      if (onDone) onDone();
    }
  }, 18);
}

function playJarvisBeep() {
  if (jarvisMuted || !jarvisOn) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 660;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    o.stop(ctx.currentTime + 0.14);
    setTimeout(() => ctx.close().catch(() => {}), 200);
  } catch { /* ignore */ }
}

function setJarvisStatus(mode) {
  jarvisStatusMode = mode || "standby";
  const el = document.getElementById("jarvis-status");
  if (!el) return;
  const map = {
    listening: "listening",
    briefing: "briefing Delco",
    standby: "standby",
  };
  el.textContent = map[jarvisStatusMode] || "standby";
  el.dataset.mode = jarvisStatusMode;
}

function syncJarvisBrief() {
  const brief = document.getElementById("jarvis-brief");
  if (!brief) return;
  const line =
    JARVIS_BRIEFS[Math.max(0, Math.min(companionStep, JARVIS_BRIEFS.length - 1))] ||
    "Soft Ask path ready when you are.";
  if (jarvisOn) {
    setJarvisStatus(jarvisListening ? "listening" : "briefing");
    typeReveal(brief, line);
  } else {
    brief.textContent = line;
    setJarvisStatus("standby");
  }
}

function renderWhiteboard() {
  const list = document.getElementById("wb-steps");
  const sub = document.getElementById("wb-sub");
  if (!list) return;
  if (sub) {
    const job = activeJob || shopData?.jobs?.find((j) => j.id?.includes("delco"));
    const prop = job?.wrapstart?.proposalId || "PR-0014";
    sub.textContent = `Delco ${prop}`;
  }
  list.innerHTML = WHITEBOARD_STEPS.map((s, idx) => {
    let state = "upcoming";
    if (idx < companionStep) state = "done";
    if (idx === companionStep) state = "active";
    return `<li class="wb-step ${state}" data-idx="${idx}">
      <span class="wb-num">${idx + 1}</span>
      <span class="wb-body">
        <span class="wb-label">${escapeHtml(s.label)}</span>
        <span class="wb-detail">${escapeHtml(s.detail)}</span>
      </span>
    </li>`;
  }).join("");
  list.querySelectorAll(".wb-step").forEach((li) => {
    li.addEventListener("click", () => {
      const idx = Number(li.getAttribute("data-idx"));
      if (Number.isNaN(idx)) return;
      companionStep = idx;
      companionRevealed = Math.max(companionRevealed, companionStep);
      renderCompanion(true);
      if (jarvisOn) playJarvisBeep();
    });
  });
}

function applyJarvisMode() {
  const strip = document.getElementById("jarvis-strip");
  const btn = document.getElementById("btn-jarvis");
  const stateEl = document.getElementById("jarvis-toggle-state");
  const muteBtn = document.getElementById("btn-jarvis-mute");
  document.body.classList.toggle("jarvis-on", jarvisOn);
  if (strip) {
    strip.hidden = !jarvisOn;
    strip.classList.toggle("jarvis-off", !jarvisOn);
  }
  if (btn) {
    btn.setAttribute("aria-pressed", jarvisOn ? "true" : "false");
    btn.classList.toggle("on", jarvisOn);
  }
  if (stateEl) stateEl.textContent = jarvisOn ? "ON" : "OFF";
  if (muteBtn) {
    muteBtn.classList.toggle("muted", jarvisMuted);
    muteBtn.setAttribute("aria-pressed", jarvisMuted ? "true" : "false");
    muteBtn.textContent = jarvisMuted ? "🔇 MUTE" : "🔊 BEEP";
  }
  const showBtn = document.getElementById("btn-show-steps");
  const stepsOpen = !document.getElementById("steps-panel")?.classList.contains("hidden");
  if (showBtn) showBtn.textContent = stepsOpen ? "Hide Jarvis" : "Jarvis thoughts";
  renderWhiteboard();
  syncJarvisBrief();
  if (jarvisOn) setJarvisStatus(jarvisListening ? "listening" : "briefing");
  else setJarvisStatus("standby");
}

function setJarvisOn(on) {
  jarvisOn = !!on;
  saveJarvisOn();
  applyJarvisMode();
  showToast(
    jarvisOn
      ? "Jarvis ON — Grok hub voice · whiteboard Soft Ask walkthrough"
      : "Jarvis OFF — companion standby · Soft Ask path still available"
  );
  if (jarvisOn) {
    setStepsOpen(true);
    playJarvisBeep();
  }
}

function toggleListening() {
  jarvisListening = !jarvisListening;
  const mic = document.getElementById("btn-mic");
  const listenBtn = document.getElementById("btn-jarvis-listen");
  if (mic) {
    mic.setAttribute("aria-pressed", jarvisListening ? "true" : "false");
    mic.classList.toggle("listening", jarvisListening);
    mic.textContent = jarvisListening ? "🎤 listening" : "🎤 listen";
  }
  if (listenBtn) {
    listenBtn.classList.toggle("listening", jarvisListening);
    listenBtn.setAttribute("aria-pressed", jarvisListening ? "true" : "false");
  }
  if (jarvisListening) {
    setJarvisStatus("listening");
    startSpeechListen();
    showToast("Listening UI on — Web Speech if available, else visual only");
  } else {
    stopSpeechListen();
    setJarvisStatus(jarvisOn ? "briefing" : "standby");
    showToast("Listening off");
  }
}

function startSpeechListen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return; // UI-only fallback
  try {
    if (speechRec) {
      try { speechRec.stop(); } catch { /* ignore */ }
    }
    speechRec = new SR();
    speechRec.continuous = false;
    speechRec.interimResults = false;
    speechRec.lang = "en-US";
    speechRec.onresult = () => {
      showToast("Heard you — Soft Ask walkthrough stays on-screen (no live STT actions)");
      jarvisListening = false;
      toggleListeningCleanup();
    };
    speechRec.onerror = () => {
      showToast("Speech unavailable — Jarvis stays visual");
      jarvisListening = false;
      toggleListeningCleanup();
    };
    speechRec.onend = () => {
      if (jarvisListening) {
        jarvisListening = false;
        toggleListeningCleanup();
      }
    };
    speechRec.start();
  } catch {
    showToast("Speech unavailable — Jarvis stays visual");
  }
}

function toggleListeningCleanup() {
  const mic = document.getElementById("btn-mic");
  const listenBtn = document.getElementById("btn-jarvis-listen");
  if (mic) {
    mic.setAttribute("aria-pressed", "false");
    mic.classList.remove("listening");
    mic.textContent = "🎤 listen";
  }
  if (listenBtn) {
    listenBtn.classList.remove("listening");
    listenBtn.setAttribute("aria-pressed", "false");
  }
  setJarvisStatus(jarvisOn ? "briefing" : "standby");
}

function stopSpeechListen() {
  if (speechRec) {
    try { speechRec.stop(); } catch { /* ignore */ }
    speechRec = null;
  }
}

function renderCompanion(force) {
  const feed = document.getElementById("companion-feed");
  const label = document.getElementById("companion-step-label");
  if (!feed) return;
  const steps = getCompanionSteps();
  if (!steps.length) {
    feed.innerHTML = `<div class="companion-bubble revealed"><div class="cb-title">No script</div><p class="cb-body">Companion script missing from shop-brain.</p></div>`;
    return;
  }
  companionStep = Math.max(0, Math.min(companionStep, steps.length - 1));
  companionRevealed = Math.max(companionRevealed, companionStep);

  const s = steps[companionStep];
  const more = steps.length - companionStep - 1;
  feed.innerHTML = `
    <article class="companion-bubble tone-${escapeHtml(s.tone || "")} revealed active" data-idx="${companionStep}">
      <div class="cb-kicker">Jarvis · Grok hub</div>
      <div class="cb-title">${escapeHtml(s.title)}</div>
      <p class="cb-body" id="companion-type-body"></p>
    </article>
    ${more > 0 ? `<div class="companion-bubble collapsed-hint">${more} more · Next / Back · whiteboard tracks Soft Ask</div>` : ""}
  `;
  const bodyEl = document.getElementById("companion-type-body");
  typeReveal(bodyEl, s.body || "");

  if (label) label.textContent = `${companionStep + 1} / ${steps.length}`;
  syncNextAction();
  renderWhiteboard();
  syncJarvisBrief();
  if (force && jarvisOn) setJarvisStatus(jarvisListening ? "listening" : "briefing");
}

function companionNext() {
  const steps = getCompanionSteps();
  if (!steps.length) return;
  if (companionStep < steps.length - 1) {
    companionStep += 1;
    companionRevealed = Math.max(companionRevealed, companionStep);
    renderCompanion(true);
    if (jarvisOn) playJarvisBeep();
  } else {
    showToast("End of Delco Soft Ask path — GO/HOLD still stubbed");
  }
}

function companionPrev() {
  if (companionStep > 0) {
    companionStep -= 1;
    renderCompanion(true);
    if (jarvisOn) playJarvisBeep();
  }
}

function wireCompanionControls() {
  const next = document.getElementById("btn-comp-next");
  const prev = document.getElementById("btn-comp-prev");
  const go = document.getElementById("btn-comp-go");
  const hold = document.getElementById("btn-comp-hold");
  const gateGo = document.getElementById("btn-go");
  const gateHold = document.getElementById("btn-hold");
  const mic = document.getElementById("btn-mic");
  const jarvisBtn = document.getElementById("btn-jarvis");
  const muteBtn = document.getElementById("btn-jarvis-mute");
  const listenBtn = document.getElementById("btn-jarvis-listen");

  if (next) next.addEventListener("click", companionNext);
  if (prev) prev.addEventListener("click", companionPrev);
  if (go) go.addEventListener("click", () => stubGateAction("companion-go"));
  if (hold) hold.addEventListener("click", () => stubGateAction("companion-hold"));
  if (gateGo) gateGo.addEventListener("click", () => stubGateAction("detail-go"));
  if (gateHold) gateHold.addEventListener("click", () => stubGateAction("detail-hold"));
  if (jarvisBtn && !jarvisBtn.dataset.wired) {
    jarvisBtn.dataset.wired = "1";
    jarvisBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setJarvisOn(!jarvisOn);
    });
  }
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      jarvisMuted = !jarvisMuted;
      saveJarvisMuted();
      applyJarvisMode();
      showToast(jarvisMuted ? "Jarvis beep muted" : "Jarvis beep on (subtle)");
      if (!jarvisMuted) playJarvisBeep();
    });
  }
  if (listenBtn) {
    listenBtn.addEventListener("click", () => {
      if (!jarvisOn) setJarvisOn(true);
      toggleListening();
    });
  }
  if (mic) {
    mic.addEventListener("click", (e) => {
      e.preventDefault();
      if (!jarvisOn) setJarvisOn(true);
      toggleListening();
    });
  }
}

function setStepsOpen(open) {
  const panel = document.getElementById("steps-panel");
  const btn = document.getElementById("btn-show-steps");
  if (!panel) return;
  panel.classList.toggle("hidden", !open);
  if (btn) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Hide Jarvis" : "Jarvis thoughts";
  }
  if (open) renderCompanion(true);
}

function setMoreOpen(open) {
  const drawer = document.getElementById("more-drawer");
  if (drawer) drawer.classList.toggle("hidden", !open);
}

function setDetailExtrasOpen(open) {
  const extras = document.getElementById("detail-extras");
  const btn = document.getElementById("btn-toggle-detail");
  if (extras) extras.classList.toggle("hidden", !open);
  if (btn) btn.textContent = open ? "Hide think path" : "Show think path";
}

function wireSimpleUi() {
  const showSteps = document.getElementById("btn-show-steps");
  const hideSteps = document.getElementById("btn-hide-steps");
  const more = document.getElementById("btn-more");
  const closeMore = document.getElementById("btn-close-more");
  const hot = document.getElementById("hot-card");
  const toggleDetail = document.getElementById("btn-toggle-detail");
  const boardBtn = document.getElementById("btn-board");
  const closeBoard = document.getElementById("btn-close-board");

  if (showSteps) {
    showSteps.addEventListener("click", () => {
      const open = document.getElementById("steps-panel")?.classList.contains("hidden");
      setStepsOpen(!!open);
    });
  }
  if (hideSteps) hideSteps.addEventListener("click", () => setStepsOpen(false));
  if (more) more.addEventListener("click", () => setMoreOpen(true));
  if (closeMore) closeMore.addEventListener("click", () => setMoreOpen(false));
  if (boardBtn) {
    boardBtn.addEventListener("click", () => {
      const board = document.getElementById("board-panel");
      const open = board?.classList.contains("hidden");
      setBoardOpen(!!open);
    });
  }
  if (closeBoard) closeBoard.addEventListener("click", () => setBoardOpen(false));
  if (toggleDetail) {
    toggleDetail.addEventListener("click", () => {
      const extras = document.getElementById("detail-extras");
      const open = extras?.classList.contains("hidden");
      setDetailExtrasOpen(!!open);
    });
  }
  if (hot) {
    hot.addEventListener("click", () => {
      const defaultId = (shopData.meta && shopData.meta.defaultJobId) || "job-delco-pr0014";
      const job =
        shopData.jobs.find((j) => j.id === defaultId) ||
        shopData.jobs.find((j) => j.id.includes("delco"));
      if (job) {
        activeStageId = "soft-ask";
        openJob(job);
        showToast("Delco focused — Soft Ask #1");
      }
    });
  }
}

function focusDelcoOnLoad() {
  const defaultId = (shopData.meta && shopData.meta.defaultJobId) || "job-delco-pr0014";
  const job =
    shopData.jobs.find((j) => j.id === defaultId) ||
    shopData.jobs.find((j) => j.id.includes("delco"));
  if (!job) return;
  activeStageId = "soft-ask";
  openJob(job);
}

async function main() {
  // Wire Jarvis / dock controls BEFORE data fetch so the toggle always works
  // even if shop-brain.json fails (previous bug: early return left btn-jarvis dead).
  wireCompanionControls();
  wireSimpleUi();
  applyJarvisMode();
  setStepsOpen(jarvisOn);
  setDetailExtrasOpen(false);
  setBoardOpen(false);
  if (detailPanel) detailPanel.classList.add("hidden");

  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Failed to load shop-brain.json — serve over HTTP");
    shopData = await res.json();
  } catch (err) {
    const chip = document.getElementById("mission-chip");
    const textEl = chip?.querySelector(".mission-text");
    const msg = "Load via HTTP (python3 -m http.server). " + err.message;
    if (textEl) textEl.textContent = msg;
    else if (chip) chip.textContent = msg;
    console.error(err);
    applyJarvisMode();
    showToast(
      jarvisOn
        ? `${VERSION_TAG} — Jarvis ON · data missing · AI OFF`
        : `${VERSION_TAG} — tap JARVIS · data missing · AI OFF`
    );
    return;
  }

  populateUI();
  renderCompanion(false);
  applyJarvisMode();
  syncOpsMeters();
  if (detailPanel) detailPanel.classList.add("hidden");
  setStepsOpen(jarvisOn);
  setDetailExtrasOpen(false);
  setBoardOpen(false);
  focusDelcoOnLoad();
  showToast(
    jarvisOn
      ? `${VERSION_TAG} — Jarvis ON · Delco Soft Ask · AI OFF · no live send`
      : `${VERSION_TAG} — tap JARVIS to wake companion · AI OFF · no live send`
  );
}

main();
