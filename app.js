const THEME_KEY = "priority-grid-theme";
const FONT_KEY = "priority-grid-font";
const FILTER_KEY = "priority-grid-filter";
const PAGE_KEY = "priority-grid-page";
const LEGACY_TASKS_KEY = "priority-grid-tasks";
const LEGACY_CONTEXT_KEY = "priority-grid-context";
const LEGACY_VIEW_KEY = "priority-grid-view";
const SYNC_BANNER_KEY = "priority-grid-sync-banner-dismissed";
const MODE_135_KEY = "priority-grid-135-mode";
const SIDEBAR_TAB_KEY = "priority-grid-sidebar-tab";
const PLAN_135_PREFIX = "priority-grid-135-";
const FORGET_IT_PREFIX = "priority-grid-forget-it-";
const SYNC_META_KEY = "priority-grid-sync-meta";
const SYNC_API = "/api/sync";
const SYNC_POLL_MS = 30000;

const PLAN_135_SLOTS = [
  { group: "big", label: "1 Big Task", count: 1 },
  { group: "medium", label: "3 Medium Tasks", count: 3 },
  { group: "small", label: "5 Small Tasks", count: 5 },
];

const CONTEXTS = ["work", "home"];
const TIER_LABELS = ["1st", "2nd", "3rd", "4th"];
const isTouchDevice = () => window.matchMedia("(hover: none), (pointer: coarse)").matches;

const THEMES = [
  { id: "soft-sand", name: "Soft Sand", colors: ["#FFFAF6", "#F5F1EB", "#DBA063", "#C29A7A", "#2A2724"] },
  { id: "calm-neutral", name: "Calm Neutral", colors: ["#FAFBF5", "#F2EEE9", "#A89F93", "#7D9186", "#3E3E3E"] },
  { id: "soft-sage", name: "Soft Sage", colors: ["#F4F7F2", "#E9F0E6", "#A8C0A3", "#6E8F7A", "#334236"] },
  { id: "warm-minimal", name: "Warm Minimal", colors: ["#FFFAF6", "#F6EFE9", "#D6B397", "#C46A4A", "#3B2F2A"] },
  { id: "zen-blue", name: "Zen Blue", colors: ["#F2F6FA", "#E6EEF5", "#9EB8D1", "#4C6A88", "#2D3748"] },
  { id: "earthy-clay", name: "Earthy Clay", colors: ["#F7F3EF", "#ECE4DA", "#C09A7B", "#7A8A74", "#3B342E"] },
  { id: "soft-lavender", name: "Soft Lavender", colors: ["#F6F4FA", "#EDE9F5", "#B7A7C9", "#7E6B91", "#3A3347"] },
  { id: "pure-white", name: "Pure White", colors: ["#FFFFFF", "#F7F7F8", "#222222", "#A6A6A6", "#333333"] },
  { id: "dusty-rose", name: "My Day", colors: ["#FFF9F9", "#FFFFFF", "#B46B61", "#FDE8E8", "#2D2D2D"] },
  { id: "mindful-greige", name: "Mindful Greige", colors: ["#F6F4F1", "#EDEAE4", "#8D857A", "#C4B8A6", "#3E3A36"] },
  { id: "ocean-breeze", name: "Ocean Breeze", colors: ["#F0F7FA", "#D8F0F3", "#5D8FA6", "#9CCBD6", "#2C3E46"] },
  { id: "sunlit-sand", name: "Sunlit Sand", colors: ["#FFF8F2", "#F7EFE1", "#D4B063", "#E9D3A8", "#584D35"] },
  { id: "forest-mist", name: "Forest Mist", colors: ["#F2F7F3", "#E4ECE6", "#3D5A47", "#A8C5AD", "#2F3D32"] },
  { id: "terra-cotta", name: "Terra Cotta", colors: ["#FFF3EF", "#F7E4DD", "#C15A3D", "#E7A28B", "#5A4036"] },
  { id: "storm-grey", name: "Storm Grey", colors: ["#F0F1F3", "#E3E5E8", "#4A4F55", "#7B828C", "#212427"] },
  { id: "blush-clay", name: "Blush Clay", colors: ["#FFF5F4", "#F4E7E4", "#B97A6E", "#DDB2A7", "#533F3A"] },
  { id: "clear-sky", name: "Clear Sky", colors: ["#F3F8FF", "#EAF3FB", "#6FA8DC", "#B9D7EF", "#1F2D3D"] },
];

const FONTS = [
  { id: "playfair-inter", name: "Inter", heading: "Inter", body: "Inter" },
  { id: "lora-inter", name: "Lora + Inter", heading: "Lora", body: "Inter" },
  { id: "pairing-1", name: "Noto Serif + Inter", heading: "Noto Serif", body: "Inter" },
  { id: "pairing-2", name: "Cormorant + Lato", heading: "Cormorant Garamond", body: "Lato" },
  { id: "pairing-3", name: "Playfair + Nunito Sans", heading: "Playfair Display", body: "Nunito Sans" },
  { id: "pairing-4", name: "DM Serif + Source Sans", heading: "DM Serif Display", body: "Source Sans 3" },
  { id: "pairing-5", name: "Libre Baskerville + Work Sans", heading: "Libre Baskerville", body: "Work Sans" },
];

let page = getPage();
let filter = getFilter();
let draggedTask = null;
let expandedTier = null;
let mode135 = getMode135();
let sidebarTab = getSidebarTab();
let plan135Picker = null;
let syncAvailable = false;
let syncPushTimer = null;
let syncPulling = false;
let syncPushing = false;

const TIER_NAMES = ["1st Priority", "2nd Priority", "3rd Priority", "4th Priority"];
const PREVIEW_TASK_LIMIT = 3;

function tasksKey(ctx) {
  return `priority-grid-tasks-${ctx}`;
}

function brainDumpKey(ctx) {
  return `priority-grid-brain-dump-${ctx}`;
}

function migrateLegacyData() {
  try {
    const legacy = localStorage.getItem(LEGACY_TASKS_KEY);
    if (legacy && !localStorage.getItem(tasksKey("home"))) {
      localStorage.setItem(tasksKey("home"), legacy);
    }
    localStorage.removeItem(LEGACY_TASKS_KEY);

    const legacyCtx = localStorage.getItem(LEGACY_CONTEXT_KEY);
    if (legacyCtx && !localStorage.getItem(FILTER_KEY)) {
      localStorage.setItem(FILTER_KEY, legacyCtx);
    }
    localStorage.removeItem(LEGACY_CONTEXT_KEY);

    const legacyView = localStorage.getItem(LEGACY_VIEW_KEY);
    if (legacyView === "brain-dump" && !localStorage.getItem(PAGE_KEY)) {
      localStorage.setItem(PAGE_KEY, "brain-dump");
    }
    localStorage.removeItem(LEGACY_VIEW_KEY);
  } catch {
    /* ignore */
  }
}

function loadTasks(ctx) {
  try {
    const saved = localStorage.getItem(tasksKey(ctx));
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
}

function saveTasks(ctx, list, options = {}) {
  localStorage.setItem(tasksKey(ctx), JSON.stringify(list));
  if (!options.skipSync) scheduleSyncPush();
}

function loadBrainDump(ctx) {
  try {
    const saved = localStorage.getItem(brainDumpKey(ctx));
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
}

function saveBrainDump(ctx, list, options = {}) {
  localStorage.setItem(brainDumpKey(ctx), JSON.stringify(list));
  if (!options.skipSync) scheduleSyncPush();
}

function getVisibleTasks() {
  const include = (t) => !t.archived;
  if (filter === "all") {
    return CONTEXTS.flatMap((ctx) =>
      loadTasks(ctx).filter(include).map((t) => ({ ...t, context: ctx }))
    );
  }
  return loadTasks(filter).filter(include).map((t) => ({ ...t, context: filter }));
}

function getArchivedTasks() {
  const include = (t) => t.archived;
  if (filter === "all") {
    return CONTEXTS.flatMap((ctx) =>
      loadTasks(ctx).filter(include).map((t) => ({ ...t, context: ctx }))
    );
  }
  return loadTasks(filter).filter(include).map((t) => ({ ...t, context: filter }));
}

function getVisibleBrainDump() {
  if (filter === "all") {
    return CONTEXTS.flatMap((ctx) =>
      loadBrainDump(ctx).map((item) => ({ ...item, context: ctx }))
    );
  }
  return loadBrainDump(filter).map((item) => ({ ...item, context: filter }));
}

function getBrainDumpContexts() {
  return filter === "all" ? CONTEXTS : [filter];
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updateBoardHint() {
  const hint = document.getElementById("board-hint");
  if (!hint) return;
  if (mode135) {
    hint.textContent = isTouchDevice()
      ? "Hold a task, then drag to reorder or into the 1-3-5 and Forget It tabs in the sidebar."
      : "Drag tasks between priorities, or drop them into 1-3-5 slots and the Forget It box in the sidebar.";
    return;
  }
  hint.textContent = isTouchDevice()
    ? "Hold a task, then drag to reorder or move priorities. Hold a priority title to see all tasks."
    : "Drag tasks between priorities. Click a priority title to see all tasks.";
}

function exportAllData() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    work: loadTasks("work"),
    home: loadTasks("home"),
    brainDumpWork: loadBrainDump("work"),
    brainDumpHome: loadBrainDump("home"),
    theme: getTheme(),
    font: getFont(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clear-space-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importAllData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.work) saveTasks("work", data.work);
      if (data.home) saveTasks("home", data.home);
      if (data.brainDumpWork) saveBrainDump("work", data.brainDumpWork);
      if (data.brainDumpHome) saveBrainDump("home", data.brainDumpHome);
      if (data.theme && THEMES.some((t) => t.id === data.theme)) setTheme(data.theme);
      if (data.font && FONTS.some((f) => f.id === data.font)) setFont(data.font);
      renderAll();
      scheduleSyncPush();
      alert("Backup imported successfully.");
    } catch {
      alert("Could not read that file. Please choose a My Day export.");
    }
  };
  reader.readAsText(file);
}

