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
const HOME_CONTEXT_FILTER_KEY = "priority-grid-home-context-filter";
const SIDEBAR_TAB_KEY = "priority-grid-sidebar-tab";
const SIDEBAR_COLLAPSED_KEY = "priority-grid-sidebar-collapsed";
const PLAN_135_PREFIX = "priority-grid-135-";
const NEXT_WEEK_PREFIX = "priority-grid-next-week-";
const FORGET_IT_PREFIX = "priority-grid-forget-it-";
const REPEAT_RESET_KEY = "priority-grid-repeat-last-reset";
const DONE_ROLLOVER_KEY = "priority-grid-done-rollover";
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SYNC_META_KEY = "priority-grid-sync-meta";
const APP_STARTED_KEY = "priority-grid-app-started";
const ANXIETY_BOX_KEY = "priority-grid-anxiety-box";
const ANXIETY_HISTORY_KEY = "priority-grid-anxiety-history";
const STANDALONE_NOTES_KEY = "priority-grid-standalone-notes";
const NOTIFY_SEEN_KEY = "priority-grid-notify-seen-at";
const NOTIFY_BELL_SELECTOR = "#tasks-page-notify, #page-header-actions .header-icon-btn-bell";
const SYNC_API = "/api/sync";
const SYNC_POLL_MS = 5000;

const HOME_DESIGN_KEY = "priority-grid-home-design";
const TIME_PREVIEW_KEY = "priority-grid-time-preview";
const DISPLAY_NAME_KEY = "priority-grid-display-name";
const PROFILE_AVATAR_KEY = "priority-grid-profile-avatar";
const WEEK_START_KEY = "priority-grid-week-start";
const WEEKLY_VIEW_KEY = "priority-grid-weekly-view";
const WEEKLY_WINDOW_START_KEY = "priority-grid-weekly-window-start";
const WEEKLY_WINDOW_LEN = 14;
const DEFAULT_DISPLAY_NAME = "Friend";
const DEFAULT_PROFILE_AVATAR = "assets/sidebar-avatar.png?v=39";
const AVATAR_EDGE = 192;
const MAX_AVATAR_DATA_URL = 180000;

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

function isValidAvatarImage(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_AVATAR_DATA_URL &&
    /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)
  );
}

async function avatarDataUrlFromFile(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Choose an image file");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image is too large");
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageFromDataUrl(dataUrl);
  const side = Math.min(img.width, img.height);
  const sx = Math.max(0, Math.round((img.width - side) / 2));
  const sy = Math.max(0, Math.round((img.height - side) / 2));
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_EDGE;
  canvas.height = AVATAR_EDGE;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, AVATAR_EDGE, AVATAR_EDGE);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_EDGE, AVATAR_EDGE);
  let out = canvas.toDataURL("image/jpeg", 0.88);
  if (out.length > MAX_AVATAR_DATA_URL) {
    out = canvas.toDataURL("image/jpeg", 0.72);
  }
  if (!isValidAvatarImage(out)) throw new Error("Photo is too large after compression");
  return out;
}

async function listIconDataUrlFromFile(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Choose an image file");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image is too large");
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageFromDataUrl(dataUrl);
  // Scale up or down to fit LIST_ICON_EDGE (contain), so tiny uploads aren't left postage-stamp sized
  const scale = LIST_ICON_EDGE / Math.max(img.width, img.height);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = LIST_ICON_EDGE;
  canvas.height = LIST_ICON_EDGE;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, LIST_ICON_EDGE, LIST_ICON_EDGE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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
];

const LEGACY_TIME_PREVIEW_MAP = {
  evening: "afternoon",
};

const HOME_HERO_WALLPAPERS = {
  morning: {
    mobile: "assets/home-hero-morning.png?v=2",
    desktop: "assets/home-hero-morning-wide.png?v=2",
  },
  day: {
    mobile: "assets/home-hero-day.png?v=1",
    desktop: "assets/home-hero-day-wide.png?v=1",
  },
  dusk: {
    mobile: "assets/home-hero-afternoon.png?v=1",
    desktop: "assets/home-hero-afternoon-wide.png?v=1",
  },
  night: {
    mobile: "assets/home-hero-night.png?v=1",
    desktop: "assets/home-hero-night-wide.png?v=1",
  },
};

/*
 * Wallpaper follows the clock more finely than the theme slots:
 *   before 5a / after 8p → night, 5–11a → morning (sunrise),
 *   11a–6p → day (high sun), 6–8p → dusk (pink sun).
 * A time-preview override still steers it via the slot's start hour.
 */
function getHomeHeroWallpaperPeriod(hour = new Date().getHours()) {
  const preview = getTimePreviewPreference();
  if (preview !== "auto") {
    const option = TIME_PREVIEW_OPTIONS.find((entry) => entry.id === preview);
    if (option?.slot) hour = option.slot.start;
  }
  if (hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 18) return "day";
  if (hour < 20) return "dusk";
  return "night";
}

const REFLECTION_TEAL_SHIFT_REVIEW = 25;

/* Header tabs were replaced by the date, so the panels are the source of truth. */
function getActiveReflectionTab() {
  return (
    document.querySelector(".reflection-tab-panel.active")?.dataset.tab ||
    document.querySelector(".reflection-tab.active")?.dataset.tab ||
    "review"
  );
}

function applyReflectionScreenBackground(reflectionScreen, assets, tab) {
  if (!reflectionScreen || !assets?.mobile) return;
  const wallpaper = reflectionScreen.querySelector(".reflection-screen-wallpaper");
  if (!wallpaper) return;
  const shiftPx = tab === "review" ? REFLECTION_TEAL_SHIFT_REVIEW : 0;
  const thoughtsCream =
    "linear-gradient(to bottom, rgba(253, 249, 244, 0.94) 0%, rgba(253, 249, 244, 0.62) 14%, rgba(253, 249, 244, 0.18) 28%, rgba(253, 249, 244, 0.05) 40%, rgba(253, 249, 244, 0.14) 100%)";
  const reviewCream =
    "linear-gradient(to bottom, rgba(253, 249, 244, 0.78) 0%, rgba(253, 249, 244, 0.42) 16%, rgba(253, 249, 244, 0.12) 30%, rgba(253, 249, 244, 0.06) 42%, rgba(253, 249, 244, 0.18) 100%)";
  // Clear legacy screen-level bg so only the sticky wallpaper layer paints mountains.
  reflectionScreen.style.backgroundImage = "";
  reflectionScreen.style.backgroundSize = "";
  reflectionScreen.style.backgroundPosition = "";
  reflectionScreen.style.backgroundRepeat = "";
  // Teal mountain treatment (review shifted): wallpaper + teal fade, cream veil for dark-text readability.
  wallpaper.style.backgroundColor = "#0d2b2b";
  wallpaper.style.backgroundImage = [
    tab === "thoughts" ? thoughtsCream : reviewCream,
    "linear-gradient(to bottom, rgba(13, 43, 43, 0) 0%, rgba(13, 43, 43, 0.12) 20%, rgb(13, 43, 43) 55%)",
    `url("${assets.mobile}")`,
  ].join(", ");
  wallpaper.style.backgroundSize = "100% 100%, 100% 100%, 100% auto";
  wallpaper.style.backgroundRepeat = "no-repeat";
  wallpaper.style.backgroundPosition = `center top, center ${shiftPx}px, center ${shiftPx}px`;
  wallpaper.dataset.tealOffset = String(shiftPx);
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
    let stored = localStorage.getItem(TIME_PREVIEW_KEY);
    if (stored && LEGACY_TIME_PREVIEW_MAP[stored]) {
      stored = LEGACY_TIME_PREVIEW_MAP[stored];
      try {
        localStorage.setItem(TIME_PREVIEW_KEY, stored);
      } catch {
        /* ignore */
      }
    }
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
let weeklyView = getWeeklyView();
let sidebarTab = getSidebarTab();
let weeklySelectedDayKey = null;
let weeklyWindowStartKey = null;
let weeklyCalendarOpen = false;
let weeklyCalendarMonthKey = null;
let dialogScheduleCalendarOpen = false;
let dialogScheduleCalendarMonthKey = null;
let dialogScheduleWindowStartKey = null;
let mediaViewerTaskRef = null;
let plan135Picker = null;
let syncAvailable = false;
let syncPushTimer = null;
let syncPulling = false;
let syncPushing = false;
let syncDirty = false;
let syncBackend = "local";
let supabaseClient = null;
let supabaseUserId = null;
let supabaseAuthEmail = null;
let supabaseRealtimeChannel = null;
let syncPollTimer = null;
let syncListenersBound = false;
let supabaseSyncStarted = false;
let lastHistorySavedAt = 0;
const SYNC_HISTORY_KEEP = 20;
const SYNC_HISTORY_THROTTLE_MS = 5 * 60 * 1000;
let touchDragGhost = null;
let dragGrabOffset = { x: 0, y: 0 };
let listDragState = null;
let visibleTiers = getVisibleTiers();
let homeContextFilter = getHomeContextFilter();
let dialogPhotoDraft = [];
let dialogPhotoUrls = [];
let dialogNoteEntries = [];
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
let focusWakeLock = null;

async function requestFocusWakeLock() {
  if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  if (focusWakeLock) return;
  try {
    focusWakeLock = await navigator.wakeLock.request("screen");
    focusWakeLock.addEventListener("release", () => {
      focusWakeLock = null;
    });
  } catch {
    focusWakeLock = null;
  }
}

async function releaseFocusWakeLock() {
  try {
    await focusWakeLock?.release();
  } catch {
    /* ignore */
  }
  focusWakeLock = null;
}

function setupFocusWakeLockVisibility() {
  if (setupFocusWakeLockVisibility.ready) return;
  setupFocusWakeLockVisibility.ready = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      releaseFocusWakeLock();
      return;
    }
    // Re-request only if a focus timer is actively running (body class set in render)
    if (document.body.classList.contains("focus-timer-wake")) {
      requestFocusWakeLock();
    }
  });
}

function syncBottomChrome() {
  const shell = document.querySelector(".mobile-nav-shell");
  if (!shell) {
    document.documentElement.style.setProperty("--bottom-chrome-height", "0px");
    return;
  }

  const style = getComputedStyle(shell);
  if (style.display === "none") {
    document.documentElement.style.setProperty("--bottom-chrome-height", "0px");
    return;
  }

  // Measure the whole chrome (session dock + nav) so content padding stays correct.
  // Reflection sits above this height so the bottom nav stays visible and tappable.
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
          <button type="button" class="focus-timer-attach-text" title="View details">${escapeHtml(task.text)}</button>
          <span class="focus-timer-attach-meta">
            ${contextIconHtml(task.context, "focus-timer-task-ctx")}
            ${taskAttachmentIndicatorHtml(task)}
          </span>
          <button type="button" class="focus-timer-attach-remove" aria-label="Remove task">×</button>
        </li>`
        )
        .join("");
      attachList.querySelectorAll(".focus-timer-attach-item").forEach((row) => {
        const id = row.dataset.id;
        const ctx = row.dataset.context;
        bindAttachmentIndicator(row, id, ctx);
        row.querySelector(".focus-timer-attach-text")?.addEventListener("click", () => {
          const task = loadTasks(ctx).find((t) => t.id === id);
          if (task) openTaskMediaViewer(task);
        });
      });
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
        <span class="focus-timer-task-meta">
          ${contextIconHtml(task.context, "focus-timer-task-ctx")}
          ${taskAttachmentIndicatorHtml(task)}
        </span>
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
    const reflectionOpen = document.documentElement.classList.contains("reflection-open");
    const hideTimerForAnxiety =
      reflectionOpen && loadAnxietyBox().length > 0;
    const showMiniBar = sessionActive && !focusCardVisible && !hideTimerForAnxiety;
    root.classList.toggle("is-running", running);
    root.classList.toggle("is-active", active);
    root.classList.toggle("is-done", done);
    document.body.classList.toggle("focus-timer-wake", running);
    if (running) requestFocusWakeLock();
    else releaseFocusWakeLock();

    const timerJump = document.getElementById("home-timer-jump");
    if (timerJump) {
      timerJump.classList.toggle("is-running", running);
      timerJump.classList.toggle("is-done", done);
      timerJump.setAttribute(
        "aria-label",
        done ? "Focus complete — jump to timer" : running ? "Focus timer running — jump to timer" : "Jump to focus timer"
      );
    }

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
  setupFocusWakeLockVisibility();
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
  const include = (t) => !t.archived && !isTaskDeferred(t) && isTaskActiveOnToday(t);
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

function normalizeAnxietyBoxItem(item) {
  if (!item || typeof item.text !== "string" || !item.text.trim()) return null;
  return {
    id: typeof item.id === "string" && item.id ? item.id : createId(),
    text: item.text.trim().slice(0, 180),
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    ...(typeof item.tossedAt === "string" ? { tossedAt: item.tossedAt } : {}),
  };
}

function normalizeAnxietyHistoryItem(item) {
  if (!item || typeof item.text !== "string" || !item.text.trim()) return null;
  const reason = item.reason === "tossed" ? "tossed" : "checked";
  return {
    id: typeof item.id === "string" && item.id ? item.id : createId(),
    text: item.text.trim().slice(0, 180),
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    archivedAt:
      typeof item.archivedAt === "string"
        ? item.archivedAt
        : typeof item.tossedAt === "string"
          ? item.tossedAt
          : typeof item.checkedAt === "string"
            ? item.checkedAt
            : new Date().toISOString(),
    reason,
  };
}

function loadAnxietyHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ANXIETY_HISTORY_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeAnxietyHistoryItem).filter(Boolean);
  } catch {
    return [];
  }
}

function saveAnxietyHistory(items, options = {}) {
  localStorage.setItem(
    ANXIETY_HISTORY_KEY,
    JSON.stringify((Array.isArray(items) ? items : []).map(normalizeAnxietyHistoryItem).filter(Boolean))
  );
  if (!options.skipSync) markSyncDirty();
}

/** Migrate legacy tossedAt active items into history once. */
function migrateAnxietyTossedToHistory(options = {}) {
  try {
    const parsed = JSON.parse(localStorage.getItem(ANXIETY_BOX_KEY) || "[]");
    if (!Array.isArray(parsed)) return;
    const normalized = parsed.map(normalizeAnxietyBoxItem).filter(Boolean);
    const tossed = normalized.filter((item) => item.tossedAt);
    if (!tossed.length) return;
    const active = normalized
      .filter((item) => !item.tossedAt)
      .map(({ tossedAt: _t, ...rest }) => rest);
    const history = [
      ...loadAnxietyHistory(),
      ...tossed.map((item) => ({
        id: item.id,
        text: item.text,
        createdAt: item.createdAt,
        archivedAt: item.tossedAt,
        reason: "tossed",
      })),
    ];
    const byId = new Map();
    history.forEach((item) => {
      if (!byId.has(item.id)) byId.set(item.id, item);
    });
    saveAnxietyHistory([...byId.values()], { skipSync: true });
    saveAnxietyBox(active, { skipSync: true });
    if (!options.skipSync) markSyncDirty();
  } catch {
    /* ignore */
  }
}

function loadAnxietyBox({ includeTossed = false } = {}) {
  migrateAnxietyTossedToHistory({ skipSync: true });
  try {
    const parsed = JSON.parse(localStorage.getItem(ANXIETY_BOX_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    const items = parsed
      .map(normalizeAnxietyBoxItem)
      .filter(Boolean)
      .map(({ tossedAt: _t, ...rest }) => rest);
    // includeTossed kept for sync/export callers; tossed now live in history
    return includeTossed ? items : items;
  } catch {
    return [];
  }
}

function saveAnxietyBox(items, options = {}) {
  localStorage.setItem(
    ANXIETY_BOX_KEY,
    JSON.stringify(
      (Array.isArray(items) ? items : [])
        .map(normalizeAnxietyBoxItem)
        .filter(Boolean)
        .filter((item) => !item.tossedAt)
        .map(({ tossedAt: _t, ...rest }) => rest)
    )
  );
  if (!options.skipSync) markSyncDirty();
  syncThoughtsBellAnimation();
}

const THOUGHTS_STALE_MS = 2 * 60 * 60 * 1000;
const THOUGHTS_BELL_SELECTOR = "#presence-thoughts-btn, #presence-toolbar-thoughts-btn";
let thoughtsBellTimer = 0;

function hasStaleThoughts(now = Date.now()) {
  const cutoff = now - THOUGHTS_STALE_MS;
  return loadAnxietyBox().some((item) => {
    const created = new Date(item.createdAt).getTime();
    return !Number.isNaN(created) && created <= cutoff;
  });
}

function scheduleThoughtsBellCheck(now = Date.now()) {
  window.clearTimeout(thoughtsBellTimer);
  thoughtsBellTimer = 0;
  let nextAt = Infinity;
  loadAnxietyBox().forEach((item) => {
    const created = new Date(item.createdAt).getTime();
    if (Number.isNaN(created)) return;
    const staleAt = created + THOUGHTS_STALE_MS;
    if (staleAt > now && staleAt < nextAt) nextAt = staleAt;
  });
  if (!Number.isFinite(nextAt)) return;
  const delay = Math.min(Math.max(nextAt - now + 200, 250), 2147483647);
  thoughtsBellTimer = window.setTimeout(() => {
    syncThoughtsBellAnimation();
  }, delay);
}

function syncThoughtsBellAnimation() {
  const stale = hasStaleThoughts();
  document.querySelectorAll(THOUGHTS_BELL_SELECTOR).forEach((btn) => {
    btn.classList.toggle("is-ringing", stale);
    if (stale) {
      btn.setAttribute("title", "A thought has been waiting over 2 hours");
    } else {
      btn.removeAttribute("title");
    }
  });
  scheduleThoughtsBellCheck();
}

function addAnxietyBoxItem(text) {
  const trimmed = String(text || "").trim().slice(0, 180);
  if (!trimmed) return;
  saveAnxietyBox([
    ...loadAnxietyBox(),
    { id: createId(), text: trimmed, createdAt: new Date().toISOString() },
  ]);
}

/** Toss → move to history as tossed (not permanent delete). */
function tossAnxietyBoxItem(id) {
  const items = loadAnxietyBox();
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  const archivedAt = new Date().toISOString();
  saveAnxietyBox(items.filter((entry) => entry.id !== id));
  saveAnxietyHistory([
    {
      id: item.id,
      text: item.text,
      createdAt: item.createdAt,
      archivedAt,
      reason: "tossed",
    },
    ...loadAnxietyHistory(),
  ]);
  renderReflectionAnxietyBox();
  renderFocusTimerChrome();
}

/** Check off → move to history. */
function checkAnxietyBoxItem(id) {
  const items = loadAnxietyBox();
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  const archivedAt = new Date().toISOString();
  saveAnxietyBox(items.filter((entry) => entry.id !== id));
  saveAnxietyHistory([
    {
      id: item.id,
      text: item.text,
      createdAt: item.createdAt,
      archivedAt,
      reason: "checked",
    },
    ...loadAnxietyHistory(),
  ]);
  renderReflectionAnxietyBox();
  renderFocusTimerChrome();
  if (page === "history") renderHistory();
}

function deleteAnxietyHistoryItem(id) {
  recordDeletedId(id);
  saveAnxietyHistory(loadAnxietyHistory().filter((item) => item.id !== id));
  renderReflectionAnxietyBox();
  if (page === "history") renderHistory();
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
    profileAvatar: getProfileAvatar() === DEFAULT_PROFILE_AVATAR ? null : getProfileAvatar(),
    anxietyBox: loadAnxietyBox(),
    anxietyHistory: loadAnxietyHistory(),
    standaloneNotes: loadStandaloneNotes(),
    theme: getTheme(),
    font: getFont(),
    weekStart: getWeekStartPreference(),
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
      if (typeof data.profileAvatar === "string") setProfileAvatar(data.profileAvatar, { skipSync: true });
      if (data.weekStart === "sunday" || data.weekStart === "monday") {
        setWeekStartPreference(data.weekStart, { skipSync: true });
      }
      if (Array.isArray(data.anxietyBox)) {
        saveAnxietyBox(data.anxietyBox, { skipSync: true });
      }
      if (Array.isArray(data.anxietyHistory)) {
        saveAnxietyHistory(data.anxietyHistory, { skipSync: true });
      }
      if (Array.isArray(data.standaloneNotes)) {
        saveStandaloneNotes(data.standaloneNotes, { skipSync: true });
      }
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
  document.getElementById("sync-history-refresh")?.addEventListener("click", () => {
    refreshSyncHistory();
  });
  document.getElementById("sync-history-list")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-restore-history]");
    if (!btn) return;
    restoreSyncHistory(btn.getAttribute("data-restore-history"));
  });

  document.getElementById("sync-banner-dismiss").addEventListener("click", () => {
    localStorage.setItem(SYNC_BANNER_KEY, "1");
    document.getElementById("sync-banner").classList.add("hidden");
  });

  setupSupabaseAuthUi();
  initRemoteSync();
}

function isSupabaseConfigured() {
  const cfg = window.SUPABASE_CONFIG;
  return Boolean(cfg?.url && cfg?.anonKey && typeof window.supabase?.createClient === "function");
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseClient) {
    const cfg = window.SUPABASE_CONFIG;
    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

function mergeListsByIdForSync(existingList, incomingList) {
  const existing = Array.isArray(existingList) ? existingList : [];
  const incoming = Array.isArray(incomingList) ? incomingList : [];
  const merged = {};
  const order = [];
  for (const item of existing) {
    const id = item?.id;
    if (!id) continue;
    merged[id] = item;
    order.push(id);
  }
  for (const item of incoming) {
    const id = item?.id;
    if (!id) continue;
    if (!merged[id]) order.push(id);
    merged[id] = item;
  }
  return order.map((id) => merged[id]);
}

function mergeDictsForSync(existing, incoming) {
  const a = existing && typeof existing === "object" ? existing : {};
  const b = incoming && typeof incoming === "object" ? incoming : {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  keys.forEach((key) => {
    out[key] = b[key] !== undefined ? b[key] : a[key];
  });
  return out;
}

function mergeSyncPayloads(existing, incoming) {
  if (!existing?.updatedAt) return incoming;
  if (!incoming?.updatedAt) return existing;

  const newer = incoming.updatedAt >= existing.updatedAt ? incoming : existing;
  const older = newer === incoming ? existing : incoming;

  const mergedDeleted = pruneDeletedIdMap({ ...(older.deleted || {}), ...(newer.deleted || {}) });
  const deletedSet = collectDeletedIdSet(mergedDeleted);
  const mergeLists = (a, b) => dropDeletedFromList(mergeListsByIdForSync(a, b), deletedSet);

  const olderCustomTasks =
    older.customTasks && typeof older.customTasks === "object" ? older.customTasks : {};
  const newerCustomTasks =
    newer.customTasks && typeof newer.customTasks === "object" ? newer.customTasks : {};
  const customTaskKeys = new Set([...Object.keys(olderCustomTasks), ...Object.keys(newerCustomTasks)]);
  const mergedCustomTasks = {};
  customTaskKeys.forEach((key) => {
    mergedCustomTasks[key] = mergeLists(olderCustomTasks[key], newerCustomTasks[key]);
  });

  const olderCustomBrain =
    older.customBrainDump && typeof older.customBrainDump === "object" ? older.customBrainDump : {};
  const newerCustomBrain =
    newer.customBrainDump && typeof newer.customBrainDump === "object" ? newer.customBrainDump : {};
  const customBrainKeys = new Set([...Object.keys(olderCustomBrain), ...Object.keys(newerCustomBrain)]);
  const mergedCustomBrain = {};
  customBrainKeys.forEach((key) => {
    mergedCustomBrain[key] = mergeLists(olderCustomBrain[key], newerCustomBrain[key]);
  });

  return {
    version: Math.max(existing.version || 1, incoming.version || 1),
    updatedAt: incoming.updatedAt >= existing.updatedAt ? incoming.updatedAt : existing.updatedAt,
    deleted: mergedDeleted,
    work: mergeLists(older.work, newer.work),
    home: mergeLists(older.home, newer.home),
    brainDumpWork: mergeLists(older.brainDumpWork, newer.brainDumpWork),
    brainDumpHome: mergeLists(older.brainDumpHome, newer.brainDumpHome),
    customContexts: mergeListsByIdForSync(older.customContexts, newer.customContexts),
    customTasks: mergedCustomTasks,
    customBrainDump: mergedCustomBrain,
    plans: mergeDictsForSync(older.plans, newer.plans),
    nextWeek: mergeDictsForSync(older.nextWeek, newer.nextWeek),
    forgetIt: mergeDictsForSync(older.forgetIt || older.nextWeek, newer.forgetIt || newer.nextWeek),
    displayName: newer.displayName ?? older.displayName,
    profileAvatar: newer.profileAvatar !== undefined ? newer.profileAvatar : older.profileAvatar,
    anxietyBox: mergeLists(older.anxietyBox, newer.anxietyBox),
    anxietyHistory: mergeLists(older.anxietyHistory, newer.anxietyHistory),
    standaloneNotes: mergeLists(older.standaloneNotes, newer.standaloneNotes),
    weekStart: newer.weekStart ?? older.weekStart,
  };
}

async function fetchRemotePayload() {
  if (syncBackend === "supabase") {
    if (!supabaseClient || !supabaseUserId) return { version: 1, updatedAt: null };
    const { data, error } = await supabaseClient
      .from("app_state")
      .select("payload, updated_at")
      .eq("user_id", supabaseUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data?.payload) return { version: 1, updatedAt: null };
    const updatedAt = data.updated_at || data.payload.updatedAt || null;
    return { ...data.payload, updatedAt };
  }

  const response = await fetch(SYNC_API, { cache: "no-store" });
  if (!response.ok) throw new Error("sync unavailable");
  return response.json();
}

async function saveRemotePayload(payload) {
  if (syncBackend === "supabase") {
    if (!supabaseClient || !supabaseUserId) throw new Error("not signed in");
    let remote = null;
    try {
      remote = await fetchRemotePayload();
    } catch {
      remote = null;
    }
    const merged = remote?.updatedAt ? mergeSyncPayloads(remote, payload) : payload;
    const { error } = await supabaseClient.from("app_state").upsert(
      {
        user_id: supabaseUserId,
        payload: merged,
        updated_at: merged.updatedAt,
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
    return merged;
  }

  const response = await fetch(SYNC_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("sync push failed");
  return response.json();
}

function syncHistoryReasonLabel(reason) {
  if (reason === "manual") return "Sync now";
  if (reason === "restore") return "Restored";
  return "Auto save";
}

function formatSyncHistoryWhen(iso) {
  if (!iso) return "Unknown time";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function pruneSyncHistory() {
  if (!supabaseClient || !supabaseUserId) return;
  const { data, error } = await supabaseClient
    .from("app_state_history")
    .select("id")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false });
  if (error || !Array.isArray(data) || data.length <= SYNC_HISTORY_KEEP) return;
  const staleIds = data.slice(SYNC_HISTORY_KEEP).map((row) => row.id);
  if (!staleIds.length) return;
  await supabaseClient.from("app_state_history").delete().in("id", staleIds);
}

async function recordSyncHistory(payload, options = {}) {
  if (syncBackend !== "supabase" || !supabaseClient || !supabaseUserId || !payload) return;
  const reason = options.reason || "auto";
  const now = Date.now();
  if (reason === "auto" && now - lastHistorySavedAt < SYNC_HISTORY_THROTTLE_MS) return;

  const taskCount = countPayloadTasks(payload);
  const { error } = await supabaseClient.from("app_state_history").insert({
    user_id: supabaseUserId,
    payload,
    task_count: taskCount,
    reason,
  });
  if (error) {
    console.warn("Could not save sync history", error);
    return;
  }
  lastHistorySavedAt = now;
  await pruneSyncHistory();
  refreshSyncHistory({ quiet: true });
}

async function fetchSyncHistoryRows() {
  if (!supabaseClient || !supabaseUserId) return [];
  const { data, error } = await supabaseClient
    .from("app_state_history")
    .select("id, created_at, task_count, reason")
    .eq("user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(SYNC_HISTORY_KEEP);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

function renderSyncHistory(rows) {
  const panel = document.getElementById("sync-history");
  const list = document.getElementById("sync-history-list");
  const empty = document.getElementById("sync-history-empty");
  if (!panel || !list) return;

  const show = Boolean(isSupabaseConfigured() && supabaseUserId);
  panel.classList.toggle("hidden", !show);
  if (!show) {
    list.innerHTML = "";
    empty?.classList.add("hidden");
    return;
  }

  if (!rows.length) {
    list.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");
  list.innerHTML = rows
    .map((row) => {
      const tasks = Number(row.task_count) || 0;
      const taskLabel = tasks === 1 ? "1 task" : `${tasks} tasks`;
      return `<li class="sync-history-item">
        <div class="sync-history-meta">
          <p class="sync-history-title">${formatSyncHistoryWhen(row.created_at)}</p>
          <p class="sync-history-detail">${syncHistoryReasonLabel(row.reason)} · ${taskLabel}</p>
        </div>
        <button type="button" class="btn-secondary" data-restore-history="${row.id}">Restore</button>
      </li>`;
    })
    .join("");
}

async function refreshSyncHistory(options = {}) {
  const panel = document.getElementById("sync-history");
  if (!panel || !isSupabaseConfigured() || !supabaseUserId) {
    renderSyncHistory([]);
    return;
  }
  try {
    const rows = await fetchSyncHistoryRows();
    renderSyncHistory(rows);
  } catch (err) {
    renderSyncHistory([]);
    if (!options.quiet) {
      const detail = err?.message || "";
      alert(
        detail.includes("app_state_history") || detail.includes("relation")
          ? "Sync history needs one more Supabase step: run supabase/schema-history.sql in the SQL Editor."
          : `Could not load sync history.${detail ? ` (${detail})` : ""}`
      );
    }
  }
}

async function restoreSyncHistory(historyId) {
  if (!historyId || !supabaseClient || !supabaseUserId) return;
  const confirmed = window.confirm(
    "Restore this snapshot? It will replace tasks on this device and sync that version to your other signed-in devices."
  );
  if (!confirmed) return;

  try {
    const { data, error } = await supabaseClient
      .from("app_state_history")
      .select("payload")
      .eq("id", historyId)
      .eq("user_id", supabaseUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data?.payload) throw new Error("Snapshot not found");

    applySyncPayload(
      { ...data.payload, updatedAt: new Date().toISOString() },
      { preferRemote: true }
    );
    syncDirty = true;
    syncAvailable = true;
    syncBackend = "supabase";
    await pushRemoteSync({ force: true, throwOnError: true, historyReason: "restore" });
    await refreshSyncHistory({ quiet: true });
    alert("Snapshot restored and synced.");
  } catch (err) {
    alert(`Could not restore snapshot.${err?.message ? ` (${err.message})` : ""}`);
  }
}

function stopSyncPolling() {
  if (syncPollTimer) {
    clearInterval(syncPollTimer);
    syncPollTimer = null;
  }
}

function teardownSupabaseRealtime() {
  if (supabaseRealtimeChannel && supabaseClient) {
    supabaseClient.removeChannel(supabaseRealtimeChannel);
    supabaseRealtimeChannel = null;
  }
}

function setupSupabaseRealtime() {
  if (!supabaseClient || !supabaseUserId || supabaseRealtimeChannel) return;
  supabaseRealtimeChannel = supabaseClient
    .channel(`app_state:${supabaseUserId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "app_state",
        filter: `user_id=eq.${supabaseUserId}`,
      },
      () => pullRemoteSync({ force: true })
    )
    .subscribe();
}

