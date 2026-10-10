import { bounded, markerPosition, focusSegment } from "./diagram-handles.js";
import { bindDiagramKeyboard } from "./diagram-keyboard.js";
import { connectorPlacementLocked } from "../model/placement-locks.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { clone } from "../core/utils.js";
import {
  connectorElement,
  labelPosition,
  redrawDiagram,
  scheduleDiagramRedraw,
  cancelDiagramRedraw,
  selectDiagramConnection,
  storeRoute,
  toggleDiagramNode,
} from "../features/diagram.js";
import {
  closestRouteInsertion,
  connectorPoints,
  shiftConnectorSegment,
} from "../model/connector-path.js";
import { diagramRoute, snapPoint } from "../model/diagram.js";
import { graphView } from "../model/graph-view.js";
import { commit } from "../services/history.js";
import { filteredGraphNodes } from "./node-data.js";

export function bindDiagramInteractions(graph) {
  let gesture = null,
    consumedClick = false;
  const point = (event) => {
    const box = graph.getBoundingClientRect();
    return {
      x: (event.clientX - box.left - state.camera.x) / state.camera.z,
      y: (event.clientY - box.top - state.camera.y) / state.camera.z,
    };
  };
  document.addEventListener(
    "pointerdown",
    () => {
      consumedClick = false;
    },
    true,
  );
  graph.addEventListener(
    "click",
    (event) => {
      if (
        consumedClick ||
        (state.diagramEditing &&
          event.target.closest("[data-connector],[data-route-label]"))
      ) {
        consumedClick = false;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  graph.addEventListener(
    "pointerdown",
    (event) => {
      if (
        state.analysisBusy ||
        event.button !== 0 ||
        event.target.closest("[data-biography],[data-favorite]")
      )
        return;
      const label = event.target.closest("[data-route-label]"),
        handle = event.target.closest("[data-route-point]"),
        segment = event.target.closest("[data-route-segment]"),
        connector = event.target.closest("[data-connector]"),
        adding = state.diagramAddPoint;
      const node = event.target.closest("[data-node]");
      if (
        !adding &&
        node &&
        ["person", "document", "property", "group"].includes(
          node.dataset.kind,
        ) &&
        (state.selectionMode ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey)
      ) {
        if (event.pointerType === "touch") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleDiagramNode(node.dataset.kind, node.dataset.node);
        consumedClick = true;
        return;
      }
      if (!adding && !label && !connector) return;
      if (
        event.pointerType === "touch" &&
        state.selectionMode &&
        !adding &&
        !handle &&
        !segment
      )
        return;
      const extend =
        state.selectionMode || event.ctrlKey || event.metaKey || event.shiftKey;
      if (
        !state.diagramEditing &&
        label?.dataset.routeLabel.startsWith("g:") &&
        !extend
      )
        return;
      if (!state.diagramEditing && event.pointerType === "touch" && !extend)
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.isPrimary === false || gesture) return;
      const key = adding
        ? state.diagramConnectionKey
        : label?.dataset.routeLabel || connector.dataset.connector;
      const start = point(event);
      if (!state.diagramEditing || (extend && !handle && !segment && !adding)) {
        consumedClick = true;
        selectDiagramConnection(key, extend);
        return;
      }
      if (
        !adding &&
        !handle &&
        !segment &&
        !(
          label &&
          state.diagramLabelSelection.has(key) &&
          !state.selectionMode &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey
        )
      ) {
        selectDiagramConnection(key);
        consumedClick = true;
      }
      if (connectorPlacementLocked(state.project, key)) {
        consumedClick = true;
        return;
      }
      if (!adding && !label && !handle && !segment) return;
      const route = clone(diagramRoute(state.project, key));
      let index = handle ? Number(handle.dataset.routePoint) : -1;
      let section = null;
      if (segment) {
        const el = connectorElement(key),
          nodes = filteredGraphNodes();
        const a = nodes.find((n) => n.id === el?.dataset.fromNode),
          b = nodes.find((n) => n.id === el?.dataset.toNode);
        if (!a || !b) return;
        section = {
          a,
          b,
          index: Number(segment.dataset.routeSegment),
          axis: segment.dataset.segmentAxis,
          marker: markerPosition(segment),
        };
        section.origin = connectorPoints(a, b, route)[section.index];
      }
      const labels = new Map();
      if (label && !adding)
        for (const selected of state.diagramLabelSelection) {
          const position = labelPosition(selected);
          if (position && !connectorPlacementLocked(state.project, selected))
            labels.set(selected, position);
        }
      const before = clone(state.project);
      if (adding) {
        const el = connectorElement(key),
          nodes = filteredGraphNodes(),
          a = nodes.find((n) => n.id === el?.dataset.fromNode),
          b = nodes.find((n) => n.id === el?.dataset.toNode);
        if (!a || !b) return;
        index = closestRouteInsertion(a, b, route, start);
        route.points.splice(
          index,
          0,
          bounded(snapPoint(start, graphView(), event.altKey)),
        );
        if (route.style === "auto") route.style = "orthogonal";
        storeRoute(key, route);
        state.diagramAddPoint = false;
      }
      state.diagramConnectionKey = key;
      state.diagramPointIndex = index;
      gesture = {
        key,
        index,
        labels,
        section,
        before,
        start,
        pointerId: event.pointerId,
        route: clone(route),
        adding,
        moved: adding,
      };
      graph.focus({ preventScroll: true });
      graph.setPointerCapture(event.pointerId);
      redrawDiagram();
    },
    true,
  );
  graph.addEventListener(
    "pointermove",
    (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const current = point(event),
        dx = current.x - gesture.start.x,
        dy = current.y - gesture.start.y;
      const distance = gesture.section
        ? Math.abs(gesture.section.axis === "x" ? dx : dy)
        : Math.hypot(dx, dy);
      if (distance * state.camera.z > 3) gesture.moved = true;
      if (!gesture.moved) return;
      if (gesture.section) {
        const { a, b, index, axis, origin } = gesture.section,
          desired = snapPoint(
            { x: origin.x + dx, y: origin.y + dy },
            graphView(),
            event.altKey,
          );
        storeRoute(
          gesture.key,
          shiftConnectorSegment(
            a,
            b,
            gesture.route,
            index,
            desired[axis] - origin[axis],
          ),
        );
      } else if (gesture.index >= 0) {
        const route = clone(gesture.route),
          original = gesture.route.points[gesture.index];
        route.points[gesture.index] = bounded(
          snapPoint(
            { x: original.x + dx, y: original.y + dy },
            graphView(),
            event.altKey,
          ),
        );
        storeRoute(gesture.key, route);
      } else {
        const reference = gesture.labels.get(gesture.key),
          desired = snapPoint(
            { x: reference.x + dx, y: reference.y + dy },
            graphView(),
            event.altKey,
          ),
          shift = { x: desired.x - reference.x, y: desired.y - reference.y };
        for (const [key, original] of gesture.labels) {
          const route = clone(diagramRoute(state.project, key));
          route.label = bounded({
            x: original.x + shift.x,
            y: original.y + shift.y,
          });
          storeRoute(key, route);
        }
      }
      scheduleDiagramRedraw();
    },
    true,
  );
  function finish(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    cancelDiagramRedraw();
    event.preventDefault();
    event.stopImmediatePropagation();
    consumedClick = true;
    const completed = gesture,
      diagram = clone(state.project.diagram || {});
    gesture = null;
    state.project = completed.before;
    if (graph.hasPointerCapture(event.pointerId))
      graph.releasePointerCapture(event.pointerId);
    if (event.type !== "pointercancel" && completed.moved)
      commit(() => {
        state.project.diagram = diagram;
      });
    else redrawDiagram();
    if (completed.index >= 0)
      $(
        '#graph [data-route-point="' +
          completed.index +
          '"][data-connector="' +
          completed.key +
          '"]',
      )?.focus({ preventScroll: true });
    else if (completed.section)
      focusSegment(
        completed.key,
        completed.section.axis,
        completed.section.marker,
      );
  }
  graph.addEventListener("pointerup", finish, true);
  graph.addEventListener("pointercancel", finish, true);
  bindDiagramKeyboard(graph, () => {
    if (!gesture) return false;
    finish({
      type: "pointercancel",
      pointerId: gesture.pointerId,
      preventDefault() {},
      stopImmediatePropagation() {},
    });
    return true;
  });
}
