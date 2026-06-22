const THEME_KEY = "priority-grid-theme";
const FONT_KEY = "priority-grid-font";
const CONTEXT_KEY = "priority-grid-context";
const VIEW_KEY = "priority-grid-view";
const LEGACY_TASKS_KEY = "priority-grid-tasks";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const CONTEXTS = ["work", "home"];

const THEMES = [
  { id: "calm-neutral", name: "Calm Neutral", colors: ["#FAFBF5", "#F2EEE9", "#A89F93", "#7D9186", "#3E3E3E"] },
  { id: "soft-sage", name: "Soft Sage", colors: ["#F4F7F2", "#E9F0E6", "#A8C0A3", "#6E8F7A", "#334236"] },
  { id: "warm-minimal", name: "Warm Minimal", colors: ["#FFFAF6", "#F6EFE9", "#D6B397", "#C46A4A", "#3B2F2A"] },
  { id: "zen-blue", name: "Zen Blue", colors: ["#F2F6FA", "#E6EEF5", "#9EB8D1", "#4C6A88", "#2D3748"] },
  { id: "earthy-clay", name: "Earthy Clay", colors: ["#F7F3EF", "#ECE4DA", "#C09A7B", "#7A8A74", "#3B342E"] },
  { id: "soft-lavender", name: "Soft Lavender", colors: ["#F6F4FA", "#EDE9F5", "#B7A7C9", "#7E6B91", "#3A3347"] },
  { id: "pure-white", name: "Pure White", colors: ["#FFFFFF", "#F7F7F8", "#222222", "#A6A6A6", "#333333"] },
  { id: "dusty-rose", name: "Dusty Rose", colors: ["#FFFBFA", "#FCE9E7", "#C67C7C", "#E2B4AC", "#5A444A"] },
  { id: "mindful-greige", name: "Mindful Greige", colors: ["#F6F4F1", "#EDEAE4", "#6D657A", "#C4BBA6", "#3E3A38"] },
  { id: "ocean-breeze", name: "Ocean Breeze", colors: ["#F0F7FA", "#E6F0F3", "#5D8FA6", "#9CC0D8", "#2C3E46"] },
  { id: "sunlit-sand", name: "Sunlit Sand", colors: ["#FFFAF2", "#F7EFE1", "#D4B063", "#E9D9AB", "#5B4D35"] },
  { id: "forest-mist", name: "Forest Mist", colors: ["#F2F7F3", "#E4ECE6", "#3D5A47", "#A8C5AD", "#2F3D32"] },
  { id: "terra-cotta", name: "Terra Cotta", colors: ["#FFF3EF", "#F7E4DD", "#C15A3D", "#E7A28B", "#5A4036"] },
  { id: "storm-grey", name: "Storm Grey", colors: ["#F0F1F3", "#E3E5E8", "#4A4F55", "#7B828C", "#212427"] },
  { id: "blush-clay", name: "Blush Clay", colors: ["#FFF5F4", "#F4E7E4", "#B97A6E", "#DDB2A7", "#533F3A"] },
  { id: "clear-sky", name: "Clear Sky", colors: ["#F3F8FF", "#EAF2FB", "#6FA8DC", "#B9D7EF", "#1F2D3D"] },
];

const FONTS = [
  { id: "pairing-1", name: "Noto Serif + Inter", heading: "Noto Serif", body: "Inter" },
  { id: "pairing-2", name: "Cormorant + Lato", heading: "Cormorant Garamond", body: "Lato" },
  { id: "pairing-3", name: "Playfair + Nunito Sans", heading: "Playfair Display", body: "Nunito Sans" },
  { id: "pairing-4", name: "DM Serif + Source Sans", heading: "DM Serif Display", body: "Source Sans 3" },
  { id: "pairing-5", name: "Libre Baskerville + Work Sans", heading: "Libre Baskerville", body: "Work Sans" },
];

let context = getContext();
let view = getView();
let tasks = loadTasks(context);
let brainDump = loadBrainDump(context);
let draggedId = null;

function tasksKey(ctx) {
  return `priority-grid-tasks-${ctx}`;
}

function brainDumpKey(ctx) {
  return `priority-grid-brain-dump-${ctx}`;
}

function migrateLegacyData() {
  try {
    const legacy = localStorage.getItem(LEGACY_TASKS_KEY);
    if (!legacy) return;
    if (!localStorage.getItem(tasksKey("home"))) {
      localStorage.setItem(tasksKey("home"), legacy);
    }
    localStorage.removeItem(LEGACY_TASKS_KEY);
  } catch {
    /* ignore */
  }
}

