import { $ } from "../core/dom.js";

const panelIds = ["mapSettings", "favoriteRail", "diagramTools"];

export function closeMapPanels() {
  for (const id of panelIds.slice(0, 2)) {
    const panel = $("#" + id);
    if (panel?.matches(":popover-open")) panel.hidePopover();
  }
}

export function configureMapPanels(tree) {
  const panel = $("#mapSettings");
  const wasTree = panel.hasAttribute("popover");
  if (tree !== wasTree) $(".map-overview").open = !tree;
  if (tree) panel.setAttribute("popover", "auto");
  else {
    closeMapPanels();
    panel.removeAttribute("popover");
  }
}

/** Position top-layer panels without changing the graph's viewport or camera. */
export function positionMapPanel(panel) {
  const editing = panel.id === "diagramTools";
  const anchor = $(editing ? "#canvasWrap" : `[popovertarget="${panel.id}"]`);
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const margin = 8;
  const inspector = $("#inspector").getBoundingClientRect();
  const docked =
    editing &&
    innerWidth > 1050 &&
    inspector.width &&
    inspector.left >= rect.right - 1;
  const width = Math.min(
    editing
      ? docked
        ? inspector.width - 16
        : 420
      : panel.id === "favoriteRail"
        ? 360
        : 560,
    innerWidth - margin * 2,
  );
  const top = Math.min(
    (docked ? inspector.top : rect[editing ? "top" : "bottom"]) + margin,
    Math.max(margin, innerHeight - 160),
  );
  const left = docked
    ? inspector.left + margin
    : Math.max(
        margin,
        Math.min(rect.right - width, innerWidth - width - margin),
      );
  Object.assign(panel.style, {
    width: width + "px",
    left: left + "px",
    top: top + "px",
    maxHeight:
      (editing && !docked
        ? Math.min(240, innerHeight * 0.32)
        : Math.max(80, innerHeight - top - margin)) + "px",
  });
}

export function bindMapPanelEvents() {
  for (const id of panelIds) {
    const panel = $("#" + id);
    panel.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") {
        if (innerWidth <= 1050) $("#inspector").classList.remove("open");
        positionMapPanel(panel);
      }
    });
    panel.addEventListener("toggle", (event) => {
      const trigger = $(`[popovertarget="${id}"]:not([popovertargetaction])`);
      trigger?.setAttribute("aria-expanded", String(event.newState === "open"));
      trigger?.classList.toggle("active", event.newState === "open");
    });
  }
  window.addEventListener("resize", () => {
    for (const id of panelIds) {
      const panel = $("#" + id);
      if (panel.matches(":popover-open")) positionMapPanel(panel);
    }
  });
}
