import { positionMapPanel } from "./map-panels.js";
import { layoutControls } from "./layout-controls.js";
import { diagramSelectionItems } from "./diagram-selection.js";
import { placementLockControls } from "./placement-lock-controls.js";
import { connectorPlacementLocked } from "../model/placement-locks.js";
import { $, esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { diagramRoute } from "../model/diagram.js";
import { graphView } from "../model/graph-view.js";
import { icon } from "./icons.js";

export function renderDiagramTools() {
  const host = $("#diagramTools");
  if (!host) return;
  host.hidden =
    !state.diagramEditing || !state.diagramPanelOpen || state.view !== "tree";
  document.body.classList.toggle(
    "diagram-editing",
    state.diagramEditing && state.view === "tree",
  );
  $("#graph")?.classList.toggle("placing-waypoint", state.diagramAddPoint);
  if (host.hidden) {
    if (host.matches(":popover-open")) host.hidePopover();
    host.replaceChildren();
    return;
  }
  const gridOpen = !!host.querySelector(".diagram-grid-settings[open]"),
    layoutOpen = !!host.querySelector(".diagram-layout-settings[open]");
  const key = state.diagramConnectionKey,
    cfg = graphView(),
    route = diagramRoute(state.project, key),
    locked = connectorPlacementLocked(state.project, key),
    line = !state.selectionMode && key && !key.startsWith("g:"),
    label = $('#graph [data-route-label="' + key + '"]'),
    connection = $('#graph [data-connector="' + key + '"][data-from-node]'),
    count = diagramSelectionItems().length;
  host.innerHTML = `<div class="diagram-tools-row"><b>${t("ui.diagramEditing")}</b><span class="selection-count">${t("ui.selectedDiagramItems", { count })}</span><button class="btn small ghost" data-action="clear-selection" ${!count ? "disabled" : ""}>${t("ui.clear")}</button><button class="btn small ghost" data-action="diagram-tools">${t("ui.finishDiagramEditing")}</button><button class="iconbtn" data-action="minimize-diagram" aria-label="${t("ui.minimizeTools")}" title="${t("ui.minimizeTools")}">${icon("panelClose")}</button></div><p class="diagram-caption">${esc(state.selectionMode ? t("ui.selectedDiagramItems", { count }) : connection?.dataset.connectorCaption || label?.querySelector("title")?.textContent || t("ui.selectDiagramLine"))}</p><details class="diagram-layout-settings" ${layoutOpen ? "open" : ""}><summary>${t("ui.mapLayout")}</summary>${layoutControls()}</details><div class="diagram-tools-row diagram-route-controls">${line ? `<select data-diagram-style ${locked ? "disabled" : ""} aria-label="${t("ui.routeStyle")}">${["auto", "orthogonal", "polyline"].map((style) => `<option value="${style}" ${style === route.style ? "selected" : ""}>${t({ auto: "ui.routeAuto", orthogonal: "ui.routeOrthogonal", polyline: "ui.routePolyline" }[style])}</option>`).join("")}</select><button class="btn small ${state.diagramAddPoint ? "active" : ""}" data-action="diagram-add-point" ${locked ? "disabled" : ""}>${icon("plus")}${t(state.diagramAddPoint ? "ui.cancelRoutePoint" : "ui.addRoutePoint")}</button><button class="btn small" data-action="diagram-remove-point" ${locked || state.diagramPointIndex < 0 ? "disabled" : ""}>${icon("trash")}${t("ui.diagramRemovePoint")}</button><button class="btn small" data-action="diagram-reset-route" ${locked || (route.style === "auto" && !route.points.length) ? "disabled" : ""}>${t("ui.resetRoute")}</button>` : ""}${!state.selectionMode || state.diagramLabelSelection.size ? `<button class="btn small" data-action="diagram-reset-label" ${![...state.diagramLabelSelection].some((key) => diagramRoute(state.project, key).label && !connectorPlacementLocked(state.project, key)) ? "disabled" : ""}>${t("ui.resetDiagramLabel")}</button>` : ""}<select data-diagram-align aria-label="${t("ui.diagramAlignment")}" ${!count ? "disabled" : ""}><option value="">${t("ui.diagramAlignment")}</option>${["left", "centerX", "right", "top", "centerY", "bottom", "distributeX", "distributeY", "grid"].map((mode) => `<option value="${mode}" ${mode === "grid" ? "" : count < (mode.startsWith("distribute") ? 3 : 2) ? "disabled" : ""}>${t({ left: "ui.alignLeft", centerX: "ui.alignCenterX", right: "ui.alignRight", top: "ui.alignTop", centerY: "ui.alignCenterY", bottom: "ui.alignBottom", distributeX: "ui.distributeX", distributeY: "ui.distributeY", grid: "ui.snapSelected" }[mode])}</option>`).join("")}</select>${state.selectionMode ? "" : `<small>${t("ui.selectedDiagramItems", { count })}</small>`}</div>${placementLockControls()}<details class="diagram-grid-settings" ${gridOpen ? "open" : ""}><summary>${t("ui.gridSettings")}</summary><div class="diagram-tools-row"><label><input type="checkbox" data-diagram-setting="showGrid" ${cfg.showGrid ? "checked" : ""}>${t("ui.diagramGrid")}</label><label><input type="checkbox" data-diagram-setting="snapToGrid" ${cfg.snapToGrid ? "checked" : ""}>${t("ui.diagramSnap")}</label><label>${t("ui.diagramGridStep")} <input type="number" min="5" max="200" step="1" value="${cfg.gridSize}" data-diagram-setting="gridSize"></label></div></details><p class="hint">${t(state.diagramAddPoint ? "ui.addRoutePointHint" : "ui.diagramHint")}</p>`;
  if (!host.matches(":popover-open")) host.showPopover();
  positionMapPanel(host);
}