function loadTasks(ctx = context) {
  try {
    const saved = localStorage.getItem(tasksKey(ctx));
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
}

function saveTasks() {
  localStorage.setItem(tasksKey(context), JSON.stringify(tasks));
}

function loadBrainDump(ctx = context) {
  try {
    const saved = localStorage.getItem(brainDumpKey(ctx));
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
}

function saveBrainDump() {
  localStorage.setItem(brainDumpKey(context), JSON.stringify(brainDump));
}

function createId() {
  return crypto.randomUUID();
}

function getContext() {
  try {
    const saved = localStorage.getItem(CONTEXT_KEY);
    if (saved && CONTEXTS.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "home";
}

function getView() {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "grid" || saved === "brain-dump") return saved;
  } catch {
    /* ignore */
  }
  return "grid";
}

function getTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "calm-neutral";
}

function getFont() {
  try {
    const saved = localStorage.getItem(FONT_KEY);
    if (saved && FONTS.some((f) => f.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "pairing-1";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function setupDateHeader() {
  const now = new Date();
  document.getElementById("date-label").textContent = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  document.getElementById("weekdays").innerHTML = WEEKDAYS.map((day, i) => {
    const isToday = i === now.getDay();
    return `<span class="weekday${isToday ? " today" : ""}">${day}</span>`;
  }).join("");
}

function updateSubtitle() {
  const subtitle = document.getElementById("subtitle");
  const label = context === "work" ? "Work" : "Home";

  if (view === "brain-dump") {
    subtitle.textContent = `${label} — capture everything on your mind before prioritizing`;
  } else {
    subtitle.textContent = `${label} — drag tasks between tiers as priorities shift`;
  }
}

function setView(nextView) {
  view = nextView;
  localStorage.setItem(VIEW_KEY, view);

  document.querySelectorAll(".view-tab").forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });

  document.getElementById("grid-view").classList.toggle("hidden", view !== "grid");
  document.getElementById("brain-dump-view").classList.toggle("hidden", view !== "brain-dump");

  updateSubtitle();
}

function setContext(nextContext) {
  saveTasks();
  saveBrainDump();

  context = nextContext;
  localStorage.setItem(CONTEXT_KEY, context);

  tasks = loadTasks(context);
  brainDump = loadBrainDump(context);

  document.querySelectorAll(".context-tab").forEach((tab) => {
    const isActive = tab.dataset.context === context;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });

  updateSubtitle();
  renderGrid();
  renderBrainDump();
}

function setupContextTabs() {
  document.querySelectorAll(".context-tab").forEach((tab) => {
    tab.addEventListener("click", () => setContext(tab.dataset.context));
  });
}

function setupViewTabs() {
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });
  setView(view);
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
    <button
      type="button"
      class="theme-option${theme.id === current ? " active" : ""}"
      data-theme="${theme.id}"
      role="radio"
      aria-checked="${theme.id === current}"
      aria-label="${theme.name} theme"
    >
      <span class="theme-name">${theme.name}</span>
      <span class="theme-swatches">
        ${theme.colors.map((c) => `<span class="theme-swatch" style="background:${c}"></span>`).join("")}
      </span>
    </button>
  `
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
    <button
      type="button"
      class="font-option${font.id === current ? " active" : ""}"
      data-font="${font.id}"
      role="radio"
      aria-checked="${font.id === current}"
      aria-label="${font.name}"
      style="font-family: '${font.body}', sans-serif"
    >
      <span class="font-option-name" style="font-family: '${font.heading}', serif">${font.name}</span>
      <span class="font-option-sample" style="font-family: '${font.heading}', serif">Aa Bb Cc</span>
    </button>
  `
  ).join("");

  picker.querySelectorAll(".font-option").forEach((btn) => {
    btn.addEventListener("click", () => setFont(btn.dataset.font));
  });
}

function getTasksForTier(tier) {
  return tasks.filter((t) => t.tier === tier);
}

function moveTask(id, tier, beforeId = null) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  tasks = tasks.filter((t) => t.id !== id);
  task.tier = tier;

  const tierTasks = tasks.filter((t) => t.tier === tier);
  if (beforeId) {
    const insertAt = tasks.findIndex((t) => t.id === beforeId);
    tasks.splice(insertAt, 0, task);
  } else {
    const lastInTier = tierTasks.length
      ? tasks.findIndex((t) => t.id === tierTasks[tierTasks.length - 1].id)
      : -1;
    tasks.splice(lastInTier + 1, 0, task);
  }
}

function renderGrid() {
  for (let tier = 1; tier <= 4; tier++) {
    const list = document.querySelector(`.task-list[data-tier="${tier}"]`);
    const tierTasks = getTasksForTier(tier);

    list.innerHTML = tierTasks
      .map(
        (task) => `
      <li
        class="task-item${task.done ? " done" : ""}"
        draggable="true"
        data-id="${task.id}"
      >
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark complete" />
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="delete-btn" type="button" aria-label="Delete task">×</button>
      </li>
    `
      )
      .join("");

    list.querySelectorAll(".task-item").forEach(bindTaskEvents);
  }
}