function setupDataSync() {
  document.getElementById("export-data-btn").addEventListener("click", exportAllData);
  document.getElementById("import-data-input").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importAllData(file);
    e.target.value = "";
  });

  document.getElementById("sync-banner-dismiss").addEventListener("click", () => {
    localStorage.setItem(SYNC_BANNER_KEY, "1");
    document.getElementById("sync-banner").classList.add("hidden");
  });

  initRemoteSync();
}

function getSyncMeta() {
  try {
    const saved = localStorage.getItem(SYNC_META_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return { updatedAt: null };
}

function setSyncMeta(meta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

function collectPlan135FromStorage() {
  const plans = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PLAN_135_PREFIX)) continue;
    try {
      plans[key.slice(PLAN_135_PREFIX.length)] = JSON.parse(localStorage.getItem(key));
    } catch {
      /* ignore */
    }
  }
  return plans;
}

function collectForgetItFromStorage() {
  const forgetIt = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(FORGET_IT_PREFIX)) continue;
    try {
      forgetIt[key.slice(FORGET_IT_PREFIX.length)] = JSON.parse(localStorage.getItem(key));
    } catch {
      /* ignore */
    }
  }
  return forgetIt;
}

function buildSyncPayload() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    work: loadTasks("work"),
    home: loadTasks("home"),
    brainDumpWork: loadBrainDump("work"),
    brainDumpHome: loadBrainDump("home"),
    plans: collectPlan135FromStorage(),
    forgetIt: collectForgetItFromStorage(),
  };
}