function updateAuthUi() {
  const panel = document.getElementById("sync-auth-panel");
  const form = document.getElementById("sync-auth-form");
  const signedIn = document.getElementById("sync-auth-signed-in");
  const userEl = document.getElementById("sync-auth-user");
  const hint = document.getElementById("sync-auth-hint");
  if (!panel) return;

  if (!isSupabaseConfigured()) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");

  if (supabaseUserId && supabaseAuthEmail) {
    form?.classList.add("hidden");
    hint?.classList.add("hidden");
    signedIn?.classList.remove("hidden");
    if (userEl) userEl.textContent = `Signed in as ${supabaseAuthEmail}`;
    refreshSyncHistory({ quiet: true });
  } else {
    form?.classList.remove("hidden");
    hint?.classList.remove("hidden");
    signedIn?.classList.add("hidden");
    if (userEl) userEl.textContent = "";
    renderSyncHistory([]);
  }
}

function setupSupabaseAuthUi() {
  if (!isSupabaseConfigured()) return;

  const client = getSupabaseClient();
  if (!client) return;

  const form = document.getElementById("sync-auth-form");
  const emailInput = document.getElementById("sync-auth-email");
  const submitBtn = document.getElementById("sync-auth-submit");
  const signOutBtn = document.getElementById("sync-auth-sign-out");
  const authHint = document.getElementById("sync-auth-hint");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput?.value?.trim();
    if (!email) return;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    try {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
      if (authHint) {
        authHint.textContent = `Check ${email} for your sign-in link.`;
      }
    } catch (err) {
      alert(err?.message || "Could not send sign-in link.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send sign-in link";
      }
    }
  });

  signOutBtn?.addEventListener("click", async () => {
    stopSyncPolling();
    teardownSupabaseRealtime();
    syncAvailable = false;
    supabaseSyncStarted = false;
    supabaseUserId = null;
    supabaseAuthEmail = null;
    await client.auth.signOut();
    updateAuthUi();
    updateSyncUi();
  });

  client.auth.onAuthStateChange((_event, session) => {
    const wasSignedIn = Boolean(supabaseUserId);
    supabaseUserId = session?.user?.id || null;
    supabaseAuthEmail = session?.user?.email || null;
    updateAuthUi();

    if (supabaseUserId && !wasSignedIn) {
      startSupabaseSync();
    } else if (!supabaseUserId && wasSignedIn) {
      stopSyncPolling();
      teardownSupabaseRealtime();
      syncAvailable = false;
      updateSyncUi();
    }
  });

  client.auth.getSession().then(({ data }) => {
    supabaseUserId = data.session?.user?.id || null;
    supabaseAuthEmail = data.session?.user?.email || null;
    updateAuthUi();
    if (supabaseUserId) startSupabaseSync();
    else updateSyncUi();
  });
}

async function bootstrapRemoteSync(remote) {
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
  if (!syncPollTimer) {
    syncPollTimer = setInterval(() => pullRemoteSync(), SYNC_POLL_MS);
  }
  if (!syncListenersBound) {
    syncListenersBound = true;
    document.addEventListener("visibilitychange", onSyncVisibilityChange);
    window.addEventListener("focus", onSyncWindowFocus);
  }
}

function onSyncVisibilityChange() {
  if (document.visibilityState === "visible") pullRemoteSync();
}

function onSyncWindowFocus() {
  pullRemoteSync();
}

async function startSupabaseSync() {
  if (!supabaseUserId) return;
  if (supabaseSyncStarted && syncAvailable) return;
  getSupabaseClient();
  syncBackend = "supabase";
  syncAvailable = true;
  supabaseSyncStarted = true;
  setupSupabaseRealtime();
  try {
    const remote = await fetchRemotePayload();
    await bootstrapRemoteSync(remote);
    await refreshSyncHistory({ quiet: true });
  } catch {
    syncAvailable = false;
    supabaseSyncStarted = false;
    updateSyncUi();
  }
}

async function initLocalSync() {
  syncBackend = "local";
  try {
    const remote = await fetchRemotePayload();
    syncAvailable = true;
    await bootstrapRemoteSync(remote);
  } catch {
    syncAvailable = false;
    updateSyncUi();
  }
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

const DELETED_IDS_KEY = "priority-grid-deleted-ids";
const DELETED_ID_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function pruneDeletedIdMap(map) {
  const cutoff = Date.now() - DELETED_ID_TTL_MS;
  const out = {};
  Object.entries(map || {}).forEach(([id, iso]) => {
    const at = new Date(iso).getTime();
    if (!Number.isFinite(at) || at >= cutoff) out[id] = iso;
  });
  return out;
}

function loadDeletedIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || "{}");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function saveDeletedIds(map) {
  try {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(pruneDeletedIdMap(map)));
  } catch {}
}

/** Tombstone an id so sync merges can't resurrect it from an older copy. */
function recordDeletedId(id) {
  if (!id) return;
  const map = loadDeletedIds();
  map[id] = new Date().toISOString();
  saveDeletedIds(map);
}

function absorbDeletedIds(remoteDeleted) {
  if (!remoteDeleted || typeof remoteDeleted !== "object") return;
  const map = loadDeletedIds();
  let changed = false;
  Object.entries(remoteDeleted).forEach(([id, iso]) => {
    if (!id || map[id]) return;
    map[id] = typeof iso === "string" ? iso : new Date().toISOString();
    changed = true;
  });
  if (changed) saveDeletedIds(map);
}

function collectDeletedIdSet(...maps) {
  const set = new Set();
  maps.forEach((map) => {
    Object.keys(map && typeof map === "object" ? map : {}).forEach((id) => set.add(id));
  });
  return set;
}

function dropDeletedFromList(list, deletedSet) {
  if (!Array.isArray(list) || !deletedSet?.size) return Array.isArray(list) ? list : [];
  return list.filter((item) => !deletedSet.has(item?.id));
}

function buildSyncPayload() {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    deleted: loadDeletedIds(),
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
    profileAvatar: getProfileAvatar() === DEFAULT_PROFILE_AVATAR ? null : getProfileAvatar(),
    anxietyBox: loadAnxietyBox(),
    anxietyHistory: loadAnxietyHistory(),
    standaloneNotes: loadStandaloneNotes(),
    weekStart: getWeekStartPreference(),
  };
}

function mergeTaskLists(localList, remoteList, preferRemote = true) {
  const local = Array.isArray(localList) ? localList : [];
  const remote = Array.isArray(remoteList) ? remoteList : [];
  const deleted = collectDeletedIdSet(loadDeletedIds());
  const byId = new Map();
  const order = [];

  for (const task of local) {
    if (!task?.id || deleted.has(task.id)) continue;
    byId.set(task.id, task);
    order.push(task.id);
  }

  for (const task of remote) {
    if (!task?.id || deleted.has(task.id)) continue;
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

  absorbDeletedIds(payload.deleted);

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

  if (typeof payload.profileAvatar === "string") {
    if (preferRemote || getProfileAvatar() === DEFAULT_PROFILE_AVATAR) {
      setProfileAvatar(payload.profileAvatar, { skipSync: true });
    }
  } else if (payload.profileAvatar === null && preferRemote) {
    setProfileAvatar("", { skipSync: true });
  }

  if (payload.weekStart === "sunday" || payload.weekStart === "monday") {
    if (preferRemote) setWeekStartPreference(payload.weekStart, { skipSync: true });
  }

  if (Array.isArray(payload.anxietyBox) || loadAnxietyBox().length > 0) {
    saveAnxietyBox(
      mergeTaskLists(loadAnxietyBox(), payload.anxietyBox || [], preferRemote),
      skipSync
    );
  }

  if (Array.isArray(payload.anxietyHistory) || loadAnxietyHistory().length > 0) {
    saveAnxietyHistory(
      mergeTaskLists(loadAnxietyHistory(), payload.anxietyHistory || [], preferRemote),
      skipSync
    );
  }

  if (Array.isArray(payload.standaloneNotes) || loadStandaloneNotes().length > 0) {
    saveStandaloneNotes(
      mergeTaskLists(loadStandaloneNotes(), payload.standaloneNotes || [], preferRemote),
      skipSync
    );
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

  // Sync can restore yesterday's done state after startup maintenance — re-run now.
  runDailyMaintenance({ render: false });

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
    const remote = await fetchRemotePayload();
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
      runDailyMaintenance({ render: false });
      renderAll();
      updateSyncUi();
    }
  } catch {
    if (syncBackend !== "supabase") syncAvailable = false;
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
    const saved = await saveRemotePayload(payload);
    if (saved?.updatedAt) {
      setSyncMeta({ updatedAt: saved.updatedAt });
      syncDirty = false;
      updateSyncUi();
      await recordSyncHistory(saved, {
        reason: options.historyReason || "auto",
      });
    }
  } catch (err) {
    if (syncBackend !== "supabase") syncAvailable = false;
    updateSyncUi();
    if (options.throwOnError) throw err;
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
  const hint = document.getElementById("sync-hint") || document.querySelector(".sync-hint");
  const status = document.getElementById("sync-status");
  const banner = document.getElementById("sync-banner");
  const bannerText = document.getElementById("sync-banner-text");
  const dismissed = localStorage.getItem(SYNC_BANNER_KEY) === "1";
  const host = location.hostname;
  const isRemoteHost = host !== "localhost" && host !== "127.0.0.1";
  const localCount = countLocalTasks();
  const usingSupabase = isSupabaseConfigured();

  if (status) {
    if (usingSupabase && !supabaseUserId) {
      status.textContent = "Sign in to sync across devices";
      status.classList.add("sync-status-offline");
    } else if (syncAvailable) {
      const taskNote = localCount === 1 ? "1 task" : `${localCount} tasks`;
      const cloudNote = usingSupabase ? "Cloud sync" : "Connected";
      status.textContent = syncDirty
        ? `${cloudNote} — saving… (${taskNote} on this device)`
        : `${cloudNote} — synced (${taskNote} on this device)`;
      status.classList.remove("sync-status-offline");
    } else {
      status.textContent = usingSupabase
        ? "Cloud sync unavailable — check your connection"
        : "Not connected to sync server";
      status.classList.add("sync-status-offline");
    }
  }

  if (syncAvailable) {
    if (hint) {
      hint.textContent = usingSupabase
        ? "Signed-in devices share the same tasks automatically."
        : isRemoteHost
          ? `This device is on ${location.host}. Tasks sync with other devices using the same address.`
          : "On your phone, open the http:// address from ./serve.sh (hotspot IP), not localhost.";
    }
    if (banner) banner.classList.add("hidden");
    return;
  }

  if (hint) {
    hint.textContent = usingSupabase
      ? "Your tasks stay on this device until you sign in with email."
      : "Run ./serve.sh on your Mac, then open the same http:// address on phone and computer.";
  }
  if (banner && isRemoteHost && !dismissed) {
    banner.classList.remove("hidden");
    const message = usingSupabase
      ? "Sign in under <strong>Settings → Data &amp; sync</strong> to keep tasks in sync across devices."
      : "Sync server not detected. Run <strong>./serve.sh</strong> on your Mac and use the same URL on every device.";
    if (bannerText) bannerText.innerHTML = message;
    else banner.querySelector("p").innerHTML = message;
  }
}

async function forceSyncNow() {
  if (isSupabaseConfigured() && !supabaseUserId) {
    alert("Sign in under Settings → Data & sync to use cloud sync.");
    return;
  }

  const btn = document.getElementById("sync-now-btn");
  const status = document.getElementById("sync-status");
  const prevLabel = btn?.textContent || "Sync now";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Syncing…";
  }
  if (status) status.textContent = "Syncing with cloud…";

  try {
    syncAvailable = true;
    if (isSupabaseConfigured()) syncBackend = "supabase";

    const remote = await fetchRemotePayload();
    const localCount = countLocalTasks();
    const remoteCount = countPayloadTasks(remote);

    if (remoteCount > localCount && remoteCount > 0) {
      applySyncPayload(remote, { preferRemote: true });
      await pushRemoteSync({ force: true, throwOnError: true, historyReason: "manual" });
    } else if (localCount > 0) {
      await pushRemoteSync({ force: true, throwOnError: true, historyReason: "manual" });
    } else if (remoteCount > 0) {
      applySyncPayload(remote, { preferRemote: true });
      await recordSyncHistory(remote, { reason: "manual" });
    } else {
      await pushRemoteSync({ force: true, throwOnError: true, historyReason: "manual" });
    }

    updateSyncUi();
    await refreshSyncHistory({ quiet: true });
    if (btn) btn.textContent = "Synced!";
  } catch (err) {
    if (syncBackend !== "supabase") syncAvailable = false;
    updateSyncUi();
    const detail = err?.message || err?.error_description || "";
    const message = isSupabaseConfigured()
      ? `Could not sync with cloud.${detail ? ` (${detail})` : " Check your connection and try again."}`
      : "Could not reach the sync server. On your phone, open the exact http:// address from ./serve.sh on your Mac (hotspot IP, not localhost).";
    alert(message);
    if (btn) btn.textContent = prevLabel;
  } finally {
    if (btn) {
      btn.disabled = false;
      if (btn.textContent === "Synced!") {
        setTimeout(() => {
          if (btn.textContent === "Synced!") btn.textContent = prevLabel;
        }, 1600);
      }
    }
  }
}

async function initRemoteSync() {
  if (isSupabaseConfigured()) {
    if (!supabaseUserId) updateSyncUi();
    return;
  }
  await initLocalSync();
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

  document.querySelectorAll(".theme-option[data-theme]").forEach((btn) => {
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

function deleteButtonHtml() {
  return `<button type="button" class="delete-btn" aria-label="Delete task permanently" title="Delete permanently"><svg class="icon icon-delete-btn" aria-hidden="true"><use href="#icon-trash"></use></svg></button>`;
}

function taskHasNotes(task) {
  return getTaskNoteEntries(task).length > 0;
}

function normalizeNoteEntry(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const text = item.trim();
    if (!text) return null;
    return { id: createId(), text, createdAt: new Date().toISOString() };
  }
  const text = typeof item.text === "string" ? item.text.trim() : "";
  if (!text) return null;
  return {
    id: typeof item.id === "string" && item.id ? item.id : createId(),
    text,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };
}

/** Notes linked to one task — array of {id, text, createdAt}; migrates legacy string `notes`. */
function getTaskNoteEntries(task) {
  if (!task) return [];
  if (Array.isArray(task.noteEntries)) {
    return task.noteEntries.map(normalizeNoteEntry).filter(Boolean);
  }
  const legacy = typeof task.notes === "string" ? task.notes.trim() : "";
  if (!legacy) return [];
  return [
    {
      id: `legacy-${task.id || "note"}`,
      text: legacy,
      createdAt: task.completedAt || task.createdAt || new Date().toISOString(),
    },
  ];
}

function taskNotesJoinedText(entries) {
  return (Array.isArray(entries) ? entries : [])
    .map((n) => (typeof n?.text === "string" ? n.text.trim() : ""))
    .filter(Boolean)
    .join("\n\n");
}

function withTaskNotes(task, entries) {
  const noteEntries = (Array.isArray(entries) ? entries : []).map(normalizeNoteEntry).filter(Boolean);
  return {
    ...task,
    noteEntries,
    notes: taskNotesJoinedText(noteEntries),
  };
}

function formatNoteTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dialogNoteItemHtml(note) {
  const when = formatNoteTimestamp(note.createdAt);
  return `
    <li class="dialog-notes-item" data-note-id="${escapeHtml(note.id)}">
      <div class="dialog-notes-item-body">
        <p class="dialog-notes-item-text">${escapeHtml(note.text)}</p>
        ${when ? `<p class="dialog-notes-item-meta">${escapeHtml(when)}</p>` : ""}
      </div>
      <button type="button" class="dialog-notes-item-delete" aria-label="Delete note" title="Delete note">×</button>
    </li>`;
}

function renderDialogNotesList() {
  const list = document.getElementById("dialog-notes-list");
  const empty = document.getElementById("dialog-notes-empty");
  const countEl = document.getElementById("dialog-notes-count");
  const hidden = document.getElementById("dialog-notes");
  if (!list) return;
  list.innerHTML = dialogNoteEntries.map(dialogNoteItemHtml).join("");
  empty?.classList.toggle("hidden", dialogNoteEntries.length > 0);
  if (countEl) {
    countEl.textContent = dialogNoteEntries.length
      ? `${dialogNoteEntries.length} note${dialogNoteEntries.length === 1 ? "" : "s"}`
      : "";
  }
  if (hidden) hidden.value = taskNotesJoinedText(dialogNoteEntries);
  list.querySelectorAll(".dialog-notes-item-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("[data-note-id]");
      const id = row?.dataset.noteId;
      if (!id) return;
      dialogNoteEntries = dialogNoteEntries.filter((n) => n.id !== id);
      dialogClaimedNoteIds = dialogClaimedNoteIds.filter((claimed) => claimed !== id);
      renderDialogNotesList();
    });
  });
  renderDialogExistingNotes();
}

function addDialogNoteFromInput() {
  const input = document.getElementById("dialog-notes-input");
  const text = input?.value.trim() || "";
  if (!text) return;
  dialogNoteEntries = [
    ...dialogNoteEntries,
    { id: createId(), text, createdAt: new Date().toISOString() },
  ];
  if (input) input.value = "";
  renderDialogNotesList();
}

/* Standalone notes claimed by the dialog draft — removed from History once saved. */
let dialogClaimedNoteIds = [];

function renderDialogExistingNotes() {
  const row = document.getElementById("dialog-notes-existing-row");
  const select = document.getElementById("dialog-notes-existing");
  if (!row || !select) return;
  const attached = new Set(dialogNoteEntries.map((n) => n.id));
  const available = loadStandaloneNotes().filter((note) => !attached.has(note.id));
  row.classList.toggle("hidden", available.length === 0);
  select.innerHTML = available
    .map(
      (note) =>
        `<option value="${escapeHtml(note.id)}">${escapeHtml(truncateReflectionLabel(note.text, 48))}</option>`
    )
    .join("");
}

function consumeClaimedDialogNotes() {
  if (!dialogClaimedNoteIds.length) return;
  const claimed = new Set(dialogClaimedNoteIds);
  dialogClaimedNoteIds = [];
  claimed.forEach((id) => recordDeletedId(id));
  saveStandaloneNotes(loadStandaloneNotes().filter((note) => !claimed.has(note.id)));
}

function attachExistingNoteToDialog() {
  const select = document.getElementById("dialog-notes-existing");
  const noteId = select?.value || "";
  if (!noteId) return;
  const note = loadStandaloneNotes().find((n) => n.id === noteId);
  if (!note) return;
  dialogNoteEntries = [...dialogNoteEntries, { ...note }];
  if (!dialogClaimedNoteIds.includes(noteId)) dialogClaimedNoteIds.push(noteId);
  renderDialogNotesList();
}

function setupDialogNotes() {
  const addBtn = document.getElementById("dialog-notes-add");
  const input = document.getElementById("dialog-notes-input");
  const attachBtn = document.getElementById("dialog-notes-attach");
  if (addBtn && !addBtn.dataset.bound) {
    addBtn.dataset.bound = "1";
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addDialogNoteFromInput();
    });
  }
  if (attachBtn && !attachBtn.dataset.bound) {
    attachBtn.dataset.bound = "1";
    attachBtn.addEventListener("click", (e) => {
      e.preventDefault();
      attachExistingNoteToDialog();
    });
  }
  if (input && !input.dataset.bound) {
    input.dataset.bound = "1";
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        addDialogNoteFromInput();
      }
    });
  }
}

function normalizeStandaloneNote(item) {
  if (!item) return null;
  const text = typeof item.text === "string" ? item.text.trim() : "";
  if (!text) return null;
  return {
    id: typeof item.id === "string" && item.id ? item.id : createId(),
    text,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };
}

function loadStandaloneNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STANDALONE_NOTES_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStandaloneNote).filter(Boolean);
  } catch {
    return [];
  }
}

function saveStandaloneNotes(items, options = {}) {
  localStorage.setItem(
    STANDALONE_NOTES_KEY,
    JSON.stringify((Array.isArray(items) ? items : []).map(normalizeStandaloneNote).filter(Boolean))
  );
  if (!options.skipSync) markSyncDirty();
}

function addStandaloneNote(text) {
  const trimmed = String(text || "").trim().slice(0, 1000);
  if (!trimmed) return null;
  const note = { id: createId(), text: trimmed, createdAt: new Date().toISOString() };
  saveStandaloneNotes([note, ...loadStandaloneNotes()]);
  return note;
}

function deleteStandaloneNote(id) {
  recordDeletedId(id);
  saveStandaloneNotes(loadStandaloneNotes().filter((n) => n.id !== id));
}

function linkStandaloneNoteToTask(noteId, taskId, context) {
  const notes = loadStandaloneNotes();
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;
  const task = loadTasks(context).find((t) => t.id === taskId);
  if (!task) return;
  const entries = [
    ...getTaskNoteEntries(task),
    { id: note.id, text: note.text, createdAt: note.createdAt },
  ];
  persistTaskNotes(taskId, context, entries);
  deleteStandaloneNote(noteId);
}

function getOpenTasksForNoteLink() {
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || t.done || isTaskDeferred(t)) return;
      tasks.push({ ...t, context: ctx });
    });
  });
  tasks.sort((a, b) => a.tier - b.tier || a.text.localeCompare(b.text));
  return tasks.slice(0, 80);
}

function collectAllNotesForPanel() {
  const items = [];
  loadStandaloneNotes().forEach((note) => {
    items.push({
      id: note.id,
      text: note.text,
      createdAt: note.createdAt,
      source: "standalone",
    });
  });
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived) return;
      getTaskNoteEntries(t).forEach((note) => {
        items.push({
          id: note.id,
          text: note.text,
          createdAt: note.createdAt,
          source: "task",
          taskId: t.id,
          context: ctx,
          taskText: t.text,
        });
      });
    });
  });
  items.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  return items;
}

function notesPanelTaskOptionsHtml(selectedValue = "") {
  const options = [`<option value="">Choose a task…</option>`];
  getOpenTasksForNoteLink().forEach((task) => {
    const value = `${task.context}:${task.id}`;
    const label = truncateReflectionLabel(task.text, 42);
    options.push(
      `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`
    );
  });
  return options.join("");
}

function notesPanelItemHtml(note) {
  const when = formatNoteTimestamp(note.createdAt);
  return `
    <article class="notes-panel-item" data-note-id="${escapeHtml(note.id)}" data-note-source="task" data-task-id="${escapeHtml(note.taskId)}" data-context="${escapeHtml(note.context)}">
      <div class="notes-panel-item-body">
        <p class="notes-panel-item-text">${escapeHtml(note.text)}</p>
        ${when ? `<p class="notes-panel-item-meta">${escapeHtml(when)}</p>` : ""}
      </div>
      <button type="button" class="notes-panel-item-delete" aria-label="Delete note" title="Delete note">×</button>
    </article>`;
}

function notesPanelGroupHtml(taskText, context, taskId, notes) {
  return `
    <section class="notes-panel-group">
      <button type="button" class="notes-panel-group-task" data-task-id="${escapeHtml(taskId)}" data-context="${escapeHtml(context)}">
        ${escapeHtml(taskText || "Task")}
      </button>
      <div class="notes-panel-group-list">
        ${notes.map(notesPanelItemHtml).join("")}
      </div>
    </section>`;
}

function fillNotesPanelTaskSelect() {
  const select = document.getElementById("notes-panel-task");
  if (!select) return;
  const current = select.value;
  select.innerHTML = notesPanelTaskOptionsHtml(current);
}

