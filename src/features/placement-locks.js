import { $ } from "../core/dom.js";
import { applyCamera } from "../graph/camera.js";
import { state } from "../core/state.js";
import { clone } from "../core/utils.js";
import { filteredGraphNodes } from "../graph/node-data.js";
import {
  connectorPlacementLocked,
  normalizePlacementLocks,
  placementSelection,
  pinLockedGroupAnchors,
} from "../model/placement-locks.js";
import { diagramRoute } from "../model/diagram.js";
import { commit } from "../services/history.js";
import { labelPosition, storeRoute } from "./diagram.js";

export function setPlacementLocked(locked) {
  if (state.analysisBusy) return;
  const targets = placementSelection(
      state.project,
      state,
      filteredGraphNodes(),
    ),
    current = normalizePlacementLocks(
      state.project.placementLocks,
      state.project,
    ),
    next = Object.fromEntries(
      ["nodes", "connectors"].map((kind) => [
        kind,
        locked
          ? [...new Set([...current[kind], ...targets[kind]])]
          : current[kind].filter((key) => !targets[kind].includes(key)),
      ]),
    );
  if (JSON.stringify(current) === JSON.stringify(next)) return;
  const labels = new Map();
  if (locked) {
    const keys = new Set([
      ...targets.connectors,
      ...targets.nodes
        .filter((key) => key.startsWith("group:"))
        .map((key) => "g:" + key.slice(6)),
    ]);
    for (const key of keys) {
      if (connectorPlacementLocked(state.project, key)) continue;
      const position = labelPosition(key);
      if (position) labels.set(key, position);
    }
  }
  const before = $("#graph").getBoundingClientRect();
  state.diagramAddPoint = false;
  state.diagramPointIndex = -1;
  commit(() => {
    for (const [key, label] of labels) {
      const route = clone(diagramRoute(state.project, key));
      route.label = label;
      storeRoute(key, route);
    }
    state.project.placementLocks = next;
    pinLockedGroupAnchors(state.project);
  });
  const after = $("#graph").getBoundingClientRect();
  state.camera.x += before.left - after.left;
  state.camera.y += before.top - after.top;
  applyCamera();
}
