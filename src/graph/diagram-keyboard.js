import { connectorPlacementLocked } from "../model/placement-locks.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { clone } from "../core/utils.js";
import {
  connectorElement,
  labelPosition,
  labelElement,
  removeRoutePoint,
  selectDiagramConnection,
  storeRoute,
  toggleDiagramNode,
} from "../features/diagram.js";
import {
  connectorPoints,
  shiftConnectorSegment,
} from "../model/connector-path.js";
import { diagramRoute, snapPoint } from "../model/diagram.js";
import { graphView } from "../model/graph-view.js";
import { commit } from "../services/history.js";
import { filteredGraphNodes } from "./node-data.js";
import { bounded, markerPosition, focusSegment } from "./diagram-handles.js";

export function bindDiagramKeyboard(graph, cancelGesture) {
  graph.addEventListener(
    "keydown",
    (event) => {
      const node = event.target.closest("[data-node]");
      if (
        node &&
        ["person", "document", "property", "group"].includes(
          node.dataset.kind,
        ) &&
        event.key === "Enter" &&
        (state.selectionMode ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleDiagramNode(node.dataset.kind, node.dataset.node);
        return;
      }
      if (event.key === "Escape" && cancelGesture()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const handle = event.target.closest("[data-route-point]"),
        label = event.target.closest("[data-route-label]"),
        segment = event.target.closest("[data-route-segment]"),
        directions = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
      const connector = event.target.closest(
        "[data-connector][data-from-node]",
      );
      if (connector && !label && !handle && !segment && event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        selectDiagramConnection(
          connector.dataset.connector,
          state.selectionMode ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey,
        );
        connectorElement(connector.dataset.connector)?.focus({
          preventScroll: true,
        });
        return;
      }
      if (
        state.diagramEditing &&
        handle &&
        ["Delete", "Backspace"].includes(event.key)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        removeRoutePoint(Number(handle.dataset.routePoint));
        return;
      }
      if (
        label &&
        event.key === "Enter" &&
        (state.diagramEditing ||
          !label.dataset.routeLabel.startsWith("g:") ||
          state.selectionMode ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        selectDiagramConnection(
          label.dataset.routeLabel,
          state.selectionMode ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey,
        );
        labelElement(label.dataset.routeLabel)?.focus({ preventScroll: true });
        return;
      }
      if (!state.diagramEditing) return;
      if (segment && directions[event.key]) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const key = segment.dataset.connector,
          el = connectorElement(key),
          nodes = filteredGraphNodes(),
          a = nodes.find((n) => n.id === el?.dataset.fromNode),
          b = nodes.find((n) => n.id === el?.dataset.toNode),
          axis = segment.dataset.segmentAxis,
          delta =
            directions[event.key][axis === "x" ? 0 : 1] *
            (graphView().snapToGrid ? graphView().gridSize : 5) *
            (event.shiftKey ? 5 : 1);
        if (!a || !b || !delta || connectorPlacementLocked(state.project, key))
          return;
        const origin = connectorPoints(a, b, diagramRoute(state.project, key))[
            Number(segment.dataset.routeSegment)
          ],
          desired = snapPoint(
            {
              x: origin.x + (axis === "x" ? delta : 0),
              y: origin.y + (axis === "y" ? delta : 0),
            },
            graphView(),
            event.altKey,
          ),
          offset = desired[axis] - origin[axis];
        const position = markerPosition(segment);
        position[axis] += offset;
        commit(() =>
          storeRoute(
            key,
            shiftConnectorSegment(
              a,
              b,
              diagramRoute(state.project, key),
              Number(segment.dataset.routeSegment),
              offset,
            ),
          ),
        );
        focusSegment(key, axis, position);
        return;
      }
      if ((!handle && !label) || !directions[event.key]) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const key = handle?.dataset.connector || label.dataset.routeLabel,
        index = handle ? Number(handle.dataset.routePoint) : -1,
        route = clone(diagramRoute(state.project, key)),
        original = index >= 0 ? route.points[index] : labelPosition(key);
      if (!original || connectorPlacementLocked(state.project, key)) return;
      const step =
          (graphView().snapToGrid ? graphView().gridSize : 5) *
          (event.shiftKey ? 5 : 1),
        direction = directions[event.key],
        next = bounded(
          snapPoint(
            {
              x: original.x + direction[0] * step,
              y: original.y + direction[1] * step,
            },
            graphView(),
            event.altKey,
          ),
        );
      if (index >= 0) route.points[index] = next;
      else route.label = next;
      commit(() => storeRoute(key, route));
      $(
        "#graph [" +
          (index >= 0
            ? 'data-route-point="' + index + '"][data-connector="' + key + '"'
            : 'data-route-label="' + key + '"') +
          "]",
      )?.focus({ preventScroll: true });
    },
    true,
  );
}