function renderNotesPanel() {
  const list = document.getElementById("notes-panel-list");
  const empty = document.getElementById("notes-panel-empty");
  if (!list || !empty) return;

  fillNotesPanelTaskSelect();
  const notes = collectAllNotesForPanel().filter((n) => n.source === "task");
  if (!notes.length) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  const groups = new Map();
  notes.forEach((note) => {
    const key = `${note.context}:${note.taskId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        taskText: note.taskText,
        context: note.context,
        taskId: note.taskId,
        notes: [],
      });
    }
    groups.get(key).notes.push(note);
  });

  list.innerHTML = [...groups.values()]
    .map((group) => notesPanelGroupHtml(group.taskText, group.context, group.taskId, group.notes))
    .join("");

  list.querySelectorAll(".notes-panel-group-task").forEach((btn) => {
    btn.addEventListener("click", () => {
      const task = findTaskByRef({ id: btn.dataset.taskId, context: btn.dataset.context });
      if (task) openEditTaskDialog(task, btn.dataset.context);
    });
  });

  list.querySelectorAll(".notes-panel-item").forEach((row) => {
    const noteId = row.dataset.noteId;
    row.querySelector(".notes-panel-item-delete")?.addEventListener("click", () => {
      deleteTaskNote(row.dataset.taskId, row.dataset.context, noteId);
    });
  });
}

function saveNotesPanelNote() {
  const input = document.getElementById("notes-panel-input");
  const select = document.getElementById("notes-panel-task");
  const text = input?.value.trim() || "";
  const linkValue = select?.value || "";
  if (!text || !linkValue) return;
  const [context, taskId] = linkValue.split(":");
  if (!context || !taskId) return;
  addTaskNote(taskId, context, text);
  if (input) input.value = "";
  renderNotesPanel();
  renderAll();
}

function setupNotesPanel() {
  const form = document.getElementById("notes-panel-form");
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveNotesPanelNote();
  });
}

function taskHasPhotos(task) {
  return Array.isArray(task?.photos) && task.photos.length > 0;
}

function taskAttachmentIndicatorHtml(task, options = {}) {
  const hasNotes = taskHasNotes(task);
  const hasPhotos = taskHasPhotos(task);
  if (!hasNotes && !hasPhotos) return "";
  const bits = [];
  if (hasNotes) {
    const noteCount = getTaskNoteEntries(task).length;
    bits.push(
      `<span class="task-attach-chip" title="${noteCount} note${noteCount === 1 ? "" : "s"}" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#icon-note"></use></svg>${noteCount > 1 ? `<span class="task-attach-count">${noteCount}</span>` : ""}</span>`
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
  if (options.interactive === false) {
    return `<span class="task-attach-btn task-attach-btn--static" aria-label="Has ${label}" title="Has ${label}">${bits.join("")}</span>`;
  }
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

function getHomeContextFilter() {
  try {
    const saved = localStorage.getItem(HOME_CONTEXT_FILTER_KEY);
    if (saved === "all" || isValidContext(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "all";
}

function matchesHomeContextFilter(ctx) {
  return homeContextFilter === "all" || ctx === homeContextFilter;
}

function setHomeContextFilter(ctx) {
  const next = ctx === "all" || isValidContext(ctx) ? ctx : "all";
  homeContextFilter = next;
  try {
    localStorage.setItem(HOME_CONTEXT_FILTER_KEY, next);
  } catch {
    /* ignore */
  }
  renderHomeCategoryTags();
  if (page === "home") renderHome();
}

function renderHomeCategoryTags() {
  const el = document.getElementById("home-category-tags");
  if (!el) return;
  if (homeContextFilter !== "all" && !isValidContext(homeContextFilter)) {
    homeContextFilter = "all";
  }
  const contexts = getContexts();
  el.innerHTML = [
    `<button type="button" class="home-category-tag${
      homeContextFilter === "all" ? " active" : ""
    }" data-context="all" aria-pressed="${homeContextFilter === "all"}">All</button>`,
    ...contexts.map((ctx) => {
      const active = homeContextFilter === ctx;
      return `<button type="button" class="home-category-tag${
        active ? " active" : ""
      }" data-context="${escapeHtml(ctx)}" aria-pressed="${active}">
        ${contextIconHtml(ctx, "home-category-tag-icon")}
        <span>${escapeHtml(contextLabel(ctx))}</span>
      </button>`;
    }),
  ].join("");
  requestAnimationFrame(() => syncHomeTagScrollButtons());
}

function syncHomeTagScrollButtons() {
  const desktop = window.matchMedia("(min-width: 769px)").matches;
  document.querySelectorAll(".home-plan-tag-row").forEach((row) => {
    const scroller = row.querySelector(".priority-visibility-tags--home, .home-category-tags");
    const prevBtn = row.querySelector(".home-tag-scroll-btn--prev");
    const nextBtn = row.querySelector(".home-tag-scroll-btn--next");
    if (!scroller || !prevBtn || !nextBtn) return;

    if (!desktop) {
      row.classList.remove("has-prev", "has-next");
      prevBtn.hidden = true;
      nextBtn.hidden = true;
      return;
    }

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const canScroll = maxScroll > 4;
    const canPrev = canScroll && scroller.scrollLeft > 4;
    const canNext = canScroll && scroller.scrollLeft < maxScroll - 4;
    row.classList.toggle("has-prev", canPrev);
    row.classList.toggle("has-next", canNext);
    prevBtn.hidden = !canPrev;
    nextBtn.hidden = !canNext;
  });
}

function setupHomeTagScrollButtons() {
  const filters = document.querySelector(".home-plan-filters");
  if (!filters || filters.dataset.scrollBound) return;
  filters.dataset.scrollBound = "1";

  filters.addEventListener("click", (event) => {
    const btn = event.target.closest(".home-tag-scroll-btn");
    if (!btn || window.matchMedia("(max-width: 768px)").matches) return;
    const scroller = document.getElementById(btn.dataset.scrollTarget || "");
    if (!scroller) return;
    const dir = Number(btn.dataset.scrollDir) || 1;
    const amount = Math.max(scroller.clientWidth * 0.7, 140) * dir;
    scroller.scrollBy({ left: amount, behavior: "smooth" });
  });

  filters.querySelectorAll(".priority-visibility-tags--home, .home-category-tags").forEach((scroller) => {
    scroller.addEventListener("scroll", () => syncHomeTagScrollButtons(), { passive: true });
  });

  window.addEventListener("resize", () => syncHomeTagScrollButtons());
  requestAnimationFrame(() => syncHomeTagScrollButtons());
}

function setupHomeCategoryTags() {
  const el = document.getElementById("home-category-tags");
  if (!el || el.dataset.bound) return;
  el.dataset.bound = "1";
  el.addEventListener("click", (event) => {
    const btn = event.target.closest(".home-category-tag");
    if (!btn) return;
    setHomeContextFilter(btn.dataset.context || "all");
  });
  setupHomeTagScrollButtons();
  renderHomeCategoryTags();
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

function getProfileAvatar() {
  try {
    const saved = localStorage.getItem(PROFILE_AVATAR_KEY);
    if (isValidAvatarImage(saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_PROFILE_AVATAR;
}

function setProfileAvatar(value, options = {}) {
  const next = isValidAvatarImage(value) ? value : "";
  try {
    if (next) localStorage.setItem(PROFILE_AVATAR_KEY, next);
    else localStorage.removeItem(PROFILE_AVATAR_KEY);
  } catch {
    /* ignore */
  }
  if (!options.skipSync) markSyncDirty();
  syncProfileAvatarUi();
  return getProfileAvatar();
}

function syncProfileAvatarUi() {
  const src = getProfileAvatar();
  const hasCustom = src !== DEFAULT_PROFILE_AVATAR;
  document.querySelectorAll(".sidebar-avatar-img, .sidebar-profile-avatar, #profile-avatar-img").forEach((el) => {
    if (el instanceof HTMLImageElement) el.src = src;
  });
  const clearBtn = document.getElementById("profile-avatar-clear");
  clearBtn?.classList.toggle("hidden", !hasCustom);
}

function setupProfileAvatar() {
  syncProfileAvatarUi();
  const btn = document.getElementById("profile-avatar-btn");
  const input = document.getElementById("profile-avatar-input");
  const clearBtn = document.getElementById("profile-avatar-clear");
  if (!btn || !input || btn.dataset.bound) return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => input.click());
  clearBtn?.addEventListener("click", () => {
    setProfileAvatar("");
  });
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const dataUrl = await avatarDataUrlFromFile(file);
      setProfileAvatar(dataUrl);
    } catch (err) {
      alert(err?.message || "Could not use that image.");
    }
  });
}

function getWeekStartPreference() {
  try {
    const saved = localStorage.getItem(WEEK_START_KEY);
    if (saved === "sunday" || saved === "monday") return saved;
  } catch {
    /* ignore */
  }
  return "monday";
}

function setWeekStartPreference(value, options = {}) {
  const next = value === "sunday" ? "sunday" : "monday";
  try {
    localStorage.setItem(WEEK_START_KEY, next);
  } catch {
    /* ignore */
  }
  if (!options.skipSync) markSyncDirty();
  syncWeekStartUi();
  // Realign the fortnight window to the new week-start preference.
  if (weeklyWindowStartKey) {
    setWeeklyWindowStartKey(weeklyWindowStartKey, { skipRender: true });
  }
  if (weeklyView) {
    if (page === "home") renderHome();
    else if (page === "tasks") renderGrid();
  }
  return next;
}

function syncWeekStartUi() {
  const current = getWeekStartPreference();
  document.querySelectorAll(".week-start-option").forEach((btn) => {
    const isActive = btn.dataset.weekStart === current;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-checked", String(isActive));
  });
}

function setupWeekStartPicker() {
  const picker = document.getElementById("week-start-picker");
  if (!picker || picker.dataset.bound) return;
  picker.dataset.bound = "1";
  syncWeekStartUi();
  picker.querySelectorAll(".week-start-option").forEach((btn) => {
    btn.addEventListener("click", () => setWeekStartPreference(btn.dataset.weekStart));
  });
}

function syncSettingsMode135Toggle() {
  const input = document.getElementById("settings-mode-135-toggle");
  if (input && document.activeElement !== input) input.checked = mode135;
}

function setupSettingsPreferences() {
  setupWeekStartPicker();
  const input = document.getElementById("settings-mode-135-toggle");
  if (input && !input.dataset.bound) {
    input.dataset.bound = "1";
    syncSettingsMode135Toggle();
    input.addEventListener("change", () => {
      setMode135(input.checked);
    });
  }
  const weeklyInput = document.getElementById("settings-weekly-view-toggle");
  if (weeklyInput && !weeklyInput.dataset.bound) {
    weeklyInput.dataset.bound = "1";
    weeklyInput.checked = weeklyView;
    weeklyInput.addEventListener("change", () => {
      setWeeklyView(weeklyInput.checked);
    });
  }
  setupWeeklyViewControls();
}

function anxietyBoxItemHtml(item) {
  return `
    <li class="reflection-anxiety-item" data-anxiety-id="${escapeHtml(item.id)}">
      <label class="reflection-anxiety-check">
        <input type="checkbox" aria-label="Check off thought" />
      </label>
      <span class="reflection-anxiety-item-text">${escapeHtml(item.text)}</span>
      <button
        type="button"
        class="reflection-anxiety-toss"
        aria-label="Toss"
        title="Toss"
      >
        <svg class="icon reflection-anxiety-toss-icon" aria-hidden="true"><use href="#icon-trash"></use></svg>
      </button>
    </li>`;
}

function anxietyHistoryItemHtml(item, { showDate = false, showReason = true } = {}) {
  const reasonLabel = item.reason === "tossed" ? "Tossed" : "Checked off";
  const whenIso = item.archivedAt || item.createdAt;
  const timeLabel = formatNoteTimestamp(whenIso);
  let meta = "";
  if (showDate) {
    meta = showReason
      ? `${formatArchiveDayHeading(archiveDayKey(whenIso))} · ${reasonLabel}`
      : formatArchiveDayHeading(archiveDayKey(whenIso));
  } else if (timeLabel) {
    meta = showReason ? `${timeLabel} · ${reasonLabel}` : timeLabel;
  } else if (showReason) {
    meta = reasonLabel;
  }
  return `
    <li class="reflection-anxiety-history-item" data-anxiety-history-id="${escapeHtml(item.id)}">
      <div class="reflection-anxiety-history-copy">
        ${meta ? `<p class="reflection-anxiety-history-meta">${escapeHtml(meta)}</p>` : ""}
        <p class="reflection-anxiety-history-text">${escapeHtml(item.text)}</p>
      </div>
      <button
        type="button"
        class="reflection-anxiety-history-delete"
        aria-label="Delete permanently"
        title="Delete permanently"
      >
        <svg class="icon" aria-hidden="true"><use href="#icon-trash"></use></svg>
      </button>
    </li>`;
}

function groupAnxietyHistoryByDate(history) {
  const groups = new Map();
  (Array.isArray(history) ? history : []).forEach((item) => {
    const key = archiveDayKey(item.archivedAt || item.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dayKey, items]) => ({
      dayKey,
      items: items.slice().sort((a, b) => {
        const aTime = new Date(a.archivedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.archivedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      }),
    }));
}

function anxietyHistoryGroupedHtml(history) {
  return groupAnxietyHistoryByDate(history)
    .map(
      ({ dayKey, items }) => `
    <section class="reflection-anxiety-history-day" aria-label="${escapeHtml(formatArchiveDayHeading(dayKey))}">
      <h4 class="reflection-anxiety-history-day-title">${escapeHtml(formatArchiveDayHeading(dayKey))}</h4>
      <ul class="reflection-anxiety-history-day-list">
        ${items.map((item) => anxietyHistoryItemHtml(item, { showReason: true })).join("")}
      </ul>
    </section>`
    )
    .join("");
}

function getAnxietyHistoryForDay(dayKey, reason) {
  return loadAnxietyHistory()
    .filter((item) => {
      const onDay = archiveDayKey(item.archivedAt || item.createdAt) === dayKey;
      if (!onDay) return false;
      if (reason === "tossed") return item.reason === "tossed";
      if (reason === "checked") return item.reason !== "tossed";
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.archivedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.archivedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
}

/* Dock lives on the Thoughts tab only — it shouldn't ride along on Review. */
function syncReflectionAnxietyDock(hasItems = loadAnxietyBox().length > 0) {
  const card = document.getElementById("reflection-anxiety");
  const dialogOpen = Boolean(document.getElementById("reflection-dialog")?.open);
  const showDock = hasItems && dialogOpen && getActiveReflectionTab() === "thoughts";
  card?.classList.toggle("hidden", !showDock);
  document.documentElement.classList.toggle("reflection-anxiety-active", showDock);
  return showDock;
}

function renderReflectionAnxietyBox() {
  const list = document.getElementById("reflection-anxiety-list");
  const countEl = document.getElementById("reflection-anxiety-count");
  const historyList = document.getElementById("reflection-anxiety-history-list");
  const historyEmpty = document.getElementById("reflection-anxiety-history-empty");
  const pastSection = document.getElementById("reflection-past-thoughts");
  const historyHeading = document.getElementById("reflection-anxiety-history-heading");
  const historyCount = document.getElementById("reflection-anxiety-history-count");
  const tossedSection = document.getElementById("reflection-tossed-thoughts");
  const tossedList = document.getElementById("reflection-tossed-list");
  const tossedEmpty = document.getElementById("reflection-tossed-empty");
  const tossedHeading = document.getElementById("reflection-tossed-heading");
  const tossedCount = document.getElementById("reflection-tossed-count");
  const items = loadAnxietyBox();
  // Thoughts/Anxiety always uses today — day pager lives on Reflection review only.
  const dayKey = reflectionTodayKey();
  const tossedToday = getAnxietyHistoryForDay(dayKey, "tossed");
  const checkedDay = getAnxietyHistoryForDay(dayKey, "checked");
  const hasItems = items.length > 0;
  const dayLabel = "today";

  syncReflectionAnxietyDock(hasItems);
  document.documentElement.classList.toggle("reflection-has-anxiety", hasItems);
  if (countEl) {
    countEl.textContent = String(items.length);
    countEl.hidden = !hasItems;
  }
  if (list) {
    list.innerHTML = hasItems ? items.map((item) => anxietyBoxItemHtml(item)).join("") : "";
  }

  if (tossedHeading) tossedHeading.textContent = "Tossed";
  if (tossedCount) {
    tossedCount.textContent = tossedToday.length
      ? `${tossedToday.length} tossed ${dayLabel}`
      : `Nothing tossed ${dayLabel}.`;
  }
  if (tossedList) {
    tossedList.innerHTML = tossedToday.length
      ? tossedToday.map((item) => anxietyHistoryItemHtml(item, { showReason: false })).join("")
      : "";
  }
  if (tossedEmpty) {
    tossedEmpty.classList.toggle("hidden", tossedToday.length > 0);
  }
  tossedSection?.classList.toggle("is-empty", tossedToday.length === 0);

  if (historyHeading) {
    historyHeading.textContent = "Past thoughts";
  }
  if (historyCount) {
    historyCount.textContent = checkedDay.length
      ? `${checkedDay.length} checked off ${dayLabel}`
      : `No checked-off thoughts ${dayLabel}.`;
  }
  if (historyList) {
    historyList.innerHTML = checkedDay.length
      ? `<ul class="reflection-anxiety-history-day-list">${checkedDay
          .map((item) => anxietyHistoryItemHtml(item, { showReason: false }))
          .join("")}</ul>`
      : "";
  }
  if (historyEmpty) {
    historyEmpty.classList.toggle("hidden", checkedDay.length > 0);
  }
  pastSection?.classList.toggle("is-empty", checkedDay.length === 0);

  syncThoughtsBellAnimation();
  requestAnimationFrame(() => updateReflectionHeroOnCream());
}

function bindAnxietyListClicks(root) {
  root?.addEventListener("click", (event) => {
    const tossBtn = event.target.closest(".reflection-anxiety-toss");
    if (tossBtn) {
      const item = tossBtn.closest("[data-anxiety-id]");
      if (item?.dataset.anxietyId) tossAnxietyBoxItem(item.dataset.anxietyId);
      return;
    }
    const historyDelete = event.target.closest(".reflection-anxiety-history-delete");
    if (historyDelete) {
      const item = historyDelete.closest("[data-anxiety-history-id]");
      if (item?.dataset.anxietyHistoryId) deleteAnxietyHistoryItem(item.dataset.anxietyHistoryId);
    }
  });

  root?.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
    const item = input.closest("[data-anxiety-id]");
    if (!item?.dataset.anxietyId) return;
    if (input.checked) checkAnxietyBoxItem(item.dataset.anxietyId);
  });
}

function setupAnxietyBox() {
  const form = document.getElementById("reflection-anxiety-form");
  const input = document.getElementById("reflection-anxiety-input");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input?.value.trim()) return;
    addAnxietyBoxItem(input.value);
    input.value = "";
    renderReflectionAnxietyBox();
    renderFocusTimerChrome();
    input.focus();
  });

  bindAnxietyListClicks(document.getElementById("reflection-anxiety-list"));
  bindAnxietyListClicks(document.getElementById("reflection-tossed-list"));
  bindAnxietyListClicks(document.getElementById("reflection-anxiety-history-list"));
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
  return localDayKey();
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

function getWeeklyView() {
  try {
    return localStorage.getItem(WEEKLY_VIEW_KEY) === "1";
  } catch {
    return false;
  }
}

function setWeeklyView(enabled, options = {}) {
  weeklyView = Boolean(enabled);
  try {
    localStorage.setItem(WEEKLY_VIEW_KEY, weeklyView ? "1" : "0");
  } catch {
    /* ignore */
  }
  syncWeeklyViewUi();
  if (!options.skipRender) {
    if (page === "home") renderHome();
    if (page === "tasks") renderAll();
  }
  return weeklyView;
}

function syncWeeklyViewUi() {
  document.querySelectorAll(".weekly-view-toggle").forEach((btn) => {
    btn.classList.toggle("is-active", weeklyView);
    btn.setAttribute("aria-pressed", weeklyView ? "true" : "false");
    btn.textContent = weeklyView ? "Week on" : "Week";
  });
  const input = document.getElementById("settings-weekly-view-toggle");
  if (input && document.activeElement !== input) input.checked = weeklyView;
  document.body.classList.toggle("weekly-view-on", weeklyView);
  document.getElementById("board")?.classList.remove("hidden");
  document.getElementById("tasks-weekly-view")?.classList.toggle("hidden", !(weeklyView && page === "tasks"));
  document.querySelector(".priority-visibility-tags--home")?.classList.remove("hidden");
}

function setupWeeklyViewControls() {
  syncWeeklyViewUi();
  document.querySelectorAll(".weekly-view-toggle").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => setWeeklyView(!weeklyView));
  });
}

function getSidebarTab() {
  try {
    const stored = localStorage.getItem(SIDEBAR_TAB_KEY) || "brain";
    if (stored === "forget") return "nextweek";
    // Anxiety Box moved to Reflection — migrate any saved tab
    if (stored === "anxiety") return "brain";
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
    btn.setAttribute("aria-label", collapsed ? "Expand nav" : "Minimize nav");
    btn.setAttribute("title", collapsed ? "Expand nav" : "Minimize nav");
  }
  if (sidebar) {
    sidebar.classList.toggle("is-collapsed", collapsed);
  }
  document.documentElement.style.setProperty(
    "--sidebar-rail-width",
    collapsed ? "4.75rem" : "13.5rem"
  );
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
  const weekStart = getWeekStartPreference();
  const target = weekStart === "sunday" ? 0 : 1;
  let daysToAdd = (target - day + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7;
  d.setDate(d.getDate() + daysToAdd);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function formatNextWeekReturnLabel(dayKey = getNextMondayKey()) {
  const [y, m, d] = String(dayKey).split("-").map(Number);
  if (!y || !m || !d) {
    return getWeekStartPreference() === "sunday" ? "next Sunday" : "next Monday";
  }
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

function isRepeatTask(task) {
  return Boolean(task?.repeatDaily || task?.repeatWeekly);
}

function normalizeRepeatWeekday(value, fallback = new Date().getDay()) {
  const n = Number(value);
  if (Number.isInteger(n) && n >= 0 && n <= 6) return n;
  return fallback;
}

function stripRepeatFields(task) {
  const {
    repeatDaily: _d,
    repeatWeekly: _w,
    repeatWeekday: _day,
    repeatLastReset: _reset,
    ...rest
  } = task;
  return rest;
}

/** Reopen a repeating task for a new period (keep it active, clear done/archive). */
function reopenRepeatTask(task, stamp) {
  const updated = { ...task, done: false, archived: false, repeatLastReset: stamp };
  delete updated.completedAt;
  delete updated.archivedAt;
  return updated;
}

/**
 * Decide whether a done/archived repeating task should reopen for `today`.
 * Incomplete repeats always stay available (and unarchived).
 */
function maybeResetRepeatOccurrence(task, today, { dueToday }) {
  if (!dueToday) {
    // Off-schedule: still rescue accidentally archived incomplete repeats.
    if (task.archived && !task.done) {
      return { changed: true, task: { ...task, archived: false } };
    }
    return { changed: false, task };
  }

  if (!task.done && !task.archived) {
    if (task.repeatLastReset === today) return { changed: false, task };
    return { changed: true, task: { ...task, repeatLastReset: today } };
  }

  if (task.archived && !task.done) {
    return { changed: true, task: reopenRepeatTask(task, today) };
  }

  // Done (optionally archived) — reopen unless completed on this local day.
  const completedDay = task.completedAt ? archiveDayKey(task.completedAt) : null;
  if (completedDay === today && !task.archived) {
    if (task.repeatLastReset === today) return { changed: false, task };
    return { changed: true, task: { ...task, repeatLastReset: today } };
  }

  return { changed: true, task: reopenRepeatTask(task, today) };
}

function resetRepeatDailyTasksIfNeeded() {
  const today = localDayKey();
  let didChange = false;

  getContexts().forEach((ctx) => {
    const list = loadTasks(ctx);
    let changed = false;
    const next = list.map((t) => {
      if (!t.repeatDaily) return t;
      const result = maybeResetRepeatOccurrence(t, today, { dueToday: true });
      if (result.changed) changed = true;
      return result.task;
    });
    if (changed) {
      didChange = true;
      saveTasks(ctx, next);
    }
  });

  try {
    localStorage.setItem(REPEAT_RESET_KEY, today);
  } catch {
    /* ignore */
  }

  return didChange;
}

function resetRepeatWeeklyTasksIfNeeded() {
  const now = new Date();
  const today = localDayKey(now);
  const weekday = now.getDay();
  let didChange = false;

  getContexts().forEach((ctx) => {
    const list = loadTasks(ctx);
    let changed = false;
    const next = list.map((t) => {
      if (!t.repeatWeekly) return t;
      const targetDay = normalizeRepeatWeekday(t.repeatWeekday, weekday);
      const dueToday = targetDay === weekday;
      const ensured = t.repeatWeekday === targetDay ? t : { ...t, repeatWeekday: targetDay };
      const result = maybeResetRepeatOccurrence(ensured, today, { dueToday });
      if (result.changed || ensured !== t) changed = true;
      return result.task;
    });
    if (changed) {
      didChange = true;
      saveTasks(ctx, next);
    }
  });

  return didChange;
}

/** Local calendar day key (YYYY-MM-DD) for midnight rollover. */
function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function msUntilNextLocalMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * At local midnight (or on open/visibility after midnight), archive completed
 * tasks from previous days so they leave active lists but stay in history.
 * Repeating tasks are never archived by midnight rollover.
 */
function archiveCompletedTasksPastMidnight() {
  const today = localDayKey();
  let lastRollover = null;
  try {
    lastRollover = localStorage.getItem(DONE_ROLLOVER_KEY);
  } catch {
    /* ignore */
  }
  if (lastRollover === today) return false;

  const archivedAt = new Date().toISOString();
  const toClear = [];

  getContexts().forEach((ctx) => {
    const list = loadTasks(ctx);
    let changed = false;
    const next = list.map((t) => {
      if (t.archived || !t.done || isRepeatTask(t)) return t;
      const completedDay = t.completedAt ? archiveDayKey(t.completedAt) : null;
      if (completedDay === today) return t;
      changed = true;
      toClear.push({ id: t.id, context: ctx });
      const archived = { ...t, archived: true, archivedAt, done: true };
      if (!archived.completedAt) archived.completedAt = archivedAt;
      return archived;
    });
    if (changed) saveTasks(ctx, next);
  });

  if (toClear.length) {
    toClear.forEach(({ id, context }) => clearTaskRefs(id, context));
    focusTimerAttached = focusTimerAttached.filter(
      (ref) => !toClear.some((t) => t.id === ref.id && t.context === ref.context)
    );
    saveFocusTimerAttached();
  }

  try {
    localStorage.setItem(DONE_ROLLOVER_KEY, today);
  } catch {
    /* ignore */
  }
  return toClear.length > 0;
}

/** Move incomplete one-off tasks from past scheduled days onto today. */
function carryOverIncompleteScheduledTasks() {
  const today = localDayKey();
  let didChange = false;
  getContexts().forEach((ctx) => {
    const list = loadTasks(ctx);
    let changed = false;
    const next = list.map((t) => {
      if (t.archived || t.done || isRepeatTask(t) || isTaskDeferred(t)) return t;
      const scheduled = normalizeScheduledFor(t.scheduledFor);
      if (!scheduled || scheduled >= today) return t;
      changed = true;
      return { ...t, scheduledFor: today };
    });
    if (changed) {
      didChange = true;
      saveTasks(ctx, next);
    }
  });
  return didChange;
}

function runDailyMaintenance({ render = false } = {}) {
  clearExpiredDeferredTasks();
  const carried = carryOverIncompleteScheduledTasks();
  const resetDaily = resetRepeatDailyTasksIfNeeded();
  const resetWeekly = resetRepeatWeeklyTasksIfNeeded();
  const rolled = archiveCompletedTasksPastMidnight();
  if (render && (carried || rolled || resetDaily || resetWeekly)) renderAll();
  return carried || resetDaily || resetWeekly || rolled;
}

function scheduleMidnightMaintenance() {
  window.clearTimeout(scheduleMidnightMaintenance._timer);
  scheduleMidnightMaintenance._timer = window.setTimeout(() => {
    runDailyMaintenance({ render: true });
    scheduleMidnightMaintenance();
  }, msUntilNextLocalMidnight());
}

function setupDailyMaintenance() {
  runDailyMaintenance();
  scheduleMidnightMaintenance();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      runDailyMaintenance({ render: true });
      scheduleMidnightMaintenance();
    }
  });
  window.addEventListener("focus", () => {
    runDailyMaintenance({ render: true });
  });
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

function getRepeatWeeklyTasks() {
  const include = (t) => !t.archived && t.repeatWeekly && !isTaskDeferred(t);
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
  const today = localDayKey();
  saveTasks(targetCtx, [
    ...loadTasks(targetCtx),
    {
      id: createId(),
      text: trimmed,
      tier,
      done: false,
      repeatDaily: true,
      repeatLastReset: today,
    },
  ]);
}

function addRepeatWeeklyTask(text, tier, ctx, weekday) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const targetCtx = ctx || (filter === "all" ? "work" : filter);
  const today = localDayKey();
  const day = normalizeRepeatWeekday(weekday);
  saveTasks(targetCtx, [
    ...loadTasks(targetCtx),
    {
      id: createId(),
      text: trimmed,
      tier,
      done: false,
      repeatWeekly: true,
      repeatWeekday: day,
      repeatLastReset: today,
    },
  ]);
}

function removeRepeatDailyTask(id, ctx) {
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      return stripRepeatFields(t);
    })
  );
}

function removeRepeatWeeklyTask(id, ctx) {
  updateTaskInContext(ctx, (list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      return stripRepeatFields(t);
    })
  );
}

function applyRepeatModeToTask(task, mode, weekday) {
  const base = stripRepeatFields(task);
  if (mode === "daily") {
    const next = { ...base, repeatDaily: true, repeatLastReset: localDayKey() };
    delete next.scheduledFor;
    return next;
  }
  if (mode === "weekly") {
    const next = {
      ...base,
      repeatWeekly: true,
      repeatWeekday: normalizeRepeatWeekday(weekday),
      repeatLastReset: localDayKey(),
    };
    delete next.scheduledFor;
    return next;
  }
  return base;
}

function normalizeScheduledFor(value) {
  const key = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
  return key;
}

function applyScheduledForToTask(task, dayKey) {
  const next = { ...task };
  const scheduledFor = normalizeScheduledFor(dayKey);
  if (!scheduledFor || isRepeatTask(next)) {
    delete next.scheduledFor;
  } else {
    next.scheduledFor = scheduledFor;
  }
  return next;
}

