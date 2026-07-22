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
const DISPLAY_NAME_KEY = "priority-grid-display-name";
const DEFAULT_DISPLAY_NAME = "Friend";

const HOME_DESIGNS = [
  { id: "apple", name: "Apple Music" },
  { id: "classic", name: "Classic" },
];

const PLAN_135_SLOTS = [
  { group: "big", label: "Big Task", number: "01", count: 1 },
  { group: "medium", label: "Medium Tasks", number: "02", count: 3 },
  { group: "small", label: "Small Tasks", number: "03", count: 5 },
];

const BUILTIN_CONTEXTS = ["work", "home", "personal", "errands", "health", "faith"];
const CUSTOM_CONTEXTS_KEY = "priority-grid-custom-contexts";
const BUILTIN_CONTEXT_LABELS = {
  work: "Work",
  home: "Home",
  personal: "Personal",
  errands: "Errands",
  health: "Health",
  faith: "Faith",
};
const CONTEXT_ICON_IDS = {
  work: "icon-briefcase",
  home: "icon-house",
  personal: "icon-user",
  errands: "icon-clipboard",
  health: "icon-wellness",
  faith: "icon-leaf",
};
const CUSTOM_LIST_ICONS = [
  "icon-box",
  "icon-star",
  "icon-sun",
  "icon-heart",
  "icon-cloud",
  "icon-briefcase",
  "icon-house",
  "icon-user",
  "icon-clipboard",
  "icon-wellness",
  "icon-leaf",
  "icon-calendar",
  "icon-tasks",
];
const DEFAULT_CUSTOM_LIST_ICON = "icon-box";
const LIST_ICON_EDGE = 96;
const MAX_LIST_ICON_DATA_URL = 100000;
const PHOTO_DB_NAME = "priority-grid-media";
const PHOTO_STORE = "photos";
const MAX_TASK_PHOTOS = 4;
const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;
const TIER_LABELS = ["1st", "2nd", "3rd", "4th"];
const isTouchDevice = () => window.matchMedia("(hover: none), (pointer: coarse)").matches;

function isValidCustomListIcon(icon) {
  return CUSTOM_LIST_ICONS.includes(icon);
}

function isValidIconImage(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_LIST_ICON_DATA_URL &&
    /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)
  );
}

function normalizeCustomContext(item) {
  if (!item || typeof item.id !== "string" || typeof item.name !== "string") return null;
  if (BUILTIN_CONTEXTS.includes(item.id)) return null;
  const normalized = {
    id: item.id,
    name: item.name,
    icon: isValidCustomListIcon(item.icon) ? item.icon : DEFAULT_CUSTOM_LIST_ICON,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };
  if (isValidIconImage(item.iconImage)) normalized.iconImage = item.iconImage;
  return normalized;
}

function getCustomContexts() {
  try {
    const saved = localStorage.getItem(CUSTOM_CONTEXTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeCustomContext).filter(Boolean);
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveCustomContexts(list, options = {}) {
  localStorage.setItem(
    CUSTOM_CONTEXTS_KEY,
    JSON.stringify(list.map(normalizeCustomContext).filter(Boolean))
  );
  if (!options.skipSync) markSyncDirty();
}

function getContexts() {
  return [...BUILTIN_CONTEXTS, ...getCustomContexts().map((c) => c.id)];
}

function isValidContext(ctx) {
  return getContexts().includes(ctx);
}

function isValidFilter(value) {
  return value === "all" || isValidContext(value);
}

function slugifyContextName(name) {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "list";
  let id = `custom-${base}`;
  const existing = new Set(getContexts());
  if (!existing.has(id)) return id;
  let n = 2;
  while (existing.has(`${id}-${n}`)) n += 1;
  return `${id}-${n}`;
}

function addCustomContext(name, icon = DEFAULT_CUSTOM_LIST_ICON, iconImage = null) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const id = slugifyContextName(trimmed);
  const entry = {
    id,
    name: trimmed,
    icon: isValidCustomListIcon(icon) ? icon : DEFAULT_CUSTOM_LIST_ICON,
    createdAt: new Date().toISOString(),
  };
  if (isValidIconImage(iconImage)) entry.iconImage = iconImage;
  saveCustomContexts([...getCustomContexts(), entry]);
  rebuildContextUi();
  return id;
}

function renameCustomContext(id, name) {
  const trimmed = name.trim();
  if (!trimmed || BUILTIN_CONTEXTS.includes(id)) return false;
  const next = getCustomContexts().map((c) => (c.id === id ? { ...c, name: trimmed } : c));
  saveCustomContexts(next);
  rebuildContextUi();
  return true;
}

function setCustomContextIcon(id, icon, iconImage = null) {
  if (BUILTIN_CONTEXTS.includes(id)) return false;
  const nextIcon = isValidCustomListIcon(icon) ? icon : null;
  if (!nextIcon && !isValidIconImage(iconImage)) return false;
  const next = getCustomContexts().map((c) => {
    if (c.id !== id) return c;
    const updated = {
      ...c,
      icon: nextIcon || c.icon || DEFAULT_CUSTOM_LIST_ICON,
    };
    if (isValidIconImage(iconImage)) {
      updated.iconImage = iconImage;
    } else if (iconImage === null && nextIcon) {
      delete updated.iconImage;
    }
    return updated;
  });
  saveCustomContexts(next);
  rebuildContextUi();
  return true;
}

function deleteCustomContext(id) {
  if (BUILTIN_CONTEXTS.includes(id)) return false;
  const next = getCustomContexts().filter((c) => c.id !== id);
  saveCustomContexts(next);
  localStorage.removeItem(tasksKey(id));
  localStorage.removeItem(brainDumpKey(id));
  if (filter === id) setFilter("all");
  rebuildContextUi();
  return true;
}

function getExtraContextIds() {
  return getContexts().filter((ctx) => ctx !== "work" && ctx !== "home");
}

function collectCustomTasksPayload() {
  const tasks = {};
  getExtraContextIds().forEach((id) => {
    tasks[id] = loadTasks(id);
  });
  return tasks;
}

function collectCustomBrainDumpPayload() {
  const dumps = {};
  getExtraContextIds().forEach((id) => {
    dumps[id] = loadBrainDump(id);
  });
  return dumps;
}

function mergeCustomContextMeta(localList, remoteList, preferRemote = true) {
  const local = Array.isArray(localList) ? localList : [];
  const remote = Array.isArray(remoteList) ? remoteList : [];
  const byId = new Map();
  const order = [];
  for (const item of local) {
    if (!item?.id) continue;
    byId.set(item.id, item);
    order.push(item.id);
  }
  for (const item of remote) {
    if (!item?.id || BUILTIN_CONTEXTS.includes(item.id)) continue;
    if (byId.has(item.id)) {
      if (preferRemote) byId.set(item.id, item);
    } else {
      byId.set(item.id, item);
      order.push(item.id);
    }
  }
  return order.map((id) => byId.get(id)).filter(Boolean);
}

function openPhotoDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePhotoRecord(record) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).put(record);
    tx.oncomplete = () => resolve(record.id);
    tx.onerror = () => reject(tx.error);
  });
}

async function getPhotoRecord(id) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readonly");
    const req = tx.objectStore(PHOTO_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deletePhotoRecord(id) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
}

async function compressImageFile(file, maxEdge = 1600, quality = 0.82) {
  if (!file?.type?.startsWith("image/")) throw new Error("Not an image");
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageFromDataUrl(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Could not compress image");
  if (blob.size > MAX_PHOTO_BYTES) throw new Error("Photo is too large");
  return blob;
}

async function listIconDataUrlFromFile(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Choose an image file");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image is too large");
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageFromDataUrl(dataUrl);
  const scale = Math.min(1, LIST_ICON_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = LIST_ICON_EDGE;
  canvas.height = LIST_ICON_EDGE;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, LIST_ICON_EDGE, LIST_ICON_EDGE);
  ctx.drawImage(
    img,
    Math.round((LIST_ICON_EDGE - width) / 2),
    Math.round((LIST_ICON_EDGE - height) / 2),
    width,
    height
  );
  let out = canvas.toDataURL("image/png");
  if (out.length > MAX_LIST_ICON_DATA_URL) {
    out = canvas.toDataURL("image/jpeg", 0.88);
  }
  if (!isValidIconImage(out)) throw new Error("Icon is too large after compression");
  return out;
}

async function storeTaskPhotoFromFile(file) {
  const blob = await compressImageFile(file);
  const id = createId();
  await savePhotoRecord({
    id,
    blob,
    mimeType: blob.type || "image/jpeg",
    size: blob.size,
    createdAt: new Date().toISOString(),
  });
  return {
    id,
    name: file.name || "photo.jpg",
    mimeType: blob.type || "image/jpeg",
    size: blob.size,
    createdAt: new Date().toISOString(),
  };
}

