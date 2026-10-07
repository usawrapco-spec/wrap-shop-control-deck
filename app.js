import * as THREE from "three";

const FEEDBACK_KEY = "wrapShopControlDeckFeedback_v03";
const STUB_TOAST_GO = "Queued for Chance — no live send";
const STUB_TOAST_HOLD = "Parked — HOLD queued for Chance";
const DATA_URL = "./data/shop-brain.json";
const VERSION_TAG = "v0.9-hologram";
const JARVIS_KEY = "wrapShopControlDeckJarvis_v09";
const JARVIS_MUTE_KEY = "wrapShopControlDeckJarvisMute_v09";
const WRAP_GUY_URL = "./assets/wrap-guy-pointing.png";

const WHITEBOARD_STEPS = [
  { id: "wb1", label: "Soft Ask ready", detail: "Warm call + proposal link · Fixed / Folding pretax · nothing sent" },
  { id: "wb2", label: "Why tonight", detail: "Competitors in play · ~48h stall · Delco is the close that moves first" },
  { id: "wb3", label: "GO or HOLD", detail: "Deck GO = stub queue only · real Soft Ask stays in Wrapstart" },
  { id: "wb4", label: "If they accept", detail: "50% deposit invoice → then Design · no free art on a handshake" },
];

const JARVIS_BRIEFS = [
  "Briefing Delco — Soft Ask draft is ready. Nothing sent. AI OFF.",
  "Competitors already in play. Stall clock ~48h. Delco first.",
  "Your call — GO queues a stub; HOLD parks it. No live send.",
  "Accept path — 50% deposit, then Design. Soft Ask name stays.",
];

const DELCO_EMAIL_DRAFT = {
  to: "Puneet @ Delco Transport",
  subject: "Soft Ask — PR-0014 Fixed / Folding options",
  body: [
    "Hey Puneet —",
    "",
    "Quick Soft Ask on PR-0014.",
    "Fixed bay $29,807 pretax · Folding $44,232 pretax.",
    "Two install windows ready once you're set.",
    "",
    "No pressure — happy to walk numbers on a call.",
    "— USA Wrap Co · Gig Harbor",
  ],
};

/** @type {any} */
let shopData = null;
/** @type {Array} */
let feedbackStore = loadFeedback();
let companionStep = 0;
let companionRevealed = 0;
/** @type {any} */
let activeJob = null;
/** @type {any} */
let activeStep = null;
let jarvisOn = loadJarvisOn();
let jarvisMuted = loadJarvisMuted();
let jarvisListening = false;
let jarvisStatusMode = "standby";
let typeTimer = null;
let toastTimer = null;
/** @type {any} */
let speechRec = null;
let wbMode = 0; // 0 soft ask · 1 jobs · 2 email
let wbDrawProgress = 0;
let wbNeedsRedraw = true;

const toast = document.getElementById("toast");
const detailPanel = document.getElementById("detail-panel");
const thinkPathEl = document.getElementById("think-path");
const detailHeader = document.getElementById("detail-header");
const confidenceMeter = document.getElementById("confidence-meter");
const fbText = document.getElementById("fb-text");

/* ========== Three.js hologram stage ========== */
const holo = {
  ready: false,
  renderer: null,
  scene: null,
  camera: null,
  figureRoot: null,
  figureMesh: null,
  whiteboardMesh: null,
  wbCanvas: null,
  wbCtx: null,
  wbTexture: null,
  pedestal: null,
  clock: new THREE.Clock(),
  scanUniforms: null,
};