/** Future-dated one-offs stay out of today's lists until their day (or overdue). */
function isTaskActiveOnToday(task) {
  const scheduledFor = normalizeScheduledFor(task?.scheduledFor);
  if (!scheduledFor) return true;
  return scheduledFor <= todayKey();
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
            ${contextIconHtml(task.context, "plan-135-ctx")}
            ${taskAttachmentIndicatorHtml(task, { interactive: false })}
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
      if (!t.archived && !isTaskDeferred(t) && isTaskActiveOnToday(t) && t.tier === tier) {
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
  if (btn) {
    btn.classList.toggle("active", mode135);
    btn.setAttribute("aria-pressed", String(mode135));
    btn.textContent = mode135 ? "On Home page" : "Show on Home";
  }
  syncSettingsMode135Toggle();
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
  document.getElementById("page-title").classList.toggle(
    "hidden",
    page === "home" || page === "tasks" || page === "settings" || page === "history"
  );
  document.getElementById("page-header").classList.toggle(
    "hidden",
    page === "home" || page === "settings" || page === "history"
  );
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
      active = btn.dataset.page === "tasks";
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
    } else if (page === "tasks") {
      active = btn.dataset.page === "tasks";
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
  if (selectEl?.id === "weekly-repeat-context") return document.getElementById("weekly-repeat-context-icon");
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
    sidebarSlot.innerHTML = "";
  }

  fillContextSelect(document.getElementById("dialog-context"), document.getElementById("dialog-context")?.value);
  fillContextSelect(
    document.getElementById("daily-repeat-context"),
    document.getElementById("daily-repeat-context")?.value
  );
  fillContextSelect(
    document.getElementById("weekly-repeat-context"),
    document.getElementById("weekly-repeat-context")?.value
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
        ? `<li class="lists-manager-empty">No custom categories yet — add one below.</li>`
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
  if (homeContextFilter !== "all" && !isValidContext(homeContextFilter)) {
    homeContextFilter = "all";
    try {
      localStorage.setItem(HOME_CONTEXT_FILTER_KEY, "all");
    } catch {
      /* ignore */
    }
  }
  renderHomeCategoryTags();
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
  document.getElementById("weekly-repeat-context")?.addEventListener("change", (e) => {
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
      const next = window.prompt("Rename category", current?.name || "");
      if (next == null) return;
      renameCustomContext(id, next);
      renderAll();
      return;
    }
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const current = getCustomContexts().find((c) => c.id === id);
      if (!confirm(`Delete category “${current?.name || id}”? Its tasks will be removed.`)) return;
      deleteCustomContext(id);
      renderAll();
    }
  });
}

function setupNavigation() {
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeReflectionDialog();
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
    closeReflectionDialog();
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
    closeReflectionDialog();
    setPage("tasks", filter);
  });

  document.getElementById("home-timer-jump")?.addEventListener("click", () => {
    const timer = document.getElementById("focus-timer");
    if (!timer) return;
    if (page !== "home") setPage("home");
    requestAnimationFrame(() => {
      timer.scrollIntoView({ behavior: "smooth", block: "center" });
      timer.classList.add("focus-timer-card--pulse");
      window.setTimeout(() => timer.classList.remove("focus-timer-card--pulse"), 900);
    });
  });

  const sidebarMenuBtn = document.getElementById("sidebar-menu-btn");
  if (sidebarMenuBtn) {
    sidebarMenuBtn.addEventListener("click", () => {
      setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
    });
  }

  const sidebarProfileBtn = document.getElementById("sidebar-profile-btn");
  if (sidebarProfileBtn) {
    sidebarProfileBtn.addEventListener("click", () => {
      closeReflectionDialog();
      setPage("settings");
    });
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
  if (!picker) return;

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
  if (weeklyView && (page === "tasks" || page === "home")) {
    const dayKey = ensureWeeklySelectedDayKey();
    const tasks = getTasksForWeeklyDay(dayKey).filter((t) => Number(t.tier) === tier);
    return sortTierTasksForDisplay(tasks, tier);
  }
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
  recordDeletedId(id);
  clearTaskRefs(id, ctx);
  focusTimerAttached = focusTimerAttached.filter(
    (ref) => !(ref.id === id && ref.context === ctx)
  );
  saveFocusTimerAttached();
  updateTaskInContext(ctx, (list) => list.filter((t) => t.id !== id));
  renderAll();
}