async function photoObjectUrl(photoId) {
  const record = await getPhotoRecord(photoId);
  if (!record?.blob) return null;
  return URL.createObjectURL(record.blob);
}

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
    id: "pairing-presence",
    name: "Source Serif 4 + Manrope",
    heading: "Source Serif 4",
    body: "Manrope",
    bodyWeight: 500,
  },
  {
    id: "pairing-playfair-source",
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
  "playfair-inter": "pairing-presence",
  "pairing-3": "pairing-playfair",
  "lora-inter": "pairing-presence",
  "pairing-1": "pairing-presence",
  "pairing-2": "pairing-playfair-sans",
  "pairing-4": "pairing-playfair-sans",
  "pairing-5": "pairing-playfair-sans",
  "pairing-source-sans": "pairing-playfair-sans",
  // Former default / id → Presence type system
  "pairing-playfair-serif": "pairing-presence",
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
let dialogPhotoDraft = [];
let dialogPhotoUrls = [];
let mediaViewerUrls = [];

const TIER_NAMES = ["1st Priority", "2nd Priority", "3rd Priority", "4th Priority"];
const PREVIEW_TASK_LIMIT = 5;
const FOCUS_TIMER_MAX_TASKS = 10;
const FOCUS_TIMER_TASKS_KEY = "priority-grid-focus-timer-tasks";
let focusTimerAttached = [];
let refreshFocusTimerUI = () => {};
let renderFocusTimerChrome = () => {};
let focusCardVisible = false;
let focusCardObserver = null;
let bottomChromeObserver = null;

function syncBottomChrome() {
  const shell = document.querySelector(".mobile-nav-shell");
  if (!shell) {
    document.documentElement.style.setProperty("--bottom-chrome-height", "0px");
    return;
  }

  const style = getComputedStyle(shell);
  if (style.display === "none" || style.visibility === "hidden") {
    document.documentElement.style.setProperty("--bottom-chrome-height", "0px");
    return;
  }

  // Measure the whole chrome (session dock + nav) so content padding stays correct.
  const height = Math.ceil(shell.getBoundingClientRect().height);
  document.documentElement.style.setProperty(
    "--bottom-chrome-height",
    height > 0 ? `${height}px` : "0px"
  );
}

function setupBottomChromeObserver() {
  const shell = document.querySelector(".mobile-nav-shell");
  if (!shell || bottomChromeObserver) return;
  bottomChromeObserver = new ResizeObserver(() => syncBottomChrome());
  bottomChromeObserver.observe(shell);
}

function syncFocusCardVisibility() {
  const card = document.getElementById("focus-timer");
  if (!card || page !== "home") {
    focusCardVisible = false;
    return;
  }
  const rect = card.getBoundingClientRect();
  focusCardVisible = rect.bottom > 12 && rect.top < window.innerHeight - 12;
}

function setupFocusCardObserver() {
  const card = document.getElementById("focus-timer");
  focusCardObserver?.disconnect();
  focusCardObserver = null;

  if (!card || page !== "home") {
    focusCardVisible = false;
    renderFocusTimerChrome();
    syncBottomChrome();
    return;
  }

  syncFocusCardVisibility();

  focusCardObserver = new IntersectionObserver(
    (entries) => {
      const nextVisible = entries.some((entry) => entry.isIntersecting);
      if (nextVisible === focusCardVisible) return;
      focusCardVisible = nextVisible;
      renderFocusTimerChrome();
      syncBottomChrome();
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  focusCardObserver.observe(card);
  renderFocusTimerChrome();
  syncBottomChrome();
}

let focusAlarmCancel = null;

function stopFocusCompleteAlarm() {
  if (focusAlarmCancel) {
    focusAlarmCancel();
    focusAlarmCancel = null;
  }
}

function playFocusCompleteAlarm() {
  stopFocusCompleteAlarm();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  let cancelled = false;
  let ctx = null;
  let loopId = null;

  focusAlarmCancel = () => {
    cancelled = true;
    if (loopId) window.clearInterval(loopId);
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
  };

  try {
    ctx = new AudioCtx();
    const tickTimes = [0, 0.55, 1.1, 1.65];

    const playRound = (baseTime) => {
      if (cancelled || !ctx) return;
      tickTimes.forEach((offset, index) => {
        const start = ctx.currentTime + baseTime + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.07, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    };

    const playAlarmRound = () => {
      if (cancelled || !ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      playRound(0);
    };

    playAlarmRound();
    loopId = window.setInterval(playAlarmRound, 2600);
  } catch {
    stopFocusCompleteAlarm();
  }
}

function loadFocusTimerAttached() {
  try {
    const raw = JSON.parse(localStorage.getItem(FOCUS_TIMER_TASKS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((ref) => ref && ref.id && ref.context)
      .slice(0, FOCUS_TIMER_MAX_TASKS);
  } catch {
    return [];
  }
}

function saveFocusTimerAttached() {
  try {
    localStorage.setItem(FOCUS_TIMER_TASKS_KEY, JSON.stringify(focusTimerAttached));
  } catch {
    /* ignore */
  }
}

function resolveFocusTimerTasks() {
  return focusTimerAttached
    .map((ref) => {
      const task = loadTasks(ref.context).find((t) => t.id === ref.id);
      if (!task || task.archived) return null;
      return { ...task, context: ref.context };
    })
    .filter(Boolean);
}

function getFocusTimerTasksForDisplay() {
  return resolveFocusTimerTasks();
}

function getFocusTimerCandidateTasks() {
  const attachedKeys = new Set(focusTimerAttached.map((r) => `${r.context}:${r.id}`));
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || t.done || isTaskDeferred(t)) return;
      const key = `${ctx}:${t.id}`;
      if (attachedKeys.has(key)) return;
      tasks.push({ ...t, context: ctx });
    });
  });
  tasks.sort((a, b) => a.tier - b.tier || a.text.localeCompare(b.text));
  return tasks;
}

function setupFocusTimer() {
  const root = document.getElementById("focus-timer");
  const display = document.getElementById("focus-timer-display");
  const toggleBtn = document.getElementById("focus-timer-toggle");
  const resetBtn = document.getElementById("focus-timer-reset");
  const customWrap = document.getElementById("focus-timer-custom");
  const customInput = document.getElementById("focus-timer-minutes");
  const setCustomBtn = document.getElementById("focus-timer-set");
  const mini = document.getElementById("focus-timer-mini");
  const miniDock = document.getElementById("focus-timer-mini-dock");
  const miniDisplay = document.getElementById("focus-timer-mini-display");
  const miniToggle = document.getElementById("focus-timer-mini-toggle");
  const miniReset = document.getElementById("focus-timer-mini-reset");
  const attachWrap = document.getElementById("focus-timer-attach");
  const attachList = document.getElementById("focus-timer-attach-list");
  const attachAdd = document.getElementById("focus-timer-attach-add");
  const sessionTasks = document.getElementById("focus-timer-session-tasks");
  const miniTasks = document.getElementById("focus-timer-mini-tasks");
  const miniPresets = document.getElementById("focus-timer-mini-presets");
  const miniCustomWrap = document.getElementById("focus-timer-mini-custom");
  const miniCustomInput = document.getElementById("focus-timer-mini-minutes");
  const miniSetCustomBtn = document.getElementById("focus-timer-mini-set");
  const pickerDialog = document.getElementById("focus-timer-picker-dialog");
  const pickerList = document.getElementById("focus-timer-picker-list");
  const pickerSub = document.getElementById("focus-timer-picker-sub");
  if (!root || !display || !toggleBtn || !resetBtn) return;

  focusTimerAttached = loadFocusTimerAttached();

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

  function isActiveSession() {
    return running || (remainingMs > 0 && remainingMs < durationMs);
  }

  function renderAttachList() {
    if (!attachList) return;
    const tasks = resolveFocusTimerTasks();
    if (tasks.length === 0) {
      attachList.innerHTML = `<li class="focus-timer-attach-empty">None yet — add up to ${FOCUS_TIMER_MAX_TASKS}.</li>`;
    } else {
      attachList.innerHTML = tasks
        .map(
          (task) => `
        <li class="focus-timer-attach-item" data-id="${task.id}" data-context="${task.context}">
          <span class="focus-timer-attach-text">${escapeHtml(task.text)}</span>
          <button type="button" class="focus-timer-attach-remove" aria-label="Remove task">×</button>
        </li>`
        )
        .join("");
      attachList.querySelectorAll(".focus-timer-attach-remove").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.closest(".focus-timer-attach-item");
          if (!item) return;
          focusTimerAttached = focusTimerAttached.filter(
            (ref) => !(ref.id === item.dataset.id && ref.context === item.dataset.context)
          );
          saveFocusTimerAttached();
          renderAttachedSurfaces();
        });
      });
    }
    if (attachAdd) {
      attachAdd.disabled = focusTimerAttached.length >= FOCUS_TIMER_MAX_TASKS;
      attachAdd.textContent =
        focusTimerAttached.length >= FOCUS_TIMER_MAX_TASKS
          ? `Full (${FOCUS_TIMER_MAX_TASKS})`
          : "Add task";
    }
  }

  function purgeDoneFocusTasks() {
    focusTimerAttached = focusTimerAttached.filter((ref) => {
      const task = loadTasks(ref.context).find((t) => t.id === ref.id);
      return task && !task.done;
    });
    saveFocusTimerAttached();
  }

  function syncPresetButtons(minutes) {
    document.querySelectorAll(".focus-timer-preset").forEach((preset) => {
      const value = preset.dataset.minutes;
      preset.classList.toggle("active", value !== "custom" && Number(value) === minutes);
    });
    document.querySelectorAll(".focus-timer-mini-preset").forEach((preset) => {
      const value = preset.dataset.minutes;
      preset.classList.toggle("active", value !== "custom" && Number(value) === minutes);
    });
  }

  function bindFocusTimerTaskRow(row, onDoneChange) {
    const id = row.dataset.id;
    const ctx = row.dataset.context;
    row.querySelector('input[type="checkbox"]')?.addEventListener("change", (e) => {
      toggleTaskDone(id, ctx, e.target.checked);
      onDoneChange?.();
    });
    bindAttachmentIndicator(row, id, ctx);
    row.querySelector(".focus-timer-session-text, .focus-timer-mini-task-text")?.addEventListener("click", () => {
      const task = loadTasks(ctx).find((t) => t.id === id);
      if (task) openTaskMediaViewer(task);
    });
  }

  function focusTimerTaskRowHtml(task, { itemClass, checkClass, textClass }) {
    return `
      <li class="${itemClass}${task.done ? " done" : ""}" data-id="${task.id}" data-context="${task.context}">
        <label class="plan-card-check ${checkClass}">
          <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
        </label>
        <button type="button" class="${textClass}" title="View details">${escapeHtml(task.text)}</button>
        ${taskAttachmentIndicatorHtml(task)}
      </li>`;
  }

  function renderSessionTasks() {
    const timerDone = !running && remainingMs === 0;
    const tasks = getFocusTimerTasksForDisplay();
    const active = isActiveSession();
    const showTasks = (active || timerDone) && tasks.length > 0;

    if (sessionTasks) {
      if (!showTasks) {
        sessionTasks.classList.add("hidden");
        sessionTasks.innerHTML = "";
      } else {
        sessionTasks.classList.remove("hidden");
        sessionTasks.innerHTML = tasks
          .map((task) =>
            focusTimerTaskRowHtml(task, {
              itemClass: "focus-timer-session-item",
              checkClass: "focus-timer-session-check",
              textClass: "focus-timer-session-text",
            })
          )
          .join("");
        sessionTasks.querySelectorAll(".focus-timer-session-item").forEach((row) => {
          bindFocusTimerTaskRow(row, renderAttachedSurfaces);
        });
      }
    }

    if (miniTasks) {
      if (!showTasks) {
        miniTasks.classList.add("hidden");
        miniTasks.innerHTML = "";
      } else {
        miniTasks.classList.remove("hidden");
        miniTasks.innerHTML = tasks
          .map((task) =>
            focusTimerTaskRowHtml(task, {
              itemClass: "focus-timer-mini-task",
              checkClass: "focus-timer-mini-check",
              textClass: "focus-timer-mini-task-text",
            })
          )
          .join("");
        miniTasks.querySelectorAll(".focus-timer-mini-task").forEach((row) => {
          bindFocusTimerTaskRow(row, renderAttachedSurfaces);
        });
      }
    }
  }

  function renderAttachedSurfaces() {
    renderAttachList();
    renderSessionTasks();
  }

  function openFocusTimerPicker() {
    if (!pickerDialog || !pickerList) return;
    const remaining = FOCUS_TIMER_MAX_TASKS - focusTimerAttached.length;
    if (remaining <= 0) return;
    const candidates = getFocusTimerCandidateTasks();
    if (pickerSub) {
      pickerSub.textContent = `Pick up to ${remaining} more open task${remaining === 1 ? "" : "s"}.`;
    }
    if (candidates.length === 0) {
      pickerList.innerHTML = `<li class="plan-135-picker-empty">No open tasks left to attach.</li>`;
    } else {
      pickerList.innerHTML = buildPickerListHtml(candidates);
      pickerList.querySelectorAll(".plan-135-picker-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (focusTimerAttached.length >= FOCUS_TIMER_MAX_TASKS) return;
          const exists = focusTimerAttached.some(
            (ref) => ref.id === btn.dataset.id && ref.context === btn.dataset.context
          );
          if (!exists) {
            focusTimerAttached.push({ id: btn.dataset.id, context: btn.dataset.context });
            saveFocusTimerAttached();
            renderAttachedSurfaces();
          }
          if (focusTimerAttached.length >= FOCUS_TIMER_MAX_TASKS) {
            pickerDialog.close();
          } else {
            openFocusTimerPicker();
          }
        });
      });
    }
    pickerDialog.showModal();
  }

  function render() {
    const timeText = formatTime(remainingMs);
    display.textContent = timeText;
    if (miniDisplay) miniDisplay.textContent = timeText;

    const done = !running && remainingMs === 0;
    const active = isActiveSession();
    const sessionActive = active || done;
    syncFocusCardVisibility();
    const showMiniBar = sessionActive && !focusCardVisible;
    root.classList.toggle("is-running", running);
    root.classList.toggle("is-active", active);
    root.classList.toggle("is-done", done);

    const toggleLabel = document.getElementById("focus-timer-toggle-label");
    if (toggleLabel) {
      toggleLabel.textContent = running ? "Pause" : done ? "Start Focus" : active ? "Resume" : "Start Focus";
    }
    toggleBtn.classList.toggle("is-pause", running);

    if (mini) {
      if (miniDock && mini.parentElement !== miniDock) miniDock.appendChild(mini);
      mini.classList.toggle("hidden", !showMiniBar);
    }
    document.body.classList.toggle("focus-timer-visible", showMiniBar);
    document.body.classList.remove("focus-timer-nav-dock", "focus-timer-home-card");
    document.body.classList.toggle("focus-timer-session", sessionActive);
    document.body.classList.toggle("focus-timer-done", done);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      if (showMiniBar) {
        themeMeta.setAttribute("content", done ? "#ffdbd2" : "#0e3030");
      } else if (!themeMeta.dataset.locked) {
        const effective = document.documentElement.dataset.theme;
        themeMeta.setAttribute(
          "content",
          effective === "midnight" ? "#0e303b" : effective === "terracotta" ? "#fff9f9" : "#fef7f4"
        );
      }
    }

    if (mini) {
      mini.classList.toggle("is-running", running);
      mini.classList.toggle("is-active", active);
      mini.classList.toggle("is-done", done);
    }

    if (miniToggle) {
      miniToggle.textContent = running ? "Pause" : done ? "Start" : "Resume";
      miniToggle.classList.toggle("is-resume", !running && (active || done));
    }

    root.classList.toggle("focus-timer-show-presets", done);
    if (miniPresets) miniPresets.classList.toggle("hidden", !done);
    if (miniCustomWrap) miniCustomWrap.classList.add("hidden");

    if (attachWrap) attachWrap.classList.toggle("hidden", active || done);
    renderAttachedSurfaces();

    const displayTasks = getFocusTimerTasksForDisplay();
    const hasTaskRows = showMiniBar && displayTasks.length > 0;
    document.body.classList.toggle("focus-timer-has-tasks", hasTaskRows);
    syncFocusTimerOffset();
    syncBottomChrome();
    requestAnimationFrame(() => {
      syncFocusTimerOffset();
      syncBottomChrome();
    });
  }

  function syncFocusTimerOffset() {
    if (!mini || mini.classList.contains("hidden")) {
      document.body.style.removeProperty("--focus-timer-offset");
      return;
    }
    const height = Math.ceil(mini.getBoundingClientRect().height);
    if (height > 0) {
      document.body.style.setProperty("--focus-timer-offset", `${height}px`);
    }
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
    playFocusCompleteAlarm();
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

  function scrollToMiniBubble() {
    if (!mini || mini.classList.contains("hidden")) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function start() {
    stopFocusCompleteAlarm();
    if (remainingMs <= 0) remainingMs = durationMs;
    endsAt = Date.now() + remainingMs;
    running = true;
    clearTick();
    intervalId = window.setInterval(tick, 250);
    render();
    scrollToMiniBubble();
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
    stopFocusCompleteAlarm();
    running = false;
    remainingMs = durationMs;
    clearTick();
    purgeDoneFocusTasks();
    customWrap?.classList.add("hidden");
    miniCustomWrap?.classList.add("hidden");
    render();
  }

  function resetFromMini() {
    reset();
    if (page === "home") {
      root?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function setDurationMinutes(mins) {
    stopFocusCompleteAlarm();
    const safe = Math.min(180, Math.max(1, Math.round(Number(mins) || 20)));
    durationMs = safe * 60 * 1000;
    remainingMs = durationMs;
    running = false;
    clearTick();
    syncPresetButtons(safe);
    customWrap?.classList.add("hidden");
    miniCustomWrap?.classList.add("hidden");
    render();
  }

  refreshFocusTimerUI = render;
  renderFocusTimerChrome = render;

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

  document.querySelectorAll(".focus-timer-mini-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.minutes;
      document.querySelectorAll(".focus-timer-mini-preset").forEach((preset) => {
        preset.classList.toggle("active", preset === btn);
      });
      if (value === "custom") {
        miniCustomWrap?.classList.remove("hidden");
        miniCustomInput?.focus();
        return;
      }
      miniCustomWrap?.classList.add("hidden");
      setDurationMinutes(value);
    });
  });

  setCustomBtn?.addEventListener("click", () => {
    setDurationMinutes(customInput?.value);
    customWrap?.classList.add("hidden");
  });

  miniSetCustomBtn?.addEventListener("click", () => {
    setDurationMinutes(miniCustomInput?.value);
    miniCustomWrap?.classList.add("hidden");
  });

  customInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setDurationMinutes(customInput.value);
      customWrap?.classList.add("hidden");
    }
  });

  miniCustomInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setDurationMinutes(miniCustomInput.value);
      miniCustomWrap?.classList.add("hidden");
    }
  });

  toggleBtn.addEventListener("click", () => {
    if (running) pause();
    else start();
  });

  resetBtn.addEventListener("click", reset);
  miniToggle?.addEventListener("click", () => {
    if (running) pause();
    else start();
  });
  miniReset?.addEventListener("click", resetFromMini);
  attachAdd?.addEventListener("click", openFocusTimerPicker);
  document.getElementById("focus-timer-picker-close")?.addEventListener("click", () => {
    pickerDialog?.close();
  });
  document.getElementById("focus-timer-picker-done")?.addEventListener("click", () => {
    pickerDialog?.close();
  });
  setupFocusCardObserver();
  setupBottomChromeObserver();
  if (mini && typeof ResizeObserver !== "undefined") {
    const miniResizeObserver = new ResizeObserver(() => {
      syncFocusTimerOffset();
      syncBottomChrome();
    });
    miniResizeObserver.observe(mini);
  }
  window.addEventListener("resize", () => {
    syncBottomChrome();
    syncFocusTimerOffset();
  });
  render();
  syncPresetButtons(20);
}

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

