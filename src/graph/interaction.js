import { render, select } from "../ui/render.js";
import { scheduleSave } from "../services/storage.js";
import { repairSelection } from "../services/history.js";
import { fit, focusPerson } from "./camera.js";
import { isMobileLayout } from "../core/viewport.js";
import { editProperty } from "../features/property.js";
import { toggleGroup } from "../features/groups.js";
import { viewDocument } from "../features/documents.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { toggleGraphSelection } from "./analysis.js";
import { applyCamera, zoom } from "./camera.js";
import { renderGraphControls } from "./controls.js";
import { filteredGraphNodes, renderGraph } from "./render.js";
import { nodeItem, person } from "../model/project.js";
import { bindTouchInteractions } from "./touch.js";
export function bindGraphInteractions() {
  const graph = $("#graph");
  bindTouchInteractions(graph);
  graph.addEventListener("pointerdown", (e) => {
    if (
      e.button !== 0 ||
      e.pointerType === "touch" ||
      appState.analysisBusy ||
      e.target.closest("[data-biography]")
    )
      return;
    const n = e.target.closest("[data-node]"),
      rect = graph.getBoundingClientRect();
    if (n && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      if (n.dataset.kind === "person") toggleGraphSelection(n.dataset.node);
      else if (n.dataset.kind === "group") {
        const g = filteredGraphNodes().find((x) => x.id === n.dataset.node);
        if (g) {
          const remove = g.members.every((id) =>
            appState.multiSelection.has(id),
          );
          g.members.forEach((id) =>
            remove
              ? appState.multiSelection.delete(id)
              : appState.multiSelection.add(id),
          );
          renderGraph();
          renderGraphControls();
        }
      }
      e.preventDefault();
      return;
    }
    if (n) {
      const item = nodeItem(n.dataset.kind, n.dataset.node),
        displayed = filteredGraphNodes().find((x) => x.id === item.id);
      if (!displayed) return;
      const items =
        n.dataset.kind === "person" && appState.multiSelection.has(item.id)
          ? appState.project.people
              .filter((p) => appState.multiSelection.has(p.id))
              .map((p) => ({
                id: p.id,
                x: p.x,
                y: p.y,
              }))
          : n.dataset.kind === "group"
            ? displayed.members
                .map((id) => person(id))
                .filter(Boolean)
                .map((p) => ({
                  id: p.id,
                  x: p.x,
                  y: p.y,
                }))
            : [];
      appState.drag = {
        kind: "node",
        nodeKind: n.dataset.kind,
        id: item.id,
        x: displayed.x,
        y: displayed.y,
        sx: e.clientX,
        sy: e.clientY,
        moved: false,
        before: clone(appState.project),
        items,
      };
    } else if (!e.target.closest("[data-edge],[data-toggle-group]")) {
      if (appState.selectionMode || e.shiftKey) {
        appState.drag = {
          kind: "box",
          sx: e.clientX,
          sy: e.clientY,
          ex: e.clientX,
          ey: e.clientY,
          extend: e.ctrlKey || e.metaKey || e.shiftKey,
          beforeSelection: [...appState.multiSelection],
          moved: false,
        };
        $("#selectionBox").removeAttribute("hidden");
        $("#selectionBox").setAttribute("x", e.clientX - rect.left);
        $("#selectionBox").setAttribute("y", e.clientY - rect.top);
        $("#selectionBox").setAttribute("width", 0);
        $("#selectionBox").setAttribute("height", 0);
      } else
        appState.drag = {
          kind: "pan",
          x: appState.camera.x,
          y: appState.camera.y,
          sx: e.clientX,
          sy: e.clientY,
          moved: false,
        };
    }
    if (appState.drag) graph.setPointerCapture(e.pointerId);
  });
  graph.addEventListener("pointermove", (e) => {
    if (!appState.drag) return;
    const dx = e.clientX - appState.drag.sx,
      dy = e.clientY - appState.drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 5) appState.drag.moved = true;
    if (appState.drag.kind === "pan") {
      appState.camera.x = appState.drag.x + dx;
      appState.camera.y = appState.drag.y + dy;
      applyCamera();
    } else if (appState.drag.kind === "box") {
      appState.drag.ex = e.clientX;
      appState.drag.ey = e.clientY;
      const rect = graph.getBoundingClientRect(),
        box = $("#selectionBox");
      box.setAttribute(
        "x",
        Math.min(appState.drag.sx, appState.drag.ex) - rect.left,
      );
      box.setAttribute(
        "y",
        Math.min(appState.drag.sy, appState.drag.ey) - rect.top,
      );
      box.setAttribute("width", Math.abs(dx));
      box.setAttribute("height", Math.abs(dy));
    } else {
      const item = nodeItem(appState.drag.nodeKind, appState.drag.id);
      item.x = appState.drag.x + dx / appState.camera.z;
      item.y = appState.drag.y + dy / appState.camera.z;
      for (const old of appState.drag.items) {
        const p = person(old.id);
        if (p) {
          p.x = old.x + dx / appState.camera.z;
          p.y = old.y + dy / appState.camera.z;
        }
      }
      renderGraph();
    }
  });
  graph.addEventListener("pointerup", finishGraphDrag);
  graph.addEventListener("pointercancel", finishGraphDrag);
  graph.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const r = graph.getBoundingClientRect();
      zoom(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    },
    {
      passive: false,
    },
  );
}
export function finishGraphDrag(e) {
  if (!appState.drag) return;
  const d = appState.drag;
  appState.drag = null;
  if (d.kind === "box") {
    $("#selectionBox").setAttribute("hidden", "");
    if (e?.type === "pointercancel") return;
    const rect = $("#graph").getBoundingClientRect(),
      x1 =
        (Math.min(d.sx, d.ex) - rect.left - appState.camera.x) /
        appState.camera.z,
      y1 =
        (Math.min(d.sy, d.ey) - rect.top - appState.camera.y) /
        appState.camera.z,
      x2 =
        (Math.max(d.sx, d.ex) - rect.left - appState.camera.x) /
        appState.camera.z,
      y2 =
        (Math.max(d.sy, d.ey) - rect.top - appState.camera.y) /
        appState.camera.z;
    appState.multiSelection = new Set(d.extend ? d.beforeSelection : []);
    for (const n of filteredGraphNodes())
      if (
        ["person", "group"].includes(n.kind) &&
        n.x + n.w / 2 >= x1 &&
        n.x + n.w / 2 <= x2 &&
        n.y + n.h / 2 >= y1 &&
        n.y + n.h / 2 <= y2
      )
        (n.kind === "group" ? n.members : [n.id]).forEach((id) =>
          appState.multiSelection.add(id),
        );
    renderGraph();
    renderGraphControls();
    return;
  }
  if (d.kind === "node") {
    if (e?.type === "pointercancel") {
      appState.project = d.before;
      repairSelection();
      render();
      return;
    }
    if (d.moved) {
      appState.history.push(d.before);
      if (appState.history.length > 45) appState.history.shift();
      appState.future = [];
      appState.project.updatedAt = new Date().toISOString();
      scheduleSave();
      renderGraph();
    } else if (d.nodeKind === "person") select("person", d.id);
    else if (d.nodeKind === "document") viewDocument(d.id);
    else if (d.nodeKind === "group") toggleGroup(d.id);
    else editProperty(d.id);
  }
}
export function bindResizeEvents() {
  let lastWidth = innerWidth;
  window.addEventListener("resize", () => {
    if (lastWidth === innerWidth) return;
    lastWidth = innerWidth;
    if (
      appState.initialized &&
      appState.editorActive &&
      $("#startScreen").hidden &&
      appState.view === "tree"
    )
      isMobileLayout() ? focusPerson() : fit();
  });
}