function confirmDeleteTask(id, ctx) {
  if (!confirm("Permanently delete this task? This cannot be undone.")) return false;
  deleteTask(id, ctx);
  return true;
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
          ${attachHtml}
          ${contextBadge}
        </div>
      </div>
      <div class="task-card-actions">
        ${inForgetIt ? `<span class="forget-it-indicator" title="In Next Week box" aria-label="In Next Week box"><svg class="icon icon-forget-box" aria-hidden="true"><use href="#icon-forget-box"></use></svg></span>` : ""}
        <button type="button" class="edit-btn" aria-label="Edit task"><svg class="icon icon-edit" aria-hidden="true"><use href="#icon-pencil"></use></svg></button>
        ${archiveButtonHtml()}
        ${deleteButtonHtml()}
      </div>
      ${taskDragHandleHtml()}
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
const REFLECTION_FAVOURITE_KEY = "priority-grid-reflection-favourite";

const REFLECTION_PROMPT_POOL = [
  { emoji: "🏆", text: "A small win I'm proud of" },
  { emoji: "😊", text: "A moment that made me smile" },
  { emoji: "💛", text: "Someone I'm grateful for" },
  { emoji: "⚡", text: "Something that energized me" },
  { emoji: "🌿", text: "A quiet moment I noticed" },
  { emoji: "🎯", text: "Something I moved forward on" },
  { emoji: "☀️", text: "What felt easy today" },
  { emoji: "🤝", text: "A kind gesture I received" },
  { emoji: "🎉", text: "Something worth celebrating" },
  { emoji: "🧭", text: "What I'd do again tomorrow" },
];

function reflectionTodayKey() {
  return archiveDayKey(new Date().toISOString());
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

function saveReflectionJournal(text, dayKey = reflectionTodayKey()) {
  const journal = loadReflectionJournal();
  journal[dayKey] = text;
  localStorage.setItem(REFLECTION_JOURNAL_KEY, JSON.stringify(journal));
}

function loadReflectionFavourites() {
  try {
    const raw = localStorage.getItem(REFLECTION_FAVOURITE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getReflectionFavouriteId(dayKey = reflectionTodayKey()) {
  const store = loadReflectionFavourites();
  const value = store[dayKey];
  return typeof value === "string" && value ? value : "";
}

function saveReflectionFavourite(taskId, dayKey = reflectionTodayKey()) {
  if (!taskId) return;
  const store = loadReflectionFavourites();
  store[dayKey] = taskId;
  localStorage.setItem(REFLECTION_FAVOURITE_KEY, JSON.stringify(store));
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
      (prompt, index) => `
    <button type="button" class="reflection-prompt-btn" data-prompt="${escapeHtml(prompt.text)}" style="--prompt-i: ${index}">
      <span class="reflection-prompt-emoji" aria-hidden="true">${prompt.emoji}</span>
      <span>${escapeHtml(prompt.text)}</span>
    </button>`
    )
    .join("");
  if (page === "history") {
    observeReflectionScrollCards(document.querySelector(".history-day-review"));
  }
}

function updateReflectionCharCount() {
  const textarea = document.getElementById("reflection-text");
  const countEl = document.getElementById("reflection-char-count");
  if (!textarea || !countEl) return;
  countEl.textContent = `${textarea.value.length} / 500`;
  if (page === "history") {
    saveReflectionJournal(textarea.value, ensureReflectionSelectedDayKey());
  }
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

let reflectionSelectedDayKey = null;

function ensureReflectionSelectedDayKey() {
  const week = getReflectionWeekDayKeys();
  if (!reflectionSelectedDayKey || !week.includes(reflectionSelectedDayKey)) {
    reflectionSelectedDayKey = week[0];
  }
  return reflectionSelectedDayKey;
}

function setReflectionSelectedDayKey(dayKey) {
  const week = getReflectionWeekDayKeys();
  if (!week.includes(dayKey)) return ensureReflectionSelectedDayKey();
  reflectionSelectedDayKey = dayKey;
  return reflectionSelectedDayKey;
}

function reflectionDayPhrase(dayKey, { short = false } = {}) {
  const today = reflectionTodayKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = archiveDayKey(yesterdayDate.toISOString());
  if (dayKey === today) return short ? "today" : "today";
  if (dayKey === yesterday) return short ? "yesterday" : "yesterday";
  const [y, m, d] = String(dayKey || "").split("-").map(Number);
  if (!y || !m || !d) return short ? "that day" : "that day";
  const date = new Date(y, m - 1, d);
  if (short) {
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function reflectionDayChipLabel(dayKey) {
  const today = reflectionTodayKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = archiveDayKey(yesterdayDate.toISOString());
  if (dayKey === today) return "Today";
  if (dayKey === yesterday) return "Yest";
  const [y, m, d] = String(dayKey || "").split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function getDailySummaryForDay(dayKey) {
  const completed = getCompletedTasksForDay(dayKey, { allowDemo: true });
  return {
    dayKey,
    completedCount: completed.length,
    completed,
  };
}

/** In-memory only — never written to localStorage / sync. Used when a day has no wins. */
const DEMO_REFLECTION_ID_PREFIX = "demo-reflect-";
const REFLECTION_DEMO_DAY_COUNT = 15;

function wantsForcedReflectionDemoWins() {
  try {
    return new URLSearchParams(window.location.search).has("reflection-demo");
  } catch {
    return false;
  }
}

function getReflectionWeekDayKeys() {
  const keys = [];
  const now = new Date();
  for (let offset = 0; offset < REFLECTION_DEMO_DAY_COUNT; offset += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    keys.push(archiveDayKey(d.toISOString()));
  }
  return keys;
}

function buildDemoReflectionWins(dayKey = reflectionTodayKey()) {
  const [y, m, d] = String(dayKey).split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const at = (hours, minutes) => {
    const stamp = new Date(base);
    stamp.setHours(hours, minutes, 0, 0);
    return stamp.toISOString();
  };
  const week = getReflectionWeekDayKeys();
  const slot = Math.max(0, week.indexOf(dayKey));
  const id = (n) => `${DEMO_REFLECTION_ID_PREFIX}${slot}-${n}`;

  /** One win shape per persona so paging the day strip previews the full catalog. */
  const sets = [
    // bookend
    [
      { id: id(1), text: "Morning stretch + walk", tier: 2, done: true, notes: "", completedAt: at(7, 45), context: "health" },
      { id: id(2), text: "Send client proposal", tier: 1, done: true, notes: "Felt clearer after outlining the ask.", completedAt: at(11, 20), context: "work" },
      { id: id(3), text: "Walk the dog at sunset", tier: 2, done: true, notes: "", completedAt: at(18, 40), context: "home" },
    ],
    // morning
    [
      { id: id(1), text: "Inbox zero sprint", tier: 2, done: true, notes: "", completedAt: at(7, 15), context: "work" },
      { id: id(2), text: "Prep lunch for the week", tier: 3, done: true, notes: "", completedAt: at(8, 40), context: "home" },
      { id: id(3), text: "Afternoon stretch", tier: 2, done: true, notes: "", completedAt: at(13, 20), context: "health" },
      { id: id(4), text: "Clear desk clutter", tier: 3, done: true, notes: "", completedAt: at(15, 10), context: "work" },
    ],
    // front-loaded
    [
      { id: id(1), text: "Ship morning standup notes", tier: 2, done: true, notes: "", completedAt: at(7, 5), context: "work" },
      { id: id(2), text: "Deep-work block on the deck", tier: 1, done: true, notes: "", completedAt: at(8, 30), context: "work" },
      { id: id(3), text: "Quick kitchen reset", tier: 3, done: true, notes: "", completedAt: at(10, 15), context: "home" },
      { id: id(4), text: "Short walk after lunch", tier: 3, done: true, notes: "", completedAt: at(13, 10), context: "health" },
    ],
    // closing
    [
      { id: id(1), text: "Grocery run", tier: 3, done: true, notes: "", completedAt: at(17, 20), context: "errands" },
      { id: id(2), text: "Pack tomorrow’s bag", tier: 3, done: true, notes: "", completedAt: at(19, 5), context: "home" },
      { id: id(3), text: "Wind-down walk", tier: 2, done: true, notes: "", completedAt: at(20, 30), context: "health" },
    ],
    // closer
    [
      { id: id(1), text: "Clear kitchen counters", tier: 3, done: true, notes: "", completedAt: at(10, 5), context: "home" },
      { id: id(2), text: "Pick up prescriptions", tier: 4, done: true, notes: "", completedAt: at(14, 20), context: "errands" },
      { id: id(3), text: "Ship the deck to stakeholders", tier: 1, done: true, notes: "Last move of the day.", completedAt: at(16, 55), context: "work" },
    ],
    // hunter
    [
      { id: id(1), text: "Finish board update", tier: 1, done: true, notes: "", completedAt: at(8, 50), context: "work" },
      { id: id(2), text: "Schedule dentist", tier: 4, done: true, notes: "", completedAt: at(11, 15), context: "errands" },
      { id: id(3), text: "Water plants", tier: 3, done: true, notes: "", completedAt: at(15, 40), context: "home" },
    ],
    // soft-landing
    [
      { id: id(1), text: "Lead standup + unblockers", tier: 1, done: true, notes: "", completedAt: at(13, 5), context: "work" },
      { id: id(2), text: "Draft follow-up emails", tier: 2, done: true, notes: "", completedAt: at(15, 40), context: "work" },
      { id: id(3), text: "Evening journal", tier: 3, done: true, notes: "", completedAt: at(20, 10), context: "personal" },
    ],
    // easy-wins
    [
      { id: id(1), text: "Empty the dishwasher", tier: 4, done: true, notes: "", completedAt: at(9, 20), context: "home" },
      { id: id(2), text: "Reply to two texts", tier: 4, done: true, notes: "", completedAt: at(11, 5), context: "personal" },
      { id: id(3), text: "Take out recycling", tier: 3, done: true, notes: "", completedAt: at(14, 40), context: "home" },
      { id: id(4), text: "Water the herbs", tier: 3, done: true, notes: "", completedAt: at(16, 15), context: "home" },
    ],
    // cat-home
    [
      { id: id(1), text: "Fold laundry", tier: 3, done: true, notes: "", completedAt: at(9, 10), context: "home" },
      { id: id(2), text: "Reset living room", tier: 3, done: true, notes: "", completedAt: at(12, 30), context: "home" },
      { id: id(3), text: "Cook a real dinner", tier: 2, done: true, notes: "", completedAt: at(18, 15), context: "home" },
    ],
    // cat-errands
    [
      { id: id(1), text: "Drop off dry cleaning", tier: 3, done: true, notes: "", completedAt: at(10, 20), context: "errands" },
      { id: id(2), text: "Post office run", tier: 3, done: true, notes: "", completedAt: at(13, 5), context: "errands" },
      { id: id(3), text: "Hardware store pickup", tier: 2, done: true, notes: "", completedAt: at(16, 40), context: "errands" },
    ],
    // cat-work
    [
      { id: id(1), text: "Outline the Q3 brief", tier: 2, done: true, notes: "", completedAt: at(10, 15), context: "work" },
      { id: id(2), text: "Review teammate PR", tier: 2, done: true, notes: "", completedAt: at(13, 45), context: "work" },
      { id: id(3), text: "Send status update", tier: 2, done: true, notes: "", completedAt: at(16, 20), context: "work" },
    ],
    // cat-health
    [
      { id: id(1), text: "Morning mobility flow", tier: 2, done: true, notes: "", completedAt: at(8, 10), context: "health" },
      { id: id(2), text: "Midday walk outside", tier: 3, done: true, notes: "", completedAt: at(12, 30), context: "health" },
      { id: id(3), text: "Evening stretch + water", tier: 3, done: true, notes: "", completedAt: at(19, 20), context: "health" },
    ],
    // cat-personal
    [
      { id: id(1), text: "Catch up on reading", tier: 3, done: true, notes: "", completedAt: at(10, 40), context: "personal" },
      { id: id(2), text: "Call a friend back", tier: 3, done: true, notes: "", completedAt: at(14, 15), context: "personal" },
      { id: id(3), text: "Plan weekend fun", tier: 2, done: true, notes: "", completedAt: at(17, 50), context: "personal" },
    ],
    // cat-faith
    [
      { id: id(1), text: "Morning quiet time", tier: 2, done: true, notes: "", completedAt: at(7, 30), context: "faith" },
      { id: id(2), text: "Write a short prayer", tier: 3, done: true, notes: "", completedAt: at(12, 10), context: "faith" },
      { id: id(3), text: "Evening gratitude note", tier: 3, done: true, notes: "", completedAt: at(20, 5), context: "faith" },
    ],
    // fallback — mixed so no single story wins hard
    [
      { id: id(1), text: "Tidy one drawer", tier: 3, done: true, notes: "", completedAt: at(11, 20), context: "home" },
      { id: id(2), text: "Reply to a work ping", tier: 2, done: true, notes: "", completedAt: at(14, 5), context: "work" },
      { id: id(3), text: "Pick up a card", tier: 4, done: true, notes: "", completedAt: at(16, 35), context: "errands" },
    ],
  ];

  return [...(sets[slot] || sets[sets.length - 1])].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

/**
 * Catalog fills for week browsing — one persona per day chip.
 * Used when a day is demo-filled so each page shows a different vibe.
 */
const REFLECTION_WEEK_PERSONA_FILLS = [
  {
    kind: "bookend",
    name: "Bookend Day",
    meaning: "You started and ended with care — morning win, evening win.",
    blurb: "Sunrise and lamplight both got a check — two anchors holding the middle steady.",
    tone: "forest",
  },
  {
    kind: "morning",
    name: "Morning Machine",
    meaning: "You got a lot done in the morning.",
    blurb: "First light favored you. That early pocket did real work.",
    tone: "forest",
  },
  {
    kind: "front-loaded",
    name: "Front-loaded Day",
    meaning: "Most of your wins landed before noon.",
    blurb: "Heavy before noon. Afternoon got to coast a little.",
    tone: "forest",
  },
  {
    kind: "closing",
    name: "Closing Shift",
    meaning: "Your evening carried the wins.",
    blurb: "Evening carried it. Last light, still moving.",
    tone: "peach",
  },
  {
    kind: "closer",
    name: "The Closer",
    meaning: "You knocked out a top priority.",
    blurb: "You warmed up, then saved the punch for a clean finish.",
    tone: "forest",
  },
  {
    kind: "hunter",
    name: "Top-priority Hunter",
    meaning: "You went after what mattered most first.",
    blurb: "Big rocks before pebbles — you went after what mattered first.",
    tone: "forest",
  },
  {
    kind: "soft-landing",
    name: "Soft Landing",
    meaning: "You opened strong and closed soft.",
    blurb: "Serious open, then a soft close. The day knew when to exhale.",
    tone: "peach",
  },
  {
    kind: "easy-wins",
    name: "Easy-wins Collector",
    meaning: "You stacked a bunch of quick wins.",
    blurb: "Small moves, real momentum — quick checks stacked up.",
    tone: "peach",
  },
  {
    kind: "cat-home",
    name: "Home Captain",
    meaning: "Most of the day’s energy went to Home.",
    blurb: "Home got the lion’s share — the fort held.",
    tone: "peach",
  },
  {
    kind: "cat-errands",
    name: "Errand Runner",
    meaning: "You knocked out the out-and-about stuff.",
    blurb: "Out and back. Errands mode: unlocked.",
    tone: "forest",
  },
  {
    kind: "cat-work",
    name: "Work Lead",
    meaning: "Most of the day’s energy went to Work.",
    blurb: "The desk led the day. Focus stayed on the work.",
    tone: "forest",
  },
  {
    kind: "cat-health",
    name: "Body Mover",
    meaning: "You made room to move your body.",
    blurb: "You moved on purpose. Body got a real vote that day.",
    tone: "forest",
  },
  {
    kind: "cat-personal",
    name: "Personal Pace",
    meaning: "You tended to personal things.",
    blurb: "Kept it personal. Quiet progress that still counts.",
    tone: "peach",
  },
  {
    kind: "cat-faith",
    name: "Quiet Keeper",
    meaning: "You made quiet space for what matters.",
    blurb: "You made room for what matters. Quiet space, kept.",
    tone: "forest",
  },
  {
    kind: "fallback",
    name: "Presence Player",
    meaning: "You showed up and moved a few things forward.",
    blurb: "Not flashy — just present. A few honest checks still count.",
    tone: "forest",
  },
];

function getReflectionWeekSlotIndex(dayKey) {
  const week = getReflectionWeekDayKeys();
  const index = week.indexOf(dayKey);
  return index >= 0 ? index : 0;
}

function getWeekSlotPersonaFill(dayKey) {
  const fill = REFLECTION_WEEK_PERSONA_FILLS[getReflectionWeekSlotIndex(dayKey)];
  if (!fill) return null;
  return {
    name: fill.name,
    meaning: fill.meaning,
    blurb: fill.blurb,
    tone: fill.tone || "forest",
    kind: fill.kind,
  };
}

function getCompletedTasksForDay(dayKey, { includeArchived = true, allowDemo = false } = {}) {
  const target = dayKey || reflectionTodayKey();
  const seen = new Set();
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (!includeArchived && t.archived) return;
      if (!t.done || !t.completedAt) return;
      if (String(t.id || "").startsWith(DEMO_REFLECTION_ID_PREFIX)) return;
      if (archiveDayKey(t.completedAt) !== target) return;
      const key = `${ctx}:${t.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      tasks.push({ ...t, context: ctx });
    });
  });

  const sorted = tasks.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  if (wantsForcedReflectionDemoWins()) {
    return buildDemoReflectionWins(target);
  }

  // Reflection-only: fill sparse past days with persona examples.
  const isToday = target === reflectionTodayKey();
  if (allowDemo && !isToday && sorted.length < 2) {
    return buildDemoReflectionWins(target);
  }

  return sorted;
}

function truncateReflectionLabel(text, max = 28) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function reflectionInsightTaskHour(task) {
  if (!task?.completedAt) return null;
  const hour = new Date(task.completedAt).getHours();
  return Number.isNaN(hour) ? null : hour;
}

function reflectionInsightTimeOfDay(hour) {
  if (hour == null) return "";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function reflectionInsightTaskName(task, max = 34) {
  return truncateReflectionLabel(task?.text || "that task", max);
}

/** Bold task name cite for persona blurbs (HTML-safe). */
function reflectionTaskCite(task, max = 24) {
  return `<strong>${escapeHtml(reflectionInsightTaskName(task, max))}</strong>`;
}

function reflectionTaskTimeBit(task) {
  const time = formatCompletionTime(task?.completedAt);
  return time ? escapeHtml(time) : "";
}

function reflectionTaskCatBit(task) {
  if (!task?.context) return "";
  return escapeHtml(contextLabel(task.context));
}

/**
 * Pick one playful persona for the day’s vibe.
 * Data-driven (category / priority / timing / arc) — not random.
 * Blurb expands on the persona and cites real completed tasks.
 */
function pickReflectionPersona(sorted) {
  if (!sorted.length) return null;

  const timed = sorted.filter((task) => reflectionInsightTaskHour(task) != null);
  const first = timed[0] || sorted[0];
  const last = timed.length > 1 ? timed[timed.length - 1] : null;
  const morningCount = timed.filter((task) => reflectionInsightTaskHour(task) < 12).length;
  const eveningCount = timed.filter((task) => reflectionInsightTaskHour(task) >= 17).length;

  const byContext = new Map();
  sorted.forEach((task) => {
    const key = task.context || "other";
    if (!byContext.has(key)) byContext.set(key, []);
    byContext.get(key).push(task);
  });
  const categoryGroups = [...byContext.entries()]
    .map(([ctx, tasks]) => ({ ctx, tasks, count: tasks.length }))
    .sort((a, b) => b.count - a.count);
  const topCat = categoryGroups[0] || null;
  const secondCat = categoryGroups[1] || null;
  const dominantCat =
    topCat &&
    topCat.count >= 1 &&
    (!secondCat || topCat.count > secondCat.count)
      ? topCat
      : null;

  const tier1 = sorted.filter((task) => task.tier === 1);
  const tier12 = sorted.filter((task) => task.tier === 1 || task.tier === 2);
  const easyWins = sorted.filter((task) => task.tier >= 3);
  const chronoFirst = sorted[0];
  const chronoLast = sorted[sorted.length - 1];

  const softContexts = new Set(["home", "personal", "health", "faith"]);
  const options = [];

  const pushPersona = (persona) => {
    if (!persona?.name || !persona?.blurb || !persona?.meaning) return;
    options.push(persona);
  };

  if (first && last && first.id !== last.id) {
    const firstPart = reflectionInsightTimeOfDay(reflectionInsightTaskHour(first));
    const lastPart = reflectionInsightTimeOfDay(reflectionInsightTaskHour(last));
    if (firstPart === "morning" && lastPart === "evening") {
      const firstTime = reflectionTaskTimeBit(first);
      const lastTime = reflectionTaskTimeBit(last);
      pushPersona({
        score: 92,
        kind: "bookend",
        name: "Bookend Day",
        meaning: "You started and ended with care — morning win, evening win.",
        blurb: `You opened with ${reflectionTaskCite(first)}${firstTime ? ` · ${firstTime}` : ""} and closed on ${reflectionTaskCite(last)}${lastTime ? ` · ${lastTime}` : ""}. Sunrise → lamplight — two anchors holding the middle steady.`,
        tone: "forest",
      });
    }

    const hardOpen =
      first.context === "work" || first.tier === 1 || first.tier === 2;
    const softClose = softContexts.has(last.context) && last.context !== "work";
    if (hardOpen && softClose && first.context !== last.context) {
      const openCat = reflectionTaskCatBit(first);
      const closeCat = reflectionTaskCatBit(last);
      pushPersona({
        score: 88,
        kind: "soft-landing",
        name: "Soft Landing",
        meaning: "You opened strong and closed soft.",
        blurb: `Serious open on ${reflectionTaskCite(first)}${openCat ? ` in ${openCat}` : ""}, then a soft close with ${reflectionTaskCite(last)}${closeCat ? ` in ${closeCat}` : ""}. The day knew when to exhale.`,
        tone: "peach",
      });
    }
  }

  if (timed.length >= 2 && morningCount >= Math.ceil(timed.length * 0.65) && morningCount > eveningCount) {
    const morningTask = timed.find((task) => reflectionInsightTaskHour(task) < 12) || first;
    const morningTime = reflectionTaskTimeBit(morningTask);
    const secondMorning =
      timed.find(
        (task) =>
          task.id !== morningTask?.id && reflectionInsightTaskHour(task) < 12
      ) || null;
    pushPersona({
      score: 84,
      kind: "front-loaded",
      name: "Front-loaded Day",
      meaning: "Most of your wins landed before noon.",
      blurb: `Heavy before noon — ${reflectionTaskCite(morningTask)}${morningTime ? ` by ${morningTime}` : ""} led the charge${
        secondMorning ? `, with ${reflectionTaskCite(secondMorning)} right behind` : ""
      }. Afternoon got to coast a little.`,
      tone: "forest",
    });
  }

  if (morningCount >= 2 && morningCount > eveningCount && morningCount >= eveningCount + 1) {
    const morningTask = timed.find((task) => reflectionInsightTaskHour(task) < 12) || first;
    const morningTime = reflectionTaskTimeBit(morningTask);
    const otherMorning =
      timed.find(
        (task) =>
          task.id !== morningTask?.id && reflectionInsightTaskHour(task) < 12
      ) || null;
    pushPersona({
      score: 80,
      kind: "morning",
      name: "Morning Machine",
      meaning: "You got a lot done in the morning.",
      blurb: `First light favored you: ${reflectionTaskCite(morningTask)}${morningTime ? ` · ${morningTime}` : ""}${
        otherMorning ? ` and ${reflectionTaskCite(otherMorning)}` : ""
      }. That early pocket did real work.`,
      tone: "forest",
    });
  }

  if (eveningCount >= 2 && eveningCount > morningCount) {
    const eveningTask =
      [...timed].reverse().find((task) => reflectionInsightTaskHour(task) >= 17) || chronoLast;
    const eveningTime = reflectionTaskTimeBit(eveningTask);
    const otherEvening =
      timed.find(
        (task) =>
          task.id !== eveningTask?.id && reflectionInsightTaskHour(task) >= 17
      ) || null;
    pushPersona({
      score: 80,
      kind: "closing",
      name: "Closing Shift",
      meaning: "Your evening carried the wins.",
      blurb: `Evening carried it — ${reflectionTaskCite(eveningTask)}${eveningTime ? ` · ${eveningTime}` : ""}${
        otherEvening ? `, plus ${reflectionTaskCite(otherEvening)}` : ""
      }. Last light, still moving.`,
      tone: "peach",
    });
  }

  if (last && last.tier === 1 && sorted.length >= 2) {
    const earlier = sorted.find((task) => task.id !== last.id) || chronoFirst;
    const lastTime = reflectionTaskTimeBit(last);
    pushPersona({
      score: 78,
      kind: "closer",
      name: "The Closer",
      meaning: "You knocked out a top priority.",
      blurb: `You warmed up on ${reflectionTaskCite(earlier)}, then saved the punch for ${reflectionTaskCite(last)}${lastTime ? ` · ${lastTime}` : ""}. A 1st priority as the closer — clean finish.`,
      tone: "forest",
    });
  }

  if (chronoFirst?.tier === 1 || (tier1.length >= 1 && chronoFirst && chronoFirst.tier <= 2 && tier12.length >= Math.ceil(sorted.length / 2))) {
    const hunterTask = tier1[0] || tier12[0] || chronoFirst;
    const hunterTime = reflectionTaskTimeBit(hunterTask);
    const followUp =
      sorted.find((task) => task.id !== hunterTask?.id) || null;
    pushPersona({
      score: chronoFirst?.tier === 1 ? 76 : 70,
      kind: "hunter",
      name: "Top-priority Hunter",
      meaning: "You went after what mattered most first.",
      blurb: `You went after ${reflectionTaskCite(hunterTask)} first${hunterTime ? ` · ${hunterTime}` : ""}${
        followUp ? `, then kept the streak with ${reflectionTaskCite(followUp)}` : ""
      }. Big rocks before pebbles.`,
      tone: "forest",
    });
  }

  if (easyWins.length >= 2 && easyWins.length > tier12.length) {
    const secondEasy = easyWins[1] || null;
    pushPersona({
      score: 68,
      kind: "easy-wins",
      name: "Easy-wins Collector",
      meaning: "You stacked a bunch of quick wins.",
      blurb: `Quick checks stacked up — ${reflectionTaskCite(easyWins[0])}${
        secondEasy ? ` and ${reflectionTaskCite(secondEasy)}` : ""
      } among them. Small moves, real momentum.`,
      tone: "peach",
    });
  }

  if (dominantCat) {
    const sample = dominantCat.tasks[0];
    const sample2 = dominantCat.tasks[1] || null;
    const catLabel = escapeHtml(contextLabel(dominantCat.ctx));
    const categoryPersonas = {
      home: {
        score: dominantCat.count >= 2 ? 74 : 62,
        kind: "cat-home",
        name: "Home Captain",
        meaning: "Most of the day’s energy went to Home.",
        blurb: `Home got the lion’s share — ${reflectionTaskCite(sample)}${
          sample2 ? ` and ${reflectionTaskCite(sample2)}` : ""
        } held the fort. ${dominantCat.count} win${dominantCat.count === 1 ? "" : "s"} under that roof.`,
        tone: "peach",
      },
      work: {
        score: dominantCat.count >= 2 ? 74 : 62,
        kind: "cat-work",
        name: "Work Lead",
        meaning: "Most of the day’s energy went to Work.",
        blurb: `The desk led the day — ${reflectionTaskCite(sample)}${
          sample2 ? `, then ${reflectionTaskCite(sample2)}` : ""
        }. ${catLabel} carried ${dominantCat.count} check${dominantCat.count === 1 ? "" : "s"}.`,
        tone: "forest",
      },
      errands: {
        score: dominantCat.count >= 2 ? 74 : 62,
        kind: "cat-errands",
        name: "Errand Runner",
        meaning: "You knocked out the out-and-about stuff.",
        blurb: `Out and back — ${reflectionTaskCite(sample)}${
          sample2 ? ` plus ${reflectionTaskCite(sample2)}` : ""
        } kept Errands moving. Errands mode: unlocked.`,
        tone: "forest",
      },
      health: {
        score: dominantCat.count >= 2 ? 74 : 62,
        kind: "cat-health",
        name: "Body Mover",
        meaning: "You made room to move your body.",
        blurb: `You moved on purpose with ${reflectionTaskCite(sample)}${
          sample2 ? ` and ${reflectionTaskCite(sample2)}` : ""
        }. Body got a real vote that day.`,
        tone: "forest",
      },
      personal: {
        score: dominantCat.count >= 2 ? 66 : 58,
        kind: "cat-personal",
        name: "Personal Pace",
        meaning: "You tended to personal things.",
        blurb: `Kept it personal — ${reflectionTaskCite(sample)}${
          sample2 ? ` alongside ${reflectionTaskCite(sample2)}` : ""
        }. Quiet progress that still counts.`,
        tone: "peach",
      },
      faith: {
        score: dominantCat.count >= 2 ? 66 : 58,
        kind: "cat-faith",
        name: "Quiet Keeper",
        meaning: "You made quiet space for what matters.",
        blurb: `You made room for ${reflectionTaskCite(sample)}${
          sample2 ? ` and ${reflectionTaskCite(sample2)}` : ""
        }. Quiet space, kept.`,
        tone: "forest",
      },
    };
    if (categoryPersonas[dominantCat.ctx]) {
      pushPersona(categoryPersonas[dominantCat.ctx]);
    }
  }

  options.sort((a, b) => b.score - a.score);
  if (options[0]) {
    const top = options[0];
    return {
      name: top.name,
      meaning: top.meaning || "",
      blurb: top.blurb,
      tone: top.tone || "forest",
      kind: top.kind || "",
    };
  }

  // Sparse fallback — still cite a real task
  const fallbackTask = chronoFirst || sorted[0];
  const fallbackTime = reflectionTaskTimeBit(fallbackTask);
  const fallbackCat = reflectionTaskCatBit(fallbackTask);
  return {
    name: "Presence Player",
    meaning: "You showed up and checked something off.",
    blurb: `You showed up and checked off ${reflectionTaskCite(fallbackTask, 28)}${
      fallbackTime ? ` · ${fallbackTime}` : ""
    }${fallbackCat ? ` in ${fallbackCat}` : ""}. One real move still makes a day.`,
    tone: "forest",
    kind: "fallback",
  };
}

/**
 * Tiny SVG mark for the persona title card — one simple motion per kind.
 * Bookend Day books animation is intentional; other kinds are literal name matches.
 */
function reflectionPersonaMarkSvg(kind) {
  const k = kind || "fallback";
  const marks = {
    bookend: `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-bookend-left">
          <rect x="3.5" y="6.5" width="5.2" height="19" rx="0.9" fill="#0e3030"/>
          <path d="M5.2 8v16" stroke="#f4b49a" stroke-width="0.9" stroke-linecap="round" opacity="0.45"/>
        </g>
        <g class="rpm-bookend-mids">
          <rect x="9.4" y="9" width="3" height="16.5" rx="0.55" fill="#f4b49a"/>
          <rect x="12.7" y="8" width="2.6" height="17.5" rx="0.55" fill="#fdf9f4" stroke="#0e3030" stroke-width="0.7"/>
          <rect class="rpm-bookend-slot" x="15.6" y="9.5" width="3.2" height="16" rx="0.55" fill="#f4b49a" opacity="0.9"/>
          <rect x="19.1" y="8.5" width="2.4" height="17" rx="0.5" fill="#fdf9f4" stroke="#0e3030" stroke-width="0.7"/>
        </g>
        <g class="rpm-bookend-right">
          <rect x="23.2" y="6.5" width="5.2" height="19" rx="0.9" fill="#0e3030"/>
          <path d="M26.7 8v16" stroke="#f4b49a" stroke-width="0.9" stroke-linecap="round" opacity="0.75"/>
        </g>
      </svg>`,
    morning: `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path class="rpm-sunrise-horizon" d="M3 23.5h26" stroke="#0e3030" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M3 23.5c4.5-2.2 9-3.2 13-3.2s8.5 1 13 3.2" fill="#f4b49a" opacity="0.55"/>
        <g class="rpm-sunrise-sun">
          <g class="rpm-sunrise-rays" stroke="#f4b49a" stroke-width="1.35" stroke-linecap="round">
            <path d="M16 6.2v2.6"/>
            <path d="M8.4 10.2l1.9 1.9"/>
            <path d="M23.6 10.2l-1.9 1.9"/>
            <path d="M5.8 17.5h2.5"/>
            <path d="M23.7 17.5h2.5"/>
          </g>
          <circle cx="16" cy="17.5" r="5.1" fill="#f4b49a"/>
          <circle cx="14.4" cy="16" r="1.5" fill="#f4b49a" opacity="0.55"/>
        </g>
      </svg>`,
    "front-loaded": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path class="rpm-sunrise-horizon" d="M3 23.5h26" stroke="#0e3030" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
        <path d="M3 23.5c4.5-2.2 9-3.2 13-3.2s8.5 1 13 3.2" fill="#0e3030" opacity="0.12"/>
        <g class="rpm-sunrise-sun">
          <g class="rpm-sunrise-rays" stroke="#0e3030" stroke-width="1.35" stroke-linecap="round" opacity="0.55">
            <path d="M16 6.2v2.6"/>
            <path d="M8.4 10.2l1.9 1.9"/>
            <path d="M23.6 10.2l-1.9 1.9"/>
          </g>
          <circle cx="16" cy="17.5" r="5.1" fill="#f4b49a"/>
        </g>
      </svg>`,
    closing: `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-dusk-moon">
          <path d="M19.2 8.2a8.2 8.2 0 1 0 6.1 12.8 6.6 6.6 0 1 1-6.1-12.8Z" fill="#f4b49a"/>
        </g>
        <g class="rpm-dusk-stars" fill="#0e3030">
          <circle class="rpm-dusk-star rpm-dusk-star-1" cx="8.2" cy="11" r="1.15"/>
          <circle class="rpm-dusk-star rpm-dusk-star-2" cx="12.5" cy="7.2" r="0.85"/>
          <circle class="rpm-dusk-star rpm-dusk-star-3" cx="9.8" cy="16.5" r="0.7" fill="#f4b49a"/>
        </g>
      </svg>`,
    closer: `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="11" fill="#f4b49a"/>
        <circle class="rpm-check-ring" cx="16" cy="16" r="11" stroke="#0e3030" stroke-width="1.4" opacity="0.2"/>
        <path class="rpm-check-mark" d="M10.2 16.4l3.6 3.6 8.2-8.4" stroke="#0e3030" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    hunter: `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle class="rpm-target-ring" cx="16" cy="16" r="10" stroke="#0e3030" stroke-width="1.5" opacity="0.35"/>
        <circle class="rpm-target-ring" cx="16" cy="16" r="6.2" stroke="#f4b49a" stroke-width="1.6"/>
        <circle class="rpm-target-core" cx="16" cy="16" r="2.4" fill="#0e3030"/>
        <g class="rpm-target-cross" stroke="#0e3030" stroke-width="1.3" stroke-linecap="round" opacity="0.55">
          <path d="M16 4.5v3.2M16 24.3v3.2M4.5 16h3.2M24.3 16h3.2"/>
        </g>
      </svg>`,
    "cat-home": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-house">
          <path d="M5.5 15.2L16 6.2l10.5 9" stroke="#0e3030" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8.8 14.5V25h14.4V14.5" stroke="#0e3030" stroke-width="1.75" stroke-linejoin="round"/>
          <rect x="13.5" y="18.2" width="5" height="6.8" rx="0.55" fill="#f4b49a"/>
          <path d="M21.2 10.2v-2.4h2.6" stroke="#0e3030" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="10.2" y="16.8" width="3.2" height="2.6" rx="0.35" fill="#f4b49a"/>
        </g>
      </svg>`,
    "soft-landing": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <ellipse class="rpm-soft-shadow" cx="16" cy="25.2" rx="7.2" ry="1.4" fill="#0e3030" opacity="0.18"/>
        <path class="rpm-soft-ground" d="M6 25.2h20" stroke="#0e3030" stroke-width="1.5" stroke-linecap="round" opacity="0.35"/>
        <g class="rpm-soft-lander">
          <ellipse cx="16" cy="13.2" rx="8.4" ry="5.4" fill="#f4b49a"/>
          <ellipse cx="16" cy="13.8" rx="5.6" ry="3.2" fill="#f4b49a" opacity="0.55"/>
          <ellipse cx="12.8" cy="11.4" rx="2.2" ry="1.3" fill="#fdf9f4" opacity="0.7"/>
        </g>
      </svg>`,
    "easy-wins": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-tick rpm-tick-1">
          <rect x="6" y="5.5" width="20" height="6.2" rx="1.2" fill="#f4b49a"/>
          <path d="M9.2 8.6l2 2 4.6-4.4" stroke="#0e3030" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g class="rpm-tick rpm-tick-2">
          <rect x="6" y="12.9" width="20" height="6.2" rx="1.2" fill="#f4b49a" opacity="0.9"/>
          <path d="M9.2 16l2 2 4.6-4.4" stroke="#0e3030" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g class="rpm-tick rpm-tick-3">
          <rect x="6" y="20.3" width="20" height="6.2" rx="1.2" fill="#f4b49a"/>
          <path d="M9.2 23.4l2 2 4.6-4.4" stroke="#0e3030" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>`,
    "cat-errands": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path class="rpm-errand-path" d="M5 22c2.5-9 6.5-13 11-13 5.2 0 8.2 5.5 11 13" stroke="#0e3030" stroke-width="1.55" stroke-linecap="round" stroke-dasharray="2.8 2.4" opacity="0.4"/>
        <path d="M24.5 9.5l2.2 1.2-1.5 2.4" stroke="#f4b49a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <g class="rpm-errand-dot">
          <circle cx="7.5" cy="20.5" r="3.1" fill="#f4b49a"/>
          <circle cx="7.5" cy="20.5" r="1.15" fill="#0e3030" opacity="0.35"/>
        </g>
      </svg>`,
    "cat-work": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-briefcase">
          <rect x="5.5" y="12" width="21" height="13.5" rx="2.2" fill="#f4b49a" stroke="#0e3030" stroke-width="1.55"/>
          <path d="M11.5 12V9.8a2.2 2.2 0 0 1 2.2-2.2h4.6A2.2 2.2 0 0 1 20.5 9.8V12" stroke="#0e3030" stroke-width="1.55"/>
          <path d="M5.5 17.2h21" stroke="#f4b49a" stroke-width="1.7"/>
          <rect x="14.2" y="15.6" width="3.6" height="2.4" rx="0.5" fill="#0e3030"/>
        </g>
      </svg>`,
    "cat-health": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path class="rpm-health-heart" d="M16 26s-9.2-5.8-9.2-12.2A5.4 5.4 0 0 1 16 10.2a5.4 5.4 0 0 1 9.2 3.6C25.2 20.2 16 26 16 26Z" fill="#f4b49a"/>
        <path class="rpm-health-pulse" d="M9.5 15.8h3.2l1.6-3.4 2.6 6.6 1.5-3.2h4.1" stroke="#0e3030" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    "cat-personal": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-personal">
          <circle class="rpm-personal-core" cx="16" cy="11" r="4.6" fill="#0e3030"/>
          <path class="rpm-personal-ring" d="M7.5 26c1.4-5.2 4.6-7.8 8.5-7.8S23.1 20.8 24.5 26" stroke="#f4b49a" stroke-width="2.2" stroke-linecap="round"/>
        </g>
      </svg>`,
    "cat-faith": `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-faith">
          <rect x="14.2" y="18.5" width="3.6" height="7" rx="0.7" fill="#0e3030"/>
          <path d="M11.5 18.5h9" stroke="#0e3030" stroke-width="1.6" stroke-linecap="round"/>
          <g class="rpm-faith-flame">
            <path d="M16 6.5c3.2 3.2 5.2 5.4 5.2 8.1A5.2 5.2 0 0 1 16 19.8 5.2 5.2 0 0 1 10.8 14.6C10.8 11.9 12.8 9.7 16 6.5Z" fill="#f4b49a"/>
            <path d="M16 11.2c1.5 1.5 2.3 2.5 2.3 3.7A2.3 2.3 0 0 1 16 17.2a2.3 2.3 0 0 1-2.3-2.3c0-1.2.8-2.2 2.3-3.7Z" fill="#f4b49a"/>
          </g>
        </g>
      </svg>`,
    fallback: `
      <svg class="reflection-persona-mark-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g class="rpm-fallback-orb">
          <path d="M16 5.5l1.7 5.2h5.5l-4.4 3.2 1.7 5.3L16 16.2l-4.5 3 1.7-5.3-4.4-3.2h5.5L16 5.5Z" fill="#f4b49a"/>
          <path d="M24.5 18.5l.9 2.7h2.8l-2.3 1.7.9 2.7-2.3-1.6-2.3 1.6.9-2.7-2.3-1.7h2.8l.9-2.7Z" fill="#f4b49a"/>
          <path d="M7.2 19l.7 2.1h2.2L8.4 22.4l.7 2.1-1.9-1.3-1.9 1.3.7-2.1-1.7-1.3h2.2L7.2 19Z" fill="#0e3030" opacity="0.55"/>
        </g>
      </svg>`,
  };
  return marks[k] || marks.fallback;
}

/** Catalog of every persona mark for localhost preview (?persona-preview=1). */
const PERSONA_MARK_PREVIEW_ITEMS = [
  { kind: "bookend", name: "Bookend Day" },
  { kind: "morning", name: "Morning Machine" },
  { kind: "front-loaded", name: "Front-loaded Day" },
  { kind: "closing", name: "Closing Shift" },
  { kind: "closer", name: "The Closer" },
  { kind: "hunter", name: "Top-priority Hunter" },
  { kind: "soft-landing", name: "Soft Landing" },
  { kind: "easy-wins", name: "Easy-wins Collector" },
  { kind: "cat-home", name: "Home Captain" },
  { kind: "cat-errands", name: "Errand Runner" },
  { kind: "cat-work", name: "Work Lead" },
  { kind: "cat-health", name: "Body Mover" },
  { kind: "cat-personal", name: "Personal Pace" },
  { kind: "cat-faith", name: "Quiet Keeper" },
  { kind: "fallback", name: "Presence Player" },
];

function wantsPersonaMarkPreview() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("persona-preview")) return false;
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "";
  } catch {
    return false;
  }
}

function setupPersonaMarkPreview() {
  if (!wantsPersonaMarkPreview()) return;
  if (document.getElementById("persona-mark-preview")) return;

  const panel = document.createElement("aside");
  panel.id = "persona-mark-preview";
  panel.className = "persona-mark-preview";
  panel.setAttribute("aria-label", "Persona mark preview");
  panel.innerHTML = `
    <header class="persona-mark-preview-header">
      <div>
        <p class="persona-mark-preview-kicker">Local preview</p>
        <h2 class="persona-mark-preview-title">All persona marks</h2>
      </div>
      <button type="button" class="persona-mark-preview-close" aria-label="Close preview">×</button>
    </header>
    <div class="persona-mark-preview-grid">
      ${PERSONA_MARK_PREVIEW_ITEMS.map(
        (item) => `
        <article class="persona-mark-preview-card reflection-persona--${escapeHtml(item.kind)}">
          <span class="reflection-persona-mark persona-mark-preview-mark" aria-hidden="true">${reflectionPersonaMarkSvg(item.kind)}</span>
          <p class="persona-mark-preview-name">${escapeHtml(item.name)}</p>
          <p class="persona-mark-preview-kind">${escapeHtml(item.kind)}</p>
        </article>`
      ).join("")}
    </div>
  `;
  document.body.appendChild(panel);
  document.documentElement.classList.add("persona-preview-open");
  panel.querySelector(".persona-mark-preview-close")?.addEventListener("click", () => {
    panel.remove();
    document.documentElement.classList.remove("persona-preview-open");
  });
}

/** Day vibe persona for the merged review card — needs 2+ completions. */
function buildReflectionInsights(completed, dayKey = reflectionTodayKey()) {
  if (completed && completed.length >= 2) {
    const sorted = [...completed].sort(
      (a, b) => new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime()
    );
    const allDemo = sorted.every((task) =>
      String(task.id || "").startsWith(DEMO_REFLECTION_ID_PREFIX)
    );
    if (allDemo) {
      const fill = getWeekSlotPersonaFill(dayKey);
      const picked = pickReflectionPersona(sorted);
      if (fill) {
        const sample = sorted[0];
        const sample2 = sorted[1] || null;
        const citeBit = sample
          ? ` Wins like ${reflectionTaskCite(sample)}${
              sample2 ? ` and ${reflectionTaskCite(sample2)}` : ""
            } set the tone.`
          : "";
        return {
          persona: {
            ...fill,
            // Prefer live cite blurbs when the picker lands on the intended persona.
            blurb:
              picked?.kind === fill.kind && picked.blurb
                ? picked.blurb
                : `${fill.blurb}${citeBit}`,
            meaning: picked?.kind === fill.kind && picked.meaning ? picked.meaning : fill.meaning,
          },
        };
      }
    }
    return { persona: pickReflectionPersona(sorted) };
  }

  return { persona: null };
}

function buildDayAccomplishStory(completed, dayKey = reflectionTodayKey()) {
  const isToday = dayKey === reflectionTodayKey();
  const dayPhrase = reflectionDayPhrase(dayKey);

  if (!completed.length) {
    // Today with 0 wins stays “in motion”; Rest Day is only for past empty days.
    if (isToday) {
      return {
        title: "Your day is still opening",
        categories: [],
        priorityBars: [],
        thumbs: [],
        insights: { persona: null },
        quietNote: "Nothing checked off yet — your day is still in motion.",
        growingNote: "",
        restDay: false,
        inMotion: true,
        ariaSummary: "Your day is still opening. No tasks completed today yet.",
      };
    }
    return {
      title: "Rest Day",
      categories: [],
      priorityBars: [],
      thumbs: [],
      insights: { persona: null },
      quietNote: "Nothing checked off — a quiet day worth keeping.",
      growingNote: "",
      restDay: true,
      inMotion: false,
      ariaSummary: `Rest day. Nothing was checked off ${dayPhrase}.`,
    };
  }

  const byContext = new Map();
  const byTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
  completed.forEach((task) => {
    const label = contextLabel(task.context);
    byContext.set(label, (byContext.get(label) || 0) + 1);
    if (byTier[task.tier] != null) byTier[task.tier] += 1;
  });

  const maxTier = Math.max(1, ...Object.values(byTier));
  const categoryStyles = ["", "muted", "soft"];

  const categories = [...byContext.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count], index) => ({
      name,
      count,
      style: categoryStyles[index] || "",
    }));

  const priorityBars = [1, 2, 3, 4]
    .filter((tier) => byTier[tier] > 0)
    .map((tier) => ({
      label: TIER_LABELS[tier - 1],
      count: byTier[tier],
      pct: Math.round((byTier[tier] / maxTier) * 100),
      peach: tier <= 2,
    }));

  const thumbs = completed.slice(0, 4).map((task) => ({
    text: truncateReflectionLabel(task.text, 26),
  }));

  const insights = buildReflectionInsights(completed, dayKey);
  const listNames = categories.map((c) => c.name).join(", ");
  const ariaSummary =
    completed.length === 1
      ? `You finished 1 thing ${dayPhrase}${listNames ? ` in ${listNames}` : ""}.`
      : `You finished ${completed.length} things ${dayPhrase}${listNames ? ` across ${listNames}` : ""}.`;

  let growingNote = "";
  if (completed.length === 1) {
    growingNote = isToday
      ? "One win down — finish one more and your day’s persona will fill in."
      : "Only one win that day — personas show up at two or more.";
  }

  const title =
    completed.length === 1
      ? isToday
        ? "Today’s first win"
        : "One win that day"
      : isToday
        ? "What you accomplished today"
        : "What you accomplished";

  return {
    title,
    categories,
    priorityBars,
    thumbs,
    insights,
    quietNote: "",
    growingNote,
    ariaSummary,
  };
}

function reflectionDayPagerDayParts(dayKey) {
  const label = reflectionDayChipLabel(dayKey);
  const num = String(dayKey || "").slice(8);
  return {
    label,
    num: /^\d{2}$/.test(num) ? String(Number(num)) : num,
    aria: formatArchiveDayHeading(dayKey),
  };
}

function reflectionDayPagerHtml(selectedDayKey) {
  const week = getReflectionWeekDayKeys();
  const index = Math.max(0, week.indexOf(selectedDayKey));
  const canNewer = index > 0;
  const canOlder = index < week.length - 1;
  const parts = reflectionDayPagerDayParts(selectedDayKey);

  return `
    <nav class="reflection-day-pager" aria-label="Recent days" data-reflection-day-index="${index}">
      <div class="reflection-day-pager-row">
        <button
          type="button"
          class="reflection-day-nav"
          id="reflection-day-newer"
          aria-label="Newer day"
          ${canNewer ? "" : "disabled"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="reflection-day-pager-current" id="reflection-day-label" aria-live="polite" aria-atomic="true" aria-label="${escapeHtml(parts.aria)}">
          <p class="reflection-day-pager-label">${escapeHtml(parts.label)}</p>
          <p class="reflection-day-pager-num">${escapeHtml(parts.num)}</p>
        </div>
        <button
          type="button"
          class="reflection-day-nav"
          id="reflection-day-older"
          aria-label="Older day"
          ${canOlder ? "" : "disabled"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </nav>`;
}

function shiftReflectionSelectedDay(delta) {
  const week = getReflectionWeekDayKeys();
  const current = ensureReflectionSelectedDayKey();
  const index = Math.max(0, week.indexOf(current));
  const next = index + delta;
  if (next < 0 || next >= week.length) return false;
  setReflectionSelectedDayKey(week[next]);
  if (document.getElementById("reflection-dialog")?.open) {
    if (getActiveReflectionTab() === "review") {
      renderReflectionReview();
    }
    renderReflectionAnxietyBox();
  } else {
    renderReflectionReview();
    syncHistoryJournalForSelectedDay();
  }
  return true;
}

function bindReflectionDayPager(selectedDayKey) {
  const week = getReflectionWeekDayKeys();
  const index = Math.max(0, week.indexOf(selectedDayKey));
  document.getElementById("reflection-day-newer")?.addEventListener("click", () => {
    if (index <= 0) return;
    shiftReflectionSelectedDay(-1);
  });
  document.getElementById("reflection-day-older")?.addEventListener("click", () => {
    if (index >= week.length - 1) return;
    shiftReflectionSelectedDay(1);
  });

  const pager = document.querySelector(".reflection-day-pager");
  if (!pager) return;

  let startX = 0;
  let startY = 0;
  let tracking = false;
  let locked = false;

  const onStart = (clientX, clientY) => {
    startX = clientX;
    startY = clientY;
    tracking = true;
    locked = false;
  };

  const onMove = (clientX, clientY, event) => {
    if (!tracking) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (!locked) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        tracking = false;
        return;
      }
      locked = true;
    }
    if (locked && event?.cancelable) event.preventDefault();
  };

  const onEnd = (clientX) => {
    if (!tracking) return;
    const dx = clientX - startX;
    tracking = false;
    if (!locked || Math.abs(dx) < 40) return;
    // Swipe left → older day; swipe right → newer day
    shiftReflectionSelectedDay(dx < 0 ? 1 : -1);
  };

  pager.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      onStart(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
  pager.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      onMove(touch.clientX, touch.clientY, event);
    },
    { passive: false }
  );
  pager.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches?.[0];
      onEnd(touch?.clientX ?? startX);
    },
    { passive: true }
  );
  pager.addEventListener("touchcancel", () => {
    tracking = false;
    locked = false;
  });
}

function reflectionReviewItemHtml(task, index = 0, favouriteId = "") {
  const time = formatCompletionTime(task.completedAt);
  const noteText = taskNotesJoinedText(getTaskNoteEntries(task));
  const note = noteText
    ? `<p class="reflection-review-note">${escapeHtml(noteText)}</p>`
    : "";
  const isFavourite = favouriteId && task.id === favouriteId;
  return `
    <li class="reflection-review-item${isFavourite ? " reflection-review-item--favourite" : ""}" style="--win-i: ${index}" data-task-id="${escapeHtml(task.id)}">
      <span class="reflection-review-check" aria-hidden="true">${isFavourite ? "★" : "✓"}</span>
      <div class="reflection-review-body">
        <span class="reflection-review-text">${escapeHtml(task.text)}</span>
        ${note}
        <span class="reflection-review-tier">
          ${contextIconHtml(task.context, "reflection-review-ctx")}
          ${TIER_LABELS[task.tier - 1]}${time ? ` · ${time}` : ""} · ${escapeHtml(contextLabel(task.context))}
          ${isFavourite ? `<span class="reflection-review-favourite-tag">Favourite</span>` : ""}
        </span>
      </div>
    </li>`;
}

function reflectionFavouritePickerHtml(completed, favouriteId, dayKey = reflectionTodayKey()) {
  if (!completed.length) return "";
  const isToday = dayKey === reflectionTodayKey();
  const dayPhrase = reflectionDayPhrase(dayKey);
  const options = completed
    .map((task) => {
      const selected = task.id === favouriteId;
      return `
      <button
        type="button"
        class="reflection-favourite-option${selected ? " is-selected" : ""}"
        data-favourite-id="${escapeHtml(task.id)}"
        aria-pressed="${selected ? "true" : "false"}"
      >
        <span class="reflection-favourite-option-mark" aria-hidden="true">${selected ? "★" : "☆"}</span>
        <span class="reflection-favourite-option-text">${escapeHtml(task.text)}</span>
      </button>`;
    })
    .join("");

  const selectedTask = completed.find((t) => t.id === favouriteId);
  const selectedBanner = selectedTask
    ? `<p class="reflection-favourite-selected" aria-live="polite">
         <span class="reflection-favourite-selected-mark" aria-hidden="true">★</span>
         <span>Favourite: <strong>${escapeHtml(selectedTask.text)}</strong></span>
       </p>`
    : `<p class="reflection-favourite-hint">Tap one win to pin it as your favourite.</p>`;

  return `
    <section class="reflection-favourite" aria-label="Favourite task from ${escapeHtml(dayPhrase)}">
      <p class="reflection-favourite-eyebrow">One small moment to keep</p>
      <h3 class="reflection-favourite-heading">${
        isToday
          ? "Which is your favourite task so far?"
          : `Which was your favourite task ${escapeHtml(dayPhrase)}?`
      }</h3>
      ${selectedBanner}
      <div class="reflection-favourite-options" role="group" aria-label="Choose a favourite win">
        ${options}
      </div>
    </section>`;
}

let reflectionRevealObserver = null;

function prefersReflectionReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function observeReflectionScrollCards(container) {
  const root =
    container ||
    document.getElementById("reflection-panel-review") ||
    document.querySelector(".reflection-screen");
  if (!root) return;

  const cards = [
    ...root.querySelectorAll(
      ".reflection-story, .reflection-favourite, .reflection-review-item, .reflection-input-card, .reflection-prompt-btn, .reflection-day-pager"
    ),
  ];
  if (!cards.length) return;

  reflectionRevealObserver?.disconnect();

  const preferReduced = prefersReflectionReducedMotion();
  const scrollRoot = getReflectionScrollRoot();

  cards.forEach((card, index) => {
    card.classList.add("reflection-reveal");
    card.classList.remove("reflection-reveal--in");
    card.style.setProperty("--reveal-i", String(Math.min(index, 6)));
  });

  if (preferReduced || !scrollRoot) {
    cards.forEach((card) => card.classList.add("reflection-reveal--in"));
    return;
  }

  reflectionRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reflection-reveal--in");
        reflectionRevealObserver?.unobserve(entry.target);
      });
    },
    {
      root: scrollRoot,
      threshold: 0.14,
      rootMargin: "0px 0px -5% 0px",
    }
  );

  cards.forEach((card) => reflectionRevealObserver.observe(card));
}

function renderReflectionReview() {
  const list = document.getElementById("reflection-review-list");
  const empty = document.getElementById("reflection-review-empty");
  const summary = document.getElementById("reflection-summary");
  const heading = document.getElementById("reflection-review-heading");
  const favouriteSlot = document.getElementById("reflection-favourite-slot");
  const dayPagerSlot = document.getElementById("reflection-day-pager-slot");
  if (!list || !empty) return;

  const dayKey = ensureReflectionSelectedDayKey();
  const isToday = dayKey === reflectionTodayKey();
  const dayPhrase = reflectionDayPhrase(dayKey);
  const { completedCount, completed } = getDailySummaryForDay(dayKey);
  const story = buildDayAccomplishStory(completed, dayKey);
  const favouriteId = getReflectionFavouriteId(dayKey);
  const favouriteTask = completed.find((t) => t.id === favouriteId) || null;

  syncReflectionDayPagerVisibility("review");

  if (summary) {
    const categoriesHtml = (story.categories || [])
      .map((cat) => {
        const dotClass = cat.style
          ? ` reflection-story-category-dot--${escapeHtml(cat.style)}`
          : "";
        return `
      <div class="reflection-story-category">
        <span class="reflection-story-category-dot${dotClass}" aria-hidden="true"></span>
        <span class="reflection-story-category-name">${escapeHtml(cat.name)}</span>
        <span class="reflection-story-category-count">${cat.count}</span>
      </div>`;
      })
      .join("");

    const barsHtml = (story.priorityBars || [])
      .map(
        (bar) => `
      <div class="reflection-story-bar-row">
        <span class="reflection-story-bar-label">${escapeHtml(bar.label)}</span>
        <div class="reflection-story-bar-track" aria-hidden="true">
          <span class="reflection-story-bar-fill${bar.peach ? " reflection-story-bar-fill--peach" : ""}" style="width: ${bar.pct}%"></span>
        </div>
        <span class="reflection-story-bar-value">${bar.count}</span>
      </div>`
      )
      .join("");

    const thumbsHtml = (story.thumbs || [])
      .map(
        (thumb) => `
      <div class="reflection-story-thumb">
        <span class="reflection-story-thumb-mark" aria-hidden="true">✓</span>
        <span class="reflection-story-thumb-text">${escapeHtml(thumb.text)}</span>
      </div>`
      )
      .join("");

    let visualsHtml = "";
    if (story.quietNote) {
      const quietMod = story.restDay
        ? " reflection-story-quiet--rest"
        : story.inMotion
          ? " reflection-story-quiet--motion"
          : "";
      const markClass = story.restDay
        ? " reflection-rest-mark"
        : story.inMotion
          ? " reflection-motion-mark"
          : "";
      const markSvg = story.restDay
        ? `<svg class="reflection-rest-svg" viewBox="0 0 48 48" fill="none">
                    <circle class="reflection-rest-halo" cx="24" cy="24" r="18" stroke="#f4b49a" stroke-width="2.5" opacity="0.95"/>
                    <circle class="reflection-rest-core" cx="24" cy="24" r="8" fill="#0e3030"/>
                    <path class="reflection-rest-leaf" d="M24 10c4.5 3.2 7 7.2 7 12s-2.5 8.8-7 12c-4.5-3.2-7-7.2-7-12s2.5-8.8 7-12Z" fill="#f4b49a" opacity="0.95"/>
                  </svg>`
        : story.inMotion
          ? `<svg class="reflection-motion-svg" viewBox="0 0 48 48" fill="none">
                    <circle class="reflection-motion-orbit" cx="24" cy="24" r="16" stroke="#f4b49a" stroke-width="2" stroke-dasharray="6 7" opacity="0.95"/>
                    <circle class="reflection-motion-core" cx="24" cy="24" r="6.5" fill="#0e3030"/>
                    <circle class="reflection-motion-spark" cx="40" cy="24" r="3.2" fill="#f4b49a"/>
                  </svg>`
          : "";
      visualsHtml = `
        <div class="reflection-story-quiet${quietMod}">
          <span class="reflection-story-quiet-ring${markClass}" aria-hidden="true">
            ${markSvg}
          </span>
          <p class="reflection-story-quiet-text">${escapeHtml(story.quietNote)}</p>
        </div>`;
    } else {
      const parts = [];
      if (story.growingNote) {
        parts.push(`
          <div class="reflection-story-growing">
            <p class="reflection-story-growing-text">${escapeHtml(story.growingNote)}</p>
          </div>`);
      }
      if (categoriesHtml) {
        parts.push(`
          <div>
            <p class="reflection-story-section-label">Across categories</p>
            <div class="reflection-story-categories">${categoriesHtml}</div>
          </div>`);
      }
      if (barsHtml) {
        parts.push(`
          <div>
            <p class="reflection-story-section-label">By priority</p>
            <div class="reflection-story-bars" role="img" aria-label="Wins by priority">${barsHtml}</div>
          </div>`);
      }
      if (thumbsHtml) {
        parts.push(`
          <div>
            <p class="reflection-story-section-label">Highlights</p>
            <div class="reflection-story-thumbs">${thumbsHtml}</div>
          </div>`);
      }
      visualsHtml = parts.length ? `<div class="reflection-story-visuals">${parts.join("")}</div>` : "";
    }

    const sunHtml = `
      <span class="reflection-story-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <g class="reflection-story-sun-rays">
            <path d="M12 2.2v2.1M12 19.7v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.2 12h2.1M19.7 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
          </g>
          <circle class="reflection-story-sun-core" cx="12" cy="12" r="4.1" fill="#e8b423"/>
          <circle class="reflection-story-sun-core" cx="12" cy="12" r="4.1" fill="#fff0b8" opacity="0.4"/>
        </svg>
      </span>`;

    const insightBundle = story.insights || {};
    const insightPersona = Array.isArray(insightBundle) ? null : insightBundle.persona || null;
    const vibeKicker = isToday ? "Today’s vibe" : `${formatArchiveDayHeading(dayKey)}’s vibe`;

    const vibeHtml = insightPersona
      ? `
        <div class="reflection-persona reflection-persona--${escapeHtml(insightPersona.kind || "fallback")}">
          <span class="reflection-persona-mark" aria-hidden="true">${reflectionPersonaMarkSvg(insightPersona.kind)}</span>
          <p class="reflection-persona-kicker">${escapeHtml(vibeKicker)}</p>
          <p class="reflection-persona-name">${escapeHtml(insightPersona.name)}</p>
          ${
            insightPersona.meaning
              ? `<p class="reflection-persona-meaning">${escapeHtml(insightPersona.meaning)}</p>`
              : ""
          }
          <p class="reflection-persona-blurb">${insightPersona.blurb}</p>
        </div>`
      : "";

    const favouriteCardHtml = favouriteTask
      ? `
        <div class="reflection-story-favourite">
          <p class="reflection-story-section-label">${isToday ? "Favourite so far" : `Favourite from ${escapeHtml(dayPhrase)}`}</p>
          <div class="reflection-story-favourite-pill">
            <span class="reflection-story-favourite-star" aria-hidden="true">★</span>
            <span class="reflection-story-favourite-text">${escapeHtml(favouriteTask.text)}</span>
          </div>
        </div>`
      : "";

    const reviewBodyHtml = `
      <div class="reflection-story-body${insightPersona ? " reflection-story-body--after-vibe" : ""}">
        <div class="reflection-story-top">
          <p class="reflection-story-kicker">${isToday ? "Today in motion" : `${escapeHtml(formatArchiveDayHeading(dayKey))} in review`}</p>
        </div>
        <h2 class="reflection-story-title">${escapeHtml(story.title)}</h2>
        ${favouriteCardHtml}
        ${visualsHtml}
      </div>`;

    const storyAria = insightPersona
      ? `${vibeKicker} — ${insightPersona.name}. ${story.ariaSummary || story.title}`
      : story.ariaSummary || story.title;

    summary.innerHTML = `
      <div class="reflection-summary-stack">
        <div class="reflection-story${insightPersona ? " reflection-story--with-vibe" : ""}" aria-label="${escapeHtml(storyAria)}">
          ${insightPersona ? "" : sunHtml}
          ${vibeHtml}
          ${reviewBodyHtml}
        </div>
      </div>`;
  }

  if (heading) {
    if (completedCount === 0) {
      heading.textContent = isToday ? "Wins from today" : `Wins from ${formatArchiveDayHeading(dayKey)}`;
    } else if (completedCount === 1) {
      heading.textContent = isToday ? "Your win so far today" : `Your win from ${dayPhrase}`;
    } else {
      heading.textContent = isToday
        ? `${completedCount} wins so far today`
        : `${completedCount} wins from ${dayPhrase}`;
    }
  }

  if (favouriteSlot) {
    favouriteSlot.innerHTML = reflectionFavouritePickerHtml(completed, favouriteId, dayKey);
    favouriteSlot.querySelectorAll(".reflection-favourite-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.favouriteId;
        if (!id) return;
        saveReflectionFavourite(id, dayKey);
        renderReflectionReview();
      });
    });
  }

  if (completed.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    empty.textContent = isToday
      ? "Your day is still in motion — nothing checked off yet. Your vibe shows up after two wins."
      : `Rest day — nothing was checked off ${dayPhrase}.`;
    observeReflectionScrollCards(document.getElementById("reflection-panel-review"));
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = completed
    .map((task, index) => reflectionReviewItemHtml(task, index, favouriteId))
    .join("");
  observeReflectionScrollCards(document.getElementById("reflection-panel-review"));
}

function syncHistoryJournalForSelectedDay() {
  const textarea = document.getElementById("reflection-text");
  if (!textarea) return;
  const dayKey = ensureReflectionSelectedDayKey();
  const journal = loadReflectionJournal();
  textarea.value = journal[dayKey] || "";
  updateReflectionCharCount();
}

function syncReflectionDayPagerVisibility(tab = getActiveReflectionTab()) {
  const slot = document.getElementById("reflection-day-pager-slot");
  if (!slot) return;
  const show = tab === "review";
  slot.classList.toggle("hidden", !show);
  if (!show) {
    slot.innerHTML = "";
    return;
  }
  const dayKey = ensureReflectionSelectedDayKey();
  slot.innerHTML = reflectionDayPagerHtml(dayKey);
  bindReflectionDayPager(dayKey);
}

function setReflectionTab(tab) {
  const nextTab = tab === "thoughts" ? "thoughts" : "review";
  document.querySelectorAll(".reflection-tab").forEach((btn) => {
    const active = btn.dataset.tab === nextTab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".reflection-tab-panel").forEach((panel) => {
    const show = panel.dataset.tab === nextTab;
    panel.classList.toggle("hidden", !show);
    panel.classList.toggle("active", show);
  });
  syncReflectionDayPagerVisibility(nextTab);
  syncReflectionAnxietyDock();
  const assets = HOME_HERO_WALLPAPERS[getHomeHeroWallpaperPeriod()];
  applyReflectionScreenBackground(document.querySelector(".reflection-screen"), assets, nextTab);
  updateReflectionHeroOnCream();
}

function updateReflectionHeroOnCream() {
  const screen = document.querySelector(".reflection-screen");
  const scrollRoot = getReflectionScrollRoot();
  if (!screen || !document.documentElement.classList.contains("reflection-open")) {
    return;
  }

  const header = screen.querySelector(".reflection-sticky-chrome");
  const viewportH = scrollRoot?.clientHeight || window.innerHeight;
  // Switch earlier — cream veil is readable well below the sticky chrome.
  const headerBottom = header
    ? header.getBoundingClientRect().bottom
    : Math.min(Math.max(viewportH * 0.18, 120), 180);
  const creamLead = Math.min(Math.max(viewportH * 0.14, 88), 140);
  const creamLine = headerBottom + creamLead;

  const isOnCream = (el) => {
    if (!el) return false;
    return el.getBoundingClientRect().top <= creamLine;
  };

  const hero =
    document.querySelector("#reflection-panel-thoughts.reflection-tab-panel.active .reflection-hero--thoughts") ||
    document.querySelector("#reflection-panel-review.reflection-tab-panel.active .reflection-hero--review") ||
    document.querySelector("#reflection-panel-review .reflection-hero--review") ||
    document.querySelector("#reflection-panel-thoughts .reflection-hero--thoughts");
  if (hero) {
    const title = hero.querySelector(".reflection-hero-title");
    const label = hero.querySelector(".reflection-hero-label");
    const probe = label || title || hero;
    hero.classList.toggle("reflection-hero--on-cream", isOnCream(probe));
  }
}

let reflectionHeroScrollRaf = 0;
function onReflectionScreenScroll() {
  if (reflectionHeroScrollRaf) return;
  reflectionHeroScrollRaf = requestAnimationFrame(() => {
    reflectionHeroScrollRaf = 0;
    updateReflectionHeroOnCream();
  });
}

function setReflectionOpenState(open) {
  document.documentElement.classList.toggle("reflection-open", open);
  document.body.classList.toggle("reflection-open", open);
  if (!open) {
    document.documentElement.classList.remove("reflection-anxiety-active", "reflection-has-anxiety");
    requestAnimationFrame(() => {
      renderFocusTimerChrome();
      syncBottomChrome();
    });
  } else {
    requestAnimationFrame(() => {
      renderReflectionAnxietyBox();
      renderFocusTimerChrome();
    });
  }
}

function getReflectionScrollRoot() {
  return document.getElementById("reflection-dialog");
}

function closeReflectionDialog() {
  const dialog = document.getElementById("reflection-dialog");
  if (dialog?.open) dialog.close();
}

function openReflectionDialog(tab = "review") {
  const dialog = document.getElementById("reflection-dialog");
  if (!dialog) return;

  const nextTab = tab === "thoughts" ? "thoughts" : "review";
  if (nextTab === "review") {
    renderReflectionReview();
  }
  renderReflectionAnxietyBox();
  setReflectionTab(nextTab);
  syncBottomChrome();
  setReflectionOpenState(true);
  // Non-modal so the standard bottom nav stays above Reflection and stays tappable
  dialog.show();
  dialog.scrollTop = 0;
  requestAnimationFrame(() => {
    dialog.scrollTop = 0;
    if (nextTab === "review") renderReflectionReview();
    renderReflectionAnxietyBox();
    renderFocusTimerChrome();
    syncBottomChrome();
    updateReflectionHeroOnCream();
    if (nextTab === "thoughts") {
      document.getElementById("reflection-anxiety-input")?.blur();
    }
  });
}

function setupReflection() {
  const dialog = document.getElementById("reflection-dialog");
  const textarea = document.getElementById("reflection-text");
  const refreshBtn = document.getElementById("reflection-prompts-refresh");
  const continueBtn = document.getElementById("reflection-continue");
  const reviewContinueBtn = document.getElementById("reflection-review-continue");
  const promptsList = document.getElementById("reflection-prompts-list");

  document.getElementById("focus-reflection-btn")?.addEventListener("click", () => {
    openReflectionDialog("review");
  });
  document.getElementById("presence-thoughts-btn")?.addEventListener("click", () => {
    openReflectionDialog("thoughts");
  });
  document.getElementById("presence-toolbar-thoughts-btn")?.addEventListener("click", () => {
    openReflectionDialog("thoughts");
  });

  setupFocusTimer();

  // Scroll lives on the dialog (not nested .reflection-screen) so touch pans work
  dialog?.addEventListener("scroll", onReflectionScreenScroll, { passive: true });
  dialog?.addEventListener("close", () => {
    setReflectionOpenState(false);
    requestAnimationFrame(() => syncBottomChrome());
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!document.documentElement.classList.contains("reflection-open")) return;
    if (document.querySelector("dialog[open]:modal")) return;
    closeReflectionDialog();
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
    renderReflectionAnxietyBox();
    dialog.scrollTop = 0;
    requestAnimationFrame(() => updateReflectionHeroOnCream());
  });

  continueBtn?.addEventListener("click", () => {
    dialog?.close();
  });

  setupPersonaMarkPreview();
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
      <label class="task-check">
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
      </label>
      <div class="history-item-body">
        <button type="button" class="task-text-btn history-text">${escapeHtml(task.text)}</button>
        <span class="history-meta tasks-flat-meta">
          <span class="plan-135-tier-badge ${plan135TierBadgeClass(task.tier)}">${TIER_LABELS[task.tier - 1]}</span>
          ${taskAttachmentIndicatorHtml(task)}
          ${contextBadge}
          ${inForgetIt ? `<span class="forget-it-indicator" title="In Next Week box" aria-label="In Next Week box"><svg class="icon icon-forget-box" aria-hidden="true"><use href="#icon-forget-box"></use></svg></span>` : ""}
        </span>
      </div>
      <div class="task-card-actions">
        ${archiveButtonHtml()}
        ${deleteButtonHtml()}
        ${taskDragHandleHtml()}
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
  syncWeeklyViewUi();
  const flatList = document.getElementById("tasks-flat-list");
  if (flatList) flatList.innerHTML = "";

  if (weeklyView) {
    renderTasksWeekly();
  }

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
      <span class="plan-card-task-meta">
        ${taskAttachmentIndicatorHtml(task)}
        ${contextIconHtml(task.context, "plan-card-task-ctx")}
        ${deleteButtonHtml()}
      </span>
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
      <span class="home-card-task-meta">
        ${taskAttachmentIndicatorHtml(task)}
        ${contextIconHtml(task.context, "home-card-task-ctx")}
      </span>
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

function parseDayKeyLocal(dayKey) {
  const [y, m, d] = String(dayKey || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKeyFromLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysToDayKey(dayKey, days) {
  const date = parseDayKeyLocal(dayKey);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return dayKeyFromLocalDate(date);
}

function startOfWeekForDayKey(dayKey) {
  const date = parseDayKeyLocal(dayKey) || new Date();
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const target = getWeekStartPreference() === "sunday" ? 0 : 1;
  let diff = day - target;
  if (diff < 0) diff += 7;
  date.setDate(date.getDate() - diff);
  return dayKeyFromLocalDate(date);
}

function getDayKeysRange(startKey, count) {
  const keys = [];
  let key = startKey;
  for (let i = 0; i < count; i += 1) {
    if (!key) break;
    keys.push(key);
    key = addDaysToDayKey(key, 1);
  }
  return keys;
}

function getDefaultWeeklyWindowStartKey() {
  return startOfWeekForDayKey(reflectionTodayKey());
}

function ensureWeeklyWindowStartKey() {
  if (!weeklyWindowStartKey) {
    try {
      const stored = normalizeScheduledFor(localStorage.getItem(WEEKLY_WINDOW_START_KEY));
      if (stored) weeklyWindowStartKey = startOfWeekForDayKey(stored);
    } catch {
      /* ignore */
    }
  }
  if (!weeklyWindowStartKey) weeklyWindowStartKey = getDefaultWeeklyWindowStartKey();
  return weeklyWindowStartKey;
}

function setWeeklyWindowStartKey(dayKey, options = {}) {
  const start = startOfWeekForDayKey(dayKey || reflectionTodayKey());
  weeklyWindowStartKey = start;
  try {
    localStorage.setItem(WEEKLY_WINDOW_START_KEY, start);
  } catch {
    /* ignore */
  }
  const keys = getCurrentWeekDayKeys();
  if (!weeklySelectedDayKey || !keys.includes(weeklySelectedDayKey)) {
    weeklySelectedDayKey = keys.includes(reflectionTodayKey())
      ? reflectionTodayKey()
      : keys[0];
  }
  if (!options.skipRender) {
    if (page === "home" && weeklyView) renderHome();
    else if (page === "tasks" && weeklyView) renderGrid();
  }
  return start;
}

/** Visible fortnight (14 days) for Home/Tasks week strip. */
function getCurrentWeekDayKeys() {
  return getDayKeysRange(ensureWeeklyWindowStartKey(), WEEKLY_WINDOW_LEN);
}

function weeklyRangeLabel(keys = getCurrentWeekDayKeys()) {
  if (!keys.length) return "";
  const start = parseDayKeyLocal(keys[0]);
  const end = parseDayKeyLocal(keys[keys.length - 1]);
  if (!start || !end) return "";
  const opts = { month: "short", day: "numeric" };
  const startLabel = start.toLocaleDateString(undefined, opts);
  const endLabel = end.toLocaleDateString(undefined, {
    ...opts,
    year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
  });
  return `${startLabel} – ${endLabel}`;
}

function monthKeyFromDayKey(dayKey) {
  const date = parseDayKeyLocal(dayKey) || new Date();
  return dayKeyFromLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function shiftMonthKey(monthKey, delta) {
  const date = parseDayKeyLocal(monthKey) || new Date();
  date.setMonth(date.getMonth() + delta, 1);
  return dayKeyFromLocalDate(date);
}

function monthCalendarHtml({
  monthKey,
  selectedDayKey = "",
  rangeStartKey = "",
  rangeEndKey = "",
  todayKey = reflectionTodayKey(),
  hint = "Tap a day to jump to that two-week stretch.",
} = {}) {
  const monthDate = parseDayKeyLocal(monthKey) || new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const title = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekStart = getWeekStartPreference() === "sunday" ? 0 : 1;
  const weekdayLabels = [];
  const sunday = new Date(2024, 0, 7, 12, 0, 0, 0);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + ((weekStart + i) % 7));
    weekdayLabels.push(d.toLocaleDateString(undefined, { weekday: "narrow" }));
  }

  const first = new Date(year, month, 1, 12, 0, 0, 0);
  let startOffset = first.getDay() - weekStart;
  if (startOffset < 0) startOffset += 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + i);
    const key = dayKeyFromLocalDate(cell);
    const inMonth = cell.getMonth() === month;
    const isSelected = key === selectedDayKey;
    const isToday = key === todayKey;
    const inRange =
      rangeStartKey &&
      rangeEndKey &&
      key >= rangeStartKey &&
      key <= rangeEndKey;
    cells.push(`
      <button
        type="button"
        class="month-calendar-day${!inMonth ? " is-outside" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}${inRange ? " is-in-range" : ""}"
        data-calendar-day="${escapeHtml(key)}"
        aria-pressed="${isSelected ? "true" : "false"}"
        ${!inMonth ? 'tabindex="-1"' : ""}
      >${cell.getDate()}</button>`);
  }

  return `
    <div class="month-calendar-inner" data-month-key="${escapeHtml(dayKeyFromLocalDate(new Date(year, month, 1)))}">
      <div class="month-calendar-head">
        <button type="button" class="month-calendar-nav" data-calendar-nav="-1" aria-label="Previous month">
          <svg class="icon" aria-hidden="true"><use href="#icon-chevron"></use></svg>
        </button>
        <p class="month-calendar-title">${escapeHtml(title)}</p>
        <button type="button" class="month-calendar-nav month-calendar-nav--next" data-calendar-nav="1" aria-label="Next month">
          <svg class="icon" aria-hidden="true"><use href="#icon-chevron"></use></svg>
        </button>
      </div>
      <div class="month-calendar-weekdays" aria-hidden="true">
        ${weekdayLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
      </div>
      <div class="month-calendar-grid">${cells.join("")}</div>
      <p class="month-calendar-hint">${escapeHtml(hint)}</p>
    </div>`;
}

function bindMonthCalendar(root, { onSelectDay, onChangeMonth } = {}) {
  if (!root) return;
  root.querySelectorAll("[data-calendar-nav]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const delta = Number(btn.dataset.calendarNav) || 0;
      onChangeMonth?.(delta);
    });
  });
  root.querySelectorAll("[data-calendar-day]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const dayKey = normalizeScheduledFor(btn.dataset.calendarDay);
      if (dayKey) onSelectDay?.(dayKey);
    });
  });
}

function ensureWeeklySelectedDayKey() {
  const week = getCurrentWeekDayKeys();
  if (!weeklySelectedDayKey || !week.includes(weeklySelectedDayKey)) {
    weeklySelectedDayKey = reflectionTodayKey();
    if (!week.includes(weeklySelectedDayKey)) weeklySelectedDayKey = week[0];
  }
  return weeklySelectedDayKey;
}

function setWeeklySelectedDayKey(dayKey) {
  const week = getCurrentWeekDayKeys();
  if (!week.includes(dayKey)) return ensureWeeklySelectedDayKey();
  weeklySelectedDayKey = dayKey;
  return weeklySelectedDayKey;
}

function scrollWeeklyStripToActive(container) {
  const strip = container?.querySelector(".weekly-day-strip");
  const active = strip?.querySelector(".weekly-day-chip.is-active");
  if (!strip || !active) return;
  const stripRect = strip.getBoundingClientRect();
  const chipRect = active.getBoundingClientRect();
  const offset =
    chipRect.left - stripRect.left - (stripRect.width - chipRect.width) / 2;
  strip.scrollLeft += offset;
}

function dayKeyToWeekdayIndex(dayKey) {
  const [y, m, d] = String(dayKey || "").split("-").map(Number);
  if (!y || !m || !d) return -1;
  return new Date(y, m - 1, d).getDay();
}

function getWeeklyOpenTasksForToday() {
  const today = reflectionTodayKey();
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || t.done || isTaskDeferred(t)) return;
      if (isRepeatTask(t)) return;
      if (!isTierVisible(t.tier)) return;
      const scheduledFor = normalizeScheduledFor(t.scheduledFor);
      if (scheduledFor && scheduledFor > today) return;
      if (scheduledFor === today) return; // added via getScheduledTasksForDay
      tasks.push({ ...t, context: ctx });
    });
  });
  tasks.sort((a, b) => a.tier - b.tier || a.text.localeCompare(b.text));
  return tasks;
}

function getDailyRepeatTasksForDay() {
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || isTaskDeferred(t)) return;
      if (!t.repeatDaily) return;
      if (!isTierVisible(t.tier)) return;
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks;
}

function getWeeklyRepeatTasksForDay(dayKey) {
  const weekday = dayKeyToWeekdayIndex(dayKey);
  if (weekday < 0) return [];
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || isTaskDeferred(t)) return;
      if (!t.repeatWeekly) return;
      if (normalizeRepeatWeekday(t.repeatWeekday) !== weekday) return;
      if (!isTierVisible(t.tier)) return;
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks;
}

function getScheduledTasksForDay(dayKey) {
  const today = reflectionTodayKey();
  const tasks = [];
  getContexts().forEach((ctx) => {
    loadTasks(ctx).forEach((t) => {
      if (t.archived || isTaskDeferred(t)) return;
      if (isRepeatTask(t)) return;
      if (!isTierVisible(t.tier)) return;
      const scheduled = normalizeScheduledFor(t.scheduledFor);
      if (!scheduled) return;
      const onExactDay = scheduled === dayKey;
      const carriedForward =
        !t.done && scheduled < dayKey && dayKey <= today;
      if (!onExactDay && !carriedForward) return;
      tasks.push({ ...t, context: ctx });
    });
  });
  return tasks;
}

/** For week-day cards, show each day's occurrence (done only if completed that day). */
function withTaskDayAppearance(task, dayKey) {
  const today = reflectionTodayKey();
  if (dayKey === today) return task;
  if (!isRepeatTask(task)) return task;
  const completedThatDay =
    task.completedAt && archiveDayKey(task.completedAt) === dayKey;
  if (completedThatDay) {
    return { ...task, done: true, archived: false };
  }
  return { ...task, done: false, archived: false };
}

function getTasksForWeeklyDay(dayKey) {
  const today = reflectionTodayKey();
  const seen = new Set();
  const tasks = [];
  const push = (t) => {
    const key = `${t.context}:${t.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    tasks.push(withTaskDayAppearance(t, dayKey));
  };

  getCompletedTasksForDay(dayKey, { includeArchived: dayKey !== today }).forEach((t) => {
    if (!isTierVisible(t.tier)) return;
    push(t);
  });

  getScheduledTasksForDay(dayKey)
    .filter((t) => !t.done)
    .forEach(push);

  getDailyRepeatTasksForDay().forEach(push);
  getWeeklyRepeatTasksForDay(dayKey).forEach(push);

  if (dayKey === today) {
    getWeeklyOpenTasksForToday().forEach(push);
  }

  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return a.tier - b.tier || a.text.localeCompare(b.text);
  });
  return tasks;
}

function weeklyDayChipLabel(dayKey) {
  const today = reflectionTodayKey();
  if (dayKey === today) return "Today";
  const [y, m, d] = String(dayKey || "").split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function weeklyDayNumLabel(dayKey) {
  const [y, m, d] = String(dayKey || "").split("-").map(Number);
  return String(d);
}

function weeklyDayStripHtml(selectedDayKey, dayKeys = getCurrentWeekDayKeys()) {
  return dayKeys
    .map((key) => {
      const active = key === selectedDayKey;
      const isToday = key === reflectionTodayKey();
      return `
      <button
        type="button"
        class="weekly-day-chip${active ? " is-active" : ""}${isToday ? " is-today" : ""}"
        data-week-day="${escapeHtml(key)}"
        aria-pressed="${active ? "true" : "false"}"
      >
        <span class="weekly-day-chip-label">${escapeHtml(weeklyDayChipLabel(key))}</span>
        <span class="weekly-day-chip-num">${escapeHtml(weeklyDayNumLabel(key))}</span>
      </button>`;
    })
    .join("");
}

function weeklyPriorityGridHtml(tasks) {
  const cardsHtml = getVisibleTierList()
    .map((tier) => {
      const allTasks = sortTierTasksForDisplay(
        tasks.filter((t) => Number(t.tier) === tier),
        tier
      );
      const preview = allTasks.slice(0, 5);
      const done = allTasks.filter((t) => t.done).length;
      const total = allTasks.length;
      return figmaPlanCardHtml({
        number: String(tier).padStart(2, "0"),
        variant: PRIORITY_CARD_VARIANTS[tier - 1],
        title: TIER_NAMES[tier - 1],
        subtitle: `${total} task${total === 1 ? "" : "s"}`,
        tasks: preview,
        done,
        total,
        tier,
      });
    })
    .join("");

  return `<div class="plan-card-grid plan-card-grid--priorities">${cardsHtml}</div>`;
}

function weeklyCalendarPanelHtml(selectedDayKey) {
  if (!weeklyCalendarOpen) return "";
  const keys = getCurrentWeekDayKeys();
  const monthKey =
    weeklyCalendarMonthKey || monthKeyFromDayKey(selectedDayKey || keys[0]);
  return `
    <div class="month-calendar weekly-month-calendar" id="weekly-month-calendar">
      ${monthCalendarHtml({
        monthKey,
        selectedDayKey,
        rangeStartKey: keys[0],
        rangeEndKey: keys[keys.length - 1],
      })}
    </div>`;
}

function weeklyViewHtml(selectedDayKey, tasks) {
  const keys = getCurrentWeekDayKeys();
  return `
    <div class="weekly-view">
      <div class="weekly-day-toolbar">
        <p class="weekly-range-label">${escapeHtml(weeklyRangeLabel(keys))}</p>
        <button
          type="button"
          class="date-cal-btn weekly-cal-btn"
          data-weekly-cal
          aria-label="Choose two-week range"
          aria-expanded="${weeklyCalendarOpen ? "true" : "false"}"
          title="Choose two-week range"
        >
          <svg class="icon" aria-hidden="true"><use href="#icon-calendar"></use></svg>
        </button>
      </div>
      <div class="weekly-day-strip" role="group" aria-label="Days in this two-week range">${weeklyDayStripHtml(selectedDayKey, keys)}</div>
      ${weeklyCalendarPanelHtml(selectedDayKey)}
      ${weeklyPriorityGridHtml(tasks)}
    </div>`;
}

function bindWeeklyView(container) {
  if (!container) return;
  container.querySelectorAll(".weekly-day-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      setWeeklySelectedDayKey(btn.dataset.weekDay);
      weeklyCalendarOpen = false;
      if (page === "home") renderHome();
      else if (page === "tasks") renderGrid();
    });
  });
  container.querySelector("[data-weekly-cal]")?.addEventListener("click", () => {
    weeklyCalendarOpen = !weeklyCalendarOpen;
    if (weeklyCalendarOpen) {
      weeklyCalendarMonthKey = monthKeyFromDayKey(
        ensureWeeklySelectedDayKey() || ensureWeeklyWindowStartKey()
      );
    }
    if (page === "home") renderHome();
    else if (page === "tasks") renderGrid();
  });
  bindMonthCalendar(container.querySelector("#weekly-month-calendar"), {
    onChangeMonth: (delta) => {
      weeklyCalendarMonthKey = shiftMonthKey(
        weeklyCalendarMonthKey || monthKeyFromDayKey(ensureWeeklySelectedDayKey()),
        delta
      );
      if (page === "home") renderHome();
      else if (page === "tasks") renderGrid();
    },
    onSelectDay: (dayKey) => {
      setWeeklyWindowStartKey(dayKey, { skipRender: true });
      weeklySelectedDayKey = dayKey;
      weeklyCalendarOpen = false;
      weeklyCalendarMonthKey = monthKeyFromDayKey(dayKey);
      if (page === "home") renderHome();
      else if (page === "tasks") renderGrid();
    },
  });
  bindHomeCardTasks(container);
  container.querySelectorAll(".plan-card-more").forEach((btn) => {
    btn.addEventListener("click", () => openTierExpand(Number(btn.dataset.tier)));
  });
  requestAnimationFrame(() => scrollWeeklyStripToActive(container));
}

function renderHomeWeekly() {
  const title = document.getElementById("home-priority-title");
  const progress = document.getElementById("home-priority-progress");
  const content = document.getElementById("home-priority-content");
  const empty = document.getElementById("home-priority-empty");
  if (!content || !empty) return;

  const dayKey = ensureWeeklySelectedDayKey();
  if (title) {
    title.textContent =
      dayKey === reflectionTodayKey() ? "Today's Plan" : formatArchiveDayHeading(dayKey);
  }
  if (progress) progress.classList.add("hidden");
  empty.classList.add("hidden");

  const tasks = getTasksForWeeklyDay(dayKey).filter((task) =>
    matchesHomeContextFilter(task.context)
  );
  content.innerHTML = weeklyViewHtml(dayKey, tasks);
  bindWeeklyView(content);
}

function renderTasksWeekly() {
  const host = document.getElementById("tasks-weekly-view");
  if (!host) return;
  const dayKey = ensureWeeklySelectedDayKey();
  const keys = getCurrentWeekDayKeys();
  host.innerHTML = `
    <div class="weekly-view">
      <div class="weekly-day-toolbar">
        <p class="weekly-range-label">${escapeHtml(weeklyRangeLabel(keys))}</p>
        <button
          type="button"
          class="date-cal-btn weekly-cal-btn"
          data-weekly-cal
          aria-label="Choose two-week range"
          aria-expanded="${weeklyCalendarOpen ? "true" : "false"}"
          title="Choose two-week range"
        >
          <svg class="icon" aria-hidden="true"><use href="#icon-calendar"></use></svg>
        </button>
      </div>
      <div class="weekly-day-strip" role="group" aria-label="Days in this two-week range">${weeklyDayStripHtml(dayKey, keys)}</div>
      ${weeklyCalendarPanelHtml(dayKey)}
    </div>`;
  bindWeeklyView(host);
}

function getTasksByTierForHome(tier, limit) {
  if (!isTierVisible(tier)) return [];
  const sorted = sortTierTasksForDisplay(
    getTierTasksAllContexts(tier).filter((task) => matchesHomeContextFilter(task.context)),
    tier
  );
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

  row.querySelector(".delete-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    confirmDeleteTask(id, ctx);
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
  const notesList = document.getElementById("media-viewer-notes-list");
  const notesEmpty = document.getElementById("media-viewer-notes-empty");
  const notesCount = document.getElementById("media-viewer-notes-count");
  const notesLegacy = document.getElementById("media-viewer-notes");
  const photosEl = document.getElementById("media-viewer-photos");
  const emptyEl = document.getElementById("media-viewer-empty");
  if (!dialog || !task) return;

  mediaViewerTaskRef = { id: task.id, context: task.context };
  revokePhotoUrls(mediaViewerUrls);
  if (title) title.textContent = task.text || "Attachments";

  const entries = getTaskNoteEntries(task);
  if (sub) {
    const parts = [];
    if (entries.length) parts.push(`${entries.length} note${entries.length === 1 ? "" : "s"}`);
    if (taskHasPhotos(task)) {
      parts.push(`${task.photos.length} photo${task.photos.length === 1 ? "" : "s"}`);
    }
    sub.textContent = parts.join(" · ") || "Notes & photos";
  }

  if (notesList) {
    notesList.innerHTML = entries
      .map(
        (note) => `
      <li class="media-viewer-note-item" data-note-id="${escapeHtml(note.id)}">
        <p class="media-viewer-note-text">${escapeHtml(note.text)}</p>
        ${
          formatNoteTimestamp(note.createdAt)
            ? `<p class="media-viewer-note-meta">${escapeHtml(formatNoteTimestamp(note.createdAt))}</p>`
            : ""
        }
        <button type="button" class="media-viewer-note-delete" aria-label="Delete note">×</button>
      </li>`
      )
      .join("");
    notesList.querySelectorAll(".media-viewer-note-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const noteId = btn.closest("[data-note-id]")?.dataset.noteId;
        if (!noteId || !mediaViewerTaskRef) return;
        deleteTaskNote(mediaViewerTaskRef.id, mediaViewerTaskRef.context, noteId);
      });
    });
  }
  notesEmpty?.classList.toggle("hidden", entries.length > 0);
  if (notesCount) {
    notesCount.textContent = entries.length
      ? `${entries.length} note${entries.length === 1 ? "" : "s"}`
      : "";
  }
  notesLegacy?.classList.add("hidden");

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

  emptyEl?.classList.toggle("hidden", photos.length > 0 || entries.length > 0);
  dialog.showModal();
}

function persistTaskNotes(id, ctx, entries) {
  updateTaskInContext(ctx, (list) =>
    list.map((t) => (t.id === id ? withTaskNotes(t, entries) : t))
  );
  const task = loadTasks(ctx).find((t) => t.id === id);
  renderAll();
  if (task && document.getElementById("media-viewer-dialog")?.open) {
    openTaskMediaViewer({ ...task, context: ctx });
  }
}

function addTaskNote(id, ctx, text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return;
  const task = loadTasks(ctx).find((t) => t.id === id);
  if (!task) return;
  const entries = [
    ...getTaskNoteEntries(task),
    { id: createId(), text: trimmed, createdAt: new Date().toISOString() },
  ];
  persistTaskNotes(id, ctx, entries);
}

function deleteTaskNote(id, ctx, noteId) {
  const task = loadTasks(ctx).find((t) => t.id === id);
  if (!task) return;
  const entries = getTaskNoteEntries(task).filter((n) => n.id !== noteId);
  persistTaskNotes(id, ctx, entries);
}

function closeTaskMediaViewer() {
  const dialog = document.getElementById("media-viewer-dialog");
  revokePhotoUrls(mediaViewerUrls);
  mediaViewerTaskRef = null;
  const input = document.getElementById("media-viewer-notes-input");
  if (input) input.value = "";
  dialog?.close();
}

function setupMediaViewer() {
  document.getElementById("media-viewer-close")?.addEventListener("click", closeTaskMediaViewer);
  document.getElementById("media-viewer-dialog")?.addEventListener("click", (e) => {
    if (e.target?.id === "media-viewer-dialog") closeTaskMediaViewer();
  });
  const form = document.getElementById("media-viewer-notes-form");
  if (form && !form.dataset.bound) {
    form.dataset.bound = "1";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!mediaViewerTaskRef) return;
      const input = document.getElementById("media-viewer-notes-input");
      const text = input?.value || "";
      if (input) input.value = "";
      addTaskNote(mediaViewerTaskRef.id, mediaViewerTaskRef.context, text);
    });
  }
}

function formatCompletionTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDurationShort(ms) {
  const mins = Math.max(1, Math.round(Number(ms) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (rem === 0) return hours === 1 ? "1 hr" : `${hours} hr`;
  return `${hours}h ${rem}m`;
}

function formatTimeAgo(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const ms = Date.now() - then;
  if (ms < 45 * 1000) return "just now";
  if (ms < 60 * 60 * 1000) return `${Math.max(1, Math.floor(ms / 60000))}m ago`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.max(1, Math.floor(ms / 3600000))}h ago`;
  return formatCompletionTime(iso);
}

function getNotifySeenAt() {
  try {
    return localStorage.getItem(NOTIFY_SEEN_KEY) || "";
  } catch {
    return "";
  }
}

function markNotifySeen() {
  try {
    localStorage.setItem(NOTIFY_SEEN_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
  syncNotifyDots();
}

function getRecentCompletedForNotify(limit = 8) {
  const todayKeyStr = archiveDayKey(new Date().toISOString());
  const seen = new Set();
  const merged = [];

  const pushTask = (task, ctx) => {
    if (!task?.done || !task.completedAt) return;
    const key = `${ctx}:${task.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({ ...task, context: ctx });
  };

  getCompletedTodayTasks().forEach((task) => pushTask(task, task.context));
  getArchivedTodayWinsTasks().forEach((task) => pushTask(task, task.context));

  if (merged.length === 0) {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    getContexts().forEach((ctx) => {
      loadTasks(ctx).forEach((task) => {
        if (!task?.done || !task.completedAt) return;
        const stamp = new Date(task.completedAt).getTime();
        if (Number.isNaN(stamp) || stamp < cutoff) return;
        pushTask(task, ctx);
      });
    });
  }

  return merged
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, limit)
    .map((task) => ({
      ...task,
      isToday: archiveDayKey(task.completedAt) === todayKeyStr,
    }));
}

function buildCompletionPace(tasks) {
  const chronological = [...tasks]
    .filter((task) => task?.completedAt)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  const count = chronological.length;
  const todayKeyStr = archiveDayKey(new Date().toISOString());
  const todayCount = chronological.filter(
    (task) => archiveDayKey(task.completedAt) === todayKeyStr
  ).length;

  if (count === 0) {
    return {
      headline: "Quiet so far",
      detail: "Cross one off and your pace will show up here.",
      todayCount: 0,
    };
  }

  if (count === 1) {
    const only = chronological[0];
    const isToday = archiveDayKey(only.completedAt) === todayKeyStr;
    return {
      headline: isToday ? "First win of the day" : "Most recent win",
      detail: `Checked off at ${formatCompletionTime(only.completedAt)}.`,
      todayCount,
    };
  }

  const first = new Date(chronological[0].completedAt).getTime();
  const last = new Date(chronological[count - 1].completedAt).getTime();
  const now = Date.now();
  const gaps = [];
  for (let i = 1; i < chronological.length; i += 1) {
    gaps.push(
      new Date(chronological[i].completedAt).getTime() -
        new Date(chronological[i - 1].completedAt).getTime()
    );
  }
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const spanHours = Math.max((Math.max(last, now) - first) / 3600000, 1 / 60);
  const perHour = count / spanHours;
  const lastHourCount = chronological.filter(
    (task) => new Date(task.completedAt).getTime() >= now - 3600000
  ).length;

  let headline;
  if (avgGap <= 20 * 60 * 1000) {
    headline = `On a roll — 1 every ${formatDurationShort(avgGap)}`;
  } else if (perHour >= 1) {
    const rounded = perHour >= 10 ? Math.round(perHour) : Math.round(perHour * 10) / 10;
    headline = `${String(rounded).replace(/\.0$/, "")} per hour`;
  } else {
    headline = `1 every ${formatDurationShort(avgGap)}`;
  }

  const detailParts = [];
  if (todayCount > 0) {
    detailParts.push(`${todayCount} win${todayCount === 1 ? "" : "s"} today`);
  } else {
    detailParts.push(`${count} recent win${count === 1 ? "" : "s"}`);
  }
  if (lastHourCount >= 2) detailParts.push(`${lastHourCount} in the last hour`);
  detailParts.push(`since ${formatCompletionTime(chronological[0].completedAt)}`);

  return {
    headline,
    detail: detailParts.join(" · "),
    todayCount,
  };
}

function hasUnseenCompletions() {
  const recent = getRecentCompletedForNotify(12);
  if (!recent.length) return false;
  const seenAt = getNotifySeenAt();
  if (!seenAt) return true;
  const seenMs = new Date(seenAt).getTime();
  if (Number.isNaN(seenMs)) return true;
  return recent.some((task) => new Date(task.completedAt).getTime() > seenMs);
}

function syncNotifyDots() {
  const show = hasUnseenCompletions();
  document.querySelectorAll(".header-notify-dot").forEach((dot) => {
    dot.classList.toggle("hidden", !show);
  });
  document.querySelectorAll(NOTIFY_BELL_SELECTOR).forEach((btn) => {
    btn.setAttribute("aria-expanded", String(isNotifyPanelOpen()));
  });
}

function isNotifyPanelOpen() {
  return Boolean(document.getElementById("notify-panel")?.classList.contains("is-open"));
}

function notifyPanelItemHtml(task) {
  const time = formatCompletionTime(task.completedAt);
  const ago = formatTimeAgo(task.completedAt);
  const tier =
    task.tier >= 1 && task.tier <= 4 ? TIER_LABELS[task.tier - 1] : "";
  const meta = [time, contextLabel(task.context), tier].filter(Boolean).join(" · ");
  return `
    <li class="notify-panel-item">
      <span class="notify-panel-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <div class="notify-panel-item-body">
        <p class="notify-panel-item-text">${escapeHtml(task.text || "Task")}</p>
        <p class="notify-panel-item-meta">${escapeHtml(meta)}</p>
      </div>
      <span class="notify-panel-item-ago">${escapeHtml(ago)}</span>
    </li>`;
}

function ensureNotifyPanel() {
  let panel = document.getElementById("notify-panel");
  if (panel) return panel;
  panel = document.createElement("div");
  panel.id = "notify-panel";
  panel.className = "notify-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Recent wins and pace");
  panel.innerHTML = `
    <header class="notify-panel-header">
      <div class="notify-panel-heading">
        <p class="notify-panel-kicker">Recent wins</p>
        <h2 class="notify-panel-title" id="notify-panel-title">Quiet so far</h2>
        <p class="notify-panel-detail" id="notify-panel-detail"></p>
      </div>
      <button type="button" class="notify-panel-close" aria-label="Close notifications">×</button>
    </header>
    <ul class="notify-panel-list" id="notify-panel-list"></ul>
    <p class="notify-panel-empty hidden" id="notify-panel-empty">Nothing completed yet — your first win will land here.</p>
  `;
  document.body.appendChild(panel);
  panel.querySelector(".notify-panel-close")?.addEventListener("click", () => {
    closeNotifyPanel();
  });
  return panel;
}

function renderNotifyPanel() {
  const panel = document.getElementById("notify-panel");
  if (!panel || !isNotifyPanelOpen()) {
    syncNotifyDots();
    return;
  }

  const recent = getRecentCompletedForNotify(8);
  const pace = buildCompletionPace(recent);
  const title = panel.querySelector("#notify-panel-title");
  const detail = panel.querySelector("#notify-panel-detail");
  const list = panel.querySelector("#notify-panel-list");
  const empty = panel.querySelector("#notify-panel-empty");

  if (title) title.textContent = pace.headline;
  if (detail) detail.textContent = pace.detail;
  if (list) {
    list.innerHTML = recent.map(notifyPanelItemHtml).join("");
    list.classList.toggle("hidden", recent.length === 0);
  }
  empty?.classList.toggle("hidden", recent.length > 0);
  if (recent[0]?.completedAt) {
    try {
      localStorage.setItem(NOTIFY_SEEN_KEY, recent[0].completedAt);
    } catch {
      /* ignore */
    }
  }
  syncNotifyDots();
}

function openNotifyPanel() {
  const panel = ensureNotifyPanel();
  panel.classList.add("is-open");
  markNotifySeen();
  renderNotifyPanel();
  requestAnimationFrame(() => {
    panel.querySelector(".notify-panel-close")?.focus();
  });
}

function closeNotifyPanel() {
  const panel = document.getElementById("notify-panel");
  if (!panel) return;
  panel.classList.remove("is-open");
  syncNotifyDots();
}

function toggleNotifyPanel() {
  if (isNotifyPanelOpen()) closeNotifyPanel();
  else openNotifyPanel();
}

function setupNotifyPanel() {
  ensureNotifyPanel();
  document.querySelectorAll(NOTIFY_BELL_SELECTOR).forEach((btn) => {
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-controls", "notify-panel");
    btn.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (event) => {
    const bell = event.target.closest?.(NOTIFY_BELL_SELECTOR);
    if (bell) {
      event.preventDefault();
      toggleNotifyPanel();
      return;
    }
    const panel = document.getElementById("notify-panel");
    if (panel && isNotifyPanelOpen() && !panel.contains(event.target)) {
      closeNotifyPanel();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isNotifyPanelOpen()) {
      closeNotifyPanel();
    }
  });

  syncNotifyDots();
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
      <span class="plan-card-task-meta completed-wins-meta">
        ${taskAttachmentIndicatorHtml(task)}
        ${contextIconHtml(task.context, "plan-card-task-ctx")}
        <button type="button" class="completed-wins-archive" aria-label="Archive task" title="Archive">
          <svg class="icon" aria-hidden="true"><use href="#icon-archive"></use></svg>
        </button>
      </span>
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
  syncWeeklyViewUi();
  renderHomeCategoryTags();
  syncThoughtsBellAnimation();
  syncHomeTagScrollButtons();
  if (weeklyView) {
    renderHomeWeekly();
  } else {
    // Always show all four priority columns with their tasks — not the 1-3-5 slot plan.
    renderHomePriorities();
  }
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

  card.querySelector('input[type="checkbox"]')?.addEventListener("change", (e) => {
    toggleTaskDone(id, ctx, e.target.checked);
  });

  const archiveBtn = card.querySelector(".archive-btn");
  archiveBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    archiveTask(id, ctx);
  });

  card.querySelector(".delete-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    confirmDeleteTask(id, ctx);
  });

  const openEdit = () => {
    const task = loadTasks(ctx).find((t) => t.id === id);
    if (task) openEditTaskDialog(task, ctx);
  };

  card.querySelector(".edit-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openEdit();
  });

  bindAttachmentIndicator(card, id, ctx);

  card.querySelector(".task-text-btn")?.addEventListener("click", (e) => {
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

function getDialogCaptureMode() {
  return document.getElementById("dialog-capture-mode")?.value === "note" ? "note" : "task";
}

function setDialogCaptureMode(mode, options = {}) {
  const next = mode === "note" ? "note" : "task";
  const modeInput = document.getElementById("dialog-capture-mode");
  if (modeInput) modeInput.value = next;

  const dialog = document.getElementById("task-dialog");
  dialog?.classList.toggle("is-note-mode", next === "note");

  const switcher = document.getElementById("dialog-mode-switch");
  if (switcher) {
    const showSwitcher = options.showSwitcher !== false;
    switcher.classList.toggle("hidden", !showSwitcher);
    switcher.querySelectorAll(".dialog-mode-btn").forEach((btn) => {
      const active = btn.dataset.mode === next;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  const taskFields = document.getElementById("dialog-task-fields");
  const noteHint = document.getElementById("dialog-note-hint");
  const input = document.getElementById("dialog-input");
  const title = document.getElementById("dialog-title");

  taskFields?.classList.toggle("hidden", next === "note");
  noteHint?.classList.toggle("hidden", next !== "note");

  if (next === "note") {
    if (title && options.updateTitle !== false) title.textContent = "Add Note";
    if (input) {
      input.placeholder = "Jot something down…";
      input.maxLength = 1000;
      input.rows = 4;
    }
    setTaskDialogSubmitLabel("Save note");
    const hint = document.getElementById("dialog-parse-hint");
    const preview = document.getElementById("dialog-parse-preview");
    hint?.classList.add("hidden");
    preview?.classList.add("hidden");
    if (preview) preview.innerHTML = "";
  } else {
    if (title && options.updateTitle !== false) title.textContent = "Add Task";
    if (input) {
      input.placeholder = "One task — or paste a few lines to split into several";
      input.maxLength = 2000;
      input.rows = 2;
    }
    if (options.syncPreview !== false) syncDialogParsePreview();
  }
}

function resetDialogMediaFields() {
  dialogPhotoDraft = [];
  dialogNoteEntries = [];
  dialogClaimedNoteIds = [];
  revokePhotoUrls(dialogPhotoUrls);
  const notesInput = document.getElementById("dialog-notes-input");
  if (notesInput) notesInput.value = "";
  const notesHidden = document.getElementById("dialog-notes");
  if (notesHidden) notesHidden.value = "";
  renderDialogNotesList();
  const grid = document.getElementById("dialog-photo-grid");
  if (grid) grid.innerHTML = `<p class="dialog-photo-empty">No photos yet.</p>`;
}

function setTaskDialogSubmitLabel(label) {
  const btn = document.getElementById("dialog-submit") || document.querySelector("#task-dialog-form button[type='submit']");
  if (btn) btn.textContent = label;
}

function setTaskDialogDeleteVisible(visible) {
  const btn = document.getElementById("dialog-delete");
  if (!btn) return;
  btn.classList.toggle("hidden", !visible);
}

function stripTaskBulletPrefix(line) {
  return line
    .replace(/^(?:[-*•·▪︎◦]|\d+[\.\)])\s+/, "")
    .replace(/^(?:todo|task)\s*[:\-–—]\s*/i, "")
    .trim();
}

function splitTaskSegment(segment) {
  const single = stripTaskBulletPrefix(segment.trim());
  if (!single) return [];

  let parts = null;
  if (/[•·▪︎◦]/.test(single)) {
    parts = single.split(/\s*[•·▪︎◦]\s*/);
  } else if (/(?:^|\s)\d+[\.\)]\s+\S/.test(single)) {
    parts = single.split(/(?:^|\s+)\d+[\.\)]\s+/);
  } else if (/;\s*/.test(single)) {
    parts = single.split(/\s*;\s*/);
  } else if (
    /\b(?:and then|and also|after that|then|also|plus)\b/i.test(single) ||
    /\bnext\b(?!\s+(?:week|month|year|time|day)\b)/i.test(single)
  ) {
    parts = single.split(
      /\s*(?:,\s*)?(?:\band\s+then\b|\band\s+also\b|\bafter\s+that\b|\bthen\b|\balso\b|\bplus\b|\bnext\b(?!\s+(?:week|month|year|time|day)\b))\s*[:,]?\s*/i
    );
  }

  if (!parts) return [single];
  const cleaned = parts
    .map((part) => stripTaskBulletPrefix(part.trim()))
    .filter((part) => part.length > 1);
  return cleaned.length > 1 ? cleaned : [single];
}

function parseTasksFromText(raw) {
  if (typeof raw !== "string") return [];
  const text = raw.replace(/\u00a0/g, " ").trim();
  if (!text) return [];

  // A blank line is always a hard task boundary. Single line breaks continue
  // to support pasted bullet and numbered lists.
  const lines = text
    .split(/\r?\n[ \t]*\r?\n+/)
    .flatMap((block) => block.split(/\r?\n/))
    .flatMap(splitTaskSegment)
    .filter(Boolean);

  const seen = new Set();
  const tasks = [];
  for (const line of lines) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (!normalized || normalized.length > 180) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push(normalized);
    if (tasks.length >= 20) break;
  }
  return tasks;
}

function isTaskDialogMultiAddMode() {
  if (getDialogCaptureMode() === "note") return false;
  const editId = document.getElementById("dialog-edit-id")?.value;
  const brainId = document.getElementById("dialog-brain-id")?.value;
  return !editId && !brainId;
}

function syncDialogParsePreview() {
  const hint = document.getElementById("dialog-parse-hint");
  const preview = document.getElementById("dialog-parse-preview");
  const input = document.getElementById("dialog-input");
  if (!hint || !preview || !input) return;

  if (!isTaskDialogMultiAddMode()) {
    hint.classList.add("hidden");
    preview.classList.add("hidden");
    preview.innerHTML = "";
    setTaskDialogSubmitLabel(document.getElementById("dialog-title")?.textContent === "Edit Task" ? "Save" : "Send");
    return;
  }

  const tasks = parseTasksFromText(input.value);
  if (tasks.length <= 1) {
    hint.classList.add("hidden");
    preview.classList.add("hidden");
    preview.innerHTML = "";
    setTaskDialogSubmitLabel("Save");
    return;
  }

  hint.classList.remove("hidden");
  hint.textContent = `Will add ${tasks.length} tasks to the selected list.`;
  preview.classList.remove("hidden");
  preview.innerHTML = tasks
    .map((text, index) => `<li><span class="dialog-parse-index">${index + 1}</span><span>${escapeHtml(text)}</span></li>`)
    .join("");
  setTaskDialogSubmitLabel(`Add ${tasks.length} tasks`);
}

function syncDialogRepeatFields() {
  const mode = document.getElementById("dialog-repeat")?.value || "none";
  const weekday = document.getElementById("dialog-repeat-weekday");
  const field = document.getElementById("dialog-schedule-field");
  const schedule = document.getElementById("dialog-schedule");
  const hint = document.getElementById("dialog-schedule-hint");
  if (weekday) weekday.classList.toggle("hidden", mode !== "weekly");
  const repeating = mode === "daily" || mode === "weekly";
  field?.classList.toggle("hidden", repeating);
  if (repeating && schedule) {
    schedule.value = "";
    dialogScheduleCalendarOpen = false;
  }
  if (hint) {
    hint.classList.toggle("hidden", !repeating);
    if (mode === "daily") {
      hint.textContent = "Shows on every day in Week view.";
    } else if (mode === "weekly") {
      hint.textContent = "Shows on that weekday in Week view.";
    }
  }
  if (!repeating) renderDialogSchedulePicker();
}

function ensureDialogScheduleWindowStart(selectedValue = "") {
  const selected = normalizeScheduledFor(selectedValue);
  if (selected) {
    dialogScheduleWindowStartKey = startOfWeekForDayKey(selected);
    return dialogScheduleWindowStartKey;
  }
  if (!dialogScheduleWindowStartKey) {
    dialogScheduleWindowStartKey = ensureWeeklyWindowStartKey();
  }
  return dialogScheduleWindowStartKey;
}

function getDialogScheduleDayKeys() {
  return getDayKeysRange(ensureDialogScheduleWindowStart(), WEEKLY_WINDOW_LEN);
}

function updateDialogScheduleSummary(selected) {
  const summary = document.getElementById("dialog-schedule-summary");
  if (!summary) return;
  summary.textContent = selected
    ? formatArchiveDayHeading(selected)
    : "Not tied to a specific day.";
}

function renderDialogSchedulePicker() {
  const schedule = document.getElementById("dialog-schedule");
  const strip = document.getElementById("dialog-schedule-strip");
  const anytime = document.getElementById("dialog-schedule-anytime");
  const calBtn = document.getElementById("dialog-schedule-cal-btn");
  const calendar = document.getElementById("dialog-schedule-calendar");
  if (!schedule || !strip) return;

  const selected = normalizeScheduledFor(schedule.value);
  ensureDialogScheduleWindowStart(selected || dialogScheduleWindowStartKey);
  const keys = getDialogScheduleDayKeys();

  anytime?.classList.toggle("is-active", !selected);
  anytime?.setAttribute("aria-pressed", !selected ? "true" : "false");

  strip.innerHTML = weeklyDayStripHtml(selected, keys);
  strip.querySelectorAll(".weekly-day-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      schedule.value = btn.dataset.weekDay || "";
      dialogScheduleCalendarOpen = false;
      renderDialogSchedulePicker();
    });
  });

  calBtn?.setAttribute("aria-expanded", dialogScheduleCalendarOpen ? "true" : "false");
  calBtn?.classList.toggle("is-active", dialogScheduleCalendarOpen);

  if (calendar) {
    if (dialogScheduleCalendarOpen) {
      const monthKey =
        dialogScheduleCalendarMonthKey ||
        monthKeyFromDayKey(selected || keys[0] || reflectionTodayKey());
      calendar.hidden = false;
      calendar.classList.remove("hidden");
      calendar.innerHTML = monthCalendarHtml({
        monthKey,
        selectedDayKey: selected,
        rangeStartKey: keys[0],
        rangeEndKey: keys[keys.length - 1],
        hint: "Tap a day to schedule this task.",
      });
      bindMonthCalendar(calendar, {
        onChangeMonth: (delta) => {
          dialogScheduleCalendarMonthKey = shiftMonthKey(
            dialogScheduleCalendarMonthKey || monthKey,
            delta
          );
          renderDialogSchedulePicker();
        },
        onSelectDay: (dayKey) => {
          schedule.value = dayKey;
          dialogScheduleWindowStartKey = startOfWeekForDayKey(dayKey);
          dialogScheduleCalendarMonthKey = monthKeyFromDayKey(dayKey);
          dialogScheduleCalendarOpen = false;
          renderDialogSchedulePicker();
        },
      });
    } else {
      calendar.hidden = true;
      calendar.classList.add("hidden");
      calendar.innerHTML = "";
    }
  }

  updateDialogScheduleSummary(selected);
  requestAnimationFrame(() =>
    scrollWeeklyStripToActive(document.getElementById("dialog-schedule-controls"))
  );
}

