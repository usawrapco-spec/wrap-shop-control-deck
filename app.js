import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const FEEDBACK_KEY = "wrapShopControlDeckFeedback_v03";
const STUB_TOAST = "Coming — no live send tonight";
const DATA_URL = "./data/shop-brain.json";

/** @type {any} */
let shopData = null;
/** @type {Array} */
let feedbackStore = loadFeedback();

const canvas = document.getElementById("c");
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
let companionRevealed = 0; // highest index revealed


// --- Three.js setup ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x120e22, 1);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x120e22, 0.018);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
camera.position.set(18, 22, 28);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 12;
controls.maxDistance = 55;
controls.target.set(0, 1, 2);

const hemi = new THREE.HemisphereLight(0xffeaa7, 0x2d1b4e, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff5e0, 1.1);
sun.position.set(12, 28, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const fill = new THREE.PointLight(0x5ec8ff, 0.55, 60);
fill.position.set(-14, 8, 8);
scene.add(fill);
const warm = new THREE.PointLight(0xff9f43, 0.4, 40);
warm.position.set(10, 6, -4);
scene.add(warm);

// Clickable registry
const clickables = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function resize() {
  const wrap = document.getElementById("stage-wrap");
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

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

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function hexColor(c) {
  return new THREE.Color(c);
}

function makeIsland(station) {
  const group = new THREE.Group();
  group.position.set(station.position[0], station.position[1], station.position[2]);
  group.userData = { kind: "station", id: station.id, label: station.name, blurb: station.blurb };

  const baseGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.55, 8);
  const baseMat = new THREE.MeshStandardMaterial({
    color: hexColor(station.color),
    roughness: 0.55,
    metalness: 0.15,
    emissive: hexColor(station.color),
    emissiveIntensity: 0.12,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.castShadow = true;
  base.receiveShadow = true;
  base.position.y = 0.1;
  group.add(base);

  // Soft top pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, 0.18, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2144, roughness: 0.8 })
  );
  pad.position.y = 0.45;
  pad.receiveShadow = true;
  group.add(pad);

  // Building blob
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.4, 1.6),
    new THREE.MeshStandardMaterial({
      color: hexColor(station.color).multiplyScalar(0.7),
      roughness: 0.4,
      metalness: 0.2,
    })
  );
  building.position.y = 1.25;
  building.castShadow = true;
  group.add(building);

  // Roof peak
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.35, 0.7, 4),
    new THREE.MeshStandardMaterial({
      color: hexColor(station.color),
      emissive: hexColor(station.color),
      emissiveIntensity: 0.25,
      roughness: 0.35,
    })
  );
  roof.position.y = 2.25;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Glow ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.06, 8, 32),
    new THREE.MeshBasicMaterial({ color: hexColor(station.color), transparent: true, opacity: 0.55 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.35;
  group.add(ring);

  // Floating emoji sprite via canvas texture
  const sprite = makeLabelSprite(station.emoji + " " + station.name, station.color);
  sprite.position.y = 3.4;
  group.add(sprite);

  // Bob animation data
  group.userData.baseY = group.position.y;
  group.userData.bobPhase = Math.random() * Math.PI * 2;
  group.userData.ring = ring;

  scene.add(group);
  clickables.push(group);
  return group;
}

function makeLabelSprite(text, colorHex) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 512, 128);
  roundRect(ctx, 16, 24, 480, 80, 28);
  ctx.fillStyle = "rgba(20, 14, 40, 0.85)";
  ctx.fill();
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px Nunito, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.5, 1.4, 1);
  return sprite;
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

