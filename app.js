const THEME_KEY = "priority-grid-theme";
const FONT_KEY = "priority-grid-font";
const FILTER_KEY = "priority-grid-filter";
const PAGE_KEY = "priority-grid-page";
const LEGACY_TASKS_KEY = "priority-grid-tasks";
const LEGACY_CONTEXT_KEY = "priority-grid-context";
const LEGACY_VIEW_KEY = "priority-grid-view";
const SYNC_BANNER_KEY = "priority-grid-sync-banner-dismissed";
const MODE_135_KEY = "priority-grid-135-mode";
const VISIBLE_TIERS_KEY = "priority-grid-visible-tiers";
const SIDEBAR_TAB_KEY = "priority-grid-sidebar-tab";
const SIDEBAR_COLLAPSED_KEY = "priority-grid-sidebar-collapsed";
const PLAN_135_PREFIX = "priority-grid-135-";
const NEXT_WEEK_PREFIX = "priority-grid-next-week-";
const FORGET_IT_PREFIX = "priority-grid-forget-it-";
const REPEAT_RESET_KEY = "priority-grid-repeat-last-reset";
const SYNC_META_KEY = "priority-grid-sync-meta";
const APP_STARTED_KEY = "priority-grid-app-started";
const SYNC_API = "/api/sync";
const SYNC_POLL_MS = 5000;

const HOME_DESIGN_KEY = "priority-grid-home-design";
const TIME_PREVIEW_KEY = "priority-grid-time-preview";

const HOME_DESIGNS = [
  { id: "apple", name: "Apple Music" },
  { id: "classic", name: "Classic" },
];

const PLAN_135_SLOTS = [
  { group: "big", label: "Big Task", number: "01", count: 1 },
  { group: "medium", label: "Medium Tasks", number: "02", count: 3 },
  { group: "small", label: "Small Tasks", number: "03", count: 5 },
];

const CONTEXTS = ["work", "home"];
const TIER_LABELS = ["1st", "2nd", "3rd", "4th"];
const isTouchDevice = () => window.matchMedia("(hover: none), (pointer: coarse)").matches;

const THEMES = [
  { id: "auto", name: "Auto (time of day)", colors: ["#0E303B", "#FCEFEA", "#FF6A6A", "#E07A5F", "#072F2E"] },
  { id: "warm-earth", name: "Warm Earth", colors: ["#FCEFEA", "#0E3D3B", "#E07A5F", "#F4A6A1", "#1F3F2E"] },
  { id: "midnight", name: "Midnight", colors: ["#0E303B", "#072F2E", "#FF6A6A", "#E07A5F", "#2D4E4E"] },
  { id: "terracotta", name: "Terracotta", colors: ["#FFF9F9", "#B46B61", "#FDE8E8", "#F4E7E4", "#2D2D2D"] },
];

const TIME_THEME_SLOTS = [
  { start: 0, label: "Night", theme: "midnight" },
  { start: 5, label: "Morning", theme: "warm-earth" },
  { start: 12, label: "Afternoon", theme: "warm-earth" },
  { start: 17, label: "Evening", theme: "midnight" },
];

const TIME_PREVIEW_OPTIONS = [
  { id: "auto", name: "Auto (clock)", slot: null },
  { id: "night", name: "Night", slot: TIME_THEME_SLOTS[0] },
  { id: "morning", name: "Morning", slot: TIME_THEME_SLOTS[1] },
  { id: "afternoon", name: "Afternoon", slot: TIME_THEME_SLOTS[2] },
  { id: "evening", name: "Evening", slot: TIME_THEME_SLOTS[3] },
];

const HOME_HERO_WALLPAPERS = {
  morning: {
    mobile: "assets/home-hero-morning.png?v=2",
    desktop: "assets/home-hero-morning-wide.png?v=2",
  },
  afternoon: {
    mobile: "assets/home-hero-afternoon.png?v=1",
    desktop: "assets/home-hero-afternoon-wide.png?v=1",
  },
  night: {
    mobile: "assets/home-hero-night.png?v=1",
    desktop: "assets/home-hero-night-wide.png?v=1",
  },
};

function getHomeHeroWallpaperPeriod(hour = new Date().getHours()) {
  const slot = getActiveTimeSlot(hour);
  if (slot.start === 0 || slot.start === 17) return "night";
  if (slot.start === 12) return "afternoon";
  return "morning";
}

const REFLECTION_TEAL_SHIFT_REVIEW = 25;

function getActiveReflectionTab() {
  return document.querySelector(".reflection-tab.active")?.dataset.tab || "review";
}

function applyReflectionScreenBackground(reflectionScreen, assets, tab) {
  const shiftPx = tab === "review" ? REFLECTION_TEAL_SHIFT_REVIEW : 0;
  reflectionScreen.style.backgroundColor = "#f3eee4";
  reflectionScreen.style.backgroundImage = `linear-gradient(to bottom, rgba(13, 43, 43, 0) 0%, rgba(13, 43, 43, 0.1) 20%, rgb(13, 43, 43) 55%), url("${assets.mobile}")`;
  reflectionScreen.style.backgroundSize = "100% 100%, 100% auto";
  reflectionScreen.style.backgroundRepeat = "no-repeat";
  reflectionScreen.style.backgroundPosition = `center ${shiftPx}px, center ${shiftPx}px`;
  reflectionScreen.dataset.tealOffset = String(shiftPx);
}

function applyHomeHeroWallpaper(hour = new Date().getHours()) {
  const period = getHomeHeroWallpaperPeriod(hour);
  const assets = HOME_HERO_WALLPAPERS[period];
  document.documentElement.dataset.heroWallpaper = period;

  const img = document.getElementById("presence-hero-bg");
  const source = document.getElementById("presence-hero-source-desktop");
  if (img && img.getAttribute("src") !== assets.mobile) img.src = assets.mobile;
  if (source && source.getAttribute("srcset") !== assets.desktop) {
    source.setAttribute("srcset", assets.desktop);
  }

  const reflectionScreen = document.querySelector(".reflection-screen");
  if (reflectionScreen) {
    applyReflectionScreenBackground(reflectionScreen, assets, getActiveReflectionTab());
  }
}

function getTimePreviewPreference() {
  try {
    const stored = localStorage.getItem(TIME_PREVIEW_KEY);
    if (TIME_PREVIEW_OPTIONS.some((option) => option.id === stored)) return stored;
  } catch {
    /* ignore */
  }
  return "auto";
}

function getActiveTimeSlot(hour = new Date().getHours()) {
  const preview = getTimePreviewPreference();
  if (preview !== "auto") {
    const option = TIME_PREVIEW_OPTIONS.find((entry) => entry.id === preview);
    if (option?.slot) return option.slot;
  }
  return getCurrentThemeSlot(hour);
}

function getGreetingForTimeSlot(slot) {
  if (slot.start === 5) return "Good morning";
  if (slot.start === 12) return "Good afternoon";
  return "Good evening";
}

const THEME_META_COLORS = {
  "warm-earth": "#fef7f4",
  auto: "#0e303b",
  midnight: "#0e303b",
  terracotta: "#fff9f9",
};

const FONTS = [
  {
    id: "pairing-playfair-serif",
    name: "Playfair Display + Source Serif 4",
    heading: "Playfair Display",
    body: "Source Serif 4",
    bodyWeight: 400,
  },
  {
    id: "pairing-playfair-sans",
    name: "Playfair Display + Source Sans 3",
    heading: "Playfair Display",
    body: "Source Sans 3",
    bodyWeight: 400,
  },
  {
    id: "pairing-playfair",
    name: "Playfair Display + Playfair Display",
    heading: "Playfair Display",
    body: "Playfair Display",
    bodyWeight: 400,
  },
];

const FONT_MIGRATION = {
  "playfair-inter": "pairing-playfair",
  "pairing-3": "pairing-playfair",
  "lora-inter": "pairing-playfair-serif",
  "pairing-1": "pairing-playfair-serif",
  "pairing-2": "pairing-playfair-sans",
  "pairing-4": "pairing-playfair-sans",
  "pairing-5": "pairing-playfair-sans",
  "pairing-source-sans": "pairing-playfair-sans",
};

let page = getPage();
let filter = getFilter();
let expandedTier = null;
let mode135 = getMode135();
let sidebarTab = getSidebarTab();
let plan135Picker = null;
let syncAvailable = false;
let syncPushTimer = null;
let syncPulling = false;
let syncPushing = false;
let syncDirty = false;
let touchDragGhost = null;
let dragGrabOffset = { x: 0, y: 0 };
let listDragState = null;
let visibleTiers = getVisibleTiers();

const TIER_NAMES = ["1st Priority", "2nd Priority", "3rd Priority", "4th Priority"];
const PREVIEW_TASK_LIMIT = 2;

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

function markSyncDirty() {
  syncDirty = true;
  scheduleSyncPush();
}

function saveTasks(ctx, list, options = {}) {
  localStorage.setItem(tasksKey(ctx), JSON.stringify(list));
  if (!options.skipSync) markSyncDirty();
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
  if (!options.skipSync) markSyncDirty();
}

function isTaskDeferred(task) {
  if (!task?.deferredUntil) return false;
  return task.deferredUntil > todayKey();
}

function getVisibleTasks() {
  const include = (t) => !t.archived && !isTaskDeferred(t);
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
  hint.textContent = isTouchDevice()
    ? "Press and drag the grip icon to reorder tasks or move them between priorities."
    : "Drag tasks between priorities, or drop them into 1-3-5 slots and the Next Week box in the sidebar.";
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
      markSyncDirty();
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
  document.getElementById("sync-now-btn")?.addEventListener("click", forceSyncNow);

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

function collectNextWeekFromStorage() {
  const nextWeek = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    let date = null;
    if (key.startsWith(NEXT_WEEK_PREFIX)) {
      date = key.slice(NEXT_WEEK_PREFIX.length);
    } else if (key.startsWith(FORGET_IT_PREFIX)) {
      date = key.slice(FORGET_IT_PREFIX.length);
    } else {
      continue;
    }
    if (nextWeek[date]) continue;
    try {
      nextWeek[date] = JSON.parse(localStorage.getItem(key));
    } catch {
      /* ignore */
    }
  }
  return nextWeek;
}

const collectForgetItFromStorage = collectNextWeekFromStorage;

function buildSyncPayload() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    work: loadTasks("work"),
    home: loadTasks("home"),
    brainDumpWork: loadBrainDump("work"),
    brainDumpHome: loadBrainDump("home"),
    plans: collectPlan135FromStorage(),
    nextWeek: collectNextWeekFromStorage(),
    forgetIt: collectNextWeekFromStorage(),
  };
}

function mergeTaskLists(localList, remoteList, preferRemote = true) {
  const local = Array.isArray(localList) ? localList : [];
  const remote = Array.isArray(remoteList) ? remoteList : [];
  const byId = new Map();
  const order = [];

  for (const task of local) {
    if (!task?.id) continue;
    byId.set(task.id, task);
    order.push(task.id);
  }

  for (const task of remote) {
    if (!task?.id) continue;
    if (byId.has(task.id)) {
      if (preferRemote) byId.set(task.id, task);
    } else {
      byId.set(task.id, task);
      order.push(task.id);
    }
  }

  return order.map((id) => byId.get(id));
}

function mergeBrainLists(localList, remoteList, preferRemote = true) {
  return mergeTaskLists(localList, remoteList, preferRemote);
}

function countPayloadTasks(payload) {
  if (!payload) return 0;
  return (payload.work?.length || 0) + (payload.home?.length || 0);
}

function countLocalTasks() {
  return loadTasks("work").length + loadTasks("home").length;
}