function initHologram() {
  const canvas = document.getElementById("holo-canvas");
  const stage = document.getElementById("holo-stage");
  const fallback = document.getElementById("holo-fallback");
  if (!canvas || !stage) return;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050607, 0.045);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0.35, 1.55, 5.2);
    camera.lookAt(0.15, 1.15, 0);

    const hemi = new THREE.HemisphereLight(0xa8e4ff, 0x0a1018, 0.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xb8e8ff, 1.15);
    key.position.set(2.5, 4, 3);
    scene.add(key);
    const rim = new THREE.PointLight(0x5ec8ff, 1.4, 12);
    rim.position.set(-2.2, 2.2, -1.5);
    scene.add(rim);
    const floorGlow = new THREE.PointLight(0x7ec8e3, 0.8, 8);
    floorGlow.position.set(0, 0.2, 0.5);
    scene.add(floorGlow);

    // Floor ring / pedestal
    const pedestal = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.025, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x7ec8e3, transparent: true, opacity: 0.55 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    pedestal.add(ring);
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.012, 10, 48),
      new THREE.MeshBasicMaterial({ color: 0xa8e4ff, transparent: true, opacity: 0.35 })
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.04;
    pedestal.add(ring2);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 48),
      new THREE.MeshBasicMaterial({
        color: 0x0a3040,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.01;
    pedestal.add(disc);
    scene.add(pedestal);

    // Soft volumetric cone (Cortana-ish beam)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x5ec8ff,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.6, 32, 1, true), beamMat);
    beam.position.y = 1.8;
    beam.rotation.x = Math.PI;
    scene.add(beam);

    // Figure root
    const figureRoot = new THREE.Group();
    figureRoot.position.set(-0.55, 0, 0);
    scene.add(figureRoot);

    // Whiteboard plane in front of him
    const wbCanvas = document.createElement("canvas");
    wbCanvas.width = 1024;
    wbCanvas.height = 640;
    const wbCtx = wbCanvas.getContext("2d");
    const wbTexture = new THREE.CanvasTexture(wbCanvas);
    wbTexture.colorSpace = THREE.SRGBColorSpace;
    wbTexture.minFilter = THREE.LinearFilter;
    wbTexture.magFilter = THREE.LinearFilter;

    const wbMat = new THREE.MeshStandardMaterial({
      map: wbTexture,
      emissive: 0x3a90b0,
      emissiveMap: wbTexture,
      emissiveIntensity: 0.55,
      roughness: 0.55,
      metalness: 0.15,
      transparent: true,
      opacity: 0.96,
    });
    const whiteboardMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.62), wbMat);
    whiteboardMesh.position.set(1.15, 1.45, 0.55);
    whiteboardMesh.rotation.y = -0.32;
    scene.add(whiteboardMesh);

    // Whiteboard frame
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(2.72, 1.74),
      new THREE.MeshBasicMaterial({ color: 0x7ec8e3, transparent: true, opacity: 0.22 })
    );
    frame.position.copy(whiteboardMesh.position);
    frame.position.z -= 0.02;
    frame.rotation.copy(whiteboardMesh.rotation);
    scene.add(frame);

    holo.renderer = renderer;
    holo.scene = scene;
    holo.camera = camera;
    holo.figureRoot = figureRoot;
    holo.whiteboardMesh = whiteboardMesh;
    holo.wbCanvas = wbCanvas;
    holo.wbCtx = wbCtx;
    holo.wbTexture = wbTexture;
    holo.pedestal = pedestal;
    holo.ready = true;

    loadWrapGuy(figureRoot);
    resizeHolo();
    window.addEventListener("resize", resizeHolo);
    drawWhiteboard(true);
    animateHolo();
  } catch (err) {
    console.error("Hologram init failed", err);
    if (fallback) fallback.hidden = false;
  }
}

function loadWrapGuy(figureRoot) {
  const loader = new THREE.TextureLoader();
  loader.load(
    WRAP_GUY_URL,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const aspect = 768 / 1280;
      const h = 2.55;
      const w = h * aspect;

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(0, h / 2 + 0.05, 0);
      figureRoot.add(mesh);

      // Soft duplicate for holographic double-exposure
      const ghostMat = mat.clone();
      ghostMat.opacity = 0.22;
      const ghost = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.04, h * 1.04), ghostMat);
      ghost.position.set(0.04, h / 2 + 0.05, -0.08);
      figureRoot.add(ghost);

      holo.figureMesh = mesh;
      holo.figureGhost = ghost;
    },
    undefined,
    () => {
      // Procedural fallback figure if texture missing
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: 0xa8e4ff,
        emissive: 0x3a90b0,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.75,
        roughness: 0.4,
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.28), mat);
      torso.position.y = 1.35;
      g.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), mat);
      head.position.y = 2.0;
      g.add(head);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.14), mat);
      arm.position.set(0.55, 1.55, 0.1);
      arm.rotation.z = -0.25;
      g.add(arm);
      figureRoot.add(g);
      holo.figureMesh = g;
    }
  );
}

