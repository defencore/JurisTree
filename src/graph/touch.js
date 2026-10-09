import { snapPoint } from "../model/diagram.js";
import { graphView } from "../model/graph-view.js";
import { CAMERA_MAX_ZOOM, CAMERA_MIN_ZOOM } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { viewDocument } from "../features/document-view.js";
import { toggleGroup } from "../features/groups.js";
import { editProperty } from "../features/property.js";
import { person } from "../model/lookup.js";
import { commit } from "../services/history.js";
import { select } from "../ui/render.js";
import { applyCamera } from "./camera.js";
import { renderGraph } from "./render.js";

const midpoint = ([a, b]) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = ([a, b]) => Math.hypot(a.x - b.x, a.y - b.y);

/** Keep the world point under the initial midpoint under the moving fingers. */
export function pinchCamera(camera, start, current) {
  const origin = midpoint(start),
    center = midpoint(current);
  const z = Math.min(
    CAMERA_MAX_ZOOM,
    Math.max(
      CAMERA_MIN_ZOOM,
      (camera.z * distance(current)) / Math.max(1, distance(start)),
    ),
  );
  return {
    x: center.x - ((origin.x - camera.x) * z) / camera.z,
    y: center.y - ((origin.y - camera.y) * z) / camera.z,
    z,
  };
}

function tap(node) {
  if (!node) return;
  if (node.kind === "person") select("person", node.id);
  else if (node.kind === "document") viewDocument(node.id);
  else if (node.kind === "group") toggleGroup(node.id);
  else if (node.kind === "relation") select("relation", node.id);
  else editProperty(node.id);
}

export function bindTouchInteractions(graph) {
  const points = new Map();
  let gesture = null,
    completedTouch = null;
  document.addEventListener(
    "pointerdown",
    () => {
      completedTouch = null;
    },
    true,
  );
  document.addEventListener(
    "click",
    (event) => {
      if (event.pointerType !== "touch" || event.pointerId !== completedTouch)
        return;
      // A newly opened panel can put a button under the finger before this click.
      // Graph gestures already handle taps, so their synthetic click is consumed.
      completedTouch = null;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );
  function point(event) {
    const rect = graph.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function rollback() {
    if (gesture?.mode !== "node") return;
    const p = person(gesture.node.id);
    if (p) {
      p.x = gesture.position.x;
      p.y = gesture.position.y;
    }
    renderGraph();
  }
  graph.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.pointerType !== "touch" ||
        appState.analysisBusy ||
        event.target.closest("[data-biography],[data-favorite]")
      )
        return;
      event.preventDefault();
      points.set(event.pointerId, point(event));
      graph.setPointerCapture(event.pointerId);
      if (points.size === 1) {
        const element = event.target.closest(
          "[data-node],[data-toggle-group],[data-edge]",
        );
        const node = element
          ? element.dataset.node
            ? { kind: element.dataset.kind, id: element.dataset.node }
            : element.dataset.toggleGroup
              ? { kind: "group", id: element.dataset.toggleGroup }
              : { kind: "relation", id: element.dataset.edge }
          : null;
        const p = node?.kind === "person" ? person(node.id) : null;
        gesture = {
          mode: appState.touchMove && p ? "node" : "pan",
          start: point(event),
          camera: { ...appState.camera },
          node,
          moved: false,
          position: p ? { x: p.x, y: p.y } : null,
        };
      } else if (points.size === 2) {
        rollback();
        gesture = {
          mode: "pinch",
          start: [...points.values()],
          camera: { ...appState.camera },
          moved: true,
        };
      }
    },
    { passive: false },
  );
  graph.addEventListener(
    "pointermove",
    (event) => {
      if (!points.has(event.pointerId) || !gesture) return;
      event.preventDefault();
      points.set(event.pointerId, point(event));
      if (gesture.mode === "pinch" && points.size >= 2) {
        appState.camera = pinchCamera(
          gesture.camera,
          gesture.start,
          [...points.values()].slice(0, 2),
        );
        applyCamera();
        return;
      }
      const current = point(event),
        dx = current.x - gesture.start.x,
        dy = current.y - gesture.start.y;
      if (Math.hypot(dx, dy) > 8) gesture.moved = true;
      if (!gesture.moved) return;
      if (gesture.mode === "node") {
        const p = person(gesture.node.id);
        Object.assign(
          p,
          snapPoint(
            {
              x: gesture.position.x + dx / appState.camera.z,
              y: gesture.position.y + dy / appState.camera.z,
            },
            graphView(),
          ),
        );
        renderGraph();
      } else {
        appState.camera.x = gesture.camera.x + dx;
        appState.camera.y = gesture.camera.y + dy;
        applyCamera();
      }
    },
    { passive: false },
  );
  function finish(event) {
    if (!points.has(event.pointerId)) return;
    if (graph.hasPointerCapture(event.pointerId))
      graph.releasePointerCapture(event.pointerId);
    points.delete(event.pointerId);
    if (event.type === "pointercancel") {
      rollback();
      for (const id of points.keys())
        if (graph.hasPointerCapture(id)) graph.releasePointerCapture(id);
      points.clear();
      gesture = null;
      return;
    }
    if (gesture?.mode === "pinch" && points.size === 1) {
      gesture = {
        mode: "pan",
        start: [...points.values()][0],
        camera: { ...appState.camera },
        moved: true,
      };
      return;
    }
    if (points.size) return;
    completedTouch = event.pointerId;
    if (gesture?.mode === "node" && gesture.moved) {
      const p = person(gesture.node.id),
        position = { x: p.x, y: p.y };
      rollback();
      commit(() => Object.assign(p, position));
    } else if (gesture && !gesture.moved) tap(gesture.node);
    gesture = null;
  }
  graph.addEventListener("pointerup", finish);
  graph.addEventListener("pointercancel", finish);
}