function getDeferredNextWeekTasks() {
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || !isTaskDeferred(t)) return;
      tasks.push({ ...t, context: ctx });
    });
  });
  tasks.sort((a, b) => {
    const byDate = String(a.deferredUntil).localeCompare(String(b.deferredUntil));
    if (byDate !== 0) return byDate;
    return a.tier - b.tier || a.text.localeCompare(b.text);
  });
  return tasks;
}

function undeferTask(id, ctx) {
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      const { deferredUntil: _removed, ...rest } = t;
      return rest;
    })
  );
  renderAll();
}

function getVisibleTasks() {
  const include = (t) => !t.archived && !isTaskDeferred(t);
  if (filter === "all") {
    return getContexts().flatMap((ctx) =>
      loadTasks(ctx).filter(include).map((t) => ({ ...t, context: ctx }))
    );
  }
  return loadTasks(filter).filter(include).map((t) => ({ ...t, context: filter }));
}

function getArchivedTasks() {
  const include = (t) => t.archived;
  if (filter === "all") {
    return getContexts().flatMap((ctx) =>
      loadTasks(ctx).filter(include).map((t) => ({ ...t, context: ctx }))
    );
  }
  return loadTasks(filter).filter(include).map((t) => ({ ...t, context: filter }));
}

function getVisibleBrainDump() {
  if (filter === "all") {
    return getContexts().flatMap((ctx) =>
      loadBrainDump(ctx).map((item) => ({ ...item, context: ctx }))
    );
  }
  return loadBrainDump(filter).map((item) => ({ ...item, context: filter }));
}

function getBrainDumpContexts() {
  return filter === "all" ? getContexts() : [filter];
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
    version: 2,
    exportedAt: new Date().toISOString(),
    work: loadTasks("work"),
    home: loadTasks("home"),
    brainDumpWork: loadBrainDump("work"),
    brainDumpHome: loadBrainDump("home"),
    customContexts: getCustomContexts(),
    customTasks: collectCustomTasksPayload(),
    customBrainDump: collectCustomBrainDumpPayload(),
    displayName: getDisplayName(),
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
      if (Array.isArray(data.customContexts)) {
        saveCustomContexts(data.customContexts);
        const customTasks = data.customTasks || {};
        const customBrain = data.customBrainDump || {};
        data.customContexts.forEach((c) => {
          if (!c?.id) return;
          if (Array.isArray(customTasks[c.id])) saveTasks(c.id, customTasks[c.id]);
          if (Array.isArray(customBrain[c.id])) saveBrainDump(c.id, customBrain[c.id]);
        });
      }
      if (data.theme && THEMES.some((t) => t.id === data.theme)) setTheme(data.theme);
      if (data.font && FONTS.some((f) => f.id === data.font)) setFont(data.font);
      if (typeof data.displayName === "string") setDisplayName(data.displayName, { skipSync: true });
      rebuildContextUi();
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
    version: 2,
    updatedAt: new Date().toISOString(),
    work: loadTasks("work"),
    home: loadTasks("home"),
    brainDumpWork: loadBrainDump("work"),
    brainDumpHome: loadBrainDump("home"),
    customContexts: getCustomContexts(),
    customTasks: collectCustomTasksPayload(),
    customBrainDump: collectCustomBrainDumpPayload(),
    plans: collectPlan135FromStorage(),
    nextWeek: collectNextWeekFromStorage(),
    forgetIt: collectNextWeekFromStorage(),
    displayName: getDisplayName(),
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
  const custom = payload.customTasks || {};
  const customCount = Object.values(custom).reduce(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0
  );
  return (payload.work?.length || 0) + (payload.home?.length || 0) + customCount;
}

function countLocalTasks() {
  return getContexts().reduce((sum, ctx) => sum + loadTasks(ctx).length, 0);
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

  if (Array.isArray(payload.customContexts) || getCustomContexts().length > 0) {
    saveCustomContexts(
      mergeCustomContextMeta(getCustomContexts(), payload.customContexts || [], preferRemote),
      skipSync
    );
  }

  if (typeof payload.displayName === "string" && payload.displayName.trim()) {
    if (preferRemote || getDisplayName() === DEFAULT_DISPLAY_NAME) {
      setDisplayName(payload.displayName, { skipSync: true });
    }
  }

  const remoteCustomTasks = payload.customTasks || {};
  const remoteCustomBrain = payload.customBrainDump || {};
  const customIds = new Set([
    ...getCustomContexts().map((c) => c.id),
    ...Object.keys(remoteCustomTasks),
    ...Object.keys(remoteCustomBrain),
  ]);
  customIds.forEach((id) => {
    if (id === "work" || id === "home") return;
    if (Array.isArray(remoteCustomTasks[id]) || loadTasks(id).length > 0) {
      saveTasks(id, mergeTaskLists(loadTasks(id), remoteCustomTasks[id] || [], preferRemote), skipSync);
    }
    if (Array.isArray(remoteCustomBrain[id]) || loadBrainDump(id).length > 0) {
      saveBrainDump(
        id,
        mergeBrainLists(loadBrainDump(id), remoteCustomBrain[id] || [], preferRemote),
        skipSync
      );
    }
  });

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

  rebuildContextUi();

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
        getContexts().some((ctx) => loadTasks(ctx).length > 0 || loadBrainDump(ctx).length > 0);
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
    if (saved === "home" || saved === "tasks" || saved === "history" || saved === "settings") return saved;
    if (saved === "brain-dump") return "tasks";
    if (saved === "profile") return "settings";
  } catch {
    /* ignore */
  }
  return "home";
}

