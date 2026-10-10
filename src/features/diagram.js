import { diagramSelectionItems } from "../ui/diagram-selection.js";
import { connectorPlacementLocked } from "../model/placement-locks.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { clone } from "../core/utils.js";
import { applyCamera } from "../graph/camera.js";
import { renderGraph } from "../graph/render.js";
import { translate as t } from "../i18n/index.js";
import {
  arrangeItems,
  diagramRoute,
  MAX_ROUTE_POINTS,
} from "../model/diagram.js";
import { graphView } from "../model/graph-view.js";
import { nodeItem } from "../model/lookup.js";
import { commit } from "../services/history.js";
import { toast } from "../ui/dialog.js";
import { renderDiagramTools } from "../ui/diagram-tools.js";
import { render, select } from "../ui/render.js";
import { renderInspector } from "../ui/inspector.js";
import { toggleGraphNode } from "../model/graph-selection.js";

export const connectorElement = (key) =>
  $('#graph [data-connector="' + key + '"][data-from-node]');
export const labelElement = (key) =>
  $('#graph [data-route-label="' + key + '"]');
export function labelPosition(key) {
  const el = labelElement(key);
  return el
    ? { x: Number(el.dataset.labelX), y: Number(el.dataset.labelY) }
    : diagramRoute(state.project, key).label;
}
export function storeRoute(key, route) {
  state.project.diagram ||= {};
  if (route.style === "auto" && !route.points.length && !route.label)
    delete state.project.diagram[key];
  else state.project.diagram[key] = route;
}
export function toggleDiagramTools() {
  if (state.analysisBusy) return;
  const before = $("#graph").getBoundingClientRect();
  state.diagramEditing = !state.diagramEditing;
  state.diagramAddPoint = false;
  state.diagramPointIndex = -1;
  state.view = "tree";
  if (state.diagramEditing) document.body.classList.remove("mobile-tools-open");
  render();
  const after = $("#graph").getBoundingClientRect();
  if (before.width && before.height) {
    state.camera.x += before.left - after.left;
    state.camera.y += before.top - after.top;
    applyCamera();
  }
}
/** Preserve screen positions when the editing controls change height. */
export function redrawDiagram() {
  const before = $("#graph").getBoundingClientRect();
  renderGraph();
  const after = $("#graph").getBoundingClientRect();
  state.camera.x += before.left - after.left;
  state.camera.y += before.top - after.top;
  applyCamera();
}
export function selectDiagramConnection(key, extend = false) {
  if (!extend && key.startsWith("r:")) {
    select("relation", key.slice(2), { openPanel: !state.diagramEditing });
    return;
  }
  state.diagramConnectionKey = key;
  state.diagramPointIndex = -1;
  state.diagramAddPoint = false;
  if (extend) {
    if (state.diagramLabelSelection.has(key))
      state.diagramLabelSelection.delete(key);
    else state.diagramLabelSelection.add(key);
  } else {
    state.diagramLabelSelection = new Set([key]);
    state.multiSelection.clear();
    state.diagramNodeSelection.clear();
  }
  if (!state.diagramLabelSelection.has(key))
    state.diagramConnectionKey = [...state.diagramLabelSelection].at(-1) || "";
  if (key.startsWith("r:")) {
    if (state.diagramLabelSelection.has(key))
      state.selected = { kind: "relation", id: key.slice(2) };
    else if (
      state.selected?.kind === "relation" &&
      state.selected.id === key.slice(2)
    )
      state.selected = null;
    renderInspector();
  }
  redrawDiagram();
}
export function toggleDiagramNode(kind, id) {
  toggleGraphNode(state, kind, id);
  redrawDiagram();
}
export function changeDiagramSetting(name, value) {
  const cfg = graphView();
  if (name === "gridSize") {
    value = Number(value);
    if (!Number.isInteger(value) || value < 5 || value > 200) {
      renderDiagramTools();
      return;
    }
  } else if (!["showGrid", "snapToGrid"].includes(name)) return;
  if (cfg[name] === value) return;
  commit(() => {
    state.project.graphView = {
      ...cfg,
      [name]: value,
    };
  });
}
export function changeRouteStyle(style) {
  const key = state.diagramConnectionKey;
  if (
    !key ||
    connectorPlacementLocked(state.project, key) ||
    key.startsWith("g:") ||
    !["auto", "orthogonal", "polyline"].includes(style)
  )
    return;
  const route = clone(diagramRoute(state.project, key));
  route.style = style;
  if (style === "auto") route.points = [];
  state.diagramPointIndex = -1;
  commit(() => storeRoute(key, route));
}
export function beginRoutePoint() {
  const key = state.diagramConnectionKey;
  if (connectorPlacementLocked(state.project, key)) return;
  if (!key || key.startsWith("g:") || !connectorElement(key)) {
    toast(t("ui.selectDiagramLine"));
    return;
  }
  if (diagramRoute(state.project, key).points.length >= MAX_ROUTE_POINTS) {
    toast(t("ui.waypointLimit"), true);
    return;
  }
  state.diagramAddPoint = !state.diagramAddPoint;
  state.selectionMode = false;
  redrawDiagram();
}
export function removeRoutePoint(index = state.diagramPointIndex) {
  const key = state.diagramConnectionKey,
    route = clone(diagramRoute(state.project, key));
  if (
    !key ||
    connectorPlacementLocked(state.project, key) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= route.points.length
  )
    return;
  route.points.splice(index, 1);
  state.diagramPointIndex = -1;
  commit(() => storeRoute(key, route));
}
export function resetDiagramLabels() {
  const keys = state.diagramLabelSelection.size
    ? [...state.diagramLabelSelection]
    : [state.diagramConnectionKey];
  const movable = keys.filter(
    (key) => !connectorPlacementLocked(state.project, key),
  );
  if (!movable.some((key) => diagramRoute(state.project, key).label)) return;
  commit(() => {
    for (const key of movable) {
      const route = clone(diagramRoute(state.project, key));
      route.label = null;
      storeRoute(key, route);
    }
  });
}
export function alignDiagramSelection(mode) {
  const items = diagramSelectionItems(),
    positions = arrangeItems(items, mode, graphView().gridSize);
  if (
    !items.some(
      (item) =>
        positions.get(item.id).x !== item.x ||
        positions.get(item.id).y !== item.y,
    )
  )
    return;
  commit(() => {
    for (const item of items) {
      if (item.locked) continue;
      const next = positions.get(item.id);
      if (item.kind === "group") {
        const group = nodeItem("group", item.idValue);
        for (const person of state.project.people.filter((p) =>
          p.groupIds?.includes(item.idValue),
        )) {
          person.x += next.x - item.x;
          person.y += next.y - item.y;
        }
        Object.assign(group, next);
      } else if (item.kind !== "label")
        Object.assign(nodeItem(item.kind, item.idValue), next);
      else {
        const route = clone(diagramRoute(state.project, item.id));
        route.label = { x: next.x + item.w / 2, y: next.y + 10 };
        storeRoute(item.id, route);
      }
    }
  });
}