function applySyncPayload(payload, options = {}) {
  if (!payload) return false;

  const skipSync = { skipSync: true };
  const preferRemote = options.preferRemote !== false;

  if (Array.isArray(payload.work) || loadTasks("work").length > 0) {
    saveTasks("work", mergeTaskLists(loadTasks("work"), payload.work || [], preferRemote), skipSync);
  }
  if (Array.isArray(payload.home) || loadTasks("home").length > 0) {
    saveTasks("home", mergeTaskLists(loadTasks("home"), payload.home || [], preferRemote), skipSync);
  }
  if (Array.isArray(payload.brainDumpWork) || loadBrainDump("work").length > 0) {
    saveBrainDump(
      "work",
      mergeBrainLists(loadBrainDump("work"), payload.brainDumpWork || [], preferRemote),
      skipSync
    );
  }
  if (Array.isArray(payload.brainDumpHome) || loadBrainDump("home").length > 0) {
    saveBrainDump(
      "home",
      mergeBrainLists(loadBrainDump("home"), payload.brainDumpHome || [], preferRemote),
      skipSync
    );
  }

  const localPlans = collectPlan135FromStorage();
  const remotePlans = payload.plans || {};
  const planDates = new Set([...Object.keys(localPlans), ...Object.keys(remotePlans)]);
  planDates.forEach((date) => {
    const plan = preferRemote
      ? remotePlans[date] ?? localPlans[date]
      : localPlans[date] ?? remotePlans[date];
    if (plan) localStorage.setItem(plan135StorageKey(date), JSON.stringify(plan));
  });

  const localNextWeek = collectNextWeekFromStorage();
  const remoteNextWeek = payload.nextWeek || payload.forgetIt || {};
  const nextWeekDates = new Set([...Object.keys(localNextWeek), ...Object.keys(remoteNextWeek)]);
  nextWeekDates.forEach((date) => {
    const ref = preferRemote
      ? remoteNextWeek[date] ?? localNextWeek[date]
      : localNextWeek[date] ?? remoteNextWeek[date];
    if (ref) {
      localStorage.setItem(nextWeekStorageKey(date), JSON.stringify(ref));
      localStorage.removeItem(forgetItStorageKey(date));
    } else {
      localStorage.removeItem(nextWeekStorageKey(date));
      localStorage.removeItem(forgetItStorageKey(date));
    }
  });

  if (payload.updatedAt && options.setMeta !== false) {
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

function shouldApplyRemote(remote) {
  if (!remote) return false;
  const localCount = countLocalTasks();
  const remoteCount = countPayloadTasks(remote);
  if (localCount === 0 && remoteCount > 0) return true;
  if (remoteCount > localCount) return true;
  if (!remote.updatedAt) return false;
  return isRemoteNewer(remote.updatedAt);
}

async function pullRemoteSync(options = {}) {
  if (!syncAvailable || syncPulling) return;
  if (syncDirty && !options.force) return;
  syncPulling = true;
  try {
    const response = await fetch(SYNC_API, { cache: "no-store" });
    if (!response.ok) return;
    const remote = await response.json();
    if (!remote?.updatedAt) {
      const hasLocal =
        loadTasks("home").length > 0 ||
        loadTasks("work").length > 0 ||
        loadBrainDump("home").length > 0 ||
        loadBrainDump("work").length > 0;
      if (hasLocal || syncDirty) {
        await pushRemoteSync({ force: true });
      }
      return;
    }
    if (options.force || shouldApplyRemote(remote)) {
      const localCount = countLocalTasks();
      const remoteCount = countPayloadTasks(remote);
      const remoteHasMore = remoteCount > localCount;

      if (localCount > remoteCount) {
        applySyncPayload(remote, { skipRender: true, preferRemote: false, setMeta: false });
        markSyncDirty();
        await pushRemoteSync({ force: true });
      } else if (remoteCount === 0 && localCount > 0) {
        await pushRemoteSync({ force: true });
      } else {
        applySyncPayload(remote, {
          skipRender: true,
          preferRemote: remoteHasMore || isRemoteNewer(remote.updatedAt),
        });
      }
      renderAll();
      updateSyncUi();
    }
  } catch {
    updateSyncUi();
  } finally {
    syncPulling = false;
  }
}

async function pushRemoteSync(options = {}) {
  if (!syncAvailable || syncPushing) return;
  if (!options.force && !syncDirty) return;

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
      syncDirty = false;
      updateSyncUi();
    }
  } catch {
    syncAvailable = false;
    updateSyncUi();
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
  const status = document.getElementById("sync-status");
  const banner = document.getElementById("sync-banner");
  const dismissed = localStorage.getItem(SYNC_BANNER_KEY) === "1";
  const host = location.hostname;
  const isRemoteHost = host !== "localhost" && host !== "127.0.0.1";
  const localCount = countLocalTasks();

  if (status) {
    if (syncAvailable) {
      const taskNote = localCount === 1 ? "1 task" : `${localCount} tasks`;
      status.textContent = syncDirty
        ? `Connected — saving… (${taskNote} on this device)`
        : `Connected — synced (${taskNote} on this device)`;
      status.classList.remove("sync-status-offline");
    } else {
      status.textContent = "Not connected to sync server";
      status.classList.add("sync-status-offline");
    }
  }

  if (syncAvailable) {
    if (hint) {
      hint.textContent = isRemoteHost
        ? `This device is on ${location.host}. Tasks sync with other devices using the same address.`
        : "On your phone, open the http:// address from ./serve.sh (hotspot IP), not localhost.";
    }
    if (banner) banner.classList.add("hidden");
    return;
  }

  if (hint) {
    hint.textContent =
      "Run ./serve.sh on your Mac, then open the same http:// address on phone and computer.";
  }
  if (banner && isRemoteHost && !dismissed) {
    banner.classList.remove("hidden");
    banner.querySelector("p").innerHTML =
      "Sync server not detected. Run <strong>./serve.sh</strong> on your Mac and use the same URL on every device.";
  }
}

async function forceSyncNow() {
  try {
    const probe = await fetch(SYNC_API, { cache: "no-store" });
    if (!probe.ok) throw new Error("sync unavailable");
    syncAvailable = true;
    syncDirty = false;
    const remote = await probe.json();
    const localCount = countLocalTasks();
    const remoteCount = countPayloadTasks(remote);

    if (remoteCount >= localCount && remoteCount > 0) {
      applySyncPayload(remote, { preferRemote: true });
    } else if (localCount > 0) {
      await pushRemoteSync({ force: true });
    } else if (remoteCount > 0) {
      applySyncPayload(remote, { preferRemote: true });
    }

    updateSyncUi();
  } catch {
    syncAvailable = false;
    updateSyncUi();
    alert(
      "Could not reach the sync server. On your phone, open the exact http:// address from ./serve.sh on your Mac (hotspot IP, not localhost)."
    );
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
    const remote = await response.json();
    await pullRemoteSync();

    const hasLocal = countLocalTasks() > 0;
    const hasRemote = countPayloadTasks(remote) > 0;

    if (!hasLocal && !hasRemote) {
      seedHomeFromNotebook();
      markSyncDirty();
    }

    if (!getSyncMeta().updatedAt || syncDirty) {
      await pushRemoteSync({ force: true });
    }

    updateSyncUi();
    setInterval(() => pullRemoteSync(), SYNC_POLL_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pullRemoteSync();
    });
    window.addEventListener("focus", () => pullRemoteSync());
  } catch {
    syncAvailable = false;
    updateSyncUi();
  }
}

function getPage() {
  try {
    const saved = localStorage.getItem(PAGE_KEY);
    if (saved === "home" || saved === "tasks" || saved === "history") return saved;
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

function getThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "auto") return "auto";
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
    if (saved === "dusty-rose") return "terracotta";
  } catch {
    /* ignore */
  }
  return "auto";
}

function getThemeForHour(hour = new Date().getHours()) {
  let theme = TIME_THEME_SLOTS[0].theme;
  for (const slot of TIME_THEME_SLOTS) {
    if (hour >= slot.start) theme = slot.theme;
  }
  return theme;
}

function getCurrentThemeSlot(hour = new Date().getHours()) {
  let slot = TIME_THEME_SLOTS[0];
  for (const entry of TIME_THEME_SLOTS) {
    if (hour >= entry.start) slot = entry;
  }
  return slot;
}

function getEffectiveTheme() {
  const preference = getThemePreference();
  if (preference !== "auto") return preference;
  const preview = getTimePreviewPreference();
  if (preview !== "auto") {
    const option = TIME_PREVIEW_OPTIONS.find((entry) => entry.id === preview);
    if (option?.slot) return option.slot.theme;
  }
  return getThemeForHour();
}

function getTheme() {
  return getThemePreference();
}

function updateThemeMeta(themeId) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_META_COLORS[themeId] || THEME_META_COLORS["warm-earth"]);
  document.documentElement.style.colorScheme = themeId === "midnight" ? "dark" : "light";
}

function applyTheme() {
  const preference = getThemePreference();
  const effective = getEffectiveTheme();
  document.documentElement.dataset.theme = effective;
  document.documentElement.dataset.themeMode = preference;
  updateThemeMeta(effective);

  document.querySelectorAll(".theme-option").forEach((btn) => {
    const isActive = btn.dataset.theme === preference;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-checked", isActive);
  });

  const status = document.getElementById("theme-schedule-status");
  if (status) {
    if (preference === "auto") {
      const slot = getActiveTimeSlot();
      const activeTheme = THEMES.find((t) => t.id === slot.theme);
      const preview = getTimePreviewPreference();
      if (preview === "auto") {
        status.textContent = `${slot.label} — using ${activeTheme?.name || slot.theme} until the next period.`;
      } else {
        status.textContent = `Previewing ${slot.label} — ${activeTheme?.name || slot.theme} wallpaper and colors.`;
      }
      status.classList.remove("hidden");
    } else {
      status.classList.add("hidden");
    }
  }

  const timePreviewStatus = document.getElementById("time-preview-status");
  if (timePreviewStatus) {
    const preview = getTimePreviewPreference();
    if (preview === "auto") {
      const slot = getCurrentThemeSlot();
      timePreviewStatus.textContent = `Following your clock — currently ${slot.label.toLowerCase()}.`;
    } else {
      const slot = getActiveTimeSlot();
      timePreviewStatus.textContent = `Previewing ${slot.label.toLowerCase()} mode on home.`;
    }
  }

  applyHomeHeroWallpaper();
  setupDateHeader();
}

function tierTagClass(tier, planGroup = "") {
  if (planGroup === "big" || tier === 1) return "home-card-task-tier--1st";
  if (planGroup === "medium" || tier === 2) return "home-card-task-tier--medium";
  return "home-card-task-tier--small";
}

function plan135TierBadgeClass(tier, planGroup = "") {
  if (planGroup === "big" || tier === 1) return "plan-135-tier-badge--1st";
  if (planGroup === "medium" || tier === 2) return "plan-135-tier-badge--medium";
  return "plan-135-tier-badge--small";
}

function getFont() {
  try {
    let saved = localStorage.getItem(FONT_KEY);
    if (saved && FONT_MIGRATION[saved]) {
      saved = FONT_MIGRATION[saved];
      localStorage.setItem(FONT_KEY, saved);
    }
    if (saved && FONTS.some((f) => f.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "pairing-playfair-serif";
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

function taskDragHandleHtml() {
  return `<div class="task-drag-handle" role="button" tabindex="-1" aria-label="Drag to reorder"><svg class="icon icon-grip" aria-hidden="true"><use href="#icon-grip"></use></svg></div>`;
}

function getVisibleTiers() {
  try {
    const saved = localStorage.getItem(VISIBLE_TIERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        2: parsed[2] !== false,
        3: parsed[3] !== false,
        4: parsed[4] !== false,
      };
    }
  } catch {
    /* ignore */
  }
  return { 2: true, 3: true, 4: true };
}

function setVisibleTiers(next) {
  visibleTiers = next;
  localStorage.setItem(VISIBLE_TIERS_KEY, JSON.stringify(next));
  syncPriorityVisibilityTags();
  renderGrid();
  if (page === "home") renderHome();
}

function isTierVisible(tier) {
  return tier === 1 || visibleTiers[tier] !== false;
}

function getVisibleTierList() {
  return [1, 2, 3, 4].filter((tier) => isTierVisible(tier));
}

function syncPriorityVisibilityTags() {
  document.querySelectorAll(".priority-visibility-tag").forEach((btn) => {
    const tier = Number(btn.dataset.tier);
    const visible = isTierVisible(tier);
    btn.classList.toggle("active", visible);
    btn.setAttribute("aria-pressed", String(visible));
  });
}

function setupPriorityVisibilityTags() {
  document.querySelectorAll(".priority-visibility-tags").forEach((container) => {
    if (container.dataset.bound) return;
    container.dataset.bound = "1";

    container.querySelectorAll(".priority-visibility-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tier = Number(btn.dataset.tier);
        setVisibleTiers({ ...visibleTiers, [tier]: !isTierVisible(tier) });
      });
    });
  });
  syncPriorityVisibilityTags();
}