function getFilter() {
  try {
    const saved = localStorage.getItem(FILTER_KEY);
    if (isValidFilter(saved)) return saved;
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
  return "pairing-presence";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function contextLabel(ctx) {
  if (BUILTIN_CONTEXT_LABELS[ctx]) return BUILTIN_CONTEXT_LABELS[ctx];
  return getCustomContexts().find((c) => c.id === ctx)?.name || ctx;
}

function contextIconId(ctx) {
  if (CONTEXT_ICON_IDS[ctx]) return CONTEXT_ICON_IDS[ctx];
  const custom = getCustomContexts().find((c) => c.id === ctx);
  if (custom?.icon && isValidCustomListIcon(custom.icon)) return custom.icon;
  return DEFAULT_CUSTOM_LIST_ICON;
}

function contextIconImage(ctx) {
  const custom = getCustomContexts().find((c) => c.id === ctx);
  return isValidIconImage(custom?.iconImage) ? custom.iconImage : null;
}

function contextIconHtml(ctx, className = "context-icon") {
  const label = contextLabel(ctx);
  const image = contextIconImage(ctx);
  if (image) {
    return `<span class="${className} ${className}--image context-icon--image" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><img class="context-icon-img" src="${image}" alt="" /></span>`;
  }
  const iconId = contextIconId(ctx);
  return `<span class="${className}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><svg class="icon ${className}-svg" aria-hidden="true"><use href="#${iconId}"></use></svg></span>`;
}

function archiveButtonHtml() {
  return `<button type="button" class="archive-btn" aria-label="Archive task" title="Archive task"><svg class="icon icon-archive-btn" aria-hidden="true"><use href="#icon-archive"></use></svg></button>`;
}

function taskHasNotes(task) {
  return Boolean(task?.notes?.trim());
}

function taskHasPhotos(task) {
  return Array.isArray(task?.photos) && task.photos.length > 0;
}

function taskAttachmentIndicatorHtml(task) {
  const hasNotes = taskHasNotes(task);
  const hasPhotos = taskHasPhotos(task);
  if (!hasNotes && !hasPhotos) return "";
  const bits = [];
  if (hasNotes) {
    bits.push(
      `<span class="task-attach-chip" title="Has notes" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#icon-note"></use></svg></span>`
    );
  }
  if (hasPhotos) {
    const count = task.photos.length;
    bits.push(
      `<span class="task-attach-chip" title="${count} photo${count === 1 ? "" : "s"}" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#icon-image"></use></svg>${count > 1 ? `<span class="task-attach-count">${count}</span>` : ""}</span>`
    );
  }
  const label = [
    hasNotes ? "notes" : null,
    hasPhotos ? "photos" : null,
  ]
    .filter(Boolean)
    .join(" and ");
  return `<button type="button" class="task-attach-btn" aria-label="View ${label}" title="View ${label}">${bits.join("")}</button>`;
}

function sidebarContextIconHtml(ctx) {
  return filter === "all" ? contextIconHtml(ctx, "context-icon sidebar-row-context-icon") : "";
}

const TIER_ICON_IDS = ["icon-star", "icon-sun", "icon-leaf", "icon-box"];
const TIER_UNCATEGORIZED_ICON = "icon-cloud";

function tierIconHtml(tier, className = "tier-icon") {
  const hasTier = Number.isFinite(tier) && tier >= 1 && tier <= 4;
  const iconId = hasTier ? TIER_ICON_IDS[tier - 1] : TIER_UNCATEGORIZED_ICON;
  const label = hasTier ? TIER_NAMES[tier - 1] : "Uncategorized";
  return `<span class="${className}" title="${label}" aria-label="${label}"><svg class="icon tier-icon-svg" aria-hidden="true"><use href="#${iconId}"></use></svg></span>`;
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

function getDisplayName() {
  try {
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (typeof saved === "string") {
      const trimmed = saved.trim();
      if (trimmed) return trimmed.slice(0, 24);
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_DISPLAY_NAME;
}

function setDisplayName(name, options = {}) {
  const trimmed = String(name || "").trim().slice(0, 24);
  const next = trimmed || DEFAULT_DISPLAY_NAME;
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, next);
  } catch {
    /* ignore */
  }
  if (!options.skipSync) markSyncDirty();
  syncDisplayNameUi();
  return next;
}

function syncDisplayNameUi() {
  const name = getDisplayName();
  document.querySelectorAll("[data-display-name]").forEach((el) => {
    el.textContent = name;
  });
  const input = document.getElementById("display-name-input");
  if (input && document.activeElement !== input) input.value = name === DEFAULT_DISPLAY_NAME ? "" : name;
}

function setupDisplayName() {
  const input = document.getElementById("display-name-input");
  syncDisplayNameUi();
  if (!input || input.dataset.bound) return;
  input.dataset.bound = "1";
  input.value = getDisplayName() === DEFAULT_DISPLAY_NAME ? "" : getDisplayName();

  const commit = () => {
    setDisplayName(input.value);
  };
  input.addEventListener("change", commit);
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
  });
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

  syncDisplayNameUi();
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

function formatNextWeekReturnLabel(dayKey = getNextMondayKey()) {
  const [y, m, d] = String(dayKey).split("-").map(Number);
  if (!y || !m || !d) return "next Monday";
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function showAppToast(message) {
  let el = document.getElementById("app-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast";
    el.className = "app-toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  window.clearTimeout(showAppToast._timer);
  showAppToast._timer = window.setTimeout(() => {
    el.classList.remove("is-visible");
  }, 3400);
}

function clearExpiredDeferredTasks() {
  const today = todayKey();
  getContexts().forEach((ctx) => {
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

  getContexts().forEach((ctx) => {
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
    return getContexts().flatMap((ctx) =>
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
  const task = findTaskByRef(ref);
  const deferredUntil = getNextMondayKey();
  updateTaskInContext(ref.context, (list) =>
    list.map((t) => (t.id === ref.id ? { ...t, deferredUntil } : t))
  );
  clearNextWeek();
  renderAll();
  const when = formatNextWeekReturnLabel(deferredUntil);
  const listName = contextLabel(ref.context);
  if (task?.text) {
    showAppToast(`“${task.text}” returns ${when} in ${listName}`);
  } else {
    showAppToast(`Task returns ${when} in ${listName}`);
  }
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

const GRIP_DRAG_CARD_SELECTOR =
  ".task-card, .plan-card-task:not(.completed-wins-item):not(.history-wins-item)";
const GRIP_DRAG_LIST_SELECTOR =
  "#tier-expand-list, .task-list[data-tier], .plan-card-list[data-tier]";

function queryGripDragCards(listEl) {
  return [...listEl.querySelectorAll(GRIP_DRAG_CARD_SELECTOR)];
}

function gripDragCardFromHandle(handle) {
  return handle?.closest(GRIP_DRAG_CARD_SELECTOR) || null;
}

function gripDragListFromCard(card) {
  return card?.closest(GRIP_DRAG_LIST_SELECTOR) || null;
}

function isHomePriorityDragCard(card) {
  return Boolean(
    card?.matches?.(".plan-card-task:not(.completed-wins-item):not(.history-wins-item)") &&
      card.closest(".plan-card-list[data-tier]")
  );
}

function computeListReorder(listEl, draggedId, clientY) {
  const cards = queryGripDragCards(listEl);
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

function sortTierTasksForDisplay(tasks, tier) {
  const ordered = sortTasksByTierDisplayOrder(tasks, tier);
  const incomplete = [];
  const complete = [];
  for (const task of ordered) {
    (task.done ? complete : incomplete).push(task);
  }
  return [...incomplete, ...complete];
}

function getTierTasksAllContexts(tier) {
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.archived && !isTaskDeferred(t) && t.tier === tier) {
        tasks.push({ ...t, context: ctx });
      }
    });
  });
  return tasks;
}

function persistTierOrderAfterToggle(tier) {
  const tasks = sortTierTasksForDisplay(getTierTasksAllContexts(tier), tier);
  saveTierDisplayOrder(
    tier,
    tasks.map(({ id, context }) => ({ id, context }))
  );
  const byCtx = new Map();
  tasks.forEach(({ id, context }) => {
    if (!byCtx.has(context)) byCtx.set(context, []);
    byCtx.get(context).push(id);
  });
  byCtx.forEach((ids, ctx) => reorderTierTasksInContext(ctx, tier, ids));
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
  const cards = queryGripDragCards(listEl);
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

  const cards = queryGripDragCards(listEl);
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
  listEl.querySelectorAll(GRIP_DRAG_CARD_SELECTOR).forEach((c) => {
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
  const cards = queryGripDragCards(listEl);
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
  const firstCard = listEl.querySelector(GRIP_DRAG_CARD_SELECTOR);
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
  let title = "My Day";
  if (page === "history") {
    title = "History";
  } else if (page === "settings") {
    title = "Settings";
  } else if (page === "tasks") {
    if (filter === "all") title = "All Tasks";
    else if (filter === "work") title = "Work Tasks";
    else if (filter === "home") title = "Home Tasks";
    else title = `${contextLabel(filter)} Tasks`;
  }
  document.getElementById("page-title").textContent = title;
  document.getElementById("page-title").classList.toggle("hidden", page === "home" || page === "tasks" || page === "settings");
  document.getElementById("page-header").classList.toggle("hidden", page === "home" || page === "settings");
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
    } else if (page === "settings") {
      active = btn.dataset.page === "settings";
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
    } else if (page === "history") {
      active = btn.dataset.page === "history";
    } else if (page === "settings") {
      active = btn.dataset.page === "settings";
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
  filter = isValidFilter(nextFilter) ? nextFilter : "all";
  localStorage.setItem(PAGE_KEY, page);
  localStorage.setItem(FILTER_KEY, filter);

  document.getElementById("home-page").classList.toggle("hidden", page !== "home");
  document.getElementById("tasks-page").classList.toggle("hidden", page !== "tasks");
  document.getElementById("history-page").classList.toggle("hidden", page !== "history");
  document.getElementById("settings-page")?.classList.toggle("hidden", page !== "settings");

  document.body.dataset.page = page;

  syncNavActive();
  updatePageTitle();
  renderAll();
  setupFocusCardObserver();
  syncBottomChrome();
  requestAnimationFrame(syncBottomChrome);

  if (options.focusBrain) {
    requestAnimationFrame(() => focusBrainPanel());
  }
}

function setFilter(nextFilter) {
  filter = isValidFilter(nextFilter) ? nextFilter : "all";
  localStorage.setItem(FILTER_KEY, filter);
  syncNavActive();
  updatePageTitle();
  renderAll();
}

function openAppearancePanel() {
  setPage("settings");
  requestAnimationFrame(() => {
    document.getElementById("settings-page")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setupScribbleCaptureGesture() {
  if (setupScribbleCaptureGesture.ready) return;
  setupScribbleCaptureGesture.ready = true;

  const IGNORE_SELECTOR = [
    "button",
    "a",
    "input",
    "textarea",
    "select",
    "label",
    "summary",
    "option",
    "dialog",
    "[role='dialog']",
    "[role='button']",
    ".task-drag-handle",
    ".plan-card-drag",
    ".plan-card-check",
    ".task-check",
    ".mobile-nav-shell",
    ".mobile-nav",
    ".capture-clip-fab",
    ".focus-timer-mini",
    ".sidebar",
  ].join(",");

  // Simple horizontal swipe to open Add Task.
  const MIN_DX = 56;
  const MIN_PATH = 56;
  const MAX_MS = 1800;
  const LOCK_PATH = 20;
  const LOCK_DX = 12;
  const SCROLL_ABORT_DY = 28;

  let session = null;
  let inkSvg = null;
  let inkPath = null;

  function ensureInkLayer() {
    if (inkSvg) return;
    inkSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    inkSvg.classList.add("scribble-ink-layer");
    inkSvg.setAttribute("aria-hidden", "true");
    inkPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    inkPath.classList.add("scribble-ink-path");
    inkSvg.appendChild(inkPath);
    document.body.appendChild(inkSvg);
  }

  function clearInk() {
    if (!inkPath) return;
    inkPath.setAttribute("d", "");
    inkSvg?.classList.remove("is-visible", "is-fading");
  }

  function drawInk(points) {
    if (!inkPath || points.length < 2) return;
    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    inkPath.setAttribute("d", d);
    inkSvg.classList.add("is-visible");
    inkSvg.classList.remove("is-fading");
  }

  function fadeInk() {
    if (!inkSvg) return;
    inkSvg.classList.add("is-fading");
    window.setTimeout(clearInk, 280);
  }

  function isBlockedTarget(target) {
    if (!(target instanceof Element)) return true;
    if (target.closest(IGNORE_SELECTOR)) return true;
    if (document.querySelector("dialog[open]")) return true;
    return false;
  }

  function analyze(points) {
    if (points.length < 2) return { path: 0, dx: 0, dy: 0 };
    let path = 0;
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      path += Math.hypot(curr.x - prev.x, curr.y - prev.y);
      minX = Math.min(minX, curr.x);
      maxX = Math.max(maxX, curr.x);
      minY = Math.min(minY, curr.y);
      maxY = Math.max(maxY, curr.y);
    }

    return {
      path,
      dx: maxX - minX,
      dy: maxY - minY,
    };
  }

  function isHorizontalSwipe(stats, requireLock) {
    if (requireLock && !session?.locked) return false;
    return stats.dx >= MIN_DX && stats.path >= MIN_PATH && stats.dx >= stats.dy * 1.6;
  }

  function endSession(commit) {
    if (!session) return;
    session = null;
    document.removeEventListener("pointermove", onMove, true);
    document.removeEventListener("pointerup", onUp, true);
    document.removeEventListener("pointercancel", onCancel, true);
    document.removeEventListener("touchmove", onTouchMove, true);
    document.body.classList.remove("scribble-capture-active");

    if (commit) {
      fadeInk();
      if (navigator.vibrate) navigator.vibrate(10);
      openTaskDialog(1);
      return;
    }
    fadeInk();
  }

  function lockSession(e) {
    if (!session || session.locked) return;
    session.locked = true;
    document.body.classList.add("scribble-capture-active");
    try {
      // Capture on the document element so moves keep arriving after scroll intent.
      document.documentElement.setPointerCapture?.(session.id);
    } catch {
      try {
        session.target?.setPointerCapture?.(session.id);
      } catch {
        /* ignore */
      }
    }
    if (e?.cancelable) e.preventDefault();
    drawInk(session.points);
  }

  function onMove(e) {
    if (!session || e.pointerId !== session.id) return;
    const point = { x: e.clientX, y: e.clientY, t: Date.now() };
    const last = session.points[session.points.length - 1];
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
    session.points.push(point);

    const stats = analyze(session.points);
    const elapsed = point.t - session.startedAt;
    const fromStart = {
      dx: Math.abs(point.x - session.points[0].x),
      dy: Math.abs(point.y - session.points[0].y),
    };

    // Abort early if this looks like a vertical scroll.
    if (!session.locked && fromStart.dy > SCROLL_ABORT_DY && fromStart.dy > fromStart.dx * 1.15) {
      endSession(false);
      return;
    }

    // Claim the gesture as soon as horizontal intent is clear (before iOS scrolls).
    if (
      !session.locked &&
      (stats.path >= LOCK_PATH || fromStart.dx >= LOCK_DX) &&
      fromStart.dx >= fromStart.dy * 1.1
    ) {
      lockSession(e);
    }

    if (session.locked) {
      if (e.cancelable) e.preventDefault();
      drawInk(session.points);
    }

    if (elapsed > MAX_MS) {
      endSession(isHorizontalSwipe(analyze(session.points), true));
    }
  }

  // iOS often delivers scroll via touchmove; keep a non-passive listener in lockstep.
  function onTouchMove(e) {
    if (!session || !session.locked) return;
    if (e.cancelable) e.preventDefault();
  }

  function onUp(e) {
    if (!session || e.pointerId !== session.id) return;
    endSession(isHorizontalSwipe(analyze(session.points), true));
  }

  function onCancel(e) {
    if (!session || e.pointerId !== session.id) return;
    // If we already locked and have a valid swipe, still commit (cancel mid-stroke on iOS).
    const stats = analyze(session.points);
    endSession(isHorizontalSwipe(stats, true));
  }

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      // Touch / pen only — skip pure mouse on desktop.
      if (e.pointerType === "mouse" && !isTouchDevice()) return;
      if (e.pointerType === "mouse") return;
      if (session || listDragState || document.body.classList.contains("task-dragging-lock")) return;
      if (isBlockedTarget(e.target)) return;

      ensureInkLayer();
      clearInk();
      session = {
        id: e.pointerId,
        startedAt: Date.now(),
        points: [{ x: e.clientX, y: e.clientY, t: Date.now() }],
        locked: false,
        target: e.target instanceof Element ? e.target : document.documentElement,
      };

      document.addEventListener("pointermove", onMove, { capture: true, passive: false });
      document.addEventListener("pointerup", onUp, { capture: true, passive: true });
      document.addEventListener("pointercancel", onCancel, { capture: true, passive: true });
      document.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    },
    { capture: true, passive: true }
  );
}

const NEW_LIST_SELECT_VALUE = "__new_list__";

function contextSelectOptionsHtml(selected = "work") {
  const options = getContexts()
    .map((ctx) => {
      const label = contextLabel(ctx);
      return `<option value="${escapeHtml(ctx)}"${ctx === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
  return `${options}<option value="${NEW_LIST_SELECT_VALUE}">+ New list…</option>`;
}

function syncDialogContextIcon(selectEl, iconEl) {
  if (!iconEl) return;
  const ctx = selectEl?.value || "work";
  if (ctx === NEW_LIST_SELECT_VALUE) return;
  const image = contextIconImage(ctx);
  iconEl.innerHTML = image
    ? `<img class="context-icon-img" src="${image}" alt="" />`
    : `<svg class="icon" aria-hidden="true"><use href="#${contextIconId(ctx)}"></use></svg>`;
  iconEl.title = contextLabel(ctx);
  iconEl.classList.toggle("dialog-list-icon--image", Boolean(image));
}

function contextSelectIconEl(selectEl) {
  if (selectEl?.id === "dialog-context") return document.getElementById("dialog-context-icon");
  if (selectEl?.id === "daily-repeat-context") return document.getElementById("daily-repeat-context-icon");
  return null;
}

function fillContextSelect(selectEl, selected) {
  if (!selectEl) return;
  const value = isValidContext(selected) ? selected : filter === "all" ? "work" : filter;
  const next = isValidContext(value) ? value : "work";
  selectEl.innerHTML = contextSelectOptionsHtml(next);
  selectEl.value = next;
  selectEl.dataset.previousContext = next;
  syncDialogContextIcon(selectEl, contextSelectIconEl(selectEl));
}

function handleContextSelectChange(selectEl) {
  if (!selectEl) return;
  const iconEl = contextSelectIconEl(selectEl);
  if (selectEl.value === NEW_LIST_SELECT_VALUE) {
    const previous = selectEl.dataset.previousContext || "work";
    selectEl.value = isValidContext(previous) ? previous : "work";
    syncDialogContextIcon(selectEl, iconEl);
    openListDialog({
      navigate: false,
      onCreated: (id) => {
        if (!id) return;
        fillContextSelect(selectEl, id);
      },
      onCancel: () => {
        selectEl.value = isValidContext(previous) ? previous : "work";
        selectEl.dataset.previousContext = selectEl.value;
        syncDialogContextIcon(selectEl, iconEl);
      },
    });
    return;
  }
  selectEl.dataset.previousContext = selectEl.value;
  syncDialogContextIcon(selectEl, iconEl);
}

function rebuildContextUi() {
  const pills = document.getElementById("filter-pills");
  if (pills) {
    const allBtn = pills.querySelector('[data-filter="all"]');
    pills.innerHTML = "";
    if (allBtn) {
      allBtn.classList.toggle("active", filter === "all");
      pills.appendChild(allBtn);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-pill${filter === "all" ? " active" : ""}`;
      btn.dataset.filter = "all";
      btn.setAttribute("role", "tab");
      btn.textContent = "All";
      pills.appendChild(btn);
    }
    getContexts().forEach((ctx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-pill${filter === ctx ? " active" : ""}`;
      btn.dataset.filter = ctx;
      if (!BUILTIN_CONTEXTS.includes(ctx) || !["work", "home"].includes(ctx)) {
        btn.dataset.extra = "true";
      }
      btn.setAttribute("role", "tab");
      btn.innerHTML = `${contextIconHtml(ctx, "filter-pill-icon")}<span>${escapeHtml(contextLabel(ctx))}</span>`;
      pills.appendChild(btn);
    });
  }

  const sidebarSlot = document.getElementById("sidebar-extra-lists");
  if (sidebarSlot) {
    sidebarSlot.innerHTML = getExtraContextIds()
      .map(
        (ctx) => `
      <button type="button" class="nav-item" data-page="tasks" data-filter="${escapeHtml(ctx)}" data-extra="true">
        ${contextIconHtml(ctx, "icon-nav")}
        <span class="nav-item-label">${escapeHtml(contextLabel(ctx))}</span>
      </button>`
      )
      .join("");
  }

  fillContextSelect(document.getElementById("dialog-context"), document.getElementById("dialog-context")?.value);
  fillContextSelect(
    document.getElementById("daily-repeat-context"),
    document.getElementById("daily-repeat-context")?.value
  );

  const manager = document.getElementById("lists-manager");
  if (manager) {
    const builtins = BUILTIN_CONTEXTS.map(
      (ctx) => `
      <li class="lists-manager-item lists-manager-item--builtin" data-id="${escapeHtml(ctx)}">
        ${contextIconHtml(ctx, "lists-manager-icon")}
        <span class="lists-manager-name">${escapeHtml(contextLabel(ctx))}</span>
        <span class="lists-manager-badge">Built-in</span>
      </li>`
    ).join("");
    const customs = getCustomContexts();
    const customHtml =
      customs.length === 0
        ? `<li class="lists-manager-empty">No custom lists yet — add one below.</li>`
        : customs
            .map(
              (c) => `
        <li class="lists-manager-item" data-id="${escapeHtml(c.id)}">
          <button type="button" class="lists-manager-icon-btn" data-id="${escapeHtml(c.id)}" title="Cycle preset icon" aria-label="Change preset icon for ${escapeHtml(c.name)}">
            ${contextIconHtml(c.id, "lists-manager-icon")}
          </button>
          <button type="button" class="lists-manager-upload-btn" data-id="${escapeHtml(c.id)}" title="Upload custom icon" aria-label="Upload icon for ${escapeHtml(c.name)}">
            <svg class="icon" aria-hidden="true"><use href="#icon-image"></use></svg>
          </button>
          <span class="lists-manager-name">${escapeHtml(c.name)}</span>
          <button type="button" class="lists-manager-rename" data-id="${escapeHtml(c.id)}">Rename</button>
          <button type="button" class="lists-manager-delete" data-id="${escapeHtml(c.id)}">Delete</button>
        </li>`
            )
            .join("");
    manager.innerHTML = builtins + customHtml;
  }

  if (!isValidFilter(filter)) {
    filter = "all";
    localStorage.setItem(FILTER_KEY, filter);
  }
  syncNavActive();
}

function revokePhotoUrls(urls) {
  urls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  });
  urls.length = 0;
}

async function renderPhotoGrid(gridEl, photos, urlsBucket, onRemove) {
  if (!gridEl) return;
  revokePhotoUrls(urlsBucket);
  if (!photos.length) {
    gridEl.innerHTML = `<p class="dialog-photo-empty">No photos yet.</p>`;
    return;
  }
  const items = await Promise.all(
    photos.map(async (photo) => {
      const url = await photoObjectUrl(photo.id);
      if (url) urlsBucket.push(url);
      return { photo, url };
    })
  );
  gridEl.innerHTML = items
    .map(
      ({ photo, url }) => `
      <figure class="dialog-photo-item" data-photo-id="${escapeHtml(photo.id)}">
        ${url ? `<img src="${url}" alt="${escapeHtml(photo.name || "Photo")}" />` : `<span class="dialog-photo-missing">Missing</span>`}
        <button type="button" class="dialog-photo-remove" data-photo-id="${escapeHtml(photo.id)}" aria-label="Remove photo">×</button>
      </figure>`
    )
    .join("");
  gridEl.querySelectorAll(".dialog-photo-remove").forEach((btn) => {
    btn.addEventListener("click", () => onRemove(btn.dataset.photoId));
  });
}

async function addPhotoToDraft(draft, file, gridEl, urlsBucket, onRemove) {
  if (!file) return;
  if (draft.length >= MAX_TASK_PHOTOS) {
    alert(`You can attach up to ${MAX_TASK_PHOTOS} photos.`);
    return;
  }
  try {
    const meta = await storeTaskPhotoFromFile(file);
    draft.push(meta);
    await renderPhotoGrid(gridEl, draft, urlsBucket, onRemove);
  } catch (err) {
    alert(err?.message || "Could not save that photo.");
  }
}

async function removePhotoFromDraft(draft, photoId, gridEl, urlsBucket, onRemove) {
  const idx = draft.findIndex((p) => p.id === photoId);
  if (idx === -1) return;
  draft.splice(idx, 1);
  await renderPhotoGrid(gridEl, draft, urlsBucket, onRemove);
}

function renderListIconPicker(container, selected = DEFAULT_CUSTOM_LIST_ICON, selectedImage = null) {
  if (!container) return;
  const hasImage = isValidIconImage(selectedImage);
  const current = isValidCustomListIcon(selected) ? selected : DEFAULT_CUSTOM_LIST_ICON;
  container.dataset.selectedIcon = current;
  container.dataset.selectedIconImage = hasImage ? selectedImage : "";
  const uploadPreview = hasImage
    ? `<img class="list-icon-custom-preview" src="${selectedImage}" alt="" />`
    : `<svg class="icon" aria-hidden="true"><use href="#icon-image"></use></svg>`;
  container.innerHTML = `
    <label class="list-icon-option list-icon-option--upload${hasImage ? " is-selected" : ""}" title="Upload custom icon" aria-label="Upload custom icon">
      <input type="file" accept="image/*" class="list-icon-upload-input" hidden />
      ${uploadPreview}
    </label>
    ${CUSTOM_LIST_ICONS.map(
      (iconId) => `
    <button type="button" class="list-icon-option${!hasImage && iconId === current ? " is-selected" : ""}" data-icon="${iconId}" aria-pressed="${!hasImage && iconId === current ? "true" : "false"}" aria-label="${iconId.replace("icon-", "")}">
      <svg class="icon" aria-hidden="true"><use href="#${iconId}"></use></svg>
    </button>`
    ).join("")}
  `;
  if (container.dataset.iconPickerBound) return;
  container.dataset.iconPickerBound = "1";
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button.list-icon-option");
    if (!btn || !container.contains(btn)) return;
    const icon = btn.dataset.icon;
    if (!isValidCustomListIcon(icon)) return;
    renderListIconPicker(container, icon, null);
  });
  container.addEventListener("change", async (e) => {
    const input = e.target.closest(".list-icon-upload-input");
    if (!input || !container.contains(input)) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const dataUrl = await listIconDataUrlFromFile(file);
      renderListIconPicker(
        container,
        container.dataset.selectedIcon || DEFAULT_CUSTOM_LIST_ICON,
        dataUrl
      );
    } catch (err) {
      alert(err?.message || "Could not use that image.");
    }
  });
}

function getSelectedListIcon(container) {
  const icon = container?.dataset.selectedIcon;
  return isValidCustomListIcon(icon) ? icon : DEFAULT_CUSTOM_LIST_ICON;
}

function getSelectedListIconImage(container) {
  const image = container?.dataset.selectedIconImage;
  return isValidIconImage(image) ? image : null;
}

let listDialogOptions = null;

function openListDialog(options = {}) {
  const dialog = document.getElementById("list-dialog");
  const input = document.getElementById("list-dialog-input");
  if (!dialog || !input) return;
  listDialogOptions = options;
  input.value = "";
  renderListIconPicker(document.getElementById("list-dialog-icons"), DEFAULT_CUSTOM_LIST_ICON, null);
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  requestAnimationFrame(() => input.focus());
}

function closeListDialog({ cancelled = false } = {}) {
  const dialog = document.getElementById("list-dialog");
  const options = listDialogOptions;
  listDialogOptions = null;
  if (dialog?.open) dialog.close();
  else dialog?.removeAttribute("open");
  if (cancelled) options?.onCancel?.();
}

function createListFromName(name, icon = DEFAULT_CUSTOM_LIST_ICON, { navigate = true, iconImage = null } = {}) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const id = addCustomContext(trimmed, icon, iconImage);
  if (id && navigate) setPage("tasks", id);
  return id;
}

function setupListsManager() {
  const form = document.getElementById("lists-add-form");
  const input = document.getElementById("lists-add-input");
  const manager = document.getElementById("lists-manager");
  const listDialog = document.getElementById("list-dialog");
  const listForm = document.getElementById("list-dialog-form");
  const listInput = document.getElementById("list-dialog-input");
  const settingsIcons = document.getElementById("lists-add-icons");
  const listIconFileInput = document.getElementById("list-icon-file-input");
  let uploadTargetListId = null;

  renderListIconPicker(settingsIcons, DEFAULT_CUSTOM_LIST_ICON, null);
  renderListIconPicker(document.getElementById("list-dialog-icons"), DEFAULT_CUSTOM_LIST_ICON, null);

  const createFromInput = (el, iconContainer, { navigate = true } = {}) => {
    const id = createListFromName(el?.value, getSelectedListIcon(iconContainer), {
      navigate,
      iconImage: getSelectedListIconImage(iconContainer),
    });
    if (el) el.value = "";
    if (iconContainer) renderListIconPicker(iconContainer, DEFAULT_CUSTOM_LIST_ICON, null);
    return id;
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    createFromInput(input, settingsIcons, { navigate: true });
  });

  document.getElementById("add-list-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openListDialog({ navigate: true });
  });
  document.getElementById("list-dialog-cancel")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeListDialog({ cancelled: true });
  });

  listForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const options = listDialogOptions || { navigate: true };
    const id = createFromInput(listInput, document.getElementById("list-dialog-icons"), {
      navigate: options.navigate !== false && !options.onCreated,
    });
    if (!id) return;
    const onCreated = options.onCreated;
    closeListDialog({ cancelled: false });
    onCreated?.(id);
  });

  listDialog?.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeListDialog({ cancelled: true });
  });

  document.getElementById("dialog-context")?.addEventListener("change", (e) => {
    handleContextSelectChange(e.target);
  });
  document.getElementById("daily-repeat-context")?.addEventListener("change", (e) => {
    handleContextSelectChange(e.target);
  });

  listIconFileInput?.addEventListener("change", async () => {
    const file = listIconFileInput.files?.[0];
    const id = uploadTargetListId;
    listIconFileInput.value = "";
    uploadTargetListId = null;
    if (!file || !id) return;
    try {
      const dataUrl = await listIconDataUrlFromFile(file);
      const current = getCustomContexts().find((c) => c.id === id);
      setCustomContextIcon(id, current?.icon || DEFAULT_CUSTOM_LIST_ICON, dataUrl);
      renderAll();
    } catch (err) {
      alert(err?.message || "Could not use that image.");
    }
  });

  manager?.addEventListener("click", (e) => {
    const iconBtn = e.target.closest(".lists-manager-icon-btn");
    const uploadBtn = e.target.closest(".lists-manager-upload-btn");
    const renameBtn = e.target.closest(".lists-manager-rename");
    const deleteBtn = e.target.closest(".lists-manager-delete");
    if (iconBtn) {
      const id = iconBtn.dataset.id;
      const current = getCustomContexts().find((c) => c.id === id);
      if (!current) return;
      const idx = CUSTOM_LIST_ICONS.indexOf(current.icon || DEFAULT_CUSTOM_LIST_ICON);
      const nextIcon = CUSTOM_LIST_ICONS[(idx + 1) % CUSTOM_LIST_ICONS.length];
      setCustomContextIcon(id, nextIcon, null);
      renderAll();
      return;
    }
    if (uploadBtn) {
      uploadTargetListId = uploadBtn.dataset.id;
      listIconFileInput?.click();
      return;
    }
    if (renameBtn) {
      const id = renameBtn.dataset.id;
      const current = getCustomContexts().find((c) => c.id === id);
      const next = window.prompt("Rename list", current?.name || "");
      if (next == null) return;
      renameCustomContext(id, next);
      renderAll();
      return;
    }
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const current = getCustomContexts().find((c) => c.id === id);
      if (!confirm(`Delete list “${current?.name || id}”? Its tasks will be removed.`)) return;
      deleteCustomContext(id);
      renderAll();
    }
  });
}

function setupNavigation() {
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.nav === "profile" || btn.dataset.nav === "settings") {
        openAppearancePanel();
        return;
      }
      const nextPage = btn.dataset.page;
      if (!nextPage) return;
      const nextFilter = btn.dataset.filter || filter;
      const focusBrain = btn.dataset.focusBrain === "true";
      setPage(nextPage, nextFilter, { focusBrain });
    });
  });

  document.getElementById("sidebar-extra-lists")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    const nextPage = btn.dataset.page;
    if (!nextPage) return;
    setPage(nextPage, btn.dataset.filter || filter);
  });

  document.getElementById("filter-pills")?.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    setFilter(pill.dataset.filter);
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
    sidebarProfileBtn.addEventListener("click", () => setPage("settings"));
  }

  document.getElementById("capture-clip-fab")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      <span class="font-option-name" style="font-family:'${font.heading}',Georgia,serif;font-weight:600">${font.name}</span>
      <span class="font-option-sample" style="font-family:'${font.body}',system-ui,sans-serif;font-weight:${font.bodyWeight || 400}">Aa Bb Cc</span>
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
  return sortTierTasksForDisplay(tasks, tier);
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

let lastWinsArchiveBatch = null;

const HISTORY_ARCHIVE_UNDO_MS = 24 * 60 * 60 * 1000;

function getTaskArchiveTimestamp(task) {
  if (!task?.archived) return null;
  return task.archivedAt || task.completedAt || null;
}

function canUndoHistoryArchive(task) {
  const archivedAt = getTaskArchiveTimestamp(task);
  if (!archivedAt) return false;
  return Date.now() - new Date(archivedAt).getTime() <= HISTORY_ARCHIVE_UNDO_MS;
}

function archiveTask(id, ctx) {
  clearTaskRefs(id, ctx);
  focusTimerAttached = focusTimerAttached.filter(
    (ref) => !(ref.id === id && ref.context === ctx)
  );
  saveFocusTimerAttached();
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

function archiveCompletedTodayWins() {
  const tasks = getCompletedTodayTasks();
  if (tasks.length === 0) return;
  lastWinsArchiveBatch = tasks.map((task) => ({ id: task.id, context: task.context }));
  tasks.forEach((task) => {
    clearTaskRefs(task.id, task.context);
    focusTimerAttached = focusTimerAttached.filter(
      (ref) => !(ref.id === task.id && ref.context === task.context)
    );
  });
  saveFocusTimerAttached();
  const archivedAt = new Date().toISOString();
  const byContext = new Map();
  tasks.forEach((task) => {
    if (!byContext.has(task.context)) byContext.set(task.context, new Set());
    byContext.get(task.context).add(task.id);
  });
  byContext.forEach((ids, ctx) => {
    updateTaskInContext(ctx, (list) =>
      list.map((t) => {
        if (!ids.has(t.id)) return t;
        const next = { ...t, archived: true, archivedAt, done: true };
        if (!next.completedAt) next.completedAt = archivedAt;
        return next;
      })
    );
  });
  renderAll();
}

function restoreTask(id, ctx, skipRender = false, { requireRecentArchive = false } = {}) {
  if (requireRecentArchive) {
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (!task || !canUndoHistoryArchive(task)) return;
  }
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      const { archivedAt: _removed, ...rest } = t;
      return { ...rest, archived: false };
    })
  );
  if (lastWinsArchiveBatch?.length) {
    lastWinsArchiveBatch = lastWinsArchiveBatch.filter(
      (ref) => !(ref.id === id && ref.context === ctx)
    );
    if (lastWinsArchiveBatch.length === 0) lastWinsArchiveBatch = null;
  }
  if (!skipRender) renderAll();
}

function undoLastWinsArchive() {
  if (!lastWinsArchiveBatch?.length) return;
  const batch = lastWinsArchiveBatch;
  lastWinsArchiveBatch = null;
  batch.forEach(({ id, context }) => restoreTask(id, context, true));
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
  const inForgetIt = isTaskForgetIt(task);
  const contextBadge = contextIconHtml(task.context, "task-context-badge");
  const attachHtml = taskAttachmentIndicatorHtml(task);
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
        <div class="task-card-trailing">
          ${contextBadge}
          ${attachHtml}
          ${taskDragHandleHtml()}
        </div>
      </div>
      <div class="task-card-actions">
        ${inForgetIt ? `<span class="forget-it-indicator" title="In Next Week box" aria-label="In Next Week box"><svg class="icon icon-forget-box" aria-hidden="true"><use href="#icon-forget-box"></use></svg></span>` : ""}
        <button type="button" class="edit-btn" aria-label="Edit task"><svg class="icon icon-edit" aria-hidden="true"><use href="#icon-pencil"></use></svg></button>
        ${archiveButtonHtml()}
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
  getContexts().forEach((ctx) => {
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

function getOpenTasksSnapshot() {
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || t.done || isTaskDeferred(t)) return;
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks;
}

function getYesterdayDailySummary() {
  const completed = getCompletedYesterdayTasks();
  const leftOpen = getOpenTasksSnapshot();
  return {
    completedCount: completed.length,
    leftCount: leftOpen.length,
    completed,
    leftOpen,
  };
}

function getCompletedYesterdayTasks() {
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = archiveDayKey(yesterdayDate.toISOString());
  const seen = new Set();
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.done || !t.completedAt) return;
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
  const note = task.notes?.trim()
    ? `<p class="reflection-review-note">${escapeHtml(task.notes.trim())}</p>`
    : "";
  return `
    <li class="reflection-review-item">
      <span class="reflection-review-check" aria-hidden="true">✓</span>
      <div class="reflection-review-body">
        <span class="reflection-review-text">${escapeHtml(task.text)}</span>
        ${note}
        <span class="reflection-review-tier">${TIER_LABELS[task.tier - 1]}${time ? ` · ${time}` : ""} · ${escapeHtml(contextLabel(task.context))}</span>
      </div>
    </li>`;
}

function renderReflectionReview() {
  const list = document.getElementById("reflection-review-list");
  const empty = document.getElementById("reflection-review-empty");
  const subtitle = document.getElementById("reflection-review-subtitle");
  const summary = document.getElementById("reflection-summary");
  const heading = document.getElementById("reflection-review-heading");
  if (!list || !empty) return;

  const { completedCount, leftCount, completed } = getYesterdayDailySummary();

  if (summary) {
    summary.innerHTML = `
      <div class="reflection-summary-stat">
        <span class="reflection-summary-value">${completedCount}</span>
        <span class="reflection-summary-label">completed</span>
      </div>
      <div class="reflection-summary-stat">
        <span class="reflection-summary-value">${leftCount}</span>
        <span class="reflection-summary-label">still open</span>
      </div>`;
  }

  if (subtitle) {
    subtitle.textContent =
      completedCount === 0 && leftCount === 0
        ? "A quiet day — nothing completed, nothing left open."
        : completedCount === 0
          ? `${leftCount} task${leftCount === 1 ? "" : "s"} still open. Reflect on what mattered.`
          : `${completedCount} finished yesterday · ${leftCount} still open today.`;
  }

  if (heading) {
    heading.textContent =
      completedCount === 0 ? "Completed yesterday" : `Completed yesterday (${completedCount})`;
  }

  if (completed.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = completed.map(reflectionReviewItemHtml).join("");
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

function markTaskDone(id, ctx, extras = {}) {
  let tier = null;
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      tier = t.tier;
      const next = {
        ...t,
        done: true,
        completedAt: new Date().toISOString(),
      };
      if (extras.notes !== undefined) next.notes = extras.notes;
      if (extras.photos !== undefined) next.photos = extras.photos;
      return next;
    })
  );
  if (tier != null) persistTierOrderAfterToggle(tier);
  renderAll();
}

function toggleTaskDone(id, ctx, markingDone) {
  let tier = null;
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      tier = t.tier;
      const next = { ...t, done: markingDone };
      if (markingDone) next.completedAt = new Date().toISOString();
      else delete next.completedAt;
      return next;
    })
  );
  if (tier != null) persistTierOrderAfterToggle(tier);
  renderAll();
}

function draftPhotoRemover(draft, gridId, urls) {
  const onRemove = (photoId) => {
    removePhotoFromDraft(draft, photoId, document.getElementById(gridId), urls, onRemove);
  };
  return onRemove;
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
  const returnLabel = formatNextWeekReturnLabel();
  const listName = contextLabel(task.context);
  return `
    <div class="forget-it-task${compact ? " forget-it-task-compact" : ""}">
      <p class="forget-it-task-text">${escapeHtml(task.text)}</p>
      <p class="forget-it-task-meta">
        <span>${TIER_LABELS[task.tier - 1]} Priority</span>
        ${contextIconHtml(task.context, "plan-135-ctx")}
        <span>${escapeHtml(listName)}</span>
      </p>
      <p class="forget-it-destination">
        Goes away until <strong>${escapeHtml(returnLabel)}</strong>, then returns to
        <strong>${escapeHtml(listName)}</strong>.
      </p>
      <div class="forget-it-actions">
        <button type="button" class="forget-it-change-btn">Change</button>
        <button type="button" class="forget-it-toss-btn">Send until ${escapeHtml(returnLabel)}</button>
      </div>
    </div>`;
}

function forgetItEmptyHtml() {
  const returnLabel = formatNextWeekReturnLabel();
  return `
    <div class="forget-it-empty forget-it-drop-zone">
      <p>Pick one task to push until ${escapeHtml(returnLabel)}.</p>
      <p class="forget-it-drop-hint">It will leave your lists until then, then come back to the same category.</p>
      <button type="button" class="forget-it-pick-btn">+ Choose task</button>
    </div>`;
}

function bindForgetItActions(container) {
  container.querySelector(".forget-it-pick-btn")?.addEventListener("click", openForgetItPicker);
  container.querySelector(".forget-it-change-btn")?.addEventListener("click", openForgetItPicker);
  container.querySelector(".forget-it-toss-btn")?.addEventListener("click", deferNextWeekTask);
}

function deferredNextWeekItemHtml(task) {
  const returnLabel = formatNextWeekReturnLabel(task.deferredUntil);
  const listName = contextLabel(task.context);
  return `
    <li class="next-week-deferred-item" data-id="${escapeHtml(task.id)}" data-context="${escapeHtml(task.context)}">
      <div class="next-week-deferred-main">
        <p class="next-week-deferred-text">${escapeHtml(task.text)}</p>
        <p class="next-week-deferred-meta">
          ${contextIconHtml(task.context, "plan-135-ctx")}
          <span>${escapeHtml(listName)}</span>
          <span>·</span>
          <span>Returns ${escapeHtml(returnLabel)}</span>
        </p>
      </div>
      <button type="button" class="next-week-bring-back-btn">Bring back</button>
    </li>`;
}

function renderDeferredNextWeekList() {
  const list = document.getElementById("next-week-deferred-list");
  const empty = document.getElementById("next-week-deferred-empty");
  const count = document.getElementById("next-week-deferred-count");
  if (!list || !empty) return;

  const tasks = getDeferredNextWeekTasks();
  if (count) {
    count.textContent = tasks.length
      ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}`
      : "";
  }

  if (tasks.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = tasks.map(deferredNextWeekItemHtml).join("");
  list.querySelectorAll(".next-week-bring-back-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".next-week-deferred-item");
      if (!row) return;
      undeferTask(row.dataset.id, row.dataset.context);
    });
  });
}

function renderForgetItPanel() {
  const body = document.getElementById("forget-it-body");
  if (!body) return;

  const sub = document.getElementById("forget-it-sub");
  if (sub) {
    sub.textContent = `Park one task until ${formatNextWeekReturnLabel()} — it returns to the same list.`;
  }

  const ref = loadNextWeek();
  const task = findTaskByRef(ref);

  if (!task) {
    if (ref) clearNextWeek();
    body.innerHTML = forgetItEmptyHtml();
    bindForgetItActions(body);
  } else {
    body.innerHTML = forgetItTaskHtml(task);
    bindForgetItActions(body);
  }

  renderDeferredNextWeekList();
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
  const contextBadge = contextIconHtml(task.context, "brain-ctx-tag");
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
          ${taskAttachmentIndicatorHtml(task)}
          ${inForgetIt ? `<span class="forget-it-indicator" title="In Next Week box" aria-label="In Next Week box"><svg class="icon icon-forget-box" aria-hidden="true"><use href="#icon-forget-box"></use></svg></span>` : ""}
        </span>
      </div>
      <div class="task-card-actions">
        ${archiveButtonHtml()}
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
      const moreCount = Math.max(0, tierTasks.length - PREVIEW_TASK_LIMIT);
      const hasMore = moreCount > 0;
      seeAllBtn.classList.toggle("hidden", !hasMore);
      const textEl = seeAllBtn.querySelector(".column-see-all-text");
      const label = hasMore
        ? `+${moreCount} more task${moreCount === 1 ? "" : "s"}`
        : "See all tasks";
      if (textEl) textEl.textContent = label;
      else seeAllBtn.textContent = label;
    }
    const addBtn = document.querySelector(`.column-add[data-tier="${tier}"]`);
    if (addBtn) addBtn.classList.toggle("hidden", tierTasks.length > PREVIEW_TASK_LIMIT);
  }

  syncPriorityVisibilityTags();
}

function getTopPriorityTasks(limit = 5) {
  const visible = getContexts().flatMap((ctx) =>
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
      ${taskAttachmentIndicatorHtml(task)}
      <button type="button" class="plan-card-drag task-drag-handle" tabindex="-1" aria-label="Drag to reorder">
        <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
          <circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/>
          <circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/>
        </svg>
      </button>
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

function figmaPlanCardHtml({ number, variant, title, subtitle, tasks = [], done = 0, total = 0, tier = null }) {
  const listHtml = tasks.map((task) => planCardTaskHtml(task)).join("");
  const taskLabel = subtitle || `${total} task${total === 1 ? "" : "s"}`;
  const tierAttr = tier != null ? ` data-tier="${tier}"` : "";
  const moreCount = Math.max(0, total - tasks.length);
  const moreHtml =
    moreCount > 0 && tier != null
      ? `<button type="button" class="plan-card-more" data-tier="${tier}">+${moreCount} more task${moreCount === 1 ? "" : "s"}</button>`
      : "";

  return `
    <article class="plan-card plan-card--${variant}"${tierAttr}>
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
          <ul class="plan-card-list"${tierAttr}>${listHtml}</ul>
          ${moreHtml}
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
      ${taskAttachmentIndicatorHtml(task)}
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
  const sorted = sortTierTasksForDisplay(getTierTasksAllContexts(tier), tier);
  if (limit == null) return sorted;
  return sorted.slice(0, limit);
}

function getOpenTasksForTiers(tiers, limit) {
  const tasks = [];
  getContexts().forEach((ctx) => {
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
        tier,
      });
    })
    .join("");

  content.innerHTML = `<div class="plan-card-grid plan-card-grid--priorities">${cardsHtml}</div>`;
  bindHomeCardTasks(content);
  content.querySelectorAll(".plan-card-more").forEach((btn) => {
    btn.addEventListener("click", () => openTierExpand(Number(btn.dataset.tier)));
  });
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

  bindAttachmentIndicator(row, id, ctx);

  row.querySelector(".home-card-task-title, .home-task-title, .plan-card-task-text, .completed-wins-text")?.addEventListener("click", () => {
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openEditTaskDialog(task, ctx);
  });

  row.querySelector(".home-task-menu")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openEditTaskDialog(task, ctx);
  });

  if (isHomePriorityDragCard(row) && !isTouchDevice()) {
    bindMouseGripDrag(row);
  }
}

function bindAttachmentIndicator(row, id, ctx) {
  row.querySelector(".task-attach-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openTaskMediaViewer(task);
  });
}

async function openTaskMediaViewer(task) {
  const dialog = document.getElementById("media-viewer-dialog");
  const title = document.getElementById("media-viewer-title");
  const sub = document.getElementById("media-viewer-sub");
  const notesEl = document.getElementById("media-viewer-notes");
  const photosEl = document.getElementById("media-viewer-photos");
  const emptyEl = document.getElementById("media-viewer-empty");
  if (!dialog || !task) return;

  revokePhotoUrls(mediaViewerUrls);
  if (title) title.textContent = task.text || "Attachments";
  if (sub) {
    const parts = [];
    if (taskHasNotes(task)) parts.push("Notes");
    if (taskHasPhotos(task)) {
      parts.push(`${task.photos.length} photo${task.photos.length === 1 ? "" : "s"}`);
    }
    sub.textContent = parts.join(" · ");
  }

  const note = task.notes?.trim() || "";
  if (notesEl) {
    if (note) {
      notesEl.textContent = note;
      notesEl.classList.remove("hidden");
    } else {
      notesEl.textContent = "";
      notesEl.classList.add("hidden");
    }
  }

  const photos = Array.isArray(task.photos) ? task.photos : [];
  if (photosEl) {
    if (!photos.length) {
      photosEl.innerHTML = "";
    } else {
      const items = await Promise.all(
        photos.map(async (photo) => {
          const url = await photoObjectUrl(photo.id);
          if (url) mediaViewerUrls.push(url);
          return { photo, url };
        })
      );
      photosEl.innerHTML = items
        .map(
          ({ photo, url }) => `
        <figure class="media-viewer-photo">
          ${
            url
              ? `<img src="${url}" alt="${escapeHtml(photo.name || "Photo")}" />`
              : `<span class="media-viewer-missing">Photo unavailable</span>`
          }
        </figure>`
        )
        .join("");
    }
  }

  emptyEl?.classList.toggle("hidden", photos.length > 0 || Boolean(note));
  dialog.showModal();
}

function closeTaskMediaViewer() {
  const dialog = document.getElementById("media-viewer-dialog");
  revokePhotoUrls(mediaViewerUrls);
  dialog?.close();
}

function setupMediaViewer() {
  document.getElementById("media-viewer-close")?.addEventListener("click", closeTaskMediaViewer);
  document.getElementById("media-viewer-dialog")?.addEventListener("click", (e) => {
    if (e.target?.id === "media-viewer-dialog") closeTaskMediaViewer();
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
  getContexts().forEach((ctx) => {
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

function getArchivedTodayWinsTasks() {
  const today = archiveDayKey(new Date().toISOString());
  const seen = new Set();
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!t.archived || !t.done || !t.completedAt) return;
      if (archiveDayKey(t.completedAt) !== today) return;
      const key = `${ctx}:${t.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks.sort((a, b) => {
    const aTime = new Date(a.archivedAt || a.completedAt).getTime();
    const bTime = new Date(b.archivedAt || b.completedAt).getTime();
    return bTime - aTime;
  });
}

function completedTodayEmptyHtml() {
  return `
    <article class="plan-card completed-wins-card completed-wins-card--empty">
      <div class="plan-card-inner">
        <div class="completed-wins-card-header">
          <div class="completed-wins-card-heading">
            <h3 class="plan-card-title plan-card-title--featured">Today's Wins</h3>
            <p class="plan-card-subtitle">0 completed</p>
          </div>
        </div>
        <p class="completed-wins-empty-msg">Nothing crossed off yet — your first win of the day is still ahead.</p>
      </div>
    </article>`;
}

function completedWinsItemHtml(task) {
  const time = formatCompletionTime(task.completedAt);
  return `
    <li class="plan-card-task done completed-wins-item" data-id="${task.id}" data-context="${task.context}">
      <label class="plan-card-check">
        <input type="checkbox" checked aria-label="Mark complete" />
      </label>
      <button type="button" class="plan-card-task-text">${escapeHtml(task.text)}</button>
      <button type="button" class="completed-wins-archive" aria-label="Archive task" title="Archive">
        <svg class="icon" aria-hidden="true"><use href="#icon-archive"></use></svg>
      </button>
      ${time ? `<span class="completed-wins-time">${escapeHtml(time)}</span>` : `<span class="completed-wins-time" aria-hidden="true"></span>`}
    </li>`;
}

function completedWinsArchivedItemHtml(task) {
  const time = formatCompletionTime(task.archivedAt || task.completedAt);
  return `
    <li class="plan-card-task done completed-wins-item completed-wins-item--archived" data-id="${task.id}" data-context="${task.context}">
      <label class="plan-card-check">
        <input type="checkbox" checked disabled aria-label="Archived win" />
      </label>
      <span class="plan-card-task-text">${escapeHtml(task.text)}</span>
      <button type="button" class="completed-wins-restore" aria-label="Restore task" title="Restore">
        <span>Restore</span>
      </button>
      ${time ? `<span class="completed-wins-time">${escapeHtml(time)}</span>` : `<span class="completed-wins-time" aria-hidden="true"></span>`}
    </li>`;
}

function completedWinsGroupHtml(tier, tasks) {
  const label = ["1st", "2nd", "3rd", "4th"][tier - 1] || `${tier}`;
  const number = String(tier).padStart(2, "0");
  return `
    <section class="completed-wins-group completed-wins-group--p${tier}" aria-label="${escapeHtml(TIER_NAMES[tier - 1])}">
      <header class="completed-wins-group-header">
        <span class="completed-wins-badge" aria-hidden="true">${number}</span>
        <h4 class="completed-wins-group-title">${escapeHtml(label)}</h4>
        <span class="completed-wins-group-count">${tasks.length}</span>
      </header>
      <ul class="plan-card-list completed-wins-items">
        ${tasks.map(completedWinsItemHtml).join("")}
      </ul>
    </section>`;
}

function completedWinsArchivedSectionHtml(tasks) {
  if (!tasks.length) return "";
  return `
    <section class="completed-wins-archived" aria-label="Archived wins">
      <header class="completed-wins-archived-header">
        <h4 class="completed-wins-archived-title">Archived</h4>
        <span class="completed-wins-group-count">${tasks.length}</span>
      </header>
      <ul class="plan-card-list completed-wins-items completed-wins-items--archived">
        ${tasks.map(completedWinsArchivedItemHtml).join("")}
      </ul>
    </section>`;
}

function bindCompletedWinsActions(content) {
  content.querySelectorAll(".completed-wins-archive").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const row = btn.closest(".completed-wins-item");
      if (!row) return;
      archiveTask(row.dataset.id, row.dataset.context);
    });
  });
  content.querySelectorAll(".completed-wins-restore").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const row = btn.closest(".completed-wins-item");
      if (!row) return;
      restoreTask(row.dataset.id, row.dataset.context);
    });
  });
  content.querySelector("#completed-wins-archive-all")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    archiveCompletedTodayWins();
  });
  content.querySelector("#completed-wins-undo-all")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    undoLastWinsArchive();
  });
}