function applySyncPayload(payload, options = {}) {
  if (!payload) return false;

  const skipSync = { skipSync: true };
  if (Array.isArray(payload.work)) saveTasks("work", payload.work, skipSync);
  if (Array.isArray(payload.home)) saveTasks("home", payload.home, skipSync);
  if (Array.isArray(payload.brainDumpWork)) saveBrainDump("work", payload.brainDumpWork, skipSync);
  if (Array.isArray(payload.brainDumpHome)) saveBrainDump("home", payload.brainDumpHome, skipSync);

  Object.entries(payload.plans || {}).forEach(([date, plan]) => {
    localStorage.setItem(plan135StorageKey(date), JSON.stringify(plan));
  });

  const forgetEntries = payload.forgetIt || {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(FORGET_IT_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
  Object.entries(forgetEntries).forEach(([date, ref]) => {
    if (ref) {
      localStorage.setItem(forgetItStorageKey(date), JSON.stringify(ref));
    }
  });

  if (payload.updatedAt) {
    setSyncMeta({ updatedAt: payload.updatedAt });
  }

  if (!options.skipRender) {
    renderAll();
  }
  return true;
}

function isRemoteNewer(remoteUpdatedAt) {
  if (!remoteUpdatedAt) return false;
  const localUpdatedAt = getSyncMeta().updatedAt;
  if (!localUpdatedAt) return true;
  return remoteUpdatedAt > localUpdatedAt;
}

async function pullRemoteSync(options = {}) {
  if (!syncAvailable || syncPulling) return;
  syncPulling = true;
  try {
    const response = await fetch(SYNC_API, { cache: "no-store" });
    if (!response.ok) return;
    const remote = await response.json();
    if (!remote?.updatedAt) {
      await pushRemoteSync({ force: true });
      return;
    }
    if (isRemoteNewer(remote.updatedAt)) {
      applySyncPayload(remote, { skipRender: true });
      renderAll();
    }
  } catch {
    syncAvailable = false;
  } finally {
    syncPulling = false;
  }
}

async function pushRemoteSync(options = {}) {
  if (!syncAvailable || syncPushing) return;
  const localMeta = getSyncMeta();
  if (!options.force && localMeta.updatedAt) {
    await pullRemoteSync({ silent: true });
    if (isRemoteNewer(getSyncMeta().updatedAt)) return;
  }

  syncPushing = true;
  try {
    const payload = buildSyncPayload();
    const response = await fetch(SYNC_API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return;
    const saved = await response.json();
    if (saved?.updatedAt) {
      setSyncMeta({ updatedAt: saved.updatedAt });
    }
  } catch {
    syncAvailable = false;
  } finally {
    syncPushing = false;
  }
}

function scheduleSyncPush() {
  if (!syncAvailable) return;
  if (syncPushTimer) clearTimeout(syncPushTimer);
  syncPushTimer = setTimeout(() => {
    syncPushTimer = null;
    pushRemoteSync();
  }, 500);
}

function updateSyncUi() {
  const hint = document.querySelector(".sync-hint");
  const banner = document.getElementById("sync-banner");
  const dismissed = localStorage.getItem(SYNC_BANNER_KEY) === "1";
  const host = location.hostname;
  const isRemoteHost = host !== "localhost" && host !== "127.0.0.1";

  if (syncAvailable) {
    if (hint) {
      hint.textContent =
        "Tasks sync automatically across devices on the same Wi-Fi while this server is running.";
    }
    if (banner) banner.classList.add("hidden");
    return;
  }

  if (hint) {
    hint.textContent =
      "Run ./serve.sh and open the same URL on phone and computer to sync automatically. Export/import still works as backup.";
  }
  if (banner && isRemoteHost && !dismissed) {
    banner.classList.remove("hidden");
    banner.querySelector("p").innerHTML =
      "Sync server not detected. Start <strong>./serve.sh</strong> on your Mac and open the same address on each device.";
  }
}

async function initRemoteSync() {
  try {
    const response = await fetch(SYNC_API, { cache: "no-store" });
    if (!response.ok) {
      updateSyncUi();
      return;
    }
    syncAvailable = true;
    updateSyncUi();
    await pullRemoteSync();
    setInterval(() => pullRemoteSync({ silent: true }), SYNC_POLL_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pullRemoteSync({ silent: true });
    });
    window.addEventListener("focus", () => pullRemoteSync({ silent: true }));
  } catch {
    syncAvailable = false;
    updateSyncUi();
  }
}

function getPage() {
  try {
    const saved = localStorage.getItem(PAGE_KEY);
    if (saved === "home" || saved === "tasks") return saved;
    if (saved === "brain-dump") return "tasks";
    if (saved === "settings") return "home";
  } catch {
    /* ignore */
  }
  return "home";
}

function getFilter() {
  try {
    const saved = localStorage.getItem(FILTER_KEY);
    if (["all", "work", "home"].includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "all";
}

function getTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
    if (saved) {
      const map = { "warm-minimal": "soft-sand" };
      if (map[saved]) return map[saved];
    }
  } catch {
    /* ignore */
  }
  return "dusty-rose";
}

function getFont() {
  try {
    const saved = localStorage.getItem(FONT_KEY);
    if (saved && FONTS.some((f) => f.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "playfair-inter";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function contextLabel(ctx) {
  return ctx === "work" ? "Work" : "Home";
}

function contextIconHtml(ctx, className = "context-icon") {
  const label = contextLabel(ctx);
  const iconId = ctx === "work" ? "icon-briefcase" : "icon-house";
  return `<span class="${className}" title="${label}" aria-label="${label}"><svg class="icon ${className}-svg" aria-hidden="true"><use href="#${iconId}"></use></svg></span>`;
}

function setupDateHeader() {
  const now = new Date();
  document.getElementById("page-date").textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";
  document.getElementById("page-greeting-text").textContent = `${greeting}, Trey`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function plan135StorageKey(date = todayKey()) {
  return `${PLAN_135_PREFIX}${date}`;
}

function emptyPlan135() {
  return { big: null, medium: [null, null, null], small: [null, null, null, null, null] };
}

function getMode135() {
  try {
    return localStorage.getItem(MODE_135_KEY) === "1";
  } catch {
    return false;
  }
}

function getSidebarTab() {
  try {
    return localStorage.getItem(SIDEBAR_TAB_KEY) || "brain";
  } catch {
    return "brain";
  }
}

function setSidebarTab(tab) {
  sidebarTab = tab;
  localStorage.setItem(SIDEBAR_TAB_KEY, tab);
  syncSidebarTabs();
}

function syncSidebarTabs() {
  const tab135 = document.getElementById("sidebar-tab-135");
  if (tab135) tab135.classList.toggle("hidden", !mode135);

  if (!mode135 && sidebarTab === "135") {
    sidebarTab = "brain";
  }

  document.querySelectorAll(".sidebar-tab").forEach((btn) => {
    const isActive = btn.dataset.tab === sidebarTab && !(btn.dataset.tab === "135" && !mode135);
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".sidebar-tab-panel").forEach((panel) => {
    const match = panel.dataset.tab === sidebarTab && !(panel.dataset.tab === "135" && !mode135);
    panel.classList.toggle("active", match);
    panel.classList.toggle("hidden", !match);
  });
}

function setupSidebarTabs() {
  document.querySelectorAll(".sidebar-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === "135" && !mode135) return;
      setSidebarTab(btn.dataset.tab);
    });
  });
  syncSidebarTabs();
}

function setMode135(enabled) {
  mode135 = enabled;
  localStorage.setItem(MODE_135_KEY, enabled ? "1" : "0");
  syncMode135Toggle();
  updateTasksLayout();
  updateBoardHint();
  if (enabled && page === "tasks") {
    setSidebarTab("135");
  } else if (!enabled && sidebarTab === "135") {
    setSidebarTab("brain");
  } else {
    syncSidebarTabs();
  }
  if (page === "home") renderHome();
}

function loadPlan135(date = todayKey()) {
  try {
    const saved = localStorage.getItem(plan135StorageKey(date));
    if (saved) {
      const parsed = JSON.parse(saved);
      return normalizePlan135(parsed);
    }
  } catch {
    /* ignore */
  }
  return emptyPlan135();
}

function normalizePlan135(plan) {
  const next = emptyPlan135();
  if (plan.big?.id && plan.big?.context) next.big = { id: plan.big.id, context: plan.big.context };
  ["medium", "small"].forEach((group) => {
    const slots = Array.isArray(plan[group]) ? plan[group] : [];
    next[group] = next[group].map((_, i) => {
      const slot = slots[i];
      return slot?.id && slot?.context ? { id: slot.id, context: slot.context } : null;
    });
  });
  return next;
}

function savePlan135(plan, date = todayKey(), options = {}) {
  localStorage.setItem(plan135StorageKey(date), JSON.stringify(plan));
  if (!options.skipSync) scheduleSyncPush();
}

function forgetItStorageKey(date = todayKey()) {
  return `${FORGET_IT_PREFIX}${date}`;
}

function loadForgetIt(date = todayKey()) {
  try {
    const saved = localStorage.getItem(forgetItStorageKey(date));
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed?.id && parsed?.context) return { id: parsed.id, context: parsed.context };
  } catch {
    /* ignore */
  }
  return null;
}

function saveForgetIt(ref, date = todayKey(), options = {}) {
  if (ref) {
    localStorage.setItem(forgetItStorageKey(date), JSON.stringify(ref));
  } else {
    localStorage.removeItem(forgetItStorageKey(date));
  }
  if (!options.skipSync) scheduleSyncPush();
}

function setForgetIt(ref) {
  saveForgetIt(ref);
  if (ref) removeTaskRefFromPlan135(ref);
}

function clearForgetIt() {
  saveForgetIt(null);
}

function removeTaskRefFromPlan135(ref) {
  if (!ref) return;
  const plan = loadPlan135();
  let changed = false;

  if (plan.big?.id === ref.id && plan.big?.context === ref.context) {
    plan.big = null;
    changed = true;
  }

  ["medium", "small"].forEach((group) => {
    plan[group].forEach((slot, i) => {
      if (slot?.id === ref.id && slot?.context === ref.context) {
        plan[group][i] = null;
        changed = true;
      }
    });
  });

  if (changed) savePlan135(plan);
}

function getForgetItPickerTasks() {
  const current = loadForgetIt();
  return getVisibleTasks().filter((t) => {
    if (t.done) return false;
    if (current && t.id === current.id && t.context === current.context) return false;
    return true;
  });
}

function tossForgetItTask() {
  const ref = loadForgetIt();
  if (!ref) return;
  archiveTask(ref.id, ref.context);
  clearForgetIt();
}

function getPlan135Ref(group, index = 0) {
  const plan = loadPlan135();
  if (group === "big") return plan.big;
  return plan.medium[index] ?? plan.small[index] ?? null;
}

function setPlan135Ref(group, index, ref) {
  const plan = loadPlan135();
  if (group === "big") {
    plan.big = ref;
  } else {
    plan[group][index] = ref;
  }
  savePlan135(plan);
}

function findTaskByRef(ref) {
  if (!ref) return null;
  const task = loadTasks(ref.context).find((t) => t.id === ref.id);
  if (!task || task.archived) return null;
  return { ...task, context: ref.context };
}

function isTaskForgetIt(task) {
  const forgetRef = loadForgetIt();
  return forgetRef?.id === task.id && forgetRef.context === task.context;
}

function getPickerTasks() {
  const plan = loadPlan135();
  const assigned = new Set();
  if (plan.big) assigned.add(`${plan.big.context}:${plan.big.id}`);
  plan.medium.forEach((ref) => {
    if (ref) assigned.add(`${ref.context}:${ref.id}`);
  });
  plan.small.forEach((ref) => {
    if (ref) assigned.add(`${ref.context}:${ref.id}`);
  });
  const forgetRef = loadForgetIt();
  if (forgetRef) assigned.add(`${forgetRef.context}:${forgetRef.id}`);

  const tasks = getVisibleTasks().filter((t) => !t.done);
  const incomplete = tasks.filter((t) => !assigned.has(`${t.context}:${t.id}`));
  const doneVisible = getVisibleTasks().filter(
    (t) => t.done && !assigned.has(`${t.context}:${t.id}`)
  );
  return [...incomplete, ...doneVisible];
}

function updateTasksLayout() {
  syncSidebarTabs();
}

function syncMode135Toggle() {
  const btn = document.getElementById("mode-135-toggle");
  if (!btn) return;
  const show = page === "tasks";
  btn.classList.toggle("hidden", !show);
  btn.classList.toggle("active", mode135);
  btn.setAttribute("aria-pressed", String(mode135));
}

function updatePageTitle() {
  const titles = {
    home: { all: "My Day", work: "My Day", home: "My Day" },
    tasks: { all: "All Tasks", work: "Work Tasks", home: "Home Tasks" },
  };
  document.getElementById("page-title").textContent = titles[page][filter];
  document.getElementById("page-title").classList.toggle("hidden", page === "home");
  document.getElementById("page-header-actions").classList.toggle("hidden", page !== "home");

  const isHome = page === "home";
  const isTasks = page === "tasks";
  document.getElementById("page-greeting").classList.toggle("hidden", !isHome);
  document.getElementById("filter-pills").classList.toggle("hidden", !isTasks);
  document.getElementById("add-task-btn").classList.toggle("hidden", !isTasks);
  syncMode135Toggle();
  updateTasksLayout();
}

function syncNavActive() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    let active = false;
    if (page === "home") {
      active = btn.dataset.page === "home";
    } else if (page === "tasks") {
      if (btn.dataset.focusBrain === "true") {
        active = false;
      } else {
        active = btn.dataset.page === "tasks" && btn.dataset.filter === filter;
      }
    }
    btn.classList.toggle("active", active);
  });

  document.querySelectorAll(".mobile-nav-item").forEach((btn) => {
    let active = false;
    if (page === "home") {
      active = btn.dataset.page === "home";
    } else if (page === "tasks" && btn.dataset.page === "tasks") {
      active = !btn.dataset.focusBrain && btn.dataset.filter === filter;
    }
    btn.classList.toggle("active", active);
  });

  document.querySelectorAll(".filter-pill").forEach((pill) => {
    const isActive = pill.dataset.filter === filter;
    pill.classList.toggle("active", isActive);
    pill.setAttribute("aria-selected", isActive);
  });
}

function focusBrainPanel() {
  if (page === "tasks") setSidebarTab("brain");
  const panel = document.getElementById("brain-panel");
  if (!panel) return;
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  panel.classList.add("brain-panel-highlight");
  setTimeout(() => panel.classList.remove("brain-panel-highlight"), 1200);
  const input = document.getElementById("brain-panel-input");
  if (input) input.focus();
}

function setPage(nextPage, nextFilter = filter, options = {}) {
  page = nextPage;
  filter = nextFilter;
  localStorage.setItem(PAGE_KEY, page);
  localStorage.setItem(FILTER_KEY, filter);

  document.getElementById("home-page").classList.toggle("hidden", page !== "home");
  document.getElementById("tasks-page").classList.toggle("hidden", page !== "tasks");

  syncNavActive();
  updatePageTitle();
  renderAll();

  if (options.focusBrain) {
    requestAnimationFrame(() => focusBrainPanel());
  }
}

function setFilter(nextFilter) {
  filter = nextFilter;
  localStorage.setItem(FILTER_KEY, filter);
  syncNavActive();
  updatePageTitle();
  renderAll();
}

function setupNavigation() {
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextPage = btn.dataset.page;
      const nextFilter = btn.dataset.filter || filter;
      const focusBrain = btn.dataset.focusBrain === "true";
      setPage(nextPage, nextFilter, { focusBrain });
    });
  });

  document.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => setFilter(pill.dataset.filter));
  });

  document.getElementById("home-view-tasks").addEventListener("click", () => {
    setPage("tasks", filter);
  });

  document.getElementById("focus-reflection-btn").addEventListener("click", () => {
    setPage("tasks", filter);
  });
}