function formatHomeDate(date = new Date()) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const mod10 = day % 10;
  const mod100 = day % 100;
  let suffix = "th";
  if (mod10 === 1 && mod100 !== 11) suffix = "st";
  else if (mod10 === 2 && mod100 !== 12) suffix = "nd";
  else if (mod10 === 3 && mod100 !== 13) suffix = "rd";
  return `${weekday}, ${month} ${day}${suffix}`;
}

function setupDateHeader() {
  const now = new Date();
  const slot = getActiveTimeSlot(now.getHours());
  const greeting = getGreetingForTimeSlot(slot);
  const dateText = formatHomeDate(now);

  const greetingEl = document.getElementById("home-greeting-line");
  if (greetingEl) greetingEl.textContent = `${greeting},`;

  const dateEl = document.getElementById("home-date");
  if (dateEl) dateEl.textContent = dateText;

  const tasksGreetingEl = document.getElementById("tasks-greeting-line");
  if (tasksGreetingEl) tasksGreetingEl.textContent = `${greeting},`;

  const tasksDateEl = document.getElementById("tasks-date");
  if (tasksDateEl) tasksDateEl.textContent = dateText;
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
    const stored = localStorage.getItem(MODE_135_KEY);
    if (stored === null) return true;
    return stored === "1";
  } catch {
    return true;
  }
}

function getSidebarTab() {
  try {
    const stored = localStorage.getItem(SIDEBAR_TAB_KEY) || "brain";
    if (stored === "forget") return "nextweek";
    return stored;
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
  document.querySelectorAll(".sidebar-tab").forEach((btn) => {
    const isActive = btn.dataset.tab === sidebarTab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".sidebar-tab-panel").forEach((panel) => {
    const match = panel.dataset.tab === sidebarTab;
    panel.classList.toggle("active", match);
    panel.classList.toggle("hidden", !match);
  });
}

function setupSidebarTabs() {
  document.querySelectorAll(".sidebar-tab").forEach((btn) => {
    btn.addEventListener("click", () => setSidebarTab(btn.dataset.tab));
  });
  syncSidebarTabs();
}

function getSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function syncSidebarCollapsed() {
  const collapsed = document.body.classList.contains("sidebar-collapsed");
  const btn = document.getElementById("sidebar-menu-btn");
  const sidebar = document.getElementById("sidebar");
  if (btn) {
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  }
  if (sidebar) {
    sidebar.classList.toggle("is-collapsed", collapsed);
  }
}

function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", Boolean(collapsed));
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
  syncSidebarCollapsed();
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
  if (!options.skipSync) markSyncDirty();
}

function nextWeekStorageKey(date = todayKey()) {
  return `${NEXT_WEEK_PREFIX}${date}`;
}

function forgetItStorageKey(date = todayKey()) {
  return `${FORGET_IT_PREFIX}${date}`;
}

function loadNextWeek(date = todayKey()) {
  try {
    const saved =
      localStorage.getItem(nextWeekStorageKey(date)) || localStorage.getItem(forgetItStorageKey(date));
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed?.id && parsed?.context) return { id: parsed.id, context: parsed.context };
  } catch {
    /* ignore */
  }
  return null;
}

const loadForgetIt = loadNextWeek;

function saveNextWeek(ref, date = todayKey(), options = {}) {
  if (ref) {
    localStorage.setItem(nextWeekStorageKey(date), JSON.stringify(ref));
    localStorage.removeItem(forgetItStorageKey(date));
  } else {
    localStorage.removeItem(nextWeekStorageKey(date));
    localStorage.removeItem(forgetItStorageKey(date));
  }
  if (!options.skipSync) markSyncDirty();
}

const saveForgetIt = saveNextWeek;

function setNextWeek(ref) {
  saveNextWeek(ref);
  if (ref) removeTaskRefFromPlan135(ref);
}

const setForgetIt = setNextWeek;

function clearNextWeek() {
  saveNextWeek(null);
}

const clearForgetIt = clearNextWeek;

function getNextMondayKey(fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  let daysToAdd = (8 - day) % 7;
  if (daysToAdd === 0) daysToAdd = 7;
  d.setDate(d.getDate() + daysToAdd);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function clearExpiredDeferredTasks() {
  const today = todayKey();
  CONTEXTS.forEach((ctx) => {
    const list = loadTasks(ctx);
    let changed = false;
    const next = list.map((t) => {
      if (!t.deferredUntil || t.deferredUntil > today) return t;
      changed = true;
      const { deferredUntil: _removed, ...rest } = t;
      return rest;
    });
    if (changed) saveTasks(ctx, next);
  });
}

function resetRepeatDailyTasksIfNeeded() {
  const today = todayKey();
  let lastReset = null;
  try {
    lastReset = localStorage.getItem(REPEAT_RESET_KEY);
  } catch {
    /* ignore */
  }
  if (lastReset === today) return;

  CONTEXTS.forEach((ctx) => {
    const list = loadTasks(ctx);
    let changed = false;
    const next = list.map((t) => {
      if (!t.repeatDaily) return t;
      changed = true;
      const updated = { ...t, done: false, repeatLastReset: today };
      delete updated.completedAt;
      return updated;
    });
    if (changed) saveTasks(ctx, next);
  });

  try {
    localStorage.setItem(REPEAT_RESET_KEY, today);
  } catch {
    /* ignore */
  }
}

function getRepeatDailyTasks() {
  const include = (t) => !t.archived && t.repeatDaily && !isTaskDeferred(t);
  if (filter === "all") {
    return CONTEXTS.flatMap((ctx) =>
      loadTasks(ctx).filter(include).map((t) => ({ ...t, context: ctx }))
    );
  }
  return loadTasks(filter).filter(include).map((t) => ({ ...t, context: filter }));
}

function addRepeatDailyTask(text, tier, ctx) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const targetCtx = ctx || (filter === "all" ? "work" : filter);
  saveTasks(targetCtx, [
    ...loadTasks(targetCtx),
    { id: createId(), text: trimmed, tier, done: false, repeatDaily: true },
  ]);
}

function removeRepeatDailyTask(id, ctx) {
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      const { repeatDaily: _removed, repeatLastReset: _reset, ...rest } = t;
      return rest;
    })
  );
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

function getNextWeekPickerTasks() {
  const current = loadNextWeek();
  return getVisibleTasks().filter((t) => {
    if (t.done) return false;
    if (current && t.id === current.id && t.context === current.context) return false;
    return true;
  });
}

const getForgetItPickerTasks = getNextWeekPickerTasks;

function deferNextWeekTask() {
  const ref = loadNextWeek();
  if (!ref) return;
  const deferredUntil = getNextMondayKey();
  updateTaskInContext(ref.context, (list) =>
    list.map((t) => (t.id === ref.id ? { ...t, deferredUntil } : t))
  );
  clearNextWeek();
  renderAll();
}

const tossForgetItTask = deferNextWeekTask;

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

function isTaskNextWeek(task) {
  const nextWeekRef = loadNextWeek();
  return nextWeekRef?.id === task.id && nextWeekRef.context === task.context;
}

const isTaskForgetIt = isTaskNextWeek;

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
  const forgetRef = loadNextWeek();
  if (forgetRef) assigned.add(`${forgetRef.context}:${forgetRef.id}`);

  const tasks = getVisibleTasks().filter((t) => !t.done);
  const incomplete = tasks.filter((t) => !assigned.has(`${t.context}:${t.id}`));
  const doneVisible = getVisibleTasks().filter(
    (t) => t.done && !assigned.has(`${t.context}:${t.id}`)
  );
  return [...incomplete, ...doneVisible];
}

function buildPickerListHtml(tasks) {
  const groups = [];
  for (let tier = 1; tier <= 4; tier++) {
    const tierTasks = tasks.filter((t) => t.tier === tier);
    if (tierTasks.length) groups.push({ tier, tasks: tierTasks });
  }

  return groups
    .map(
      ({ tier, tasks: tierTasks }) => `
    <li class="plan-135-picker-tier-heading">${TIER_NAMES[tier - 1]}</li>
    ${tierTasks
      .map(
        (task) => `
      <li>
        <button type="button" class="plan-135-picker-item" data-id="${task.id}" data-context="${task.context}">
          <span class="plan-135-picker-item-text">${escapeHtml(task.text)}</span>
          <span class="plan-135-picker-item-meta">
            ${filter === "all" ? contextIconHtml(task.context, "plan-135-ctx") : ""}
          </span>
        </button>
      </li>`
      )
      .join("")}`
    )
    .join("");
}