function renderHomeCompletedToday() {
  const content = document.getElementById("home-completed-content");
  const section = document.querySelector(".presence-completed-today");
  if (!content) return;

  const tasks = getCompletedTodayTasks();
  const archivedTasks = getArchivedTodayWinsTasks();

  if (tasks.length === 0 && archivedTasks.length === 0) {
    content.innerHTML = completedTodayEmptyHtml();
    section?.classList.add("presence-completed-today--empty");
    return;
  }

  section?.classList.toggle("presence-completed-today--empty", tasks.length === 0);
  const groupsHtml = getVisibleTierList()
    .map((tier) => {
      const tierTasks = tasks.filter((t) => t.tier === tier);
      if (tierTasks.length === 0) return "";
      return completedWinsGroupHtml(tier, tierTasks);
    })
    .filter(Boolean)
    .join("");

  const undoBtnHtml = lastWinsArchiveBatch?.length
    ? `<button type="button" class="completed-wins-undo-all" id="completed-wins-undo-all">
            <span>Undo archive</span>
          </button>`
    : tasks.length
      ? `<button type="button" class="completed-wins-archive-all" id="completed-wins-archive-all">
            <svg class="icon" aria-hidden="true"><use href="#icon-archive"></use></svg>
            <span>Archive all</span>
          </button>`
      : "";

  const subtitle =
    tasks.length === 0
      ? `${archivedTasks.length} archived`
      : archivedTasks.length
        ? `${tasks.length} completed · ${archivedTasks.length} archived`
        : `${tasks.length} completed`;

  content.innerHTML = `
    <article class="plan-card completed-wins-card">
      <div class="plan-card-inner">
        <div class="completed-wins-card-header">
          <div class="completed-wins-card-heading">
            <h3 class="plan-card-title plan-card-title--featured">Today's Wins</h3>
            <p class="plan-card-subtitle">${subtitle}</p>
          </div>
          ${undoBtnHtml}
        </div>
        <div class="completed-wins-card-body">
          ${
            tasks.length
              ? groupsHtml
              : `<p class="completed-wins-empty-msg">Active wins are cleared — archived ones stay below.</p>`
          }
          ${completedWinsArchivedSectionHtml(archivedTasks)}
        </div>
      </div>
    </article>`;
  if (tasks.length) bindHomeCardTasks(content);
  bindCompletedWinsActions(content);
}

