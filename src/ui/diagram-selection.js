import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { filteredGraphNodes } from "../graph/node-data.js";
import { selectedGraphNodes } from "../model/graph-selection.js";
import {
  nodePlacementLocked,
  connectorPlacementLocked,
} from "../model/placement-locks.js";

export function diagramSelectionItems() {
  const nodes = filteredGraphNodes(),
    ids = state.multiSelection.size
      ? state.multiSelection
      : !state.selectionMode &&
          !state.diagramLabelSelection.size &&
          !state.diagramNodeSelection.size &&
          state.selected?.kind === "person"
        ? new Set([state.selected.id])
        : new Set();
  const items = selectedGraphNodes(nodes, {
    ...state,
    multiSelection: ids,
  }).map((n) => ({
    ...n,
    id: n.kind + ":" + n.id,
    idValue: n.id,
    locked: nodePlacementLocked(state.project, n.kind, n.id),
  }));
  for (const key of state.diagramLabelSelection) {
    const el = $('#graph [data-route-label="' + key + '"]');
    if (!el) continue;
    const w = Number(el.dataset.labelWidth),
      h = Number(el.dataset.labelHeight);
    items.push({
      id: key,
      kind: "label",
      locked: connectorPlacementLocked(state.project, key),
      x: Number(el.dataset.labelX) - w / 2,
      y: Number(el.dataset.labelY) - 10,
      w,
      h,
    });
  }
  return items;
}