function setTheme(themeId) {
  document.documentElement.dataset.theme = themeId;
  localStorage.setItem(THEME_KEY, themeId);
  document.querySelectorAll(".theme-option").forEach((btn) => {
    const isActive = btn.dataset.theme === themeId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-checked", isActive);
  });
}

function setFont(fontId) {
  document.documentElement.dataset.font = fontId;
  localStorage.setItem(FONT_KEY, fontId);
  document.querySelectorAll(".font-option").forEach((btn) => {
    const isActive = btn.dataset.font === fontId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-checked", isActive);
  });
}

function setupThemePicker() {
  const picker = document.getElementById("theme-picker");
  const current = getTheme();
  document.documentElement.dataset.theme = current;

  picker.innerHTML = THEMES.map(
    (theme) => `
    <button type="button" class="theme-option${theme.id === current ? " active" : ""}"
      data-theme="${theme.id}" role="radio" aria-checked="${theme.id === current}"
      aria-label="${theme.name}">
      <span class="theme-name">${theme.name}</span>
      <span class="theme-swatches">
        ${theme.colors.map((c) => `<span class="theme-swatch" style="background:${c}"></span>`).join("")}
      </span>
    </button>`
  ).join("");

  picker.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", () => setTheme(btn.dataset.theme));
  });
}

function setupFontPicker() {
  const picker = document.getElementById("font-picker");
  const current = getFont();
  document.documentElement.dataset.font = current;

  picker.innerHTML = FONTS.map(
    (font) => `
    <button type="button" class="font-option${font.id === current ? " active" : ""}"
      data-font="${font.id}" role="radio" aria-checked="${font.id === current}"
      aria-label="${font.name}" style="font-family:'${font.body}',sans-serif">
      <span class="font-option-name" style="font-family:'${font.heading}',serif">${font.name}</span>
      <span class="font-option-sample" style="font-family:'${font.heading}',serif">Aa Bb Cc</span>
    </button>`
  ).join("");

  picker.querySelectorAll(".font-option").forEach((btn) => {
    btn.addEventListener("click", () => setFont(btn.dataset.font));
  });
}

function getTasksForTier(tier) {
  return getVisibleTasks().filter((t) => t.tier === tier);
}

function updateTaskInContext(ctx, updater) {
  const list = loadTasks(ctx);
  const next = updater(list);
  saveTasks(ctx, next);
}

function clearTaskRefs(id, ctx) {
  const ref = { id, context: ctx };
  removeTaskRefFromPlan135(ref);
  const forgetRef = loadForgetIt();
  if (forgetRef && forgetRef.id === id && forgetRef.context === ctx) {
    clearForgetIt();
  }
}

function archiveTask(id, ctx) {
  clearTaskRefs(id, ctx);
  const archivedAt = new Date().toISOString();
  updateTaskInContext(ctx, (list) =>
    list.map((t) => (t.id === id ? { ...t, archived: true, archivedAt } : t))
  );
  renderAll();
}

function restoreTask(id, ctx) {
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      const { archivedAt: _removed, ...rest } = t;
      return { ...rest, archived: false };
    })
  );
  renderAll();
}

function deleteTask(id, ctx) {
  clearTaskRefs(id, ctx);
  updateTaskInContext(ctx, (list) => list.filter((t) => t.id !== id));
  renderAll();
}

function isTaskInPlan135(id, ctx) {
  const plan = loadPlan135();
  if (plan.big?.id === id && plan.big?.context === ctx) return true;
  return [...plan.medium, ...plan.small].some((ref) => ref?.id === id && ref?.context === ctx);
}

function findTaskPlan135Location(ref) {
  const plan = loadPlan135();
  if (plan.big?.id === ref.id && plan.big?.context === ref.context) {
    return { group: "big", index: 0 };
  }
  for (const group of ["medium", "small"]) {
    const idx = plan[group].findIndex((slot) => slot?.id === ref.id && slot?.context === ref.context);
    if (idx !== -1) return { group, index: idx };
  }
  return null;
}

function assignTaskToPlan135Slot(group, index, ref) {
  const next = loadPlan135();
  const src = findTaskPlan135Location(ref);
  const occupied = group === "big" ? next.big : next[group][index];

  if (occupied?.id === ref.id && occupied?.context === ref.context) return;
  if (src && src.group === group && src.index === index) return;

  if (src) {
    if (src.group === "big") next.big = null;
    else next[src.group][src.index] = null;
  }

  if (occupied && src) {
    if (src.group === "big") next.big = occupied;
    else next[src.group][src.index] = occupied;
  }

  if (group === "big") next.big = ref;
  else next[group][index] = ref;

  savePlan135(next);

  const forgetRef = loadForgetIt();
  if (forgetRef?.id === ref.id && forgetRef?.context === ref.context) {
    clearForgetIt();
  }
}

function moveTask(taskId, taskContext, tier, beforeId = null) {
  let task = null;
  const list = loadTasks(taskContext).filter((t) => {
    if (t.id === taskId) {
      task = { ...t, tier };
      return false;
    }
    return true;
  });
  if (!task) return;

  if (beforeId) {
    const idx = list.findIndex((t) => t.id === beforeId);
    list.splice(idx, 0, task);
  } else {
    const lastIdx = list.map((t) => t.tier).lastIndexOf(tier);
    if (lastIdx === -1) {
      list.push(task);
    } else {
      list.splice(lastIdx + 1, 0, task);
    }
  }
  saveTasks(taskContext, list);
}

function taskCardHtml(task) {
  const tierLabel = TIER_NAMES[task.tier - 1];
  const inForgetIt = isTaskForgetIt(task);
  const contextBadge = filter === "all" ? contextIconHtml(task.context, "task-context-badge") : "";
  return `
    <li class="task-card${task.done ? " done" : ""}" draggable="${isTouchDevice() ? "false" : "true"}"
      data-id="${task.id}" data-context="${task.context}">
      <div class="task-card-main">
        <label class="task-check">
          <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
        </label>
        <div class="task-card-body">
          <button type="button" class="task-text-btn">${escapeHtml(task.text)}</button>
        </div>
      </div>
      <div class="task-card-actions">
        ${inForgetIt ? `<span class="forget-it-indicator" title="In Forget It box today" aria-label="In Forget It box today"><svg class="icon icon-forget-box" aria-hidden="true"><use href="#icon-forget-box"></use></svg></span>` : ""}
        <span class="task-dot task-dot-tier-${task.tier}" title="${tierLabel}" aria-label="${tierLabel}"></span>
        ${contextBadge}
        <button type="button" class="edit-btn" aria-label="Edit task">✎</button>
        <button type="button" class="archive-btn" aria-label="Archive task" title="Archive task">×</button>
      </div>
    </li>`;
}

function plan135SlotHtml(group, index, ref, task) {
  const slotKey = group === "big" ? "big" : `${group}-${index}`;
  const isBig = group === "big";
  const filled = Boolean(task);

  if (filled) {
    return `
      <li class="plan-135-slot plan-135-slot-filled plan-135-drop-zone${task.done ? " done" : ""}${isBig ? " plan-135-slot-big" : ""}"
        data-slot-group="${group}" data-slot-index="${index}">
        <label class="task-check plan-135-check">
          <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
        </label>
        <div class="plan-135-slot-body">
          <span class="plan-135-slot-text">${escapeHtml(task.text)}</span>
          <span class="plan-135-slot-meta">
            <span class="plan-135-tier-badge">${TIER_LABELS[task.tier - 1]} Priority</span>
            ${filter === "all" ? contextIconHtml(task.context, "plan-135-ctx") : ""}
          </span>
        </div>
        <div class="plan-135-slot-actions">
          <button type="button" class="plan-135-change-btn" data-slot="${slotKey}">Change</button>
          <button type="button" class="plan-135-remove-btn" data-slot="${slotKey}" aria-label="Remove from plan">×</button>
        </div>
      </li>`;
  }

  return `
    <li class="plan-135-slot plan-135-slot-empty plan-135-drop-zone${isBig ? " plan-135-slot-big" : ""}"
      data-slot-group="${group}" data-slot-index="${index}">
      <button type="button" class="plan-135-pick-btn" data-slot="${slotKey}">
        <span class="plan-135-pick-icon" aria-hidden="true">+</span>
        <span class="plan-135-pick-label">Pick a task</span>
      </button>
    </li>`;
}

function sanitizePlan135(plan) {
  const next = emptyPlan135();
  if (plan.big && findTaskByRef(plan.big)) next.big = plan.big;
  ["medium", "small"].forEach((group) => {
    plan[group].forEach((ref, i) => {
      if (ref && findTaskByRef(ref)) next[group][i] = ref;
    });
  });
  return next;
}