function resizeHolo() {
  if (!holo.ready) return;
  const stage = document.getElementById("holo-stage");
  if (!stage) return;
  const w = stage.clientWidth || 1;
  const h = stage.clientHeight || 1;
  holo.renderer.setSize(w, h, false);
  holo.camera.aspect = w / h;
  holo.camera.updateProjectionMatrix();
}

function animateHolo() {
  if (!holo.ready) return;
  requestAnimationFrame(animateHolo);
  const t = holo.clock.getElapsedTime();

  if (holo.figureRoot && jarvisOn) {
    holo.figureRoot.position.y = Math.sin(t * 1.4) * 0.04;
    holo.figureRoot.rotation.y = Math.sin(t * 0.55) * 0.08;
    if (holo.figureGhost) {
      holo.figureGhost.material.opacity = 0.14 + Math.sin(t * 3.2) * 0.08;
    }
    if (holo.figureMesh?.material && holo.figureMesh.material.map) {
      holo.figureMesh.material.opacity = 0.82 + Math.sin(t * 2.1) * 0.1;
    }
  } else if (holo.figureRoot && !jarvisOn) {
    holo.figureRoot.position.y = 0;
    if (holo.figureMesh?.material) holo.figureMesh.material.opacity = 0.25;
  }

  if (holo.pedestal) {
    holo.pedestal.rotation.y = t * 0.35;
  }

  if (holo.whiteboardMesh && jarvisOn) {
    holo.whiteboardMesh.position.y = 1.45 + Math.sin(t * 0.9) * 0.02;
  }

  // Drawing animation
  if (jarvisOn) {
    wbDrawProgress = Math.min(1, wbDrawProgress + 0.008);
    if (wbDrawProgress < 1 || wbNeedsRedraw) {
      drawWhiteboard(false);
      wbNeedsRedraw = false;
    }
  }

  holo.renderer.render(holo.scene, holo.camera);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWhiteboard(resetDraw) {
  if (!holo.wbCtx) return;
  if (resetDraw) wbDrawProgress = 0;
  const ctx = holo.wbCtx;
  const W = holo.wbCanvas.width;
  const H = holo.wbCanvas.height;
  const p = wbDrawProgress;

  // Board surface
  ctx.fillStyle = "#0a1218";
  ctx.fillRect(0, 0, W, H);
  // subtle grid
  ctx.strokeStyle = "rgba(126,200,227,0.08)";
  ctx.lineWidth = 1;
  for (let x = 40; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 40; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Header bar
  ctx.fillStyle = "rgba(126,200,227,0.12)";
  ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = "#7ec8e3";
  ctx.font = "600 22px 'IBM Plex Mono', monospace";
  const headers = ["WHITEBOARD // SOFT ASK", "WHITEBOARD // JOBS", "WHITEBOARD // EMAIL DRAFT"];
  ctx.fillText(headers[wbMode] || headers[0], 28, 36);
  ctx.fillStyle = "#8a96a3";
  ctx.font = "500 16px 'IBM Plex Mono', monospace";
  ctx.fillText("Delco PR-0014 · AI OFF · no live send", W - 420, 36);

  // Animated draw underscore
  ctx.strokeStyle = "rgba(168,228,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 58);
  ctx.lineTo(28 + (W - 56) * Math.min(1, p * 1.4), 58);
  ctx.stroke();

  if (wbMode === 0) drawWbSoftAsk(ctx, W, H, p);
  else if (wbMode === 1) drawWbJobs(ctx, W, H, p);
  else drawWbEmail(ctx, W, H, p);

  // Scanlines
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  if (holo.wbTexture) holo.wbTexture.needsUpdate = true;
}

function drawWbSoftAsk(ctx, W, H, p) {
  const steps = WHITEBOARD_STEPS;
  const startY = 90;
  steps.forEach((s, idx) => {
    const reveal = Math.max(0, Math.min(1, (p - idx * 0.18) / 0.35));
    if (reveal <= 0) return;
    const y = startY + idx * 120;
    const active = idx === companionStep;
    const done = idx < companionStep;

    ctx.globalAlpha = reveal;
    // card
    ctx.fillStyle = active ? "rgba(126,200,227,0.16)" : "rgba(20,28,34,0.9)";
    roundRect(ctx, 36, y, W - 72, 100, 4);
    ctx.fill();
    ctx.strokeStyle = active ? "rgba(168,228,255,0.7)" : "rgba(126,200,227,0.25)";
    ctx.lineWidth = active ? 2 : 1;
    ctx.stroke();

    // number circle
    ctx.beginPath();
    ctx.arc(86, y + 50, 26, 0, Math.PI * 2);
    ctx.fillStyle = done ? "rgba(107,207,142,0.35)" : active ? "rgba(126,200,227,0.35)" : "rgba(60,80,90,0.5)";
    ctx.fill();
    ctx.fillStyle = done ? "#6bcf8e" : "#a8e4ff";
    ctx.font = "700 22px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(idx + 1), 86, y + 58);
    ctx.textAlign = "left";

    // drawing line animation
    if (active) {
      ctx.strokeStyle = "rgba(168,228,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(128, y + 78);
      ctx.lineTo(128 + (W - 220) * reveal, y + 78);
      ctx.stroke();
    }

    ctx.fillStyle = "#e8edf2";
    ctx.font = "600 26px 'IBM Plex Sans', sans-serif";
    ctx.fillText(s.label, 130, y + 42);
    ctx.fillStyle = "#8a96a3";
    ctx.font = "400 18px 'IBM Plex Sans', sans-serif";
    ctx.fillText(s.detail.slice(0, Math.floor(s.detail.length * reveal)), 130, y + 72);
    ctx.globalAlpha = 1;
  });
}

function drawWbJobs(ctx, W, H, p) {
  const rows = boardRows().slice(0, 5);
  rows.forEach((r, idx) => {
    const reveal = Math.max(0, Math.min(1, (p - idx * 0.12) / 0.3));
    if (reveal <= 0) return;
    const y = 88 + idx * 95;
    ctx.globalAlpha = reveal;
    const hot = idx === 0;
    ctx.fillStyle = hot ? "rgba(126,200,227,0.14)" : "rgba(16,22,28,0.92)";
    roundRect(ctx, 36, y, W - 72, 82, 4);
    ctx.fill();
    ctx.strokeStyle = hot ? "rgba(168,228,255,0.65)" : "rgba(126,200,227,0.2)";
    ctx.stroke();

    ctx.fillStyle = "#7ec8e3";
    ctx.font = "700 20px 'IBM Plex Mono', monospace";
    ctx.fillText(`#${r.rank}`, 56, y + 34);
    ctx.fillStyle = "#e8edf2";
    ctx.font = "600 24px 'IBM Plex Sans', sans-serif";
    ctx.fillText(`${r.who} · ${r.id}`, 120, y + 34);
    ctx.fillStyle = "#8a96a3";
    ctx.font = "400 17px 'IBM Plex Sans', sans-serif";
    const next = String(r.next || "");
    ctx.fillText(next.slice(0, Math.floor(next.length * reveal)), 120, y + 62);
    ctx.globalAlpha = 1;
  });
  if (!rows.length) {
    ctx.fillStyle = "#8a96a3";
    ctx.font = "400 22px 'IBM Plex Sans', sans-serif";
    ctx.fillText("Board snapshot loading…", 48, 140);
  }
}

function drawWbEmail(ctx, W, H, p) {
  const d = DELCO_EMAIL_DRAFT;
  ctx.globalAlpha = Math.min(1, p * 1.5);
  ctx.fillStyle = "rgba(16,22,28,0.95)";
  roundRect(ctx, 36, 88, W - 72, H - 130, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(168,228,255,0.45)";
  ctx.stroke();

  ctx.fillStyle = "#7ec8e3";
  ctx.font = "600 18px 'IBM Plex Mono', monospace";
  ctx.fillText("PREVIEW · not sent · Soft Ask", 56, 120);

  ctx.fillStyle = "#8a96a3";
  ctx.font = "500 17px 'IBM Plex Mono', monospace";
  ctx.fillText(`To: ${d.to}`, 56, 160);
  ctx.fillStyle = "#e8edf2";
  ctx.font = "600 22px 'IBM Plex Sans', sans-serif";
  ctx.fillText(`Subj: ${d.subject}`, 56, 195);

  // draw lines as if writing
  ctx.strokeStyle = "rgba(126,200,227,0.35)";
  ctx.beginPath();
  ctx.moveTo(56, 215);
  ctx.lineTo(W - 56, 215);
  ctx.stroke();

  ctx.fillStyle = "#c8d2dc";
  ctx.font = "400 20px 'IBM Plex Sans', sans-serif";
  let y = 250;
  const visibleLines = Math.floor(d.body.length * Math.min(1, p * 1.2));
  for (let i = 0; i < visibleLines; i++) {
    const line = d.body[i];
    const chars = Math.floor(line.length * Math.min(1, (p - i * 0.08) / 0.25));
    ctx.fillText(line.slice(0, Math.max(0, chars)), 56, y);
    y += 32;
  }

  ctx.fillStyle = "rgba(196,92,92,0.85)";
  ctx.font = "700 16px 'IBM Plex Mono', monospace";
  ctx.fillText("AI OFF · GO = stub only · real send in Wrapstart / Gmail", 56, H - 60);
  ctx.globalAlpha = 1;
}

function cycleWhiteboard() {
  wbMode = (wbMode + 1) % 3;
  wbDrawProgress = 0;
  wbNeedsRedraw = true;
  drawWhiteboard(true);
  const labels = ["Soft Ask steps", "job cards", "Delco email draft"];
  showToast(`Whiteboard → ${labels[wbMode]}`);
}

function syncWhiteboardToStep() {
  if (wbMode === 0) {
    wbDrawProgress = Math.max(wbDrawProgress, 0.35 + companionStep * 0.18);
    wbNeedsRedraw = true;
    drawWhiteboard(false);
  }
}

/* ========== App logic ========== */

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
    if (v === null) return true;
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
    if (v === null) return true;
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
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("hidden", "toast-go", "toast-hold");
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

function jobNeedsChance(j) {
  return j.status === "close-prep" || j.status === "pending-send" || j.status === "hold";
}

function plainStatus(job) {
  if (!job) return "";
  if (job.id?.includes("delco")) return "Soft Ask · not sent";
  if (job.status === "pending-send") return "Pending Chance SEND";
  if (job.status === "close-prep") return "Close prep";
  if (job.status === "hold") return "HOLD";
  if (job.status === "practice") return "Practice only";
  return job.status || "Active";
}

function nextActionPlain(stepIdx) {
  const steps = getCompanionSteps();
  if (steps[stepIdx]) return steps[stepIdx].title + " — " + (steps[stepIdx].body || "").split(".")[0] + ".";
  return "Soft Ask path ready when you are.";
}

function nextActionForJob(job, stepIdx) {
  if (job?.id?.includes("delco")) return nextActionPlain(stepIdx);
  if (job?.boardNext) return job.boardNext;
  return plainStatus(job);
}

function syncOpsMeters() {
  const need = document.getElementById("meter-need-you");
  const delco = document.getElementById("meter-delco");
  if (!shopData) return;
  const snap = shopData.boardSnapshot;
  const needing = snap?.sendReadyWaitingChanceGO ?? shopData.jobs.filter((j) => jobNeedsChance(j)).length;
  if (need) need.textContent = String(needing);
  if (delco) {
    const stall = (shopData.meta && shopData.meta.delcoStallHours) || 48;
    delco.textContent = `~${stall}h stall`;
  }
}

function boardRows() {
  const snap = shopData?.boardSnapshot;
  if (snap?.top5?.length) {
    return snap.top5.map((row, i) => ({
      ...row,
      rank: i + 1,
      jobId: matchJobId(row),
    }));
  }
  return (shopData?.jobs || []).map((j, i) => ({
    id: j.wrapstart?.proposalId || j.id,
    who: (j.title || "").split("—")[0].trim(),
    next: j.boardNext || plainStatus(j),
    rank: j.boardRank || i + 1,
    jobId: j.id,
  }));
}

function matchJobId(row) {
  const jobs = shopData?.jobs || [];
  const id = String(row?.id || "");
  const who = String(row?.who || "").toLowerCase();
  const byProp = jobs.find((j) => j.wrapstart?.proposalId === id);
  if (byProp) return byProp.id;
  if (who.includes("delco")) return jobs.find((j) => j.id?.includes("delco"))?.id || "";
  if (who.includes("amit")) return jobs.find((j) => j.id?.includes("amit"))?.id || "";
  return "";
}

function boardCardHtml(job, hot) {
  const rank = job.boardRank || (hot ? 1 : "·");
  const next = job.boardNext || plainStatus(job);
  return `<button type="button" class="board-card ${hot ? "hot" : ""}" data-job="${escapeHtml(job.id)}">
    <div class="bc-top">
      <span class="bc-title">${escapeHtml((job.title || "").split("—")[0].trim())}</span>
      <span class="bc-rank">#${rank}</span>
    </div>
    <p class="bc-next">${escapeHtml(next)}</p>
  </button>`;
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
  const boss =
    jobs.find((j) => j.id === ((shopData.meta && shopData.meta.defaultJobId) || "job-delco-pr0014")) ||
    jobs[0];
  hotEl.innerHTML = boss ? boardCardHtml(boss, true) : "";
  const snap = shopData.boardSnapshot;
  if (snap?.top5?.length) {
    listEl.innerHTML = snap.top5
      .slice(1)
      .map((row) => {
        const match = jobs.find(
          (j) =>
            (j.wrapstart && j.wrapstart.proposalId === row.id) ||
            j.id?.includes(String(row.id).toLowerCase().replace("-", ""))
        );
        if (match) return boardCardHtml(match, false);
        return `<button type="button" class="board-card" data-job="" disabled>
          <div class="bc-top"><span class="bc-title">${escapeHtml(row.who)} · ${escapeHtml(row.id)}</span></div>
          <p class="bc-next">${escapeHtml(row.next)}</p>
        </button>`;
      })
      .join("");
  } else {
    listEl.innerHTML = jobs
      .filter((j) => j !== boss)
      .slice(0, 6)
      .map((j) => boardCardHtml(j, false))
      .join("");
  }
  [...hotEl.querySelectorAll(".board-card"), ...listEl.querySelectorAll(".board-card")].forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-job");
      if (id) focusJobById(id);
      setBoardOpen(false);
    });
  });
}