function renderHome() {
  // Always show all four priority columns with their tasks — not the 1-3-5 slot plan.
  renderHomePriorities();
  renderHomeCompletedToday();
  refreshFocusTimerUI();
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
  const list = card.closest(".task-list[data-tier], .plan-card-list[data-tier]");
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
  const target = el?.closest(GRIP_DRAG_CARD_SELECTOR);
  if (!target || target === card) return null;
  return target;
}

function columnAtPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  return el?.closest(".column") || null;
}

function listAtPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const list = el?.closest(GRIP_DRAG_LIST_SELECTOR);
  if (list) return list;
  const section = el?.closest(".tasks-flat-section");
  if (section) return section.querySelector(".task-list[data-tier]");
  const planCard = el?.closest(".plan-card[data-tier]:not(.completed-wins-card)");
  if (planCard) return planCard.querySelector(".plan-card-list[data-tier]");
  const col = el?.closest(".column[data-tier]");
  if (col) return col.querySelector(".task-list[data-tier]");
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
  document.querySelectorAll(".column, .tasks-flat-section, .plan-card[data-tier]").forEach((c) =>
    c.classList.remove("drag-over")
  );
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
  if (list?.classList.contains("plan-card-list")) {
    list.closest(".plan-card[data-tier]")?.classList.add("drag-over");
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
  const dropList = listAtPoint(x, y);
  const dropCol = columnAtPoint(x, y);
  const sourceCol = listEl?.closest?.(".column") || null;
  const isSidebarDrop = Boolean(dropEl?.closest(".plan-135-drop-zone, .forget-it-drop-zone"));
  const isCrossListDrop = Boolean(dropList && dropList !== listEl);
  const isCrossColumnDrop = Boolean(
    dropCol && dropCol !== sourceCol && dropCol.querySelector(".task-list[data-tier]")
  );

  if (isSidebarDrop || isCrossListDrop || isCrossColumnDrop) {
    applyGripDragDrop(card, x, y);
    listEl.classList.remove("list-drag-active");
    listEl.querySelectorAll(GRIP_DRAG_CARD_SELECTOR).forEach((c) => {
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

  const listEl = gripDragListFromCard(card);
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

  bindAttachmentIndicator(card, id, ctx);

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
      const card = gripDragCardFromHandle(handle);
      const list = gripDragListFromCard(card);
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

function clearDialogBrainFields() {
  document.getElementById("dialog-brain-id").value = "";
  document.getElementById("dialog-brain-context").value = "";
}

function resetDialogMediaFields() {
  dialogPhotoDraft = [];
  revokePhotoUrls(dialogPhotoUrls);
  const notes = document.getElementById("dialog-notes");
  if (notes) notes.value = "";
  const grid = document.getElementById("dialog-photo-grid");
  if (grid) grid.innerHTML = `<p class="dialog-photo-empty">No photos yet.</p>`;
}

function setTaskDialogSubmitLabel(label) {
  const btn = document.querySelector("#task-dialog-form button[type='submit']");
  if (btn) btn.textContent = label;
}

async function openTaskDialog(tier = 1) {
  const dialog = document.getElementById("task-dialog");
  const defaultCtx = filter === "all" ? "work" : filter;

  clearDialogBrainFields();
  resetDialogMediaFields();
  document.getElementById("dialog-title").textContent = "Add Task";
  document.getElementById("dialog-input").value = "";
  document.getElementById("dialog-tier-select").value = String(tier);
  fillContextSelect(document.getElementById("dialog-context"), defaultCtx);
  document.getElementById("dialog-edit-id").value = "";
  document.getElementById("dialog-original-context").value = "";
  setTaskDialogSubmitLabel("Save");

  dialog.showModal();
  document.getElementById("dialog-input").focus();
}

async function openEditTaskDialog(task, ctx) {
  const dialog = document.getElementById("task-dialog");

  clearDialogBrainFields();
  dialogPhotoDraft = Array.isArray(task.photos) ? task.photos.map((p) => ({ ...p })) : [];
  document.getElementById("dialog-title").textContent = "Edit Task";
  document.getElementById("dialog-input").value = task.text;
  document.getElementById("dialog-tier-select").value = String(task.tier);
  fillContextSelect(document.getElementById("dialog-context"), ctx);
  document.getElementById("dialog-edit-id").value = task.id;
  document.getElementById("dialog-original-context").value = ctx;
  document.getElementById("dialog-notes").value = task.notes || "";
  setTaskDialogSubmitLabel("Save");
  await renderPhotoGrid(
    document.getElementById("dialog-photo-grid"),
    dialogPhotoDraft,
    dialogPhotoUrls,
    draftPhotoRemover(dialogPhotoDraft, "dialog-photo-grid", dialogPhotoUrls)
  );

  dialog.showModal();
  document.getElementById("dialog-input").focus();
}

function openBrainDumpSendDialog(item, ctx) {
  const dialog = document.getElementById("task-dialog");

  clearDialogBrainFields();
  resetDialogMediaFields();
  document.getElementById("dialog-title").textContent = "Send to Priority";
  document.getElementById("dialog-input").value = item.text;
  document.getElementById("dialog-tier-select").value = "1";
  fillContextSelect(document.getElementById("dialog-context"), ctx);
  document.getElementById("dialog-edit-id").value = "";
  document.getElementById("dialog-original-context").value = "";
  document.getElementById("dialog-brain-id").value = item.id;
  document.getElementById("dialog-brain-context").value = ctx;
  setTaskDialogSubmitLabel("Send");

  dialog.showModal();
  document.getElementById("dialog-input").focus();
}

function sendBrainDumpToTier(id, ctx, tier, textOverride) {
  const items = loadBrainDump(ctx);
  const item = items.find((i) => i.id === id);
  if (!item) return;

  const text = (textOverride ?? item.text).trim();
  if (!text) return;

  updateTaskInContext(ctx, (list) => [...list, { id: createId(), text, tier, done: false }]);
  saveBrainDump(
    ctx,
    items.filter((i) => i.id !== id)
  );
}

function saveTaskFromDialog() {
  const text = document.getElementById("dialog-input").value.trim();
  if (!text) return;

  const tier = Number(document.getElementById("dialog-tier-select").value);
  const newCtx = document.getElementById("dialog-context").value;
  if (!isValidContext(newCtx)) return;
  const editId = document.getElementById("dialog-edit-id").value;
  const oldCtx = document.getElementById("dialog-original-context").value;
  const brainId = document.getElementById("dialog-brain-id").value;
  const brainCtx = document.getElementById("dialog-brain-context").value;
  const notes = document.getElementById("dialog-notes")?.value.trim() || "";
  const photos = dialogPhotoDraft.map((p) => ({ ...p }));

  if (brainId) {
    saveTasks(newCtx, [
      ...loadTasks(newCtx),
      { id: createId(), text, tier, done: false, notes, photos },
    ]);
    saveBrainDump(brainCtx, loadBrainDump(brainCtx).filter((i) => i.id !== brainId));
    clearDialogBrainFields();
    return;
  }

  if (editId) {
    const oldList = loadTasks(oldCtx);
    const task = oldList.find((t) => t.id === editId);
    if (!task) return;

    const updated = { ...task, text, tier, notes, photos };

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
    saveTasks(newCtx, [
      ...loadTasks(newCtx),
      { id: createId(), text, tier, done: false, notes, photos },
    ]);
  }
}

function setupTaskDialog() {
  const dialog = document.getElementById("task-dialog");
  const photoInput = document.getElementById("dialog-photo-input");

  document.getElementById("add-task-btn").addEventListener("click", () => openTaskDialog(1));

  document.querySelectorAll(".column-add").forEach((btn) => {
    btn.addEventListener("click", () => openTaskDialog(Number(btn.dataset.tier)));
  });

  document.querySelectorAll(".column-see-all").forEach((btn) => {
    btn.addEventListener("click", () => openTierExpand(Number(btn.dataset.tier)));
  });

  document.getElementById("dialog-cancel").addEventListener("click", () => {
    clearDialogBrainFields();
    resetDialogMediaFields();
    dialog.close();
  });

  dialog.addEventListener("close", () => {
    clearDialogBrainFields();
    resetDialogMediaFields();
    setTaskDialogSubmitLabel("Save");
  });

  photoInput?.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    photoInput.value = "";
    await addPhotoToDraft(
      dialogPhotoDraft,
      file,
      document.getElementById("dialog-photo-grid"),
      dialogPhotoUrls,
      draftPhotoRemover(dialogPhotoDraft, "dialog-photo-grid", dialogPhotoUrls)
    );
  });

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
    <li class="plan-card-task brain-panel-item${filter === "all" ? " brain-panel-item--all" : ""}" data-id="${item.id}" data-context="${item.context}">
      <button type="button" class="plan-card-task-text">${escapeHtml(item.text)}</button>
      <div class="sidebar-row-actions">
        ${sidebarContextIconHtml(item.context)}
        <button type="button" class="brain-dump-delete sidebar-row-delete" aria-label="Delete note" title="Delete note">×</button>
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

    el.querySelector(".plan-card-task-text")?.addEventListener("click", () => {
      const item = loadBrainDump(ctx).find((i) => i.id === id);
      if (item) openBrainDumpSendDialog(item, ctx);
    });

    el.querySelector(".brain-dump-delete")?.addEventListener("click", () => {
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
  getContexts().forEach((ctx) => {
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
  getContexts().forEach((ctx) => {
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

function historyWinsItemHtml(task) {
  const time = formatCompletionTime(task.completedAt);
  const restoreBtn =
    task.archived && canUndoHistoryArchive(task)
      ? `<button type="button" class="history-wins-restore" aria-label="Undo archive" title="Undo archive">
        <span>Undo</span>
      </button>`
      : "";
  return `
    <li class="plan-card-task done completed-wins-item history-wins-item${task.archived ? " is-archived" : ""}" data-id="${task.id}" data-context="${task.context}">
      <label class="plan-card-check">
        <input type="checkbox" checked disabled aria-label="Completed" />
      </label>
      <button type="button" class="plan-card-task-text">${escapeHtml(task.text)}</button>
      ${restoreBtn}
      ${time ? `<span class="completed-wins-time">${escapeHtml(time)}</span>` : `<span class="completed-wins-time" aria-hidden="true"></span>`}
    </li>`;
}

function historyWinsGroupHtml(tier, tasks) {
  const label = ["1st", "2nd", "3rd", "4th"][tier - 1] || `${tier}`;
  const number = String(tier).padStart(2, "0");
  return `
    <section class="completed-wins-group completed-wins-group--p${tier}" aria-label="${escapeHtml(TIER_NAMES[tier - 1])}">
      <header class="completed-wins-group-header">
        <span class="completed-wins-badge" aria-hidden="true">${number}</span>
        <h4 class="completed-wins-group-title">${escapeHtml(label)}</h4>
        <span class="completed-wins-group-count">${tasks.length}</span>
      </header>
      <ul class="plan-card-list completed-wins-items">
        ${tasks.map(historyWinsItemHtml).join("")}
      </ul>
    </section>`;
}

function historyDayCardHtml(dayKey, tasks) {
  const groupsHtml = [1, 2, 3, 4]
    .map((tier) => {
      const tierTasks = tasks.filter((t) => t.tier === tier);
      if (tierTasks.length === 0) return "";
      return historyWinsGroupHtml(tier, tierTasks);
    })
    .filter(Boolean)
    .join("");

  return `
    <article class="plan-card completed-wins-card history-wins-card">
      <div class="plan-card-inner">
        <div class="completed-wins-card-header">
          <div class="completed-wins-card-heading">
            <h3 class="plan-card-title plan-card-title--featured">${escapeHtml(formatArchiveDayHeading(dayKey))}</h3>
            <p class="plan-card-subtitle">${tasks.length} completed</p>
          </div>
        </div>
        <div class="completed-wins-card-body">
          ${groupsHtml}
        </div>
      </div>
    </article>`;
}

function renderHistory() {
  const content = document.getElementById("history-content");
  const empty = document.getElementById("history-empty");
  const subtitle = document.getElementById("history-subtitle");
  if (!content || !empty) return;

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
    content.innerHTML = "";
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

  content.innerHTML = sortedKeys
    .map((dayKey) => historyDayCardHtml(dayKey, groups.get(dayKey)))
    .join("");

  content.querySelectorAll(".history-wins-item .plan-card-task-text").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".history-wins-item");
      if (!row) return;
      const task = loadTasks(row.dataset.context).find((t) => t.id === row.dataset.id);
      if (task) openEditTaskDialog(task, row.dataset.context);
    });
  });
  content.querySelectorAll(".history-wins-restore").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const row = btn.closest(".history-wins-item");
      if (!row) return;
      restoreTask(row.dataset.id, row.dataset.context, false, { requireRecentArchive: true });
    });
  });
}