function makeVan(job, stationPos) {
  const group = new THREE.Group();
  const offset = (Math.random() - 0.5) * 2.2;
  const zOff = (Math.random() - 0.5) * 2.2;
  group.position.set(stationPos[0] + offset, 0.7, stationPos[2] + zOff + 2.8);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: hexColor(job.color),
    roughness: 0.35,
    metalness: 0.35,
    emissive: hexColor(job.color),
    emissiveIntensity: 0.2,
  });

  if (job.vehicle === "boat") {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.0), bodyMat);
    hull.castShadow = true;
    group.add(hull);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.5, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    cabin.position.set(-0.4, 0.4, 0);
    cabin.castShadow = true;
    group.add(cabin);
    // Deck stripe
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.08, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x55efc4, roughness: 0.5 })
    );
    deck.position.set(0.35, 0.22, 0);
    group.add(deck);
  } else {
    // Van body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 1.15), bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);
    // Cab
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.75, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.4, roughness: 0.4 })
    );
    cab.position.set(-1.15, 0.5, 0);
    cab.castShadow = true;
    group.add(cab);
    // Windows
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.7 })
    );
    win.position.set(-1.15, 0.65, 0);
    group.add(win);
    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    for (const [x, z] of [[-0.7, 0.6], [-0.7, -0.6], [0.55, 0.6], [0.55, -0.6]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.28, z);
      group.add(w);
    }
    // Soft Ask bubble for softask jobs
    if (job.id.includes("softask") || job.status === "active") {
      const bubble = makeSpeechBubble("Soft Ask 💬");
      bubble.position.set(0.3, 1.9, 0);
      group.add(bubble);
    }
  }

  // Status bubbles
  if (job.status === "hold") {
    const lock = makeSpeechBubble("🔒 HOLD");
    lock.position.set(0, 2.0, 0);
    group.add(lock);
  }
  if (job.status === "close-prep" || job.status === "ready") {
    const prep = makeSpeechBubble("🎯 CLOSE");
    prep.position.set(0, 2.0, 0);
    group.add(prep);
  }
  if (job.status === "pending-send") {
    const pend = makeSpeechBubble("⏳ SEND?");
    pend.position.set(0, 2.0, 0);
    group.add(pend);
  }
  if (job.status === "practice") {
    const prac = makeSpeechBubble("🧪 practice");
    prac.position.set(0, 2.0, 0);
    group.add(prac);
  }

  const label = makeLabelSprite(job.title.split("—")[0].trim(), job.color);
  label.position.y = job.vehicle === "boat" ? 1.8 : 2.6;
  label.scale.set(4.2, 1.05, 1);
  group.add(label);

  group.userData = {
    kind: "job",
    id: job.id,
    label: job.title,
    job,
    baseY: group.position.y,
    bobPhase: Math.random() * Math.PI * 2,
    driveAngle: Math.random() * Math.PI * 2,
    home: group.position.clone(),
  };

  scene.add(group);
  clickables.push(group);
  return group;
}

function makeSpeechBubble(text) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext("2d");
  roundRect(ctx, 8, 8, 240, 64, 20);
  ctx.fillStyle = "#fff8e7";
  ctx.fill();
  ctx.strokeStyle = "#ff9f43";
  ctx.lineWidth = 3;
  ctx.stroke();
  // little tail
  ctx.beginPath();
  ctx.moveTo(110, 72);
  ctx.lineTo(128, 90);
  ctx.lineTo(146, 72);
  ctx.fillStyle = "#fff8e7";
  ctx.fill();
  ctx.fillStyle = "#2d1b4e";
  ctx.font = "bold 28px Nunito, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 42);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(2.4, 0.9, 1);
  return spr;
}

function makeChanceGateGlow(station) {
  // Extra tall glowing door at Chance Gate
  const group = new THREE.Group();
  group.position.set(station.position[0], 0, station.position[2]);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 3.2, 0.35),
    new THREE.MeshStandardMaterial({
      color: 0xffeaa7,
      emissive: 0xffeaa7,
      emissiveIntensity: 0.7,
      metalness: 0.5,
      roughness: 0.2,
    })
  );
  frame.position.y = 2.4;
  group.add(frame);

  const doorLight = new THREE.PointLight(0xffeaa7, 1.4, 12);
  doorLight.position.set(0, 2.5, 1.5);
  group.add(doorLight);

  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.7, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.7, roughness: 0.3, emissive: 0x886600, emissiveIntensity: 0.3 })
  );
  chest.position.set(1.8, 0.9, 1.2);
  chest.castShadow = true;
  group.add(chest);

  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.15, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.25 })
  );
  lid.position.set(1.8, 1.3, 1.2);
  group.add(lid);

  const lockSpr = makeSpeechBubble("Chance opens");
  lockSpr.position.set(1.8, 2.0, 1.2);
  group.add(lockSpr);

  scene.add(group);
  return group;
}