function focusJobById(jobId) {
  const job = shopData?.jobs?.find((j) => j.id === jobId);
  if (job) openJob(job);
}

function openJob(job) {
  activeJob = job;
  syncHotCard();
  syncNextAction();
  renderJobDetail(job);
  wbNeedsRedraw = true;
  drawWhiteboard(false);
  showToast(`Focused · ${(job.title || "").split("—")[0].trim()}`);
}

function renderJobDetail(job) {
  if (!job) return;
  if (detailHeader) {
    detailHeader.innerHTML = `<strong>${escapeHtml(job.title || "")}</strong><p class="hint-sm">${escapeHtml(job.summary || "")}</p>`;
  }
  if (confidenceMeter) {
    confidenceMeter.innerHTML = `<span class="rule-chip">confidence · ${escapeHtml(job.confidenceOverall || "—")}</span>`;
  }
  if (thinkPathEl) {
    thinkPathEl.innerHTML = (job.thinkPath || [])
      .map((s) => `<li><strong>${escapeHtml(s.label)}</strong> — ${escapeHtml(s.detail)}</li>`)
      .join("");
  }
  const gate = document.getElementById("gate-controls");
  if (gate) gate.classList.toggle("hidden", !(job.id?.includes("delco") || job.status === "close-prep"));
  activeStep = { job, step: (job.thinkPath || [])[0] || { id: "x", label: job.title } };
}