function renderPlan135() {
  let plan = loadPlan135();
  const cleaned = sanitizePlan135(plan);
  if (JSON.stringify(cleaned) !== JSON.stringify(plan)) {
    savePlan135(cleaned);
    plan = cleaned;
  }
  const sections = document.getElementById("plan-135-sections");
  const progress = document.getElementById("plan-135-progress");
  if (!sections) return;

  let filled = 0;
  const total = 9;
  if (plan.big) filled += 1;
  plan.medium.forEach((ref) => {
    if (ref) filled += 1;
  });
  plan.small.forEach((ref) => {
    if (ref) filled += 1;
  });

  if (progress) {
    progress.textContent = `${filled} of ${total} planned`;
  }

  sections.innerHTML = PLAN_135_SLOTS.map((section) => {
    const slots =
      section.group === "big"
        ? [plan.big]
        : plan[section.group];

    const slotHtml = slots
      .map((ref, i) => {
        const task = findTaskByRef(ref);
        return plan135SlotHtml(section.group, i, ref, task);
      })
      .join("");

    return `
      <section class="plan-135-section" data-group="${section.group}">
        <h4 class="plan-135-section-title">${section.label}</h4>
        <ul class="plan-135-slots">${slotHtml}</ul>
      </section>`;
  }).join("");

  bindPlan135Slots(sections);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function spawnCompletionRipple(anchorEl) {
  if (prefersReducedMotion() || !anchorEl) return;

  const check = anchorEl.querySelector(".task-check") || anchorEl.closest(".task-check") || anchorEl;
  const host = check.closest(".task-card, .priority-preview-item, .plan-135-slot") || anchorEl;
  if (host && getComputedStyle(host).position === "static") {
    host.style.position = "relative";
  }

  const rect = (check.getBoundingClientRect?.() || host.getBoundingClientRect());
  const layer = document.createElement("span");
  layer.className = "completion-ripple-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <span class="completion-ripple completion-ripple-1"></span>
    <span class="completion-ripple completion-ripple-2"></span>
    <span class="completion-ripple completion-ripple-3"></span>`;

  const offsetParent = host.offsetParent || host;
  const hostRect = host.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - hostRect.left;
  const cy = rect.top + rect.height / 2 - hostRect.top;
  layer.style.left = `${cx}px`;
  layer.style.top = `${cy}px`;

  host.appendChild(layer);
  layer.addEventListener("animationend", () => layer.remove(), { once: true });
  setTimeout(() => layer.remove(), 1200);
}

function toggleTaskDone(id, ctx, markingDone, anchorEl) {
  const task = loadTasks(ctx).find((t) => t.id === id);
  const wasDone = task?.done ?? false;
  if (markingDone && !wasDone) spawnCompletionRipple(anchorEl);
  updateTaskInContext(ctx, (list) =>
    list.map((t) => (t.id === id ? { ...t, done: markingDone } : t))
  );
  renderAll();
}

function bindPlan135Slots(container) {
  container.querySelectorAll(".plan-135-pick-btn, .plan-135-change-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [group, indexStr] = btn.dataset.slot.split("-");
      const index = indexStr !== undefined ? Number(indexStr) : 0;
      openPlan135Picker(group, index);
    });
  });

  container.querySelectorAll(".plan-135-remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [group, indexStr] = btn.dataset.slot.split("-");
      const index = indexStr !== undefined ? Number(indexStr) : 0;
      setPlan135Ref(group, index, null);
      renderAll();
    });
  });

  container.querySelectorAll(".plan-135-slot-filled input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", (e) => {
      const slot = input.closest(".plan-135-slot");
      const group = slot.dataset.slotGroup;
      const ref = getPlan135Ref(group, Number(slot.dataset.slotIndex));
      const task = findTaskByRef(ref);
      if (!task) return;
      toggleTaskDone(task.id, task.context, e.target.checked, slot);
    });
  });

  setupPlan135DropZones(container);
}

function openPlan135Picker(group, index) {
  plan135Picker = { group, index };
  const dialog = document.getElementById("plan-135-picker-dialog");
  const slotLabel =
    group === "big" ? "big task" : group === "medium" ? `medium task ${index + 1}` : `small task ${index + 1}`;

  document.getElementById("plan-135-picker-title").textContent = `Pick ${slotLabel}`;
  document.getElementById("plan-135-picker-sub").textContent =
    "Choose from your open priority tasks (any tier).";

  const tasks = getPickerTasks();
  const list = document.getElementById("plan-135-picker-list");

  if (tasks.length === 0) {
    list.innerHTML = `<li class="plan-135-picker-empty">No open tasks match this filter. Add tasks in the priority grid first.</li>`;
  } else {
    list.innerHTML = tasks
      .map(
        (task) => `
      <li>
        <button type="button" class="plan-135-picker-item" data-id="${task.id}" data-context="${task.context}">
          <span class="plan-135-picker-item-text">${escapeHtml(task.text)}</span>
          <span class="plan-135-picker-item-meta">
            <span class="plan-135-tier-badge">${TIER_LABELS[task.tier - 1]}</span>
            ${filter === "all" ? contextIconHtml(task.context, "plan-135-ctx") : ""}
          </span>
        </button>
      </li>`
      )
      .join("");

    list.querySelectorAll(".plan-135-picker-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!plan135Picker) return;
        setPlan135Ref(plan135Picker.group, plan135Picker.index, {
          id: btn.dataset.id,
          context: btn.dataset.context,
        });
        dialog.close();
        plan135Picker = null;
        renderAll();
      });
    });
  }

  dialog.showModal();
}

function forgetItTaskHtml(task, { compact = false } = {}) {
  return `
    <div class="forget-it-task${compact ? " forget-it-task-compact" : ""}">
      <p class="forget-it-task-text">${escapeHtml(task.text)}</p>
      <p class="forget-it-task-meta">
        <span>${TIER_LABELS[task.tier - 1]} Priority</span>
        ${filter === "all" || compact ? contextIconHtml(task.context, "plan-135-ctx") : ""}
      </p>
      <div class="forget-it-actions">
        <button type="button" class="forget-it-change-btn">Change</button>
        <button type="button" class="forget-it-toss-btn">Toss it away</button>
      </div>
    </div>`;
}

function forgetItEmptyHtml() {
  return `
    <div class="forget-it-empty forget-it-drop-zone">
      <p>Pick one task you're ready to let go of today.</p>
      <p class="forget-it-drop-hint">Or drag a task here from the grid.</p>
      <button type="button" class="forget-it-pick-btn">+ Choose task</button>
    </div>`;
}

function bindForgetItActions(container) {
  container.querySelector(".forget-it-pick-btn")?.addEventListener("click", openForgetItPicker);
  container.querySelector(".forget-it-change-btn")?.addEventListener("click", openForgetItPicker);
  container.querySelector(".forget-it-toss-btn")?.addEventListener("click", tossForgetItTask);
}

function renderForgetItPanel() {
  const body = document.getElementById("forget-it-body");
  if (!body) return;

  const ref = loadForgetIt();
  const task = findTaskByRef(ref);

  if (!task) {
    if (ref) clearForgetIt();
    body.innerHTML = forgetItEmptyHtml();
    bindForgetItActions(body);
    setupForgetItDropZone(body);
    return;
  }

  body.innerHTML = forgetItTaskHtml(task);
  bindForgetItActions(body);
  setupForgetItDropZone(body);
}

function setupForgetItDropZone(container) {
  const zone = container.classList.contains("forget-it-drop-zone")
    ? container
    : container.querySelector(".forget-it-drop-zone");
  if (!zone || zone.dataset.dropBound) return;
  zone.dataset.dropBound = "1";

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drop-target-active");
  });

  zone.addEventListener("dragleave", (e) => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove("drop-target-active");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drop-target-active");
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (!data?.id) return;
      const task = findTaskByRef(data);
      if (!task || task.done) return;
      setForgetIt(data);
      renderAll();
    } catch {
      /* ignore */
    }
  });
}

function setupPlan135DropZones(container) {
  container.querySelectorAll(".plan-135-drop-zone").forEach((slot) => {
    if (slot.dataset.dropBound) return;
    slot.dataset.dropBound = "1";

    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("drop-target-active");
    });

    slot.addEventListener("dragleave", (e) => {
      if (!slot.contains(e.relatedTarget)) slot.classList.remove("drop-target-active");
    });

    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      slot.classList.remove("drop-target-active");
      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (!data?.id) return;
        const task = findTaskByRef(data);
        if (!task || task.done) return;
        const group = slot.dataset.slotGroup;
        const index = Number(slot.dataset.slotIndex);
        assignTaskToPlan135Slot(group, index, data);
        renderAll();
      } catch {
        /* ignore */
      }
    });
  });
}

function renderForgetItHome() {
  const section = document.getElementById("forget-it-home");
  const body = document.getElementById("forget-it-home-body");
  if (!section || !body) return;

  const ref = loadForgetIt();
  const task = findTaskByRef(ref);

  if (!task) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");
  body.innerHTML = forgetItTaskHtml(task, { compact: true });
  bindForgetItActions(body);
}

function openForgetItPicker() {
  const dialog = document.getElementById("forget-it-picker-dialog");
  const list = document.getElementById("forget-it-picker-list");
  const tasks = getForgetItPickerTasks();

  if (tasks.length === 0) {
    list.innerHTML = `<li class="plan-135-picker-empty">No open tasks to choose from.</li>`;
  } else {
    list.innerHTML = tasks
      .map(
        (task) => `
      <li>
        <button type="button" class="plan-135-picker-item" data-id="${task.id}" data-context="${task.context}">
          <span class="plan-135-picker-item-text">${escapeHtml(task.text)}</span>
          <span class="plan-135-picker-item-meta">
            <span class="plan-135-tier-badge">${TIER_LABELS[task.tier - 1]}</span>
            ${filter === "all" ? contextIconHtml(task.context, "plan-135-ctx") : ""}
          </span>
        </button>
      </li>`
      )
      .join("");

    list.querySelectorAll(".plan-135-picker-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        setForgetIt({ id: btn.dataset.id, context: btn.dataset.context });
        dialog.close();
        renderAll();
      });
    });
  }

  dialog.showModal();
}

function setupForgetIt() {
  document.getElementById("forget-it-picker-close")?.addEventListener("click", () => {
    document.getElementById("forget-it-picker-dialog").close();
  });
  document.getElementById("forget-it-picker-dialog")?.addEventListener("close", () => {});
}

function setupMode135() {
  document.getElementById("mode-135-toggle").addEventListener("click", () => {
    setMode135(!mode135);
    renderAll();
  });

  const pickerDialog = document.getElementById("plan-135-picker-dialog");
  document.getElementById("plan-135-picker-close").addEventListener("click", () => {
    plan135Picker = null;
    pickerDialog.close();
  });
  pickerDialog.addEventListener("close", () => {
    plan135Picker = null;
  });
}

function renderGrid() {
  for (let tier = 1; tier <= 4; tier++) {
    const list = document.querySelector(`.task-list[data-tier="${tier}"]`);
    const tierTasks = getTasksForTier(tier);
    const countEl = document.querySelector(`[data-tier-count="${tier}"]`);
    const seeAllBtn = document.querySelector(`.column-see-all[data-tier="${tier}"]`);

    countEl.textContent = `${tierTasks.length} task${tierTasks.length === 1 ? "" : "s"}`;

    const previewTasks = tierTasks.slice(0, PREVIEW_TASK_LIMIT);
    list.innerHTML = previewTasks.map((task) => taskCardHtml(task)).join("");
    list.querySelectorAll(".task-card").forEach(bindTaskEvents);

    list.classList.toggle("task-list-preview", tierTasks.length > PREVIEW_TASK_LIMIT);
    if (seeAllBtn) {
      const hasMore = tierTasks.length > PREVIEW_TASK_LIMIT;
      seeAllBtn.classList.toggle("hidden", !hasMore);
      seeAllBtn.textContent = hasMore ? `See all ${tierTasks.length} tasks →` : "See all tasks →";
    }
    const addBtn = document.querySelector(`.column-add[data-tier="${tier}"]`);
    if (addBtn) addBtn.classList.toggle("hidden", tierTasks.length > PREVIEW_TASK_LIMIT);
  }
}

function getTopPriorityTasks(limit = 5) {
  const tasks = getVisibleTasks()
    .filter((t) => !t.done && t.tier === 1)
    .slice(0, limit);
  if (tasks.length >= limit) return tasks;
  const extras = getVisibleTasks()
    .filter((t) => !t.done && t.tier === 2)
    .slice(0, limit - tasks.length);
  return [...tasks, ...extras];
}

function homeTaskRowHtml(task) {
  return `
    <li class="priority-preview-item${task.done ? " done" : ""}" data-id="${task.id}" data-context="${task.context}">
      <label class="task-check">
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
      </label>
      <button type="button" class="priority-preview-text">${escapeHtml(task.text)}</button>
      <span class="context-pill context-pill-${task.context}">
        ${contextIconHtml(task.context, "context-pill-icon")}
      </span>
      <button type="button" class="archive-btn priority-archive-btn" aria-label="Archive task">×</button>
      <svg class="icon icon-star" aria-hidden="true"><use href="#icon-star"></use></svg>
    </li>`;
}

const HOME_135_SIZE_LABELS = { big: "Big", medium: "Medium", small: "Small" };

function home135TaskRowHtml(task, group) {
  const sizeLabel = HOME_135_SIZE_LABELS[group];
  const isBig = group === "big";
  return `
    <li class="priority-preview-item${task.done ? " done" : ""}${isBig ? " priority-preview-item-big" : ""}"
      data-id="${task.id}" data-context="${task.context}" data-plan-group="${group}">
      <label class="task-check">
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
      </label>
      <button type="button" class="priority-preview-text">${escapeHtml(task.text)}</button>
      <span class="plan-135-tier-badge">${TIER_NAMES[task.tier - 1]}</span>
      <span class="context-pill context-pill-${task.context}">
        ${contextIconHtml(task.context, "context-pill-icon")}
      </span>
      <span class="plan-135-size-badge plan-135-size-badge-${group}">${sizeLabel}</span>
      <button type="button" class="archive-btn priority-archive-btn" aria-label="Archive task">×</button>
    </li>`;
}

function home135EmptyRowHtml(slotLabel) {
  return `
    <li class="priority-preview-item priority-preview-item-empty">
      <span class="home-plan-135-empty">Add ${slotLabel} on All Tasks</span>
    </li>`;
}

function countPlan135Filled(plan) {
  let filled = 0;
  if (plan.big) filled += 1;
  plan.medium.forEach((ref) => {
    if (ref) filled += 1;
  });
  plan.small.forEach((ref) => {
    if (ref) filled += 1;
  });
  return filled;
}

function renderHomePlan135() {
  const title = document.getElementById("home-priority-title");
  const progress = document.getElementById("home-priority-progress");
  const content = document.getElementById("home-priority-content");
  const empty = document.getElementById("home-priority-empty");
  if (!content) return;

  const plan = sanitizePlan135(loadPlan135());
  const filled = countPlan135Filled(plan);
  const total = 9;

  if (title) title.textContent = "Today's 1-3-5";
  if (progress) {
    progress.textContent = `${filled} of ${total} planned`;
    progress.classList.toggle("hidden", filled === 0);
  }

  if (filled === 0) {
    content.innerHTML = "";
    empty.textContent = "No tasks planned yet. Turn on 1-3-5 on All Tasks to plan your day.";
    empty.classList.remove("hidden");
    renderForgetItHome();
    return;
  }

  empty.classList.add("hidden");

  const sectionsHtml = PLAN_135_SLOTS.map((section) => {
    const slots = section.group === "big" ? [plan.big] : plan[section.group];
    const rows = slots
      .map((ref, i) => {
        const task = findTaskByRef(ref);
        if (task) return home135TaskRowHtml(task, section.group);
        const slotName =
          section.group === "big"
            ? "a big task"
            : section.group === "medium"
              ? `medium task ${i + 1}`
              : `small task ${i + 1}`;
        return home135EmptyRowHtml(slotName);
      })
      .join("");

    return `
      <section class="home-plan-135-group">
        <h4 class="home-plan-135-label">${section.label}</h4>
        <ul class="priority-preview-list">${rows}</ul>
      </section>`;
  }).join("");

  content.innerHTML = `<div class="home-plan-135">${sectionsHtml}</div>`;
  content.querySelectorAll(".priority-preview-item:not(.priority-preview-item-empty)").forEach(bindHomeTaskEvents);
  renderForgetItHome();
}

function bindHomeTaskEvents(row) {
  const id = row.dataset.id;
  const ctx = row.dataset.context;
  row.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
    toggleTaskDone(id, ctx, e.target.checked, row);
  });

  row.querySelector(".priority-preview-text").addEventListener("click", () => {
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openEditTaskDialog(task, ctx);
  });

  row.querySelector(".priority-archive-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    archiveTask(id, ctx);
  });
}

function renderHome() {
  const title = document.getElementById("home-priority-title");
  const progress = document.getElementById("home-priority-progress");
  const content = document.getElementById("home-priority-content");
  const empty = document.getElementById("home-priority-empty");
  if (!content || !empty) return;

  if (mode135) {
    renderHomePlan135();
    return;
  }

  if (title) title.textContent = "Top Priorities";
  if (progress) progress.classList.add("hidden");
  empty.textContent = "No open priorities yet — add a task to get started.";

  const tasks = getTopPriorityTasks(5);

  if (tasks.length === 0) {
    content.innerHTML = "";
    empty.classList.remove("hidden");
    renderForgetItHome();
    return;
  }

  empty.classList.add("hidden");
  content.innerHTML = `<ul class="priority-preview-list">${tasks.map((task) => homeTaskRowHtml(task)).join("")}</ul>`;
  content.querySelectorAll(".priority-preview-item").forEach(bindHomeTaskEvents);
  renderForgetItHome();
}

function openTierExpand(tier) {
  expandedTier = tier;
  const dialog = document.getElementById("tier-expand-dialog");
  refreshTierExpand(tier);
  dialog.showModal();
}

function refreshTierExpand(tier) {
  const tasks = getTasksForTier(tier);
  document.getElementById("tier-expand-title").textContent = TIER_NAMES[tier - 1];
  document.getElementById("tier-expand-count").textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;

  const list = document.getElementById("tier-expand-list");
  if (tasks.length === 0) {
    list.innerHTML = `<li class="tier-expand-empty">No tasks in this priority yet.</li>`;
  } else {
    list.innerHTML = tasks.map((task) => taskCardHtml(task)).join("");
    list.querySelectorAll(".task-card").forEach(bindTaskEvents);
  }
}

function dialogCloseTierExpand() {
  expandedTier = null;
  document.getElementById("tier-expand-dialog").close();
}

function isTierExpandCard(card) {
  return Boolean(card.closest("#tier-expand-list"));
}

function getCardTier(card) {
  if (isTierExpandCard(card)) return expandedTier;
  const column = card.closest(".column");
  return column ? Number(column.dataset.tier) : null;
}

function setupTierExpand() {
  const dialog = document.getElementById("tier-expand-dialog");
  const list = document.getElementById("tier-expand-list");

  list.addEventListener("dragover", (e) => {
    if (!draggedTask) return;
    e.preventDefault();
  });

  list.addEventListener("drop", (e) => {
    if (e.target.closest(".task-card")) return;
    e.preventDefault();
    if (!expandedTier) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data?.id) {
        moveTask(data.id, data.context, expandedTier);
        renderAll();
      }
    } catch {
      /* ignore */
    }
  });

  document.getElementById("tier-expand-close").addEventListener("click", dialogCloseTierExpand);
  document.getElementById("tier-expand-add").addEventListener("click", () => {
    const tier = expandedTier;
    dialogCloseTierExpand();
    if (tier) openTaskDialog(tier);
  });
  dialog.addEventListener("close", () => {
    expandedTier = null;
  });

  document.querySelectorAll(".column-menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTierExpand(Number(btn.dataset.tier));
    });
  });

  document.querySelectorAll(".column-header").forEach((header) => {
    const tier = Number(header.closest(".column").dataset.tier);
    let holdTimer = null;

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const startHold = (e) => {
      if (e.target.closest(".column-menu-btn")) return;
      if (e.type === "mousedown" && e.button !== 0) return;
      clearHold();
      header.classList.add("holding");
      holdTimer = setTimeout(() => {
        header.classList.remove("holding");
        openTierExpand(tier);
      }, 450);
    };

    const endHold = () => {
      clearHold();
      header.classList.remove("holding");
    };

    if (isTouchDevice()) {
      header.addEventListener("touchstart", startHold, { passive: true });
      header.addEventListener("touchend", endHold);
      header.addEventListener("touchcancel", endHold);
      header.addEventListener("contextmenu", (e) => e.preventDefault());
    } else {
      header.addEventListener("click", (e) => {
        if (e.target.closest(".column-menu-btn")) return;
        openTierExpand(tier);
      });
    }
  });
}

function bindTaskEvents(card) {
  const id = card.dataset.id;
  const ctx = card.dataset.context;

  if (!isTouchDevice()) {
    card.addEventListener("dragstart", (e) => {
      draggedTask = { id, context: ctx };
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify(draggedTask));
    });

    card.addEventListener("dragover", (e) => {
      if (!draggedTask || draggedTask.id === id) return;
      e.preventDefault();
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const data = JSON.parse(e.dataTransfer.getData("text/plain") || "null");
      if (!data || data.id === id) return;
      const tier = getCardTier(card);
      if (!tier) return;
      moveTask(data.id, data.context, tier, id);
      renderAll();
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      draggedTask = null;
      document.querySelectorAll(".column.drag-over").forEach((c) => c.classList.remove("drag-over"));
      document.querySelectorAll(".drop-target-active").forEach((z) => z.classList.remove("drop-target-active"));
    });
  }

  card.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
    toggleTaskDone(id, ctx, e.target.checked, card);
  });

  card.querySelector(".archive-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    archiveTask(id, ctx);
  });

  const openEdit = () => {
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openEditTaskDialog(task, ctx);
  };

  card.querySelector(".edit-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    openEdit();
  });

  card.querySelector(".task-text-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    openEdit();
  });

  if (isTouchDevice()) {
    bindTouchDrag(card);
  }
}

function bindTouchDrag(card) {
  const id = card.dataset.id;
  const ctx = card.dataset.context;
  let dragging = false;
  let holdTimer = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let suppressClick = false;

  const clearHold = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  const columnAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el?.closest(".column") || null;
  };

  const taskCardAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const target = el?.closest(".task-card");
    if (!target || target === card) return null;
    return target;
  };

  const isDraggableTouchTarget = (target) => {
    if (!target) return false;
    if (target.closest(".task-card-actions, .task-check, input, .archive-btn, .edit-btn")) {
      return false;
    }
    return Boolean(target.closest(".task-card-main, .task-card-body, .task-text-btn"));
  };

  card.addEventListener(
    "touchstart",
    (e) => {
      if (!isDraggableTouchTarget(e.target)) return;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      lastX = startX;
      lastY = startY;
      suppressClick = false;
      clearHold();
      holdTimer = setTimeout(() => {
        dragging = true;
        suppressClick = true;
        card.classList.add("dragging");
        if (navigator.vibrate) navigator.vibrate(12);
      }, 320);
    },
    { passive: true }
  );

  card.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);

      if (!dragging && (dx > 10 || dy > 10)) clearHold();

      if (!dragging) return;

      e.preventDefault();
      lastX = touch.clientX;
      lastY = touch.clientY;
      document.querySelectorAll(".column").forEach((c) => c.classList.remove("drag-over"));
      const col = columnAt(touch.clientX, touch.clientY);
      if (col) col.classList.add("drag-over");
    },
    { passive: false }
  );

  card.addEventListener(
    "touchend",
    (e) => {
      clearHold();
      if (!dragging) return;

      dragging = false;
      card.classList.remove("dragging");
      document.querySelectorAll(".column").forEach((c) => c.classList.remove("drag-over"));

      const touch = e.changedTouches[0];
      const x = lastX || touch.clientX;
      const y = lastY || touch.clientY;

      if (isTierExpandCard(card)) {
        const target = taskCardAt(x, y);
        if (target && isTierExpandCard(target) && expandedTier) {
          moveTask(id, ctx, expandedTier, target.dataset.id);
          renderAll();
        } else if (expandedTier) {
          const dropEl = document.elementFromPoint(x, y);
          if (dropEl?.closest("#tier-expand-list")) {
            moveTask(id, ctx, expandedTier);
            renderAll();
          }
        }
        return;
      }

      const target = taskCardAt(x, y);
      if (target && !isTierExpandCard(target)) {
        const tier = getCardTier(target);
        if (tier) {
          moveTask(id, ctx, tier, target.dataset.id);
          renderAll();
          return;
        }
      }

      const col = columnAt(x, y);
      if (col) {
        const tier = Number(col.dataset.tier);
        moveTask(id, ctx, tier);
        renderAll();
      }
    },
    { passive: true }
  );

  card.addEventListener("touchcancel", () => {
    clearHold();
    dragging = false;
    card.classList.remove("dragging");
    document.querySelectorAll(".column").forEach((c) => c.classList.remove("drag-over"));
  });

  card.querySelector(".task-text-btn")?.addEventListener("click", (e) => {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    }
  });
}

function setupDropZones() {
  document.querySelectorAll(".column").forEach((column) => {
    const tier = Number(column.dataset.tier);

    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", (e) => {
      if (!column.contains(e.relatedTarget)) column.classList.remove("drag-over");
    });

    column.addEventListener("drop", (e) => {
      if (e.target.closest(".task-card")) return;
      e.preventDefault();
      column.classList.remove("drag-over");
      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data?.id) {
          moveTask(data.id, data.context, tier);
          renderAll();
        }
      } catch {
        /* ignore */
      }
    });
  });
}

function openTaskDialog(tier = 1) {
  const dialog = document.getElementById("task-dialog");
  const defaultCtx = filter === "all" ? "work" : filter;

  document.getElementById("dialog-title").textContent = "Add Task";
  document.getElementById("dialog-input").value = "";
  document.getElementById("dialog-tier-select").value = String(tier);
  document.getElementById("dialog-context").value = defaultCtx;
  document.getElementById("dialog-edit-id").value = "";
  document.getElementById("dialog-original-context").value = "";

  dialog.showModal();
  document.getElementById("dialog-input").focus();
}

function openEditTaskDialog(task, ctx) {
  const dialog = document.getElementById("task-dialog");

  document.getElementById("dialog-title").textContent = "Edit Task";
  document.getElementById("dialog-input").value = task.text;
  document.getElementById("dialog-tier-select").value = String(task.tier);
  document.getElementById("dialog-context").value = ctx;
  document.getElementById("dialog-edit-id").value = task.id;
  document.getElementById("dialog-original-context").value = ctx;

  dialog.showModal();
  document.getElementById("dialog-input").focus();
}

function saveTaskFromDialog() {
  const text = document.getElementById("dialog-input").value.trim();
  if (!text) return;

  const tier = Number(document.getElementById("dialog-tier-select").value);
  const newCtx = document.getElementById("dialog-context").value;
  const editId = document.getElementById("dialog-edit-id").value;
  const oldCtx = document.getElementById("dialog-original-context").value;

  if (editId) {
    const oldList = loadTasks(oldCtx);
    const task = oldList.find((t) => t.id === editId);
    if (!task) return;

    const updated = { ...task, text, tier };

    if (oldCtx === newCtx) {
      saveTasks(
        oldCtx,
        oldList.map((t) => (t.id === editId ? updated : t))
      );
    } else {
      saveTasks(
        oldCtx,
        oldList.filter((t) => t.id !== editId)
      );
      saveTasks(newCtx, [...loadTasks(newCtx), updated]);
    }
  } else {
    saveTasks(newCtx, [...loadTasks(newCtx), { id: createId(), text, tier, done: false }]);
  }
}

function setupTaskDialog() {
  const dialog = document.getElementById("task-dialog");

  document.getElementById("add-task-btn").addEventListener("click", () => openTaskDialog(1));

  document.querySelectorAll(".column-add").forEach((btn) => {
    btn.addEventListener("click", () => openTaskDialog(Number(btn.dataset.tier)));
  });

  document.querySelectorAll(".column-see-all").forEach((btn) => {
    btn.addEventListener("click", () => openTierExpand(Number(btn.dataset.tier)));
  });

  document.getElementById("dialog-cancel").addEventListener("click", () => dialog.close());

  document.getElementById("task-dialog-form").addEventListener("submit", (e) => {
    e.preventDefault();
    saveTaskFromDialog();
    dialog.close();
    renderAll();
  });
}

function renderBrainPanel() {
  const list = document.getElementById("brain-panel-list");
  const empty = document.getElementById("brain-panel-empty");
  const items = getVisibleBrainDump();

  if (items.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = items
    .map(
      (item) => `
    <li class="brain-panel-item" data-id="${item.id}" data-context="${item.context}">
      <span class="brain-panel-check" aria-hidden="true"></span>
      <span class="brain-panel-text">${escapeHtml(item.text)}</span>
      <div class="brain-panel-actions">
        ${filter === "all" ? contextIconHtml(item.context, "brain-ctx-tag") : ""}
        ${[1, 2, 3, 4]
          .map((t) => `<button type="button" class="tier-send-btn" data-tier="${t}">${TIER_LABELS[t - 1]}</button>`)
          .join("")}
        <button type="button" class="brain-dump-delete" aria-label="Delete">×</button>
      </div>
    </li>`
    )
    .join("");

  bindBrainDumpItems(list, "brain-panel-item");
}

function bindBrainDumpItems(listEl, itemClass) {
  listEl.querySelectorAll(`.${itemClass}`).forEach((el) => {
    const id = el.dataset.id;
    const ctx = el.dataset.context;

    el.querySelectorAll(".tier-send-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const items = loadBrainDump(ctx);
        const item = items.find((i) => i.id === id);
        if (!item) return;

        const tier = Number(btn.dataset.tier);
        updateTaskInContext(ctx, (list) => [...list, { id: createId(), text: item.text, tier, done: false }]);
        saveBrainDump(
          ctx,
          items.filter((i) => i.id !== id)
        );
        renderAll();
      });
    });

    el.querySelector(".brain-dump-delete").addEventListener("click", () => {
      saveBrainDump(
        ctx,
        loadBrainDump(ctx).filter((i) => i.id !== id)
      );
      renderAll();
    });
  });
}

function archiveDayKey(iso) {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatArchiveDayHeading(dayKey) {
  if (dayKey === "unknown") return "Earlier";
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = archiveDayKey(new Date().toISOString());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = archiveDayKey(yesterdayDate.toISOString());
  if (dayKey === today) return "Today";
  if (dayKey === yesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function archivePanelItemHtml(task) {
  return `
    <li class="archive-panel-item" data-id="${task.id}" data-context="${task.context}">
      <div class="archive-panel-item-body">
        <span class="archive-panel-text">${escapeHtml(task.text)}</span>
        <span class="archive-panel-meta">
          <span class="task-dot task-dot-tier-${task.tier}" title="${TIER_NAMES[task.tier - 1]}" aria-label="${TIER_NAMES[task.tier - 1]}"></span>
          <span class="plan-135-tier-badge">${TIER_LABELS[task.tier - 1]}</span>
          ${filter === "all" ? contextIconHtml(task.context, "brain-ctx-tag") : ""}
        </span>
      </div>
      <div class="archive-panel-actions">
        <button type="button" class="archive-restore-btn">Restore</button>
        <button type="button" class="archive-delete-btn" aria-label="Delete permanently">Delete</button>
      </div>
    </li>`;
}

function renderArchivePanel() {
  const list = document.getElementById("archive-panel-list");
  const empty = document.getElementById("archive-panel-empty");
  const count = document.getElementById("archive-panel-count");
  if (!list || !empty) return;

  const tasks = getArchivedTasks().sort((a, b) => {
    const aTime = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
    const bTime = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
    return bTime - aTime;
  });

  if (count) {
    count.textContent = `${tasks.length} archived`;
    count.classList.toggle("hidden", tasks.length === 0);
  }

  if (tasks.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  const groups = new Map();
  tasks.forEach((task) => {
    const key = archiveDayKey(task.archivedAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  });

  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "unknown") return 1;
    if (b === "unknown") return -1;
    return b.localeCompare(a);
  });

  list.innerHTML = sortedKeys
    .map(
      (dayKey) => `
    <li class="archive-day-heading">${formatArchiveDayHeading(dayKey)}</li>
    ${groups.get(dayKey).map((task) => archivePanelItemHtml(task)).join("")}`
    )
    .join("");

  list.querySelectorAll(".archive-panel-item").forEach((el) => {
    const id = el.dataset.id;
    const ctx = el.dataset.context;
    el.querySelector(".archive-restore-btn").addEventListener("click", () => restoreTask(id, ctx));
    el.querySelector(".archive-delete-btn").addEventListener("click", () => {
      if (confirm("Permanently delete this task? This cannot be undone.")) {
        deleteTask(id, ctx);
      }
    });
  });
}

function addBrainDumpNote(text, ctx) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const targetCtx = ctx || (filter === "all" ? "work" : filter);
  saveBrainDump(targetCtx, [...loadBrainDump(targetCtx), { id: createId(), text: trimmed }]);
}

function setupBrainDumpForms() {
  document.getElementById("brain-panel-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("brain-panel-input");
    addBrainDumpNote(input.value);
    input.value = "";
    input.focus();
    renderAll();
  });
}

function renderAll() {
  if (page === "home") {
    renderHome();
  }
  if (page === "tasks") {
    renderGrid();
    if (mode135) {
      renderPlan135();
    }
    renderBrainPanel();
    renderForgetItPanel();
    renderArchivePanel();
    syncSidebarTabs();
    if (expandedTier && document.getElementById("tier-expand-dialog").open) {
      refreshTierExpand(expandedTier);
    }
  }
}

function seedHomeFromNotebook() {
  if (loadTasks("home").length > 0) return;

  const seed = [
    { text: "Return phone", tier: 1, done: false },
    { text: "Do laundry", tier: 1, done: false },
    { text: "Take photos", tier: 1, done: true },
    { text: "Clean closet", tier: 1, done: true },
    { text: "Do finances", tier: 1, done: false },
    { text: "Write prayer", tier: 1, done: false },
    { text: "Pickup CJ Food", tier: 1, done: false },
    { text: "Fix animations", tier: 1, done: false },
    { text: "Take photos", tier: 2, done: false },
    { text: "List items", tier: 2, done: false },
    { text: "Keep updating Admin", tier: 2, done: false },
    { text: "Clean closet", tier: 3, done: false },
    { text: "Edit videos", tier: 3, done: false },
    { text: "Clean office", tier: 3, done: false },
    { text: "Clean garage", tier: 4, done: false },
    { text: "Christian App", tier: 4, done: false },
    { text: "Interaction App", tier: 4, done: false },
    { text: "Planning App", tier: 4, done: false },
  ];

  saveTasks("home", seed.map((t) => ({ ...t, id: createId() })));
}

migrateLegacyData();
seedHomeFromNotebook();

document.documentElement.dataset.theme = getTheme();
document.documentElement.dataset.font = getFont();

setupDateHeader();
setupThemePicker();
setupFontPicker();
setupNavigation();
setupDropZones();
setupSidebarTabs();
setupTaskDialog();
setupBrainDumpForms();
setupDataSync();
setupTierExpand();
setupMode135();
setupForgetIt();
updateBoardHint();

setPage(page, filter);