function makeGround() {
  const geo = new THREE.CircleGeometry(40, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a1230,
    roughness: 0.95,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // Path ribbon connecting stations (simple tube-ish boxes)
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0x3d2a6b,
    emissive: 0x5ec8ff,
    emissiveIntensity: 0.15,
    roughness: 0.6,
  });
  const order = shopData.stations;
  for (let i = 0; i < order.length - 1; i++) {
    const a = new THREE.Vector3(...order[i].position);
    const b = new THREE.Vector3(...order[i + 1].position);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dist = a.distanceTo(b);
    const path = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, dist), pathMat);
    path.position.copy(mid);
    path.position.y = 0.02;
    path.lookAt(b.x, 0.02, b.z);
    scene.add(path);
  }

  // Stars / sparkles
  const starGeo = new THREE.BufferGeometry();
  const count = 180;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 70;
    positions[i * 3 + 1] = 4 + Math.random() * 25;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xffeaa7, size: 0.12, transparent: true, opacity: 0.7 })
  );
  scene.add(stars);
}

function buildScene() {
  makeGround();
  const stationMap = Object.fromEntries(shopData.stations.map((s) => [s.id, s]));

  for (const st of shopData.stations) {
    makeIsland(st);
    if (st.id === "chance-gate") makeChanceGateGlow(st);
  }

  for (const job of shopData.jobs) {
    const st = stationMap[job.station] || shopData.stations[0];
    makeVan(job, st.position);
  }
}