function beginDragGhost(sourceCard, clientX, clientY) {
  const rect = sourceCard.getBoundingClientRect();
  dragGrabOffset = {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
  createDragGhost(sourceCard, clientX, clientY);
}

function createDragGhost(sourceCard, x, y) {
  removeDragGhost();
  const ghost = sourceCard.cloneNode(true);
  ghost.classList.remove("dragging");
  ghost.classList.add("touch-drag-ghost");
  ghost.removeAttribute("draggable");
  const listWidth = sourceCard.parentElement?.clientWidth;
  ghost.style.width = `${listWidth || sourceCard.offsetWidth}px`;
  const host = sourceCard.closest("dialog[open]") || document.body;
  host.appendChild(ghost);
  touchDragGhost = ghost;
  moveDragGhost(x, y);
}

function createTouchDragGhost(sourceCard, x, y) {
  beginDragGhost(sourceCard, x, y);
}

function moveDragGhost(x, y) {
  if (!touchDragGhost) return;
  touchDragGhost.style.transform = `translate(${x - dragGrabOffset.x}px, ${y - dragGrabOffset.y}px)`;
}

function moveTouchDragGhost(x, y) {
  moveDragGhost(x, y);
}

function removeDragGhost() {
  touchDragGhost?.remove();
  touchDragGhost = null;
  dragGrabOffset = { x: 0, y: 0 };
}

function computeListReorder(listEl, draggedId, clientY) {
  const cards = [...listEl.querySelectorAll(".task-card")];
  const fromIndex = cards.findIndex((c) => c.dataset.id === draggedId);
  if (fromIndex === -1) return { fromIndex: 0, toIndex: 0, entries: [] };

  const others = cards.filter((c) => c.dataset.id !== draggedId);
  let insertAt = others.length;
  for (let i = 0; i < others.length; i++) {
    const rect = others[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      insertAt = i;
      break;
    }
  }

  const entries = cards.map((c) => ({ id: c.dataset.id, context: c.dataset.context }));
  const [moved] = entries.splice(fromIndex, 1);
  entries.splice(insertAt, 0, moved);

  return { fromIndex, toIndex: insertAt, entries };
}

function tierOrderKey(tier) {
  return `priority-grid-tier-order-${tier}`;
}

function sortTasksByTierDisplayOrder(tasks, tier) {
  try {
    const saved = localStorage.getItem(tierOrderKey(tier));
    if (!saved) return tasks;
    const order = JSON.parse(saved);
    const map = new Map(tasks.map((t) => [`${t.context}:${t.id}`, t]));
    const result = [];
    const used = new Set();
    for (const ref of order) {
      const key = `${ref.context}:${ref.id}`;
      if (map.has(key)) {
        result.push(map.get(key));
        used.add(key);
      }
    }
    for (const t of tasks) {
      const key = `${t.context}:${t.id}`;
      if (!used.has(key)) result.push(t);
    }
    return result;
  } catch {
    return tasks;
  }
}

function saveTierDisplayOrder(tier, entries) {
  try {
    localStorage.setItem(
      tierOrderKey(tier),
      JSON.stringify(entries.map(({ id, context }) => ({ id, context })))
    );
    markSyncDirty();
  } catch {
    /* ignore */
  }
}

function reorderTierTasksInContext(ctx, tier, orderedIds) {
  const list = loadTasks(ctx);
  const tierMap = new Map(list.filter((t) => t.tier === tier).map((t) => [t.id, t]));
  const reordered = orderedIds.filter((id) => tierMap.has(id)).map((id) => tierMap.get(id));
  const missing = list.filter((t) => t.tier === tier && !orderedIds.includes(t.id));
  const orderedTierTasks = [...reordered, ...missing];
  const insertAt = tierStartIndex(list, tier);
  const withoutTier = list.filter((t) => t.tier !== tier);
  const result = [...withoutTier.slice(0, insertAt), ...orderedTierTasks, ...withoutTier.slice(insertAt)];
  saveTasks(ctx, result);
}

function applyListReorderEntries(listEl, entries, tier) {
  saveTierDisplayOrder(tier, entries);
  if (filter === "all") {
    const byCtx = new Map();
    entries.forEach(({ id, context }) => {
      if (!byCtx.has(context)) byCtx.set(context, []);
      byCtx.get(context).push(id);
    });
    byCtx.forEach((ids, ctx) => reorderTierTasksInContext(ctx, tier, ids));
    return;
  }
  reorderTierTasksInContext(filter, tier, entries.map((entry) => entry.id));
}

function getListDragTier(listEl) {
  if (listEl.id === "tier-expand-list") return expandedTier;
  return Number(listEl.dataset.tier) || null;
}

function startListDragSession(card, listEl, clientX, clientY) {
  const cards = [...listEl.querySelectorAll(".task-card")];
  const fromIndex = cards.indexOf(card);
  const gap = parseFloat(getComputedStyle(listEl).gap) || 0;
  const rowHeight = card.offsetHeight + gap;

  listDragState = {
    card,
    listEl,
    fromIndex,
    toIndex: fromIndex,
    rowHeight,
    tier: getListDragTier(listEl),
    lastX: clientX,
    lastY: clientY,
    entries: null,
  };

  listEl.classList.add("list-drag-active");
  card.classList.add("dragging");
  card.querySelector(".task-drag-handle")?.classList.add("dragging-active");
  beginDragGhost(card, clientX, clientY);
  updateListDragSession(clientX, clientY);
}

function updateListDragSession(clientX, clientY) {
  if (!listDragState) return;
  const { card, listEl, fromIndex, rowHeight } = listDragState;
  const { toIndex, entries } = computeListReorder(listEl, card.dataset.id, clientY);
  listDragState.toIndex = toIndex;
  listDragState.entries = entries;
  listDragState.lastX = clientX;
  listDragState.lastY = clientY;

  const cards = [...listEl.querySelectorAll(".task-card")];
  cards.forEach((c, i) => {
    if (c === card) return;
    let shift = 0;
    if (fromIndex < toIndex) {
      if (i > fromIndex && i <= toIndex) shift = -rowHeight;
    } else if (fromIndex > toIndex) {
      if (i >= toIndex && i < fromIndex) shift = rowHeight;
    }
    c.style.transform = shift ? `translateY(${shift}px)` : "";
  });

  moveDragGhost(clientX, clientY);
  updateGripDragHighlights(clientX, clientY);
}

function clearListDragSession() {
  if (!listDragState) return;
  const { card, listEl } = listDragState;

  listEl.classList.remove("list-drag-active");
  listEl.querySelectorAll(".task-card").forEach((c) => {
    c.style.transform = "";
    c.style.transition = "";
    c.classList.remove("dragging");
  });
  card.querySelector(".task-drag-handle")?.classList.remove("dragging-active");
  removeDragGhost();
  listDragState = null;
}

function commitListDragSession() {
  if (!listDragState) return;
  const { tier, fromIndex, toIndex, entries, listEl } = listDragState;

  clearListDragSession();

  if (fromIndex !== toIndex && tier && entries?.length) {
    applyListReorderEntries(listEl, entries, tier);
    renderAll();
  }
}

function resolveListInsert(clientY, listEl, draggedId) {
  const cards = [...listEl.querySelectorAll(".task-card")];
  const others = cards.filter((item) => item.dataset.id !== draggedId);
  for (let i = 0; i < others.length; i++) {
    const rect = others[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return { beforeId: others[i].dataset.id };
    }
  }
  return { atEnd: true };
}

function applyListInsertMove(id, ctx, tier, listEl, clientY) {
  const insert = resolveListInsert(clientY, listEl, id);
  if (insert.beforeId) {
    moveTask(id, ctx, tier, insert.beforeId);
  } else {
    moveTask(id, ctx, tier);
  }
}

function removeTouchDragGhost() {
  removeDragGhost();
}

function isDropAtListStart(listEl, clientY) {
  const firstCard = listEl.querySelector(".task-card");
  if (!firstCard) return true;
  const rect = firstCard.getBoundingClientRect();
  return clientY < rect.top + rect.height / 2;
}

function handlePlan135Drop(slot, dataTransfer) {
  try {
    const data = JSON.parse(dataTransfer.getData("text/plain"));
    if (!data?.id) return;
    const task = findTaskByRef(data);
    if (!task || task.done) return;
    assignTaskToPlan135Slot(slot.dataset.slotGroup, Number(slot.dataset.slotIndex), data);
    renderAll();
  } catch {
    /* ignore */
  }
}

function updateTasksLayout() {
  syncSidebarTabs();
}

function syncMode135Toggle() {
  const btn = document.getElementById("plan-135-home-toggle");
  if (!btn) return;
  btn.classList.toggle("active", mode135);
  btn.setAttribute("aria-pressed", String(mode135));
  btn.textContent = mode135 ? "On Home page" : "Show on Home";
}

function updatePageTitle() {
  const titles = {
    home: { all: "My Day", work: "My Day", home: "My Day" },
    tasks: { all: "All Tasks", work: "Work Tasks", home: "Home Tasks" },
    history: { all: "History", work: "History", home: "History" },
  };
  document.getElementById("page-title").textContent = titles[page][filter];
  document.getElementById("page-title").classList.toggle("hidden", page === "home" || page === "tasks");
  document.getElementById("page-header").classList.toggle("hidden", page === "home");
  document.getElementById("page-header").classList.toggle("page-header--home", page === "home");
  document.getElementById("page-header").classList.toggle("page-header--tasks", page === "tasks");
  document.getElementById("page-header-actions").classList.toggle("hidden", page !== "home");
  document.getElementById("tasks-page-intro")?.classList.toggle("hidden", page !== "tasks");
  document.getElementById("tasks-page-notify")?.classList.toggle("hidden", page !== "tasks");

  const isHome = page === "home";
  const isTasks = page === "tasks";
  document.getElementById("filter-pills").classList.toggle("hidden", !isTasks);
  document.getElementById("add-task-btn").classList.toggle("hidden", !(isHome || isTasks));
  syncMode135Toggle();
  updateTasksLayout();
}

function syncNavActive() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    let active = false;
    if (page === "home") {
      active = btn.dataset.page === "home";
    } else if (page === "history") {
      active = btn.dataset.page === "history";
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
    if (btn.dataset.nav === "profile" || btn.dataset.nav === "settings") {
      active = false;
    } else if (page === "home") {
      active = btn.dataset.page === "home";
    } else if (page === "history") {
      active = btn.dataset.page === "history";
    } else if (page === "tasks" && btn.dataset.page === "tasks") {
      active = !btn.dataset.focusBrain && btn.dataset.filter === filter && !btn.dataset.nav;
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
  document.getElementById("history-page").classList.toggle("hidden", page !== "history");

  document.body.dataset.page = page;

  const appearance = document.getElementById("appearance-panel");
  if (appearance && page !== "home") appearance.removeAttribute("open");

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

function openAppearancePanel() {
  const panel = document.getElementById("appearance-panel");
  if (!panel) return;
  panel.open = true;
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setupNavigation() {
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.nav === "profile" || btn.dataset.nav === "settings") {
        openAppearancePanel();
        return;
      }
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

  const sidebarMenuBtn = document.getElementById("sidebar-menu-btn");
  if (sidebarMenuBtn) {
    sidebarMenuBtn.addEventListener("click", () => {
      setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
    });
  }

  const sidebarProfileBtn = document.getElementById("sidebar-profile-btn");
  if (sidebarProfileBtn) {
    sidebarProfileBtn.addEventListener("click", openAppearancePanel);
  }

  document.getElementById("mobile-nav-fab")?.addEventListener("click", (e) => {
    const fab = e.currentTarget;
    fab.classList.remove("is-sparkling");
    void fab.offsetWidth;
    fab.classList.add("is-sparkling");
    const clearSparkle = () => fab.classList.remove("is-sparkling");
    fab.addEventListener("animationend", clearSparkle, { once: true });
    window.setTimeout(clearSparkle, 700);
    openTaskDialog(1);
  });

  document.getElementById("presence-hero-add-task")?.addEventListener("click", () => {
    openTaskDialog(1);
  });
}

function setTheme(themeId) {
  const theme = THEMES.some((t) => t.id === themeId) ? themeId : "auto";
  localStorage.setItem(THEME_KEY, theme);
  applyTheme();
}

function setupThemeSchedule() {
  applyTheme();
  window.setInterval(() => {
    if (getThemePreference() === "auto") applyTheme();
  }, 60_000);
}

function setTimePreview(previewId) {
  localStorage.setItem(TIME_PREVIEW_KEY, previewId);
  document.querySelectorAll(".time-preview-option").forEach((btn) => {
    const isActive = btn.dataset.timePreview === previewId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-checked", isActive);
  });
  applyTheme();
}

function setupTimePreviewPicker() {
  const picker = document.getElementById("time-preview-picker");
  if (!picker) return;
  const current = getTimePreviewPreference();

  picker.innerHTML = TIME_PREVIEW_OPTIONS.map(
    (option) => `
    <button type="button" class="theme-option time-preview-option${option.id === current ? " active" : ""}"
      data-time-preview="${option.id}" role="radio" aria-checked="${option.id === current}"
      aria-label="${option.name}">
      <span class="theme-name">${option.name}</span>
    </button>`
  ).join("");

  picker.querySelectorAll(".time-preview-option").forEach((btn) => {
    btn.addEventListener("click", () => setTimePreview(btn.dataset.timePreview));
  });
}

function setupThemePicker() {
  const picker = document.getElementById("theme-picker");
  if (!picker) return;
  const current = getThemePreference();

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

  applyTheme();
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

function setupFontPicker() {
  const picker = document.getElementById("font-picker");
  const current = getFont();
  document.documentElement.dataset.font = current;

  picker.innerHTML = FONTS.map(
    (font) => `
    <button type="button" class="font-option${font.id === current ? " active" : ""}"
      data-font="${font.id}" role="radio" aria-checked="${font.id === current}"
      aria-label="${font.name}">
      <span class="font-option-name" style="font-family:'${font.heading}',serif;font-weight:600">${font.name}</span>
      <span class="font-option-sample" style="font-family:'${font.body}',serif;font-weight:${font.bodyWeight || 400}">Aa Bb Cc</span>
    </button>`
  ).join("");

  picker.querySelectorAll(".font-option").forEach((btn) => {
    btn.addEventListener("click", () => setFont(btn.dataset.font));
  });
}

function getHomeDesign() {
  try {
    const stored = localStorage.getItem(HOME_DESIGN_KEY);
    if (stored === "classic" || stored === "apple") return stored;
  } catch {
    /* ignore */
  }
  return "classic";
}

function applyHomeDesign(designId) {
  document.documentElement.dataset.homeDesign = designId;
  let link = document.getElementById("home-design-stylesheet");
  if (designId === "apple") {
    if (!link) {
      link = document.createElement("link");
      link.id = "home-design-stylesheet";
      link.rel = "stylesheet";
      link.href = "design/home-apple.css?v=1";
      document.head.appendChild(link);
    }
  } else if (link) {
    link.remove();
  }
}

function setHomeDesign(designId) {
  localStorage.setItem(HOME_DESIGN_KEY, designId);
  applyHomeDesign(designId);
  document.querySelectorAll(".home-design-option").forEach((btn) => {
    const isActive = btn.dataset.homeDesign === designId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-checked", isActive);
  });
}

function setupHomeDesignPicker() {
  const picker = document.getElementById("home-design-picker");
  if (!picker) return;
  const current = getHomeDesign();
  applyHomeDesign(current);

  picker.innerHTML = HOME_DESIGNS.map(
    (design) => `
    <button type="button" class="theme-option home-design-option${design.id === current ? " active" : ""}"
      data-home-design="${design.id}" role="radio" aria-checked="${design.id === current}"
      aria-label="${design.name}">
      <span class="theme-name">${design.name}</span>
    </button>`
  ).join("");

  picker.querySelectorAll(".home-design-option").forEach((btn) => {
    btn.addEventListener("click", () => setHomeDesign(btn.dataset.homeDesign));
  });
}

function getTasksForTier(tier) {
  const tasks = getVisibleTasks().filter((t) => t.tier === tier);
  return sortTasksByTierDisplayOrder(tasks, tier);
}

function updateTaskInContext(ctx, updater) {
  const list = loadTasks(ctx);
  const next = updater(list);
  saveTasks(ctx, next);
}

function clearTaskRefs(id, ctx) {
  const ref = { id, context: ctx };
  removeTaskRefFromPlan135(ref);
  const forgetRef = loadNextWeek();
  if (forgetRef && forgetRef.id === id && forgetRef.context === ctx) {
    clearForgetIt();
  }
}

function archiveTask(id, ctx) {
  clearTaskRefs(id, ctx);
  const archivedAt = new Date().toISOString();
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, archived: true, archivedAt };
      if (next.done && !next.completedAt) next.completedAt = archivedAt;
      return next;
    })
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

  const forgetRef = loadNextWeek();
  if (forgetRef?.id === ref.id && forgetRef?.context === ref.context) {
    clearForgetIt();
  }
}

function tierStartIndex(list, tier) {
  const idx = list.findIndex((t) => t.tier === tier);
  return idx === -1 ? list.length : idx;
}

function tierEndIndex(list, tier) {
  const lastIdx = list.map((t) => t.tier).lastIndexOf(tier);
  return lastIdx === -1 ? list.length : lastIdx + 1;
}

function moveTask(taskId, taskContext, tier, beforeId = null, atTierStart = false) {
  let task = null;
  const list = loadTasks(taskContext).filter((t) => {
    if (t.id === taskId) {
      task = { ...t, tier };
      return false;
    }
    return true;
  });
  if (!task) return;

  let insertIdx;
  if (beforeId) {
    insertIdx = list.findIndex((t) => t.id === beforeId);
    if (insertIdx === -1) {
      insertIdx = atTierStart ? tierStartIndex(list, tier) : tierEndIndex(list, tier);
    }
  } else if (atTierStart) {
    insertIdx = tierStartIndex(list, tier);
  } else {
    insertIdx = tierEndIndex(list, tier);
  }

  list.splice(insertIdx, 0, task);
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
        ${taskDragHandleHtml()}
        <label class="task-check">
          <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
        </label>
        <div class="task-card-body">
          <button type="button" class="task-text-btn">${escapeHtml(task.text)}</button>
        </div>
      </div>
      <div class="task-card-actions">
        ${inForgetIt ? `<span class="forget-it-indicator" title="In Next Week box" aria-label="In Next Week box"><svg class="icon icon-forget-box" aria-hidden="true"><use href="#icon-forget-box"></use></svg></span>` : ""}
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
          ${filter === "all" ? `<span class="plan-135-slot-meta">${contextIconHtml(task.context, "plan-135-ctx")}</span>` : ""}
        </div>
        <div class="plan-135-slot-actions">
          <button type="button" class="plan-135-change-btn" data-slot="${slotKey}">Change</button>
          <button type="button" class="plan-135-remove-btn" data-slot="${slotKey}" aria-label="Remove from plan">×</button>
        </div>
      </li>`;
  }

  return `
    <li class="plan-135-slot plan-135-slot-empty plan-135-drop-zone plan-135-slot--${group}${isBig ? " plan-135-slot-big" : ""}"
      data-slot-group="${group}" data-slot-index="${index}">
      <button type="button" class="plan-135-pick-btn" data-slot="${slotKey}">
        <span class="plan-135-pick-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="12" x2="12" y1="5" y2="19" stroke-linecap="round" />
            <line x1="5" x2="19" y1="12" y2="12" stroke-linecap="round" />
          </svg>
        </span>
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

  syncMode135Toggle();

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
    progress.textContent = `${filled} of ${total} tasks planned`;
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
        <header class="plan-135-section-header">
          <span class="plan-135-section-badge" aria-hidden="true">${section.number}</span>
          <div class="plan-135-section-copy">
            <h4 class="plan-135-section-title">${section.label}</h4>
          </div>
        </header>
        <ul class="plan-135-slots">${slotHtml}</ul>
      </section>`;
  }).join("");

  bindPlan135Slots(sections);
}

function dayBoundsFromOffset(offsetDays) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isTimestampOnDay(iso, offsetDays) {
  if (!iso) return false;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  const { start, end } = dayBoundsFromOffset(offsetDays);
  return t >= start && t < end;
}

function relativeDayKey(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getEffectiveCompletedAt(task) {
  if (!task.done) return null;
  return task.completedAt || null;
}

function isYesterdayWin(task) {
  if (!task.done) return false;
  return isTimestampOnDay(getEffectiveCompletedAt(task), -1);
}

function getTasksCompletedYesterday() {
  const seen = new Set();
  const tasks = [];
  CONTEXTS.forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!isYesterdayWin(t)) return;
      const key = `${ctx}:${t.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks;
}

const REFLECTION_JOURNAL_KEY = "priority-grid-reflection-journal";

const REFLECTION_PROMPT_POOL = [
  { emoji: "🏆", text: "A small win I'm proud of" },
  { emoji: "😊", text: "A moment that made me smile" },
  { emoji: "💛", text: "Someone I'm grateful for" },
  { emoji: "⚡", text: "Something that energized me" },
  { emoji: "🌿", text: "A quiet moment I noticed" },
  { emoji: "🎯", text: "Something I moved forward on" },
  { emoji: "☀️", text: "What felt easy today" },
  { emoji: "🤝", text: "A kind gesture I received" },
];

function reflectionTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadReflectionJournal() {
  try {
    const raw = localStorage.getItem(REFLECTION_JOURNAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveReflectionJournal(text) {
  const journal = loadReflectionJournal();
  journal[reflectionTodayKey()] = text;
  localStorage.setItem(REFLECTION_JOURNAL_KEY, JSON.stringify(journal));
}

function shuffleReflectionPrompts(count = 4) {
  const pool = [...REFLECTION_PROMPT_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function renderReflectionPrompts(prompts) {
  const list = document.getElementById("reflection-prompts-list");
  if (!list) return;
  list.innerHTML = prompts
    .map(
      (prompt) => `
    <button type="button" class="reflection-prompt-btn" data-prompt="${escapeHtml(prompt.text)}">
      <span class="reflection-prompt-emoji" aria-hidden="true">${prompt.emoji}</span>
      <span>${escapeHtml(prompt.text)}</span>
    </button>`
    )
    .join("");
}

function updateReflectionCharCount() {
  const textarea = document.getElementById("reflection-text");
  const countEl = document.getElementById("reflection-char-count");
  if (!textarea || !countEl) return;
  countEl.textContent = `${textarea.value.length} / 500`;
}

function getCompletedYesterdayTasks() {
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = archiveDayKey(yesterdayDate.toISOString());
  const seen = new Set();
  const tasks = [];
  CONTEXTS.forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.done || !t.completedAt || t.archived) return;
      if (archiveDayKey(t.completedAt) !== yesterday) return;
      const key = `${ctx}:${t.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

function reflectionReviewItemHtml(task) {
  const time = formatCompletionTime(task.completedAt);
  return `
    <li class="reflection-review-item">
      <span class="reflection-review-check" aria-hidden="true">✓</span>
      <span class="reflection-review-text">${escapeHtml(task.text)}</span>
      <span class="reflection-review-tier">${TIER_LABELS[task.tier - 1]}${time ? ` · ${time}` : ""}</span>
    </li>`;
}

function renderReflectionReview() {
  const list = document.getElementById("reflection-review-list");
  const empty = document.getElementById("reflection-review-empty");
  const subtitle = document.getElementById("reflection-review-subtitle");
  if (!list || !empty) return;

  const tasks = getCompletedYesterdayTasks();

  if (subtitle) {
    subtitle.textContent =
      tasks.length === 0
        ? "Nothing was completed yesterday — you can still reflect on your day."
        : `${tasks.length} task${tasks.length === 1 ? "" : "s"} completed yesterday.`;
  }

  if (tasks.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = tasks.map(reflectionReviewItemHtml).join("");
}

function setReflectionTab(tab) {
  const nextTab = tab === "thoughts" ? "thoughts" : "review";
  document.querySelectorAll(".reflection-tab").forEach((btn) => {
    const active = btn.dataset.tab === nextTab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
    const step = btn.querySelector(".reflection-progress-step");
    if (!step) return;
    step.classList.toggle("reflection-progress-step--active", active);
    let dot = step.querySelector(".reflection-progress-dot");
    if (active) {
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "reflection-progress-dot";
        dot.setAttribute("aria-hidden", "true");
        step.appendChild(dot);
      }
    } else if (dot) {
      dot.remove();
    }
  });
  document.querySelectorAll(".reflection-tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tab !== nextTab);
    panel.classList.toggle("active", panel.dataset.tab === nextTab);
  });
  if (nextTab === "thoughts") {
    document.getElementById("reflection-text")?.focus();
  }
  applyHomeHeroWallpaper();
}

function openReflectionDialog() {
  const dialog = document.getElementById("reflection-dialog");
  const textarea = document.getElementById("reflection-text");
  if (!dialog || !textarea) return;

  const journal = loadReflectionJournal();
  textarea.value = journal[reflectionTodayKey()] || "";
  updateReflectionCharCount();
  renderReflectionPrompts(shuffleReflectionPrompts());
  renderReflectionReview();
  setReflectionTab("review");
  applyHomeHeroWallpaper();
  dialog.showModal();
}

function handleReflectionBack() {
  const dialog = document.getElementById("reflection-dialog");
  if (getActiveReflectionTab() === "thoughts") {
    setReflectionTab("review");
    return;
  }
  dialog?.close();
}

function setupFocusTimer() {
  const root = document.getElementById("focus-timer");
  const display = document.getElementById("focus-timer-display");
  const toggleBtn = document.getElementById("focus-timer-toggle");
  const resetBtn = document.getElementById("focus-timer-reset");
  const customWrap = document.getElementById("focus-timer-custom");
  const customInput = document.getElementById("focus-timer-minutes");
  const setCustomBtn = document.getElementById("focus-timer-set");
  if (!root || !display || !toggleBtn || !resetBtn) return;

  let durationMs = 20 * 60 * 1000;
  let remainingMs = durationMs;
  let endsAt = 0;
  let intervalId = null;
  let running = false;

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function render() {
    display.textContent = formatTime(remainingMs);
    root.classList.toggle("is-running", running);
    root.classList.toggle("is-done", !running && remainingMs === 0 && durationMs > 0);
    toggleBtn.textContent = running ? "Pause" : remainingMs === 0 ? "Restart" : "Start";
    toggleBtn.classList.toggle("is-pause", running);
  }

  function clearTick() {
    if (intervalId) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function completeTimer() {
    running = false;
    remainingMs = 0;
    clearTick();
    render();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Focus complete", { body: "Your focus session is done." });
      }
    } catch {
      /* ignore */
    }
  }

  function tick() {
    remainingMs = Math.max(0, endsAt - Date.now());
    if (remainingMs <= 0) {
      completeTimer();
      return;
    }
    render();
  }

  function start() {
    if (remainingMs <= 0) remainingMs = durationMs;
    endsAt = Date.now() + remainingMs;
    running = true;
    clearTick();
    intervalId = window.setInterval(tick, 250);
    render();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch {
      /* ignore */
    }
  }

  function pause() {
    if (!running) return;
    remainingMs = Math.max(0, endsAt - Date.now());
    running = false;
    clearTick();
    render();
  }

  function reset() {
    running = false;
    remainingMs = durationMs;
    clearTick();
    render();
  }

  function setDurationMinutes(mins) {
    const safe = Math.min(180, Math.max(1, Math.round(Number(mins) || 20)));
    durationMs = safe * 60 * 1000;
    remainingMs = durationMs;
    running = false;
    clearTick();
    render();
  }

  document.querySelectorAll(".focus-timer-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.minutes;
      document.querySelectorAll(".focus-timer-preset").forEach((preset) => {
        preset.classList.toggle("active", preset === btn);
      });
      if (value === "custom") {
        customWrap?.classList.remove("hidden");
        customInput?.focus();
        return;
      }
      customWrap?.classList.add("hidden");
      setDurationMinutes(value);
    });
  });

  setCustomBtn?.addEventListener("click", () => {
    setDurationMinutes(customInput?.value);
    customWrap?.classList.add("hidden");
  });

  customInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setDurationMinutes(customInput.value);
      customWrap?.classList.add("hidden");
    }
  });

  toggleBtn.addEventListener("click", () => {
    if (running) pause();
    else start();
  });

  resetBtn.addEventListener("click", reset);
  render();
}

function setupReflection() {
  const dialog = document.getElementById("reflection-dialog");
  const textarea = document.getElementById("reflection-text");
  const refreshBtn = document.getElementById("reflection-prompts-refresh");
  const continueBtn = document.getElementById("reflection-continue");
  const reviewContinueBtn = document.getElementById("reflection-review-continue");
  const backBtn = document.getElementById("reflection-back");
  const promptsList = document.getElementById("reflection-prompts-list");

  document.getElementById("focus-reflection-btn")?.addEventListener("click", openReflectionDialog);

  setupFocusTimer();

  backBtn?.addEventListener("click", handleReflectionBack);

  document.querySelectorAll(".reflection-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      setReflectionTab(btn.dataset.tab);
    });
  });

  textarea?.addEventListener("input", updateReflectionCharCount);

  refreshBtn?.addEventListener("click", () => {
    renderReflectionPrompts(shuffleReflectionPrompts());
  });

  promptsList?.addEventListener("click", (e) => {
    const btn = e.target.closest(".reflection-prompt-btn");
    if (!btn || !textarea) return;
    const prompt = btn.dataset.prompt;
    if (!prompt) return;
    const prefix = textarea.value.trim() ? `${textarea.value.trim()}\n\n` : "";
    textarea.value = `${prefix}${prompt}: `;
    updateReflectionCharCount();
    textarea.focus();
  });

  reviewContinueBtn?.addEventListener("click", () => {
    setReflectionTab("thoughts");
  });

  continueBtn?.addEventListener("click", () => {
    if (textarea) saveReflectionJournal(textarea.value.trim());
    dialog?.close();
  });
}

function toggleTaskDone(id, ctx, markingDone) {
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      const next = { ...t, done: markingDone };
      if (markingDone) next.completedAt = new Date().toISOString();
      else delete next.completedAt;
      return next;
    })
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
      toggleTaskDone(task.id, task.context, e.target.checked);
    });
  });

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
    list.innerHTML = buildPickerListHtml(tasks);

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
        <button type="button" class="forget-it-toss-btn">Move to next week</button>
      </div>
    </div>`;
}

function forgetItEmptyHtml() {
  return `
    <div class="forget-it-empty forget-it-drop-zone">
      <p>Pick one task to push to next week.</p>
      <p class="forget-it-drop-hint">Or drag a task here from the grid.</p>
      <button type="button" class="forget-it-pick-btn">+ Choose task</button>
    </div>`;
}

function bindForgetItActions(container) {
  container.querySelector(".forget-it-pick-btn")?.addEventListener("click", openForgetItPicker);
  container.querySelector(".forget-it-change-btn")?.addEventListener("click", openForgetItPicker);
  container.querySelector(".forget-it-toss-btn")?.addEventListener("click", deferNextWeekTask);
}

function renderForgetItPanel() {
  const body = document.getElementById("forget-it-body");
  if (!body) return;

  const ref = loadNextWeek();
  const task = findTaskByRef(ref);

  if (!task) {
    if (ref) clearNextWeek();
    body.innerHTML = forgetItEmptyHtml();
    bindForgetItActions(body);
    return;
  }

  body.innerHTML = forgetItTaskHtml(task);
  bindForgetItActions(body);
}

function setupForgetItDropDelegation() {
  const body = document.getElementById("forget-it-body");
  if (!body || body.dataset.dropDelegation) return;
  body.dataset.dropDelegation = "1";

  body.addEventListener("dragover", (e) => {
    const zone = e.target.closest(".forget-it-drop-zone");
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    body.querySelectorAll(".forget-it-drop-zone").forEach((z) => z.classList.remove("drop-target-active"));
    zone.classList.add("drop-target-active");
  });

  body.addEventListener("dragleave", (e) => {
    const zone = e.target.closest(".forget-it-drop-zone");
    if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove("drop-target-active");
  });

  body.addEventListener("drop", (e) => {
    const zone = e.target.closest(".forget-it-drop-zone");
    if (!zone) return;
    e.preventDefault();
    e.stopPropagation();
    body.querySelectorAll(".forget-it-drop-zone").forEach((z) => z.classList.remove("drop-target-active"));
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

function setupPlan135DropDelegation() {
  const root = document.getElementById("plan-135-sections");
  if (!root || root.dataset.dropDelegation) return;
  root.dataset.dropDelegation = "1";

  root.addEventListener("dragover", (e) => {
    const slot = e.target.closest(".plan-135-drop-zone");
    if (!slot) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    root.querySelectorAll(".plan-135-drop-zone").forEach((z) => z.classList.remove("drop-target-active"));
    slot.classList.add("drop-target-active");
  });

  root.addEventListener("dragleave", (e) => {
    const slot = e.target.closest(".plan-135-drop-zone");
    if (slot && !slot.contains(e.relatedTarget)) slot.classList.remove("drop-target-active");
  });

  root.addEventListener("drop", (e) => {
    const slot = e.target.closest(".plan-135-drop-zone");
    if (!slot) return;
    e.preventDefault();
    e.stopPropagation();
    root.querySelectorAll(".plan-135-drop-zone").forEach((z) => z.classList.remove("drop-target-active"));
    handlePlan135Drop(slot, e.dataTransfer);
  });
}

function setupSidebarDragAssist() {
  const workspace = document.querySelector(".tasks-workspace");
  if (!workspace || workspace.dataset.dragAssist) return;
  workspace.dataset.dragAssist = "1";

  workspace.addEventListener("dragover", (e) => {
    if (!document.querySelector(".task-card.dragging")) return;
    if (e.target.closest("#plan-135-sections, #sidebar-tab-panel-135")) {
      setSidebarTab("135");
    } else if (e.target.closest("#forget-it-body, #sidebar-tab-panel-nextweek")) {
      setSidebarTab("nextweek");
    }
  });
}

function renderForgetItHome() {
  /* Home forget-it widget removed — matches Figma home mockup */
}

function openForgetItPicker() {
  const dialog = document.getElementById("forget-it-picker-dialog");
  const list = document.getElementById("forget-it-picker-list");
  const tasks = getForgetItPickerTasks();

  if (tasks.length === 0) {
    list.innerHTML = `<li class="plan-135-picker-empty">No open tasks to choose from.</li>`;
  } else {
    list.innerHTML = buildPickerListHtml(tasks);

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
  setupForgetItDropDelegation();

  document.getElementById("forget-it-picker-close")?.addEventListener("click", () => {
    document.getElementById("forget-it-picker-dialog").close();
  });
  document.getElementById("forget-it-picker-dialog")?.addEventListener("close", () => {});
}

function setupMode135() {
  document.getElementById("plan-135-home-toggle")?.addEventListener("click", () => {
    setMode135(!mode135);
    renderAll();
  });

  setupPlan135DropDelegation();
  setupSidebarDragAssist();
  syncMode135Toggle();

  const pickerDialog = document.getElementById("plan-135-picker-dialog");
  document.getElementById("plan-135-picker-close").addEventListener("click", () => {
    plan135Picker = null;
    pickerDialog.close();
  });
  pickerDialog.addEventListener("close", () => {
    plan135Picker = null;
  });
}

function tasksFlatRowHtml(task) {
  const inForgetIt = isTaskForgetIt(task);
  const contextBadge = filter === "all" ? contextIconHtml(task.context, "brain-ctx-tag") : "";
  return `
    <li class="history-item task-card tasks-flat-item${task.done ? " done" : ""}" draggable="false"
      data-id="${task.id}" data-context="${task.context}">
      ${taskDragHandleHtml()}
      <label class="task-check">
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
      </label>
      <div class="history-item-body">
        <button type="button" class="task-text-btn history-text">${escapeHtml(task.text)}</button>
        <span class="history-meta tasks-flat-meta">
          <span class="plan-135-tier-badge ${plan135TierBadgeClass(task.tier)}">${TIER_LABELS[task.tier - 1]}</span>
          ${contextBadge}
          ${inForgetIt ? `<span class="forget-it-indicator" title="In Next Week box" aria-label="In Next Week box"><svg class="icon icon-forget-box" aria-hidden="true"><use href="#icon-forget-box"></use></svg></span>` : ""}
        </span>
      </div>
      <div class="task-card-actions">
        <button type="button" class="archive-btn" aria-label="Archive task" title="Archive task">×</button>
      </div>
    </li>`;
}

function renderTasksFlat() {
  const container = document.getElementById("tasks-flat-list");
  if (!container) return;

  let html = "";
  for (let tier = 1; tier <= 4; tier++) {
    if (!isTierVisible(tier)) continue;
    const tierTasks = getTasksForTier(tier);
    html += `
    <li class="tasks-flat-section" data-tier="${tier}">
      <h3 class="tasks-flat-heading">${TIER_NAMES[tier - 1]} · ${tierTasks.length} task${tierTasks.length === 1 ? "" : "s"}</h3>
      <ul class="task-list tasks-flat-tier-list" data-tier="${tier}">
        ${tierTasks.map((task) => tasksFlatRowHtml(task)).join("")}
      </ul>
    </li>`;
  }

  container.innerHTML = html;
  container.querySelectorAll(".task-card").forEach(bindTaskEvents);
  syncPriorityVisibilityTags();
}

function renderGrid() {
  const flatList = document.getElementById("tasks-flat-list");
  if (flatList) flatList.innerHTML = "";

  const board = document.getElementById("board");
  if (board) {
    board.classList.toggle("board-single-column", !isTierVisible(2) && !isTierVisible(3) && !isTierVisible(4));
  }

  for (let tier = 1; tier <= 4; tier++) {
    const column = document.querySelector(`.column[data-tier="${tier}"]`);
    const list = document.querySelector(`.task-list[data-tier="${tier}"]`);
    const tierTasks = getTasksForTier(tier);
    const countEl = document.querySelector(`[data-tier-count="${tier}"]`);
    const seeAllBtn = document.querySelector(`.column-see-all[data-tier="${tier}"]`);
    const visible = isTierVisible(tier);
    const badgeNumber = String(tier).padStart(2, "0");

    if (column) {
      column.classList.toggle("hidden", !visible);
      const badge = column.querySelector(".column-badge");
      // Always keep the fixed priority number/color (01–04), even when other tiers are hidden.
      if (badge) badge.textContent = badgeNumber;
    }
    if (!visible || !list) continue;

    countEl.textContent = `${tierTasks.length} task${tierTasks.length === 1 ? "" : "s"}`;

    const previewTasks = tierTasks.slice(0, PREVIEW_TASK_LIMIT);
    list.innerHTML = previewTasks.map((task) => taskCardHtml(task)).join("");
    list.querySelectorAll(".task-card").forEach(bindTaskEvents);

    list.classList.toggle("task-list-preview", tierTasks.length > PREVIEW_TASK_LIMIT);
    if (seeAllBtn) {
      const hasMore = tierTasks.length > PREVIEW_TASK_LIMIT;
      seeAllBtn.classList.toggle("hidden", !hasMore);
      const textEl = seeAllBtn.querySelector(".column-see-all-text");
      const label = hasMore ? `See all ${tierTasks.length} tasks` : "See all tasks";
      if (textEl) textEl.textContent = label;
      else seeAllBtn.textContent = label;
    }
    const addBtn = document.querySelector(`.column-add[data-tier="${tier}"]`);
    if (addBtn) addBtn.classList.toggle("hidden", tierTasks.length > PREVIEW_TASK_LIMIT);
  }

  syncPriorityVisibilityTags();
}

function getTopPriorityTasks(limit = 5) {
  const visible = CONTEXTS.flatMap((ctx) =>
    loadTasks(ctx)
      .filter((t) => !t.archived)
      .map((t) => ({ ...t, context: ctx }))
  );
  const ranked = visible
    .filter((t) => t.tier === 1 || t.tier === 2)
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.done !== b.done) return a.done ? 1 : -1;
      return 0;
    });
  return ranked.slice(0, limit);
}

function planCardTaskHtml(task) {
  if (!task) return "";
  return `
    <li class="plan-card-task${task.done ? " done" : ""}" data-id="${task.id}" data-context="${task.context}">
      <label class="plan-card-check">
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
      </label>
      <button type="button" class="plan-card-task-text">${escapeHtml(task.text)}</button>
      <span class="plan-card-drag" aria-hidden="true">
        <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
          <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
          <circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/>
          <circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/>
        </svg>
      </span>
    </li>`;
}

const PRIORITY_CARD_VARIANTS = ["p1", "p2", "p3", "p4"];

function planCardProgressRing(done, total) {
  const pct = total > 0 ? done / total : 0;
  const r = 20;
  const cx = 24;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return `
    <div class="plan-card-progress" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${Math.max(total, 1)}">
      <svg class="plan-card-progress-ring" viewBox="0 0 48 48" aria-hidden="true">
        <circle class="plan-card-progress-track" cx="${cx}" cy="${cx}" r="${r}" />
        <circle class="plan-card-progress-fill" cx="${cx}" cy="${cx}" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" />
      </svg>
      <span class="plan-card-progress-label">${done}/${total}</span>
    </div>`;
}

function figmaPlanCardHtml({ number, variant, title, subtitle, tasks = [], done = 0, total = 0 }) {
  const listHtml = tasks.map((task) => planCardTaskHtml(task)).join("");
  const taskLabel = subtitle || `${total} task${total === 1 ? "" : "s"}`;

  return `
    <article class="plan-card plan-card--${variant}">
      <div class="plan-card-inner">
        <div class="plan-card-top-row">
          <span class="plan-card-badge plan-card-badge--top" aria-hidden="true">${escapeHtml(number)}</span>
          ${planCardProgressRing(done, total)}
        </div>
        <div class="plan-card-heading">
          <h3 class="plan-card-title plan-card-title--featured">${escapeHtml(title)}</h3>
          <p class="plan-card-subtitle">${escapeHtml(taskLabel)}</p>
        </div>
        <div class="plan-card-body">
          ${listHtml ? `<ul class="plan-card-list">${listHtml}</ul>` : ""}
        </div>
      </div>
    </article>`;
}

function homeCardTaskHtml(task, options = {}) {
  const { showTier = false, planGroup = "" } = options;
  const tierClass = tierTagClass(task.tier, planGroup);
  return `
    <li class="home-card-task${task.done ? " done" : ""}" data-id="${task.id}" data-context="${task.context}"${planGroup ? ` data-plan-group="${planGroup}"` : ""}>
      <label class="task-check home-card-check">
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
      </label>
      <div class="home-card-task-body">
        <button type="button" class="home-card-task-title">${escapeHtml(task.text)}</button>
        ${showTier ? `<span class="home-card-task-tier ${tierClass}">${TIER_NAMES[task.tier - 1]}</span>` : ""}
      </div>
    </li>`;
}

function homeCardEmptyHtml(label) {
  return `<li class="home-card-task home-card-task--empty"><span>${escapeHtml(label)}</span></li>`;
}

function homeCardProgressRing(done, total) {
  const pct = total > 0 ? done / total : 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return `
    <div class="home-priority-card-progress home-priority-card-progress--ring" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}">
      <svg class="progress-ring" viewBox="0 0 88 88" aria-hidden="true">
        <circle class="progress-ring-track" cx="44" cy="44" r="${r}" />
        <circle class="progress-ring-fill" cx="44" cy="44" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" />
      </svg>
      <span class="home-priority-card-progress-label">${done}/${total} done</span>
    </div>`;
}

function homePriorityCardHtml({ variant, badge, title, listHtml, footerHtml = "" }) {
  return `
    <article class="home-priority-card home-priority-card--${variant}">
      <header class="home-priority-card-header">
        <span class="home-priority-card-badge" aria-hidden="true">${badge}</span>
        <h4 class="home-priority-card-title">${escapeHtml(title)}</h4>
      </header>
      <ul class="home-priority-card-list">${listHtml}</ul>
      ${footerHtml ? `<footer class="home-priority-card-footer">${footerHtml}</footer>` : ""}
    </article>`;
}

function bindHomeCardTasks(container) {
  container
    .querySelectorAll(
      ".home-card-task:not(.home-card-task--empty):not(.home-card-task--summary), .plan-card-task"
    )
    .forEach(bindHomeTaskEvents);
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

function getTasksByTierForHome(tier, limit) {
  if (!isTierVisible(tier)) return [];
  const tasks = [];
  CONTEXTS.forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.archived && !isTaskDeferred(t) && t.tier === tier) tasks.push({ ...t, context: ctx });
    });
  });
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return 0;
  });
  if (limit == null) return tasks;
  return tasks.slice(0, limit);
}

function getOpenTasksForTiers(tiers, limit) {
  const tasks = [];
  CONTEXTS.forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.archived && !t.done && !isTaskDeferred(t) && tiers.includes(t.tier)) {
        tasks.push({ ...t, context: ctx });
      }
    });
  });
  tasks.sort((a, b) => a.tier - b.tier);
  return tasks.slice(0, limit);
}