function setDialogScheduleField(task) {
  const schedule = document.getElementById("dialog-schedule");
  const defaultDay =
    weeklyView && weeklySelectedDayKey && weeklySelectedDayKey !== reflectionTodayKey()
      ? weeklySelectedDayKey
      : "";
  const value = task ? normalizeScheduledFor(task.scheduledFor) : defaultDay;
  if (schedule) schedule.value = value || "";
  dialogScheduleWindowStartKey = startOfWeekForDayKey(
    value || ensureWeeklyWindowStartKey()
  );
  dialogScheduleCalendarMonthKey = monthKeyFromDayKey(
    value || dialogScheduleWindowStartKey
  );
  dialogScheduleCalendarOpen = false;
  syncDialogRepeatFields();
  renderDialogSchedulePicker();
}

function getDialogScheduledFor() {
  return normalizeScheduledFor(document.getElementById("dialog-schedule")?.value);
}

function setDialogTier(tier) {
  const value = String(Math.min(4, Math.max(1, Number(tier) || 1)));
  const input = document.getElementById("dialog-tier-select");
  if (input) input.value = value;
  document.querySelectorAll(".dialog-tier-tag").forEach((btn) => {
    const active = btn.dataset.tier === value;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setupDialogTierPicker() {
  document.querySelectorAll(".dialog-tier-tag").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => setDialogTier(btn.dataset.tier));
  });
}