function populateUI() {
  document.getElementById("mission-chip").textContent = "🎯 " + shopData.meta.mission;

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
    const li = document.createElement("li");
    li.innerHTML = `<strong>${rule.title}</strong>${rule.detail}`;
    rulesList.appendChild(li);
  }

  const flow = document.getElementById("flow-strip");
  flow.innerHTML = shopData.leadFlow.map((s) => `<span class="flow-step">${s}</span>`).join("");

  populateFutureCards();
  syncAiOffBadge();
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
      <h3>${escapeHtml(c.emoji || "")} ${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.blurb)}</p>
    </article>`
    )
    .join("");
}

function syncAiOffBadge() {
  const badge = document.getElementById("ai-off-badge");
  if (!badge) return;
  // v0.3 HARDCODED OFF — never wire live AI ON from this deck
  badge.innerHTML = 'AI OFF<span class="ai-off-sub">Engage OFF · Answer Off</span>';
  badge.title = "Engage OFF · Answer calls Off · hardcoded — never wire live AI ON";
  badge.style.background = "linear-gradient(135deg, #c0392b, #ff7675)";
}

function openFuturePanel() {
  const panel = document.getElementById("future-panel");
  if (!panel) return;
  populateFutureCards();
  panel.classList.remove("hidden");
  showToast("Future deck — AI stays OFF");
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

function openJob(job) {
  activeJob = job;
  detailPanel.classList.remove("hidden");

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

  const cc = confClass(job.confidenceOverall);
  confidenceMeter.innerHTML = `
    <div class="cm-label">Grok confidence (overall)</div>
    <div class="cm-bar"><div class="cm-fill ${cc}"></div></div>
    <div class="cm-text ${cc}">${confLabel(job.confidenceOverall)}</div>
  `;

  const gate = document.getElementById("gate-controls");
  if (gate) {
    const showGate = job.status === "close-prep" || job.status === "ready" || job.status === "pending-send" || job.id.includes("delco");
    gate.classList.toggle("hidden", !showGate);
  }

  thinkPathEl.innerHTML = "";
  for (const step of job.thinkPath) {
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

  if (job.id === "job-delco-pr0014" || (job.wrapstart && job.wrapstart.proposalId === "PR-0014")) {
    renderCompanion(true);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function ndcFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function pick(e) {
  ndcFromEvent(e);
  raycaster.setFromCamera(pointer, camera);
  const meshes = [];
  for (const g of clickables) {
    g.traverse((o) => {
      if (o.isMesh) {
        o.userData.root = g;
        meshes.push(o);
      }
    });
  }
  const hits = raycaster.intersectObjects(meshes, false);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && !obj.userData?.kind) obj = obj.userData?.root || obj.parent;
  return obj?.userData?.kind ? obj : hits[0].object.userData.root || null;
}

canvas.addEventListener("pointermove", (e) => {
  const obj = pick(e);
  if (obj && obj.userData.kind) {
    canvas.style.cursor = "pointer";
    tooltip.classList.remove("hidden");
    tooltip.style.left = e.clientX + "px";
    tooltip.style.top = e.clientY + "px";
    const u = obj.userData;
    tooltip.textContent =
      u.kind === "job" ? "🚐 " + u.label : "🏝️ " + u.label + (u.blurb ? " — " + u.blurb : "");
    if (hovered !== obj) {
      if (hovered) hovered.scale.setScalar(1);
      hovered = obj;
      hovered.scale.setScalar(1.08);
    }
  } else {
    canvas.style.cursor = "grab";
    tooltip.classList.add("hidden");
    if (hovered) {
      hovered.scale.setScalar(1);
      hovered = null;
    }
  }
});

canvas.addEventListener("pointerleave", () => {
  tooltip.classList.add("hidden");
  if (hovered) {
    hovered.scale.setScalar(1);
    hovered = null;
  }
});

let downPos = null;
canvas.addEventListener("pointerdown", (e) => {
  downPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("pointerup", (e) => {
  if (!downPos) return;
  const dx = e.clientX - downPos.x;
  const dy = e.clientY - downPos.y;
  downPos = null;
  if (Math.hypot(dx, dy) > 6) return; // was a drag
  const obj = pick(e);
  if (!obj) return;
  if (obj.userData.kind === "job") {
    openJob(obj.userData.job);
    // gentle camera nudge toward job
    controls.target.lerp(obj.position.clone().setY(1), 0.4);
  } else if (obj.userData.kind === "station") {
    if (obj.userData.id === "future-deck") {
      openFuturePanel();
      controls.target.lerp(obj.position.clone().setY(1), 0.35);
      return;
    }
    // highlight jobs at this station
    const jobsHere = shopData.jobs.filter((j) => j.station === obj.userData.id);
    if (jobsHere.length === 1) openJob(jobsHere[0]);
    else if (jobsHere.length > 1) openJob(jobsHere[0]);
    else {
      detailPanel.classList.remove("hidden");
      detailHeader.innerHTML = `
        <div class="job-title">${obj.userData.label}</div>
        <p class="summary">${obj.userData.blurb}</p>
        <p class="summary" style="opacity:0.7">No job parked here right now — click a van or boat.</p>
      `;
      confidenceMeter.innerHTML = "";
      thinkPathEl.innerHTML = "";
    }
    controls.target.lerp(obj.position.clone().setY(1), 0.35);
  }
});

document.getElementById("btn-close-detail").addEventListener("click", () => {
  detailPanel.classList.add("hidden");
  activeJob = null;
  detailHeader.innerHTML = "";
  confidenceMeter.innerHTML = "";
  thinkPathEl.innerHTML = "";
  const gate = document.getElementById("gate-controls");
  if (gate) gate.classList.add("hidden");
});

document.getElementById("btn-export").addEventListener("click", exportFeedback);
document.getElementById("btn-future").addEventListener("click", openFuturePanel);
document.getElementById("btn-close-future").addEventListener("click", closeFuturePanel);
document.getElementById("ai-off-badge").addEventListener("click", () => {
  showToast("AI OFF locked — Engage OFF · Answer Off · never ON from deck");
});
document.getElementById("btn-reset-cam").addEventListener("click", () => {
  camera.position.set(18, 22, 28);
  controls.target.set(0, 1, 2);
});
document.getElementById("fb-cancel").addEventListener("click", closeFeedbackModal);
document.getElementById("fb-save").addEventListener("click", () => {
  const jobRef = activeStep?.job;
  const text = fbText.value.trim();
  if (!text || !activeStep) return;
  const entry = {
    id: "fb-" + Date.now(),
    jobId: activeStep.job.id,
    jobTitle: activeStep.job.title,
    stepId: activeStep.step.id,
    stepLabel: activeStep.step.label,
    text,
    createdAt: new Date().toISOString(),
  };
  feedbackStore.push(entry);
  saveFeedback();
  closeFeedbackModal();
  if (jobRef) openJob(jobRef);
  showToast("Feedback saved locally ✓");
});

feedbackModal.addEventListener("click", (e) => {
  if (e.target === feedbackModal) closeFeedbackModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeFeedbackModal();
    closeFuturePanel();
  }
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  for (const g of clickables) {
    const u = g.userData;
    if (u.bobPhase != null) {
      g.position.y = u.baseY + Math.sin(t * 1.2 + u.bobPhase) * 0.12;
    }
    if (u.ring) {
      u.ring.rotation.z = t * 0.4;
    }
    if (u.kind === "job" && u.home) {
      // gentle wander near home
      const a = t * 0.35 + u.driveAngle;
      g.position.x = u.home.x + Math.cos(a) * 0.55;
      g.position.z = u.home.z + Math.sin(a) * 0.55;
      g.rotation.y = a + Math.PI / 2;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}


function stubGateAction(kind) {
  // Never call Wrapstart, never send email/SMS
  showToast(STUB_TOAST);
  console.info("[Control Deck] stub gate:", kind, "— no live send / no API");
}

function getCompanionSteps() {
  return (shopData && shopData.companionScript) || [];
}

function renderCompanion(keepStep) {
  const feed = document.getElementById("companion-feed");
  const label = document.getElementById("companion-step-label");
  if (!feed) return;
  const steps = getCompanionSteps();
  if (!steps.length) {
    feed.innerHTML = '<p class="hint-sm">No companion script loaded.</p>';
    return;
  }
  if (!keepStep) {
    companionStep = 0;
    companionRevealed = 0;
  }
  companionStep = Math.max(0, Math.min(companionStep, steps.length - 1));
  companionRevealed = Math.max(companionRevealed, companionStep);

  feed.innerHTML = steps
    .map((s, i) => {
      const revealed = i <= companionRevealed;
      const active = i === companionStep;
      return `<article class="companion-bubble tone-${escapeHtml(s.tone || "")} ${
        revealed ? "revealed" : ""
      } ${active ? "active" : ""}" data-idx="${i}">
        <div class="cb-title">${escapeHtml(s.title)}</div>
        <p class="cb-body">${revealed ? escapeHtml(s.body) : "…"}</p>
      </article>`;
    })
    .join("");

  feed.querySelectorAll(".companion-bubble").forEach((el) => {
    el.addEventListener("click", () => {
      companionStep = Number(el.dataset.idx);
      companionRevealed = Math.max(companionRevealed, companionStep);
      renderCompanion(true);
    });
  });

  if (label) label.textContent = `${companionStep + 1} / ${steps.length}`;

  // Auto-scroll active into view
  const activeEl = feed.querySelector(".companion-bubble.active");
  if (activeEl) activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function companionNext() {
  const steps = getCompanionSteps();
  if (!steps.length) return;
  if (companionStep < steps.length - 1) {
    companionStep += 1;
    companionRevealed = Math.max(companionRevealed, companionStep);
    renderCompanion(true);
  } else {
    showToast("End of Delco close script — GO/HOLD still stubbed");
  }
}

function companionPrev() {
  if (companionStep > 0) {
    companionStep -= 1;
    renderCompanion(true);
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

  if (next) next.addEventListener("click", companionNext);
  if (prev) prev.addEventListener("click", companionPrev);
  if (go) go.addEventListener("click", () => stubGateAction("companion-go"));
  if (hold) hold.addEventListener("click", () => stubGateAction("companion-hold"));
  if (gateGo) gateGo.addEventListener("click", () => stubGateAction("detail-go"));
  if (gateHold) gateHold.addEventListener("click", () => stubGateAction("detail-hold"));
  if (mic) {
    mic.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("voice coming");
    });
  }
}

function focusDelcoOnLoad() {
  const defaultId = (shopData.meta && shopData.meta.defaultJobId) || "job-delco-pr0014";
  const job = shopData.jobs.find((j) => j.id === defaultId) || shopData.jobs.find((j) => j.id.includes("delco"));
  if (!job) return;
  openJob(job);
  // Nudge camera toward Chance Gate / Delco van
  const target = clickables.find((g) => g.userData.kind === "job" && g.userData.id === job.id);
  if (target) {
    controls.target.lerp(target.position.clone().setY(1), 0.85);
    camera.position.lerp(new THREE.Vector3(14, 16, 18), 0.35);
  }
}

async function main() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Failed to load shop-brain.json — serve over HTTP");
    shopData = await res.json();
  } catch (err) {
    document.getElementById("mission-chip").textContent =
      "⚠️ Load via HTTP (python3 -m http.server). " + err.message;
    console.error(err);
    return;
  }

  populateUI();
  buildScene();
  wireCompanionControls();
  renderCompanion(false);
  resize();
  detailPanel.classList.add("hidden");
  animate();
  focusDelcoOnLoad();
  showToast("Control Deck v0.3 — Delco PR-0014 ready · AI OFF · no live send");
}

main();