function archivePanelItemHtml(task) {
  return `
    <li class="plan-card-task archive-panel-item${task.done ? " done" : ""}${filter === "all" ? " archive-panel-item--all" : ""}" data-id="${task.id}" data-context="${task.context}">
      <span class="plan-card-task-text archive-panel-text">${escapeHtml(task.text)}</span>
      <div class="sidebar-row-actions">
        ${sidebarContextIconHtml(task.context)}
        <button type="button" class="archive-restore-btn sidebar-row-restore" aria-label="Restore" title="Restore">↩</button>
        <button type="button" class="archive-delete-btn sidebar-row-delete" aria-label="Delete permanently" title="Delete permanently">×</button>
      </div>
    </li>`;
}

function archiveTierGroupHtml(tier, tasks) {
  const label = ["1st", "2nd", "3rd", "4th"][tier - 1] || `${tier}`;
  const number = String(tier).padStart(2, "0");
  return `
    <section class="completed-wins-group completed-wins-group--p${tier} archive-tier-group" aria-label="${escapeHtml(TIER_NAMES[tier - 1])}">
      <header class="completed-wins-group-header">
        <span class="completed-wins-badge" aria-hidden="true">${number}</span>
        <h4 class="completed-wins-group-title">${escapeHtml(label)}</h4>
        <span class="completed-wins-group-count">${tasks.length}</span>
      </header>
      <ul class="archive-tier-items">
        ${tasks.map(archivePanelItemHtml).join("")}
      </ul>
    </section>`;
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
    .map((dayKey) => {
      const dayTasks = groups.get(dayKey);
      const tierGroupsHtml = [1, 2, 3, 4]
        .map((tier) => {
          const tierTasks = dayTasks.filter((t) => t.tier === tier);
          if (tierTasks.length === 0) return "";
          return archiveTierGroupHtml(tier, tierTasks);
        })
        .filter(Boolean)
        .join("");
      return `
    <li class="archive-day-heading">${formatArchiveDayHeading(dayKey)}</li>
    <li class="archive-day-body">${tierGroupsHtml}</li>`;
    })
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

function saveBrainPanelNote() {
  const input = document.getElementById("brain-panel-input");
  if (!input) return;
  addBrainDumpNote(input.value);
  input.value = "";
  input.focus();
  renderAll();
}

function setupBrainDumpForms() {
  const form = document.getElementById("brain-panel-form");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveBrainPanelNote();
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
  }
  if (expandedTier && document.getElementById("tier-expand-dialog")?.open) {
    refreshTierExpand(expandedTier);
  }
  renderFocusTimerChrome();
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
setupDisplayName();
setupThemePicker();
setupTimePreviewPicker();
setupThemeSchedule();
setupFontPicker();
setupHomeDesignPicker();
setupNavigation();
setupListsManager();
setupScribbleCaptureGesture();
setupDropZones();
setupTouchListDrag();
setupSidebarTabs();
setSidebarCollapsed(getSidebarCollapsed());
setupTaskDialog();
setupMediaViewer();
setupBrainDumpForms();
setupDailyRepeatForm();
setupDataSync();
setupTierExpand();
setupReflection();
setupMode135();
setupForgetIt();
setupPriorityVisibilityTags();
setupBottomChromeObserver();
updateBoardHint();
rebuildContextUi();

setPage(page, filter);
syncBottomChrome();
