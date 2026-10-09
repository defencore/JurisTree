import { placementLockControls } from "./placement-lock-controls.js";
import { connectorPlacementLocked } from "../model/placement-locks.js";
import { $, esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { diagramRoute } from "../model/diagram.js";
import { filteredGraphNodes } from "../graph/node-data.js";
import { graphView } from "../model/graph-view.js";
import { icon } from "./icons.js";

export function renderDiagramTools() {
  const host = $("#diagramTools");
  if (!host) return;
  host.hidden = !state.diagramEditing || state.view !== "tree";
  document.body.classList.toggle(
    "diagram-editing",
    state.diagramEditing && state.view === "tree",
  );
  $("#graph")?.classList.toggle("placing-waypoint", state.diagramAddPoint);
  if (host.hidden) return;
  const key = state.diagramConnectionKey,
    cfg = graphView(),
    route = diagramRoute(state.project, key),
    locked = connectorPlacementLocked(state.project, key),
    line = !state.diagramSelecting && key && !key.startsWith("g:"),
    label = $('#graph [data-route-label="' + key + '"]'),
    connection = $('#graph [data-connector="' + key + '"][data-from-node]'),
    nodes = filteredGraphNodes(),
    count =
      nodes.filter((n) =>
        n.kind === "person"
          ? state.multiSelection.size
            ? state.multiSelection.has(n.id)
            : !state.diagramSelecting &&
              !state.diagramLabelSelection.size &&
              !state.diagramNodeSelection.size &&
              state.selected?.kind === "person" &&
              state.selected.id === n.id
          : state.diagramNodeSelection.has(n.kind + ":" + n.id),
      ).length + state.diagramLabelSelection.size;
  host.innerHTML = `<div class="diagram-tools-row"><b>${t("ui.diagramEditing")}</b><button class="btn small ${state.diagramSelecting ? "active" : ""}" data-action="diagram-select-items" aria-pressed="${state.diagramSelecting}">${icon("selectBox")}${t("ui.diagramSelectItems")}</button><label><input type="checkbox" data-diagram-setting="showGrid" ${cfg.showGrid ? "checked" : ""}>${t("ui.diagramGrid")}</label><label><input type="checkbox" data-diagram-setting="snapToGrid" ${cfg.snapToGrid ? "checked" : ""}>${t("ui.diagramSnap")}</label><label>${t("ui.diagramGridStep")} <input type="number" min="5" max="200" step="1" value="${cfg.gridSize}" data-diagram-setting="gridSize"></label><button class="btn small ghost" data-action="diagram-tools">${t("ui.finishDiagramEditing")}</button></div><p class="diagram-caption">${esc(state.diagramSelecting ? t("ui.selectedDiagramItems", { count }) : connection?.dataset.connectorCaption || label?.querySelector("title")?.textContent || t("ui.selectDiagramLine"))}</p><div class="diagram-tools-row">${line ? `<select data-diagram-style ${locked ? "disabled" : ""} aria-label="${t("ui.routeStyle")}">${["auto", "orthogonal", "polyline"].map((style) => `<option value="${style}" ${style === route.style ? "selected" : ""}>${t({ auto: "ui.routeAuto", orthogonal: "ui.routeOrthogonal", polyline: "ui.routePolyline" }[style])}</option>`).join("")}</select><button class="btn small ${state.diagramAddPoint ? "active" : ""}" data-action="diagram-add-point" ${locked ? "disabled" : ""}>${icon("plus")}${t(state.diagramAddPoint ? "ui.cancelRoutePoint" : "ui.addRoutePoint")}</button><button class="btn small" data-action="diagram-remove-point" ${locked || state.diagramPointIndex < 0 ? "disabled" : ""}>${icon("trash")}${t("ui.diagramRemovePoint")}</button><button class="btn small" data-action="diagram-reset-route" ${locked || (route.style === "auto" && !route.points.length) ? "disabled" : ""}>${t("ui.resetRoute")}</button>` : ""}${!state.diagramSelecting || state.diagramLabelSelection.size ? `<button class="btn small" data-action="diagram-reset-label" ${![...state.diagramLabelSelection].some((key) => diagramRoute(state.project, key).label && !connectorPlacementLocked(state.project, key)) ? "disabled" : ""}>${t("ui.resetDiagramLabel")}</button>` : ""}<select data-diagram-align aria-label="${t("ui.diagramAlignment")}" ${!count ? "disabled" : ""}><option value="">${t("ui.diagramAlignment")}</option>${["left", "centerX", "right", "top", "centerY", "bottom", "distributeX", "distributeY", "grid"].map((mode) => `<option value="${mode}" ${mode === "grid" ? "" : count < (mode.startsWith("distribute") ? 3 : 2) ? "disabled" : ""}>${t({ left: "ui.alignLeft", centerX: "ui.alignCenterX", right: "ui.alignRight", top: "ui.alignTop", centerY: "ui.alignCenterY", bottom: "ui.alignBottom", distributeX: "ui.distributeX", distributeY: "ui.distributeY", grid: "ui.snapSelected" }[mode])}</option>`).join("")}</select>${state.diagramSelecting ? "" : `<small>${t("ui.selectedDiagramItems", { count })}</small>`}</div>${placementLockControls()}<p class="hint">${t(state.diagramAddPoint ? "ui.addRoutePointHint" : "ui.diagramHint")}</p>`;
}