function setupDialogSchedulePicker() {
  const anytime = document.getElementById("dialog-schedule-anytime");
  const calBtn = document.getElementById("dialog-schedule-cal-btn");
  const schedule = document.getElementById("dialog-schedule");
  if (anytime && !anytime.dataset.bound) {
    anytime.dataset.bound = "1";
    anytime.addEventListener("click", () => {
      if (schedule) schedule.value = "";
      dialogScheduleCalendarOpen = false;
      renderDialogSchedulePicker();
    });
  }
  if (calBtn && !calBtn.dataset.bound) {
    calBtn.dataset.bound = "1";
    calBtn.addEventListener("click", () => {
      dialogScheduleCalendarOpen = !dialogScheduleCalendarOpen;
      if (dialogScheduleCalendarOpen) {
        dialogScheduleCalendarMonthKey = monthKeyFromDayKey(
          normalizeScheduledFor(schedule?.value) ||
            dialogScheduleWindowStartKey ||
            reflectionTodayKey()
        );
      }
      renderDialogSchedulePicker();
    });
  }
}

function setDialogRepeatFields(task) {
  const modeEl = document.getElementById("dialog-repeat");
  const weekdayEl = document.getElementById("dialog-repeat-weekday");
  if (!modeEl || !weekdayEl) return;
  if (task?.repeatDaily) modeEl.value = "daily";
  else if (task?.repeatWeekly) modeEl.value = "weekly";
  else modeEl.value = "none";
  weekdayEl.value = String(normalizeRepeatWeekday(task?.repeatWeekday));
  setDialogScheduleField(task);
}