function bindTaskEvents(item) {
  const id = item.dataset.id;

  item.addEventListener("dragstart", (e) => {
    draggedId = id;
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  });

  item.addEventListener("dragover", (e) => {
    if (!draggedId || draggedId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  item.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dragged = e.dataTransfer.getData("text/plain") || draggedId;
    if (!dragged || dragged === id) return;

    const tier = Number(item.closest(".quadrant").dataset.tier);
    moveTask(dragged, tier, id);
    saveTasks();
    renderGrid();
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    draggedId = null;
    document.querySelectorAll(".quadrant.drag-over").forEach((q) => {
      q.classList.remove("drag-over");
    });
  });

  item.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.done = e.target.checked;
      saveTasks();
      renderGrid();
    }
  });

  item.querySelector(".delete-btn").addEventListener("click", () => {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderGrid();
  });
}

function setupDropZones() {
  document.querySelectorAll(".quadrant").forEach((quadrant) => {
    const tier = Number(quadrant.dataset.tier);

    quadrant.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      quadrant.classList.add("drag-over");
    });

    quadrant.addEventListener("dragleave", (e) => {
      if (!quadrant.contains(e.relatedTarget)) {
        quadrant.classList.remove("drag-over");
      }
    });

    quadrant.addEventListener("drop", (e) => {
      if (e.target.closest(".task-item")) return;
      e.preventDefault();
      quadrant.classList.remove("drag-over");

      const id = e.dataTransfer.getData("text/plain") || draggedId;
      if (!id) return;

      moveTask(id, tier);
      saveTasks();
      renderGrid();
    });
  });
}

function setupAddForms() {
  document.querySelectorAll(".add-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const text = input.value.trim();
      if (!text) return;

      const tier = Number(form.dataset.tier);
      tasks.push({ id: createId(), text, tier, done: false });
      saveTasks();
      input.value = "";
      renderGrid();
      input.focus();
    });
  });
}

function renderBrainDump() {
  const list = document.getElementById("brain-dump-list");
  const empty = document.getElementById("brain-dump-empty");

  list.innerHTML = brainDump
    .map(
      (item) => `
    <li class="brain-dump-item" data-id="${item.id}">
      <span class="brain-dump-text">${escapeHtml(item.text)}</span>
      <div class="brain-dump-actions">
        ${[1, 2, 3, 4]
          .map(
            (tier) =>
              `<button type="button" class="tier-send-btn" data-tier="${tier}" aria-label="Send to ${tier === 1 ? "1st" : tier === 2 ? "2nd" : tier === 3 ? "3rd" : "4th"} priority">${tier === 1 ? "1st" : tier === 2 ? "2nd" : tier === 3 ? "3rd" : "4th"}</button>`
          )
          .join("")}
        <button type="button" class="brain-dump-delete" aria-label="Delete">×</button>
      </div>
    </li>
  `
    )
    .join("");

  empty.classList.toggle("hidden", brainDump.length > 0);

  list.querySelectorAll(".brain-dump-item").forEach((el) => {
    const id = el.dataset.id;

    el.querySelectorAll(".tier-send-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = brainDump.find((i) => i.id === id);
        if (!item) return;

        const tier = Number(btn.dataset.tier);
        tasks.push({ id: createId(), text: item.text, tier, done: false });
        brainDump = brainDump.filter((i) => i.id !== id);

        saveTasks();
        saveBrainDump();
        renderGrid();
        renderBrainDump();
      });
    });

    el.querySelector(".brain-dump-delete").addEventListener("click", () => {
      brainDump = brainDump.filter((i) => i.id !== id);
      saveBrainDump();
      renderBrainDump();
    });
  });
}

function setupBrainDumpForm() {
  const form = document.getElementById("brain-dump-form");
  const input = document.getElementById("brain-dump-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addBrainDumpItems(input.value);
    input.value = "";
    input.focus();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBrainDumpItems(input.value);
      input.value = "";
    }
  });
}

function addBrainDumpItems(raw) {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return;

  lines.forEach((text) => {
    brainDump.push({ id: createId(), text });
  });

  saveBrainDump();
  renderBrainDump();
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

  const seeded = seed.map((t) => ({ ...t, id: createId() }));
  localStorage.setItem(tasksKey("home"), JSON.stringify(seeded));

  if (context === "home") {
    tasks = seeded;
  }
}

migrateLegacyData();
seedHomeFromNotebook();

setupDateHeader();
setupThemePicker();
setupFontPicker();
setupContextTabs();
setupViewTabs();
setupDropZones();
setupAddForms();
setupBrainDumpForm();

document.querySelectorAll(".context-tab").forEach((tab) => {
  tab.classList.toggle("active", tab.dataset.context === context);
  tab.setAttribute("aria-selected", tab.dataset.context === context);
});

updateSubtitle();
renderGrid();
renderBrainDump();