function syncHotCard() {
  const title = document.getElementById("hot-title");
  const sub = document.getElementById("hot-sub");
  const job = activeJob || shopData?.jobs?.find((j) => j.id?.includes("delco"));
  if (!job) return;
  if (title) title.textContent = job.id?.includes("delco")
    ? `Delco ${job.wrapstart?.proposalId || "PR-0014"}`
    : (job.title || "").split("—")[0].trim();
  if (sub) sub.textContent = job.id?.includes("delco") ? "Soft Ask · not sent" : plainStatus(job);
}

function syncNextAction() {
  const el = document.getElementById("next-action");
  const job = activeJob || shopData?.jobs?.find((j) => j.id?.includes("delco"));
  if (!el) return;
  el.textContent = nextActionForJob(job, job?.id?.includes("delco") ? companionStep : 0);
}

function populateUI() {
  if (!shopData) return;
  const chip = document.getElementById("mission-chip");
  const textEl = chip?.querySelector(".mission-text");
  const mission = shopData.meta?.mission || "";
  if (textEl) textEl.textContent = mission;
  else if (chip) chip.textContent = mission;

  const lanes = document.getElementById("lanes-list");
  if (lanes) {
    lanes.innerHTML = (shopData.lanes || [])
      .map(
        (l) => `<div class="lane-card" style="border-left:3px solid ${escapeHtml(l.color || "#7ec8e3")}">
        <h4>${escapeHtml(l.name)}</h4>
        <p>${escapeHtml(l.summary)}</p>
      </div>`
      )
      .join("");
  }

  const rules = document.getElementById("rules-list");
  if (rules) {
    const list = shopData.hardRules || shopData.rules || [
      "AI OFF",
      "No live send",
      "Soft Ask name stays",
      "50% deposit before Design",
      "Chance = SEND gate",
    ];
    rules.innerHTML = list.map((r) => `<span class="rule-chip" role="listitem">${escapeHtml(typeof r === "string" ? r : r.label || r)}</span>`).join("");
  }

  const future = document.getElementById("future-cards");
  if (future) {
    future.innerHTML = (shopData.futureCards || [])
      .map(
        (c) => `<div class="future-card">
        <h4>${escapeHtml(c.emoji || "")} ${escapeHtml(c.title || "")}</h4>
        <p>${escapeHtml(c.blurb || "")}</p>
      </div>`
      )
      .join("");
  }

  const flow = document.getElementById("flow-strip");
  if (flow && shopData.flow) flow.textContent = (shopData.flow || []).join(" → ");

  syncHotCard();
  syncNextAction();
  syncOpsMeters();
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
  const map = { listening: "listening", briefing: "briefing Delco", standby: "standby" };
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

function applyJarvisMode() {
  const btn = document.getElementById("btn-jarvis");
  const stateEl = document.getElementById("jarvis-toggle-state");
  const muteBtn = document.getElementById("btn-jarvis-mute");
  document.body.classList.toggle("jarvis-on", jarvisOn);
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
  syncJarvisBrief();
  syncWhiteboardToStep();
  if (jarvisOn) setJarvisStatus(jarvisListening ? "listening" : "briefing");
  else setJarvisStatus("standby");
}

function setJarvisOn(on) {
  jarvisOn = !!on;
  saveJarvisOn();
  applyJarvisMode();
  showToast(
    jarvisOn
      ? "Jarvis ON — Grok hub voice · hologram body + whiteboard"
      : "Jarvis OFF — companion standby · Soft Ask path still available"
  );
  if (jarvisOn) {
    wbDrawProgress = 0;
    drawWhiteboard(true);
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
  if (!SR) return;
  try {
    if (speechRec) {
      try { speechRec.stop(); } catch { /* ignore */ }
    }
    speechRec = new SR();
    speechRec.continuous = false;
    speechRec.interimResults = false;
    speechRec.lang = "en-US";
    speechRec.onresult = () => {
      showToast("Heard you — Soft Ask walkthrough stays on hologram (no live STT actions)");
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
  const label2 = document.getElementById("steps-step-label");
  if (!feed) {
    syncNextAction();
    syncJarvisBrief();
    syncWhiteboardToStep();
    return;
  }
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
    ${more > 0 ? `<div class="companion-bubble collapsed-hint">${more} more · Next / Back · hologram whiteboard tracks Soft Ask</div>` : ""}
  `;
  typeReveal(document.getElementById("companion-type-body"), s.body || "");

  const lab = `${companionStep + 1} / ${steps.length}`;
  if (label) label.textContent = lab;
  if (label2) label2.textContent = lab;
  syncNextAction();
  syncJarvisBrief();
  syncWhiteboardToStep();
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

function stubGateAction(source) {
  const isGo = String(source).includes("go");
  showToast(isGo ? STUB_TOAST_GO : STUB_TOAST_HOLD, isGo ? "go" : "hold");
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

function closeFeedbackModal() {
  document.getElementById("feedback-modal")?.classList.add("hidden");
}
function closeFuturePanel() {
  document.getElementById("future-panel")?.classList.add("hidden");
}

function exportFeedback() {
  const blob = new Blob([JSON.stringify(feedbackStore, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `wrap-shop-control-deck-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast(`Exported ${feedbackStore.length} note(s)`);
}

function wireCompanionControls() {
  const next = document.getElementById("btn-comp-next");
  const prev = document.getElementById("btn-comp-prev");
  const stepsNext = document.getElementById("btn-steps-next");
  const stepsPrev = document.getElementById("btn-steps-prev");
  const go = document.getElementById("btn-comp-go");
  const hold = document.getElementById("btn-comp-hold");
  const gateGo = document.getElementById("btn-go");
  const gateHold = document.getElementById("btn-hold");
  const mic = document.getElementById("btn-mic");
  const jarvisBtn = document.getElementById("btn-jarvis");
  const muteBtn = document.getElementById("btn-jarvis-mute");
  const listenBtn = document.getElementById("btn-jarvis-listen");
  const wbBtn = document.getElementById("btn-wb-cycle");

  if (next) next.addEventListener("click", companionNext);
  if (prev) prev.addEventListener("click", companionPrev);
  if (stepsNext) stepsNext.addEventListener("click", companionNext);
  if (stepsPrev) stepsPrev.addEventListener("click", companionPrev);
  if (go) go.addEventListener("click", () => stubGateAction("companion-go"));
  if (hold) hold.addEventListener("click", () => stubGateAction("companion-hold"));
  if (gateGo) gateGo.addEventListener("click", () => stubGateAction("detail-go"));
  if (gateHold) gateHold.addEventListener("click", () => stubGateAction("detail-hold"));
  if (wbBtn) wbBtn.addEventListener("click", cycleWhiteboard);

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
      const defaultId = (shopData?.meta && shopData.meta.defaultJobId) || "job-delco-pr0014";
      const job =
        shopData?.jobs?.find((j) => j.id === defaultId) ||
        shopData?.jobs?.find((j) => j.id.includes("delco"));
      if (job) {
        openJob(job);
        wbMode = 0;
        drawWhiteboard(true);
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
  activeJob = job;
  renderJobDetail(job);
  syncHotCard();
  syncNextAction();
}

document.getElementById("fb-cancel")?.addEventListener("click", closeFeedbackModal);
document.getElementById("fb-save")?.addEventListener("click", () => {
  if (!activeStep) return;
  const text = fbText?.value.trim();
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
  closeFeedbackModal();
  showToast("Feedback saved locally");
});
document.getElementById("btn-export")?.addEventListener("click", exportFeedback);
document.getElementById("btn-close-future")?.addEventListener("click", closeFuturePanel);
document.getElementById("ai-off-badge")?.addEventListener("click", () => {
  showToast("AI OFF locked — Engage OFF · Answer Off · never ON from deck");
});

async function main() {
  wireCompanionControls();
  wireSimpleUi();
  applyJarvisMode();
  setStepsOpen(false);
  setDetailExtrasOpen(false);
  setBoardOpen(false);
  if (detailPanel) detailPanel.classList.add("hidden");

  initHologram();

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
  focusDelcoOnLoad();
  drawWhiteboard(true);
  showToast(
    jarvisOn
      ? `${VERSION_TAG} — hologram ON · Delco Soft Ask · AI OFF · no live send`
      : `${VERSION_TAG} — tap JARVIS to wake hologram · AI OFF · no live send`
  );
}

main();