function getDialogRepeatMode() {
  return document.getElementById("dialog-repeat")?.value || "none";
}

function getDialogRepeatWeekday() {
  return normalizeRepeatWeekday(document.getElementById("dialog-repeat-weekday")?.value);
}

function buildTaskFromDialogFields(baseTask) {
  return applyScheduledForToTask(
    applyRepeatModeToTask(baseTask, getDialogRepeatMode(), getDialogRepeatWeekday()),
    getDialogScheduledFor()
  );
}

async function openTaskDialog(tier = 1) {
  const dialog = document.getElementById("task-dialog");
  const defaultCtx = filter === "all" ? "work" : filter;

  clearDialogBrainFields();
  resetDialogMediaFields();
  setDialogCaptureMode("task", { showSwitcher: true, updateTitle: true, syncPreview: false });
  document.getElementById("dialog-title").textContent = "Add Task";
  document.getElementById("dialog-input").value = "";
  setDialogTier(tier);
  fillContextSelect(document.getElementById("dialog-context"), defaultCtx);
  document.getElementById("dialog-edit-id").value = "";
  document.getElementById("dialog-original-context").value = "";
  setDialogRepeatFields(null);
  setTaskDialogSubmitLabel("Save");
  setTaskDialogDeleteVisible(false);
  syncDialogParsePreview();

  dialog.showModal();
  document.getElementById("dialog-input").focus();
}

async function openEditTaskDialog(task, ctx) {
  const dialog = document.getElementById("task-dialog");

  clearDialogBrainFields();
  setDialogCaptureMode("task", { showSwitcher: false, updateTitle: false, syncPreview: false });
  dialogPhotoDraft = Array.isArray(task.photos) ? task.photos.map((p) => ({ ...p })) : [];
  dialogNoteEntries = getTaskNoteEntries(task).map((n) => ({ ...n }));
  dialogClaimedNoteIds = [];
  document.getElementById("dialog-title").textContent = "Edit Task";
  document.getElementById("dialog-input").value = task.text;
  setDialogTier(task.tier);
  fillContextSelect(document.getElementById("dialog-context"), ctx);
  document.getElementById("dialog-edit-id").value = task.id;
  document.getElementById("dialog-original-context").value = ctx;
  renderDialogNotesList();
  setDialogRepeatFields(task);
  setTaskDialogSubmitLabel("Save");
  setTaskDialogDeleteVisible(true);
  syncDialogParsePreview();
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
  setDialogCaptureMode("task", { showSwitcher: false, updateTitle: false, syncPreview: false });
  document.getElementById("dialog-title").textContent = "Send to Priority";
  document.getElementById("dialog-input").value = item.text;
  setDialogTier(1);
  fillContextSelect(document.getElementById("dialog-context"), ctx);
  document.getElementById("dialog-edit-id").value = "";
  document.getElementById("dialog-original-context").value = "";
  document.getElementById("dialog-brain-id").value = item.id;
  document.getElementById("dialog-brain-context").value = ctx;
  setDialogRepeatFields(null);
  setTaskDialogSubmitLabel("Send");
  setTaskDialogDeleteVisible(false);
  syncDialogParsePreview();

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
  recordDeletedId(id);
  saveBrainDump(
    ctx,
    items.filter((i) => i.id !== id)
  );
}

function saveTaskFromDialog() {
  if (getDialogCaptureMode() === "note") {
    const text = document.getElementById("dialog-input")?.value || "";
    if (!addStandaloneNote(text)) return false;
    return true;
  }

  const raw = document.getElementById("dialog-input").value;
  const tier = Number(document.getElementById("dialog-tier-select").value);
  const newCtx = document.getElementById("dialog-context").value;
  if (!isValidContext(newCtx)) return false;
  const editId = document.getElementById("dialog-edit-id").value;
  const oldCtx = document.getElementById("dialog-original-context").value;
  const brainId = document.getElementById("dialog-brain-id").value;
  const brainCtx = document.getElementById("dialog-brain-context").value;
  const noteEntries = dialogNoteEntries.map((n) => ({ ...n }));
  const photos = dialogPhotoDraft.map((p) => ({ ...p }));

  if (brainId) {
    const text = raw.trim();
    if (!text) return false;
    const created = buildTaskFromDialogFields(
      withTaskNotes({ id: createId(), text, tier, done: false, photos }, noteEntries)
    );
    saveTasks(newCtx, [...loadTasks(newCtx), created]);
    recordDeletedId(brainId);
    saveBrainDump(brainCtx, loadBrainDump(brainCtx).filter((i) => i.id !== brainId));
    clearDialogBrainFields();
    return true;
  }

  if (editId) {
    const text = raw.trim();
    if (!text) return false;
    const oldList = loadTasks(oldCtx);
    const task = oldList.find((t) => t.id === editId);
    if (!task) return false;

    const updated = buildTaskFromDialogFields(
      withTaskNotes({ ...task, text, tier, photos }, noteEntries)
    );

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
    return true;
  }

  const parsed = parseTasksFromText(raw);
  if (!parsed.length) return false;
  const created = parsed.map((text, index) =>
    buildTaskFromDialogFields(
      withTaskNotes(
        {
          id: createId(),
          text,
          tier,
          done: false,
          photos: index === 0 ? photos : [],
        },
        index === 0 ? noteEntries : []
      )
    )
  );
  saveTasks(newCtx, [...loadTasks(newCtx), ...created]);
  return true;
}

function setupTaskDialog() {
  const dialog = document.getElementById("task-dialog");
  const photoInput = document.getElementById("dialog-photo-input");
  const input = document.getElementById("dialog-input");

  setupDialogNotes();
  setupDialogTierPicker();
  setupDialogSchedulePicker();

  document.getElementById("add-task-btn").addEventListener("click", () => openTaskDialog(1));

  document.querySelectorAll(".column-add").forEach((btn) => {
    btn.addEventListener("click", () => openTaskDialog(Number(btn.dataset.tier)));
  });

  document.querySelectorAll(".column-see-all").forEach((btn) => {
    btn.addEventListener("click", () => openTierExpand(Number(btn.dataset.tier)));
  });

  const modeSwitch = document.getElementById("dialog-mode-switch");
  if (modeSwitch && !modeSwitch.dataset.bound) {
    modeSwitch.dataset.bound = "1";
    modeSwitch.addEventListener("click", (e) => {
      const btn = e.target.closest(".dialog-mode-btn");
      if (!btn || !modeSwitch.contains(btn)) return;
      setDialogCaptureMode(btn.dataset.mode, { showSwitcher: true });
      document.getElementById("dialog-input")?.focus();
    });
  }

  document.getElementById("dialog-cancel").addEventListener("click", () => {
    clearDialogBrainFields();
    resetDialogMediaFields();
    setDialogCaptureMode("task", { showSwitcher: false, updateTitle: false, syncPreview: false });
    setTaskDialogDeleteVisible(false);
    dialog.close();
  });

  document.getElementById("dialog-delete")?.addEventListener("click", () => {
    const id = document.getElementById("dialog-edit-id")?.value;
    const ctx = document.getElementById("dialog-original-context")?.value;
    if (!id || !ctx) return;
    if (!confirmDeleteTask(id, ctx)) return;
    clearDialogBrainFields();
    resetDialogMediaFields();
    setTaskDialogDeleteVisible(false);
    dialog.close();
  });

  dialog.addEventListener("close", () => {
    clearDialogBrainFields();
    resetDialogMediaFields();
    setDialogCaptureMode("task", { showSwitcher: false, updateTitle: false, syncPreview: false });
    setTaskDialogSubmitLabel("Save");
    setTaskDialogDeleteVisible(false);
    syncDialogParsePreview();
  });

  input?.addEventListener("input", syncDialogParsePreview);

  document.getElementById("dialog-repeat")?.addEventListener("change", syncDialogRepeatFields);

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
    if (!saveTaskFromDialog()) return;
    consumeClaimedDialogNotes();
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
  const ctxField = ctxSelect?.closest(".dialog-list-field");
  if (ctxField) ctxField.classList.toggle("hidden", filter !== "all");

  const tasks = getRepeatDailyTasks();

  if (tasks.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
  } else {
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

  renderWeeklyRepeatPanel();
}

function renderWeeklyRepeatPanel() {
  const list = document.getElementById("weekly-repeat-list");
  const empty = document.getElementById("weekly-repeat-empty");
  if (!list || !empty) return;

  const ctxSelect = document.getElementById("weekly-repeat-context");
  if (ctxSelect) {
    ctxSelect.classList.toggle("hidden", filter !== "all");
    if (filter !== "all") ctxSelect.value = filter;
  }
  const ctxField = ctxSelect?.closest(".dialog-list-field");
  if (ctxField) ctxField.classList.toggle("hidden", filter !== "all");

  const weekdaySelect = document.getElementById("weekly-repeat-weekday");
  if (weekdaySelect && !weekdaySelect.dataset.initialized) {
    weekdaySelect.value = String(new Date().getDay());
    weekdaySelect.dataset.initialized = "1";
  }

  const tasks = getRepeatWeeklyTasks().sort(
    (a, b) =>
      normalizeRepeatWeekday(a.repeatWeekday) - normalizeRepeatWeekday(b.repeatWeekday) ||
      a.tier - b.tier ||
      a.text.localeCompare(b.text)
  );

  if (tasks.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = tasks
    .map((task) => {
      const day = normalizeRepeatWeekday(task.repeatWeekday);
      return `
    <li class="daily-repeat-item" data-id="${task.id}" data-context="${task.context}">
      <span class="daily-repeat-tier">${TIER_LABELS[task.tier - 1]}</span>
      <span class="daily-repeat-day">${WEEKDAY_SHORT[day]}</span>
      <span class="daily-repeat-text">${escapeHtml(task.text)}</span>
      <div class="daily-repeat-actions">
        ${filter === "all" ? contextIconHtml(task.context, "brain-ctx-tag") : ""}
        <button type="button" class="daily-repeat-remove" aria-label="Remove from weekly repeat">×</button>
      </div>
    </li>`;
    })
    .join("");

  list.querySelectorAll(".daily-repeat-remove").forEach((btn) => {
    const item = btn.closest(".daily-repeat-item");
    btn.addEventListener("click", () => {
      removeRepeatWeeklyTask(item.dataset.id, item.dataset.context);
      renderAll();
    });
  });
}

function setupDailyRepeatForm() {
  const form = document.getElementById("daily-repeat-form");
  if (form && !form.dataset.bound) {
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

  const weeklyForm = document.getElementById("weekly-repeat-form");
  if (weeklyForm && !weeklyForm.dataset.bound) {
    weeklyForm.dataset.bound = "1";
    const weekdaySelect = document.getElementById("weekly-repeat-weekday");
    if (weekdaySelect && !weekdaySelect.dataset.initialized) {
      weekdaySelect.value = String(new Date().getDay());
      weekdaySelect.dataset.initialized = "1";
    }
    weeklyForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("weekly-repeat-input");
      const tier = Number(document.getElementById("weekly-repeat-tier").value);
      const weekday = Number(document.getElementById("weekly-repeat-weekday").value);
      const ctxSelect = document.getElementById("weekly-repeat-context");
      const ctx = ctxSelect ? ctxSelect.value : filter === "all" ? "work" : filter;
      addRepeatWeeklyTask(input.value, tier, ctx, weekday);
      input.value = "";
      input.focus();
      renderAll();
    });
  }
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
      recordDeletedId(id);
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
      <span class="plan-card-task-meta history-wins-meta">
        ${taskAttachmentIndicatorHtml(task)}
        ${contextIconHtml(task.context, "plan-card-task-ctx")}
        ${restoreBtn}
      </span>
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

function historyAnxietyItemHtml(item) {
  const when = formatArchiveDayHeading(archiveDayKey(item.archivedAt || item.createdAt));
  const reasonLabel = item.reason === "tossed" ? "Tossed" : "Checked off";
  return `
    <li class="history-anxiety-item" data-anxiety-history-id="${escapeHtml(item.id)}">
      <div class="history-anxiety-copy">
        <p class="history-anxiety-meta">${escapeHtml(when)} · ${escapeHtml(reasonLabel)}</p>
        <p class="history-anxiety-text">${escapeHtml(item.text)}</p>
      </div>
      <button
        type="button"
        class="history-anxiety-delete"
        aria-label="Delete permanently"
        title="Delete permanently"
      >
        <svg class="icon" aria-hidden="true"><use href="#icon-trash"></use></svg>
      </button>
    </li>`;
}

function historyAnxietyCardHtml(history) {
  if (!history.length) return "";
  return `
    <article class="plan-card history-anxiety-card" aria-labelledby="history-anxiety-heading">
      <div class="plan-card-inner">
        <div class="completed-wins-card-header">
          <div class="completed-wins-card-heading">
            <h3 class="plan-card-title plan-card-title--featured" id="history-anxiety-heading">Past anxiety thoughts</h3>
            <p class="plan-card-subtitle">${history.length} checked off or tossed</p>
          </div>
        </div>
        <ul class="history-anxiety-list">
          ${history.map(historyAnxietyItemHtml).join("")}
        </ul>
      </div>
    </article>`;
}

function historyNoteItemHtml(note, taskOptionsHtml, hasTasks) {
  const when = formatNoteTimestamp(note.createdAt);
  const linked = note.source === "task";
  return `
    <li class="history-note-item${linked ? " history-note-item--linked" : ""}" data-note-id="${escapeHtml(note.id)}"${
      linked
        ? ` data-task-id="${escapeHtml(note.taskId)}" data-context="${escapeHtml(note.context)}"`
        : ""
    }>
      <div class="history-note-copy">
        <p class="history-note-text">${escapeHtml(note.text)}</p>
        ${when ? `<p class="history-note-meta">${escapeHtml(when)}</p>` : ""}
        ${
          linked
            ? `<button type="button" class="history-note-task-link">On “${escapeHtml(
                truncateReflectionLabel(note.taskText || "task", 42)
              )}”</button>`
            : hasTasks
              ? `<div class="history-note-attach-row">
          <select class="history-note-attach" aria-label="Attach to a task">
            ${taskOptionsHtml}
          </select>
          <button type="button" class="history-note-attach-btn">Attach</button>
        </div>`
              : `<p class="history-note-attach-empty">Add a task to attach this note.</p>`
        }
      </div>
      <button
        type="button"
        class="history-note-delete"
        aria-label="Delete note"
        title="Delete note"
      >
        <svg class="icon" aria-hidden="true"><use href="#icon-trash"></use></svg>
      </button>
    </li>`;
}

function historyNotesCardHtml(notes) {
  if (!notes.length) return "";
  const openTasks = getOpenTasksForNoteLink();
  const taskOptionsHtml = notesPanelTaskOptionsHtml("");
  const linkedCount = notes.filter((note) => note.source === "task").length;
  const subtitle = linkedCount
    ? `${notes.length} note${notes.length === 1 ? "" : "s"} · ${linkedCount} on tasks`
    : `${notes.length} note${notes.length === 1 ? "" : "s"}`;
  return `
    <article class="plan-card history-notes-card" aria-labelledby="history-notes-heading">
      <div class="plan-card-inner">
        <div class="completed-wins-card-header">
          <div class="completed-wins-card-heading">
            <h3 class="plan-card-title plan-card-title--featured" id="history-notes-heading">Notes</h3>
            <p class="plan-card-subtitle">${subtitle}</p>
          </div>
        </div>
        <ul class="history-notes-list">
          ${notes.map((note) => historyNoteItemHtml(note, taskOptionsHtml, openTasks.length > 0)).join("")}
        </ul>
      </div>
    </article>`;
}

function bindHistoryNotesCard(root) {
  if (!root) return;
  root.querySelectorAll(".history-note-item").forEach((el) => {
    const noteId = el.dataset.noteId;
    const taskId = el.dataset.taskId;
    const context = el.dataset.context;
    el.querySelector(".history-note-delete")?.addEventListener("click", () => {
      if (taskId && context) {
        deleteTaskNote(taskId, context, noteId);
      } else {
        deleteStandaloneNote(noteId);
      }
      renderAll();
    });
    el.querySelector(".history-note-task-link")?.addEventListener("click", () => {
      const task = loadTasks(context).find((t) => t.id === taskId);
      if (task) openEditTaskDialog(task, context);
    });
    el.querySelector(".history-note-attach-btn")?.addEventListener("click", () => {
      const select = el.querySelector(".history-note-attach");
      const [targetContext, targetTaskId] = (select?.value || "").split(":");
      if (!targetContext || !targetTaskId) return;
      linkStandaloneNoteToTask(noteId, targetTaskId, targetContext);
      renderAll();
    });
  });
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
  const notes = collectAllNotesForPanel();

  if (subtitle) {
    const startedLabel = formatArchiveDayHeading(startedDay);
    const taskPart =
      tasks.length === 0
        ? `Completed tasks since ${startedLabel} will appear here`
        : `${tasks.length} completed task${tasks.length === 1 ? "" : "s"} since ${startedLabel}`;
    const notePart =
      notes.length === 0
        ? ""
        : ` · ${notes.length} note${notes.length === 1 ? "" : "s"}`;
    subtitle.textContent = `${taskPart}${notePart}.`;
  }

  if (tasks.length === 0 && notes.length === 0) {
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

  const winsHtml = sortedKeys
    .map((dayKey) => historyDayCardHtml(dayKey, groups.get(dayKey)))
    .join("");
  content.innerHTML = `${historyNotesCardHtml(notes)}${winsHtml}`;
  bindHistoryNotesCard(content);

  content.querySelectorAll(".history-wins-item").forEach((row) => {
    bindAttachmentIndicator(row, row.dataset.id, row.dataset.context);
  });

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
      confirmDeleteTask(id, ctx);
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
    renderNotesPanel();
    renderDailyRepeatPanel();
    renderForgetItPanel();
    renderArchivePanel();
    syncSidebarTabs();
  }
  if (expandedTier && document.getElementById("tier-expand-dialog")?.open) {
    refreshTierExpand(expandedTier);
  }
  const reflectionDialog = document.getElementById("reflection-dialog");
  if (reflectionDialog?.open) {
    renderReflectionAnxietyBox();
  }
  renderFocusTimerChrome();
  renderNotifyPanel();
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
setupDailyMaintenance();
ensureAppStartedDay();

document.documentElement.dataset.font = getFont();
applyTheme();

setupDateHeader();
setupDisplayName();
setupProfileAvatar();
setupThemePicker();
setupTimePreviewPicker();
setupThemeSchedule();
setupFontPicker();
setupHomeDesignPicker();
setupNavigation();
setupListsManager();
setupSettingsPreferences();
setupAnxietyBox();
setupScribbleCaptureGesture();
setupDropZones();
setupTouchListDrag();
setupSidebarTabs();
setSidebarCollapsed(getSidebarCollapsed());
setupTaskDialog();
setupMediaViewer();
setupBrainDumpForms();
setupNotesPanel();
setupDailyRepeatForm();
setupDataSync();
setupTierExpand();
setupReflection();
setupMode135();
setupForgetIt();
setupPriorityVisibilityTags();
setupHomeCategoryTags();
setupBottomChromeObserver();
setupNotifyPanel();
syncThoughtsBellAnimation();
updateBoardHint();
rebuildContextUi();

setPage(page, filter);
syncBottomChrome();