function renderHomePriorities() {
  const title = document.getElementById("home-priority-title");
  const progress = document.getElementById("home-priority-progress");
  const content = document.getElementById("home-priority-content");
  const empty = document.getElementById("home-priority-empty");
  if (!content || !empty) return;

  if (title) title.textContent = "Today's Plan";
  if (progress) progress.classList.add("hidden");
  empty.classList.add("hidden");

  const cardsHtml = getVisibleTierList()
    .map((tier) => {
      const allTasks = getTasksByTierForHome(tier);
      const tasks = allTasks.slice(0, 5);
      const done = allTasks.filter((t) => t.done).length;
      const total = allTasks.length;
      return figmaPlanCardHtml({
        number: String(tier).padStart(2, "0"),
        variant: PRIORITY_CARD_VARIANTS[tier - 1],
        title: TIER_NAMES[tier - 1],
        subtitle: `${total} task${total === 1 ? "" : "s"}`,
        tasks,
        done,
        total,
      });
    })
    .join("");

  content.innerHTML = `<div class="plan-card-grid plan-card-grid--priorities">${cardsHtml}</div>`;
  bindHomeCardTasks(content);
}

function renderHomePlan135() {
  const title = document.getElementById("home-priority-title");
  const progress = document.getElementById("home-priority-progress");
  const content = document.getElementById("home-priority-content");
  const empty = document.getElementById("home-priority-empty");
  if (!content) return;

  const rawPlan = loadPlan135();
  const plan = sanitizePlan135(rawPlan);
  if (JSON.stringify(plan) !== JSON.stringify(rawPlan)) {
    savePlan135(plan);
  }

  if (title) title.textContent = "Today's Plan";
  if (progress) progress.classList.add("hidden");
  empty.classList.add("hidden");

  const cardsHtml = PLAN_135_SLOTS.map((section, index) => {
    const slots = section.group === "big" ? [plan.big] : plan[section.group];
    const resolved = slots
      .map((ref) => findTaskByRef(ref))
      .filter(Boolean)
      .filter((t) => isTierVisible(t.tier));
    const tasks = section.group === "big" ? (resolved[0] ? [resolved[0]] : []) : resolved;
    const done = tasks.filter((t) => t.done).length;
    const total = tasks.length;

    return figmaPlanCardHtml({
      number: String(index + 1).padStart(2, "0"),
      variant: section.group,
      title: TIER_NAMES[index],
      subtitle: `${total} task${total === 1 ? "" : "s"}`,
      tasks,
      done,
      total,
    });
  }).join("");

  content.innerHTML = `<div class="plan-card-grid">${cardsHtml}</div>`;
  bindHomeCardTasks(content);
}

function bindHomeTaskEvents(row) {
  const id = row.dataset.id;
  const ctx = row.dataset.context;
  const checkbox = row.querySelector('input[type="checkbox"]');
  if (!checkbox) return;

  checkbox.addEventListener("change", (e) => {
    toggleTaskDone(id, ctx, e.target.checked);
  });

  row.querySelector(".home-card-task-title, .home-task-title, .plan-card-task-text")?.addEventListener("click", () => {
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openEditTaskDialog(task, ctx);
  });

  row.querySelector(".home-task-menu")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openEditTaskDialog(task, ctx);
  });
}

function formatCompletionTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getCompletedTodayTasks() {
  const today = archiveDayKey(new Date().toISOString());
  const seen = new Set();
  const tasks = [];
  CONTEXTS.forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.done || !t.completedAt || t.archived) return;
      if (archiveDayKey(t.completedAt) !== today) return;
      const key = `${ctx}:${t.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

function completedTodayEmptyCardHtml() {
  return `
    <article class="plan-card plan-card--p1 plan-card--empty">
      <div class="plan-card-inner">
        <div class="plan-card-top-row">
          <span class="plan-card-badge plan-card-badge--top" aria-hidden="true">—</span>
        </div>
        <h3 class="plan-card-title plan-card-title--featured">Today's Wins</h3>
        <div class="plan-card-body">
          <p class="plan-card-empty-msg">Nothing crossed off yet — your first win of the day is still ahead.</p>
        </div>
      </div>
    </article>`;
}

function renderHomeCompletedToday() {
  const content = document.getElementById("home-completed-content");
  const section = document.querySelector(".presence-completed-today");
  if (!content) return;

  const tasks = getCompletedTodayTasks();

  if (tasks.length === 0) {
    content.innerHTML = `<div class="plan-card-grid plan-card-grid--completed">${completedTodayEmptyCardHtml()}</div>`;
    section?.classList.add("presence-completed-today--empty");
    return;
  }

  section?.classList.remove("presence-completed-today--empty");
  const cardsHtml = getVisibleTierList()
    .map((tier) => {
      const tierTasks = tasks.filter((t) => t.tier === tier);
      if (tierTasks.length === 0) return "";
      const total = tierTasks.length;
      return figmaPlanCardHtml({
        number: String(tier).padStart(2, "0"),
        variant: PRIORITY_CARD_VARIANTS[tier - 1],
        title: TIER_NAMES[tier - 1],
        subtitle: `${total} task${total === 1 ? "" : "s"}`,
        tasks: tierTasks,
        done: total,
        total,
      });
    })
    .filter(Boolean)
    .join("");

  content.innerHTML = `<div class="plan-card-grid plan-card-grid--completed">${cardsHtml}</div>`;
  bindHomeCardTasks(content);
}

function renderHome() {
  // Always show all four priority columns with their tasks — not the 1-3-5 slot plan.
  renderHomePriorities();
  renderHomeCompletedToday();
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
  const list = card.closest(".task-list[data-tier]");
  if (list) return Number(list.dataset.tier);
  const column = card.closest(".column");
  return column ? Number(column.dataset.tier) : null;
}

function setupTierExpand() {
  const dialog = document.getElementById("tier-expand-dialog");

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

function taskCardAtPoint(card, x, y) {
  const el = document.elementFromPoint(x, y);
  const target = el?.closest(".task-card");
  if (!target || target === card) return null;
  return target;
}

function columnAtPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  return el?.closest(".column") || null;
}

function listAtPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const list = el?.closest("#tier-expand-list, .task-list[data-tier]");
  if (list) return list;
  const section = el?.closest(".tasks-flat-section");
  if (section) return section.querySelector(".task-list[data-tier]");
  return null;
}

function applyGripDragDrop(card, x, y) {
  const id = card.dataset.id;
  const ctx = card.dataset.context;

  if (isTierExpandCard(card)) {
    if (!expandedTier) return;
    const list = document.getElementById("tier-expand-list");
    if (!list) return;
    const dropEl = document.elementFromPoint(x, y);
    if (!dropEl?.closest("#tier-expand-list")) return;
    const { entries } = computeListReorder(list, id, y);
    applyListReorderEntries(list, entries, expandedTier);
    renderAll();
    return;
  }

  const planSlot = document.elementFromPoint(x, y)?.closest(".plan-135-drop-zone");
  if (planSlot) {
    assignTaskToPlan135Slot(planSlot.dataset.slotGroup, Number(planSlot.dataset.slotIndex), {
      id,
      context: ctx,
    });
    renderAll();
    return;
  }

  const forgetZone = document.elementFromPoint(x, y)?.closest(".forget-it-drop-zone");
  if (forgetZone) {
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task && !task.done) {
      setForgetIt({ id, context: ctx });
      renderAll();
    }
    return;
  }

  const target = taskCardAtPoint(card, x, y);
  if (target && !isTierExpandCard(target)) {
    const tier = getCardTier(target);
    const list = target.parentElement;
    if (tier && list) {
      applyListInsertMove(id, ctx, tier, list, y);
      renderAll();
      return;
    }
  }

  const list = listAtPoint(x, y);
  if (list) {
    const tier = getListDragTier(list);
    if (tier) {
      const atStart = isDropAtListStart(list, y);
      moveTask(id, ctx, tier, null, atStart);
      renderAll();
      return;
    }
  }

  const col = columnAtPoint(x, y);
  if (col) {
    const tier = Number(col.dataset.tier);
    const colList = col.querySelector(".task-list");
    const atStart = colList ? isDropAtListStart(colList, y) : false;
    moveTask(id, ctx, tier, null, atStart);
    renderAll();
  }
}

function clearGripDragHighlights() {
  document.querySelectorAll(".column, .tasks-flat-section").forEach((c) => c.classList.remove("drag-over"));
  document.querySelectorAll(".plan-135-drop-zone, .forget-it-drop-zone").forEach((z) =>
    z.classList.remove("drop-target-active")
  );
}

function updateGripDragHighlights(x, y) {
  clearGripDragHighlights();
  const col = columnAtPoint(x, y);
  if (col) col.classList.add("drag-over");
  const list = listAtPoint(x, y);
  if (list?.classList.contains("tasks-flat-tier-list")) {
    list.closest(".tasks-flat-section")?.classList.add("drag-over");
  }
  const dropEl = document.elementFromPoint(x, y);
  dropEl?.closest(".plan-135-drop-zone")?.classList.add("drop-target-active");
  dropEl?.closest(".forget-it-drop-zone")?.classList.add("drop-target-active");
  if (dropEl?.closest(".plan-135-drop-zone, #plan-135-sections")) setSidebarTab("135");
  else if (dropEl?.closest(".forget-it-drop-zone, #forget-it-body")) setSidebarTab("nextweek");
}

function finishGripListDrag(x, y) {
  if (!listDragState) return;
  const { card, listEl } = listDragState;
  const dropEl = document.elementFromPoint(x, y);
  const dropList = dropEl?.closest("#tier-expand-list, .task-list[data-tier]");
  const isSidebarDrop = Boolean(dropEl?.closest(".plan-135-drop-zone, .forget-it-drop-zone"));
  const isCrossListDrop = Boolean(dropList && dropList !== listEl);

  if (isSidebarDrop || isCrossListDrop) {
    applyGripDragDrop(card, x, y);
    listEl.classList.remove("list-drag-active");
    listEl.querySelectorAll(".task-card").forEach((c) => {
      c.style.transform = "";
      c.style.transition = "";
      c.classList.remove("dragging");
    });
    card.querySelector(".task-drag-handle")?.classList.remove("dragging-active");
    removeDragGhost();
    listDragState = null;
    document.body.classList.remove("task-dragging-lock");
  } else {
    commitListDragSession();
    document.body.classList.remove("task-dragging-lock");
  }
}

function bindMouseGripDrag(card) {
  const handle = card.querySelector(".task-drag-handle");
  if (!handle) return;

  const listEl = card.closest("#tier-expand-list, .task-list[data-tier]");
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const endDrag = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    if (!dragging) return;
    dragging = false;
    clearGripDragHighlights();
    if (listDragState) {
      finishGripListDrag(lastX, lastY);
    } else {
      card.classList.remove("dragging");
      handle.classList.remove("dragging-active");
      removeDragGhost();
      applyGripDragDrop(card, lastX, lastY);
    }
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    lastX = e.clientX;
    lastY = e.clientY;
    if (listDragState) {
      updateListDragSession(e.clientX, e.clientY);
    } else {
      moveDragGhost(e.clientX, e.clientY);
      updateGripDragHighlights(e.clientX, e.clientY);
    }
  };

  const onMouseUp = () => {
    endDrag();
  };

  handle.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    if (listEl) {
      startListDragSession(card, listEl, lastX, lastY);
    } else {
      card.classList.add("dragging");
      handle.classList.add("dragging-active");
      beginDragGhost(card, lastX, lastY);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  handle.addEventListener("dragstart", (e) => e.preventDefault());
}

function bindTaskEvents(card) {
  const id = card.dataset.id;
  const ctx = card.dataset.context;

  if (!isTouchDevice()) {
    card.draggable = false;
    bindMouseGripDrag(card);
  }

  card.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
    toggleTaskDone(id, ctx, e.target.checked);
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
}

let touchDragPointer = null;

function setupTouchListDrag() {
  if (!isTouchDevice() || setupTouchListDrag.ready) return;
  setupTouchListDrag.ready = true;

  const onPointerMove = (e) => {
    if (!touchDragPointer || e.pointerId !== touchDragPointer.id) return;
    e.preventDefault();
    touchDragPointer.lastX = e.clientX;
    touchDragPointer.lastY = e.clientY;
    if (listDragState) {
      updateListDragSession(e.clientX, e.clientY);
    } else {
      moveTouchDragGhost(e.clientX, e.clientY);
      updateGripDragHighlights(e.clientX, e.clientY);
    }
  };

  const finishTouchDrag = (e) => {
    if (!touchDragPointer || e.pointerId !== touchDragPointer.id) return;
    const { card, handle, lastX, lastY } = touchDragPointer;

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", finishTouchDrag);
    document.removeEventListener("pointercancel", finishTouchDrag);

    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    handle.classList.remove("dragging-active");
    clearGripDragHighlights();
    document.body.classList.remove("task-dragging-lock");
    touchDragPointer = null;

    if (listDragState) {
      listDragState.lastX = lastX;
      listDragState.lastY = lastY;
      finishGripListDrag(lastX, lastY);
      return;
    }

    card.classList.remove("dragging");
    removeTouchDragGhost();
    applyGripDragDrop(card, lastX, lastY);
  };

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      const handle = e.target.closest(".task-drag-handle");
      if (!handle) return;
      const card = handle.closest(".task-card");
      const list = card?.closest("#tier-expand-list, .task-list[data-tier]");
      if (!card || !list) return;

      e.preventDefault();
      e.stopPropagation();

      const lastX = e.clientX;
      const lastY = e.clientY;

      try {
        handle.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      handle.classList.add("dragging-active");
      document.body.classList.add("task-dragging-lock");

      if (list) {
        startListDragSession(card, list, lastX, lastY);
      } else {
        card.classList.add("dragging");
        createTouchDragGhost(card, lastX, lastY);
      }

      touchDragPointer = { card, handle, id: e.pointerId, lastX, lastY };
      document.addEventListener("pointermove", onPointerMove, { passive: false });
      document.addEventListener("pointerup", finishTouchDrag, { passive: true });
      document.addEventListener("pointercancel", finishTouchDrag, { passive: true });

      if (navigator.vibrate) navigator.vibrate(8);
    },
    { capture: true, passive: false }
  );
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
          const list = column.querySelector(".task-list");
          const atStart = list ? isDropAtListStart(list, e.clientY) : false;
          moveTask(data.id, data.context, tier, null, atStart);
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

function renderDailyRepeatPanel() {
  const list = document.getElementById("daily-repeat-list");
  const empty = document.getElementById("daily-repeat-empty");
  if (!list || !empty) return;

  const ctxSelect = document.getElementById("daily-repeat-context");
  if (ctxSelect) {
    ctxSelect.classList.toggle("hidden", filter !== "all");
    if (filter !== "all") ctxSelect.value = filter;
  }

  const tasks = getRepeatDailyTasks();

  if (tasks.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = tasks
    .map(
      (task) => `
    <li class="daily-repeat-item" data-id="${task.id}" data-context="${task.context}">
      <span class="daily-repeat-tier">${TIER_LABELS[task.tier - 1]}</span>
      <span class="daily-repeat-text">${escapeHtml(task.text)}</span>
      <div class="daily-repeat-actions">
        ${filter === "all" ? contextIconHtml(task.context, "brain-ctx-tag") : ""}
        <button type="button" class="daily-repeat-remove" aria-label="Remove from daily repeat">×</button>
      </div>
    </li>`
    )
    .join("");

  list.querySelectorAll(".daily-repeat-remove").forEach((btn) => {
    const item = btn.closest(".daily-repeat-item");
    btn.addEventListener("click", () => {
      removeRepeatDailyTask(item.dataset.id, item.dataset.context);
      renderAll();
    });
  });
}

function setupDailyRepeatForm() {
  const form = document.getElementById("daily-repeat-form");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("daily-repeat-input");
    const tier = Number(document.getElementById("daily-repeat-tier").value);
    const ctxSelect = document.getElementById("daily-repeat-context");
    const ctx = ctxSelect ? ctxSelect.value : filter === "all" ? "work" : filter;
    addRepeatDailyTask(input.value, tier, ctx);
    input.value = "";
    input.focus();
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

function getEarliestCompletedDay() {
  let earliest = null;
  CONTEXTS.forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.completedAt) return;
      const key = archiveDayKey(t.completedAt);
      if (key === "unknown") return;
      if (!earliest || key < earliest) earliest = key;
    });
  });
  return earliest;
}

function ensureAppStartedDay() {
  try {
    if (localStorage.getItem(APP_STARTED_KEY)) return;
    localStorage.setItem(APP_STARTED_KEY, getEarliestCompletedDay() || todayKey());
  } catch {
    /* ignore */
  }
}

function getAppStartedDay() {
  ensureAppStartedDay();
  try {
    return localStorage.getItem(APP_STARTED_KEY) || todayKey();
  } catch {
    return todayKey();
  }
}

function getCompletedTasksForHistory() {
  const seen = new Set();
  const tasks = [];
  CONTEXTS.forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.done || !t.completedAt) return;
      const key = `${ctx}:${t.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

function historyItemHtml(task) {
  return `
    <li class="history-item" data-id="${task.id}" data-context="${task.context}">
      <span class="history-check" aria-hidden="true">✓</span>
      <div class="history-item-body">
        <span class="history-text">${escapeHtml(task.text)}</span>
        <span class="history-meta">
          <span class="plan-135-tier-badge ${plan135TierBadgeClass(task.tier)}">${TIER_LABELS[task.tier - 1]}</span>
          ${contextIconHtml(task.context, "brain-ctx-tag")}
        </span>
      </div>
    </li>`;
}

function renderHistory() {
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  const subtitle = document.getElementById("history-subtitle");
  if (!list || !empty) return;

  const startedDay = getAppStartedDay();
  const tasks = getCompletedTasksForHistory().filter(
    (t) => archiveDayKey(t.completedAt) >= startedDay
  );

  if (subtitle) {
    const startedLabel = formatArchiveDayHeading(startedDay);
    subtitle.textContent =
      tasks.length === 0
        ? `Completed tasks since ${startedLabel} will appear here.`
        : `${tasks.length} completed task${tasks.length === 1 ? "" : "s"} since ${startedLabel}`;
  }

  if (tasks.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  const groups = new Map();
  tasks.forEach((task) => {
    const key = archiveDayKey(task.completedAt);
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
    <li class="history-day-heading">${formatArchiveDayHeading(dayKey)}</li>
    ${groups.get(dayKey).map((task) => historyItemHtml(task)).join("")}`
    )
    .join("");

  list.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", () => {
      const task = loadTasks(el.dataset.context).find((t) => t.id === el.dataset.id);
      if (task) openEditTaskDialog(task, el.dataset.context);
    });
  });
}

function archivePanelItemHtml(task) {
  return `
    <li class="archive-panel-item" data-id="${task.id}" data-context="${task.context}">
      <div class="archive-panel-item-body">
        <span class="archive-panel-text">${escapeHtml(task.text)}</span>
        <span class="archive-panel-meta">
          <span class="task-dot task-dot-tier-${task.tier}" title="${TIER_NAMES[task.tier - 1]}" aria-label="${TIER_NAMES[task.tier - 1]}"></span>
          <span class="plan-135-tier-badge ${plan135TierBadgeClass(task.tier)}">${TIER_LABELS[task.tier - 1]}</span>
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
  if (page === "history") {
    renderHistory();
  }
  if (page === "tasks") {
    renderGrid();
    renderPlan135();
    renderBrainPanel();
    renderDailyRepeatPanel();
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
clearExpiredDeferredTasks();
resetRepeatDailyTasksIfNeeded();
ensureAppStartedDay();

document.documentElement.dataset.font = getFont();
applyTheme();

setupDateHeader();
setupThemePicker();
setupTimePreviewPicker();
setupThemeSchedule();
setupFontPicker();
setupHomeDesignPicker();
setupNavigation();
setupDropZones();
setupTouchListDrag();
setupSidebarTabs();
setSidebarCollapsed(getSidebarCollapsed());
setupTaskDialog();
setupBrainDumpForms();
setupDailyRepeatForm();
setupDataSync();
setupTierExpand();
setupReflection();
setupMode135();
setupForgetIt();
setupPriorityVisibilityTags();
updateBoardHint();

setPage(page, filter);
