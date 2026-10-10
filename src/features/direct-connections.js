import { clearGraphItems } from "../model/graph-selection.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { applyCamera } from "../graph/camera.js";
import { directConnectionScope } from "../model/graph-view.js";
import { render } from "../ui/render.js";

/** Highlight one-hop connections on the current map without moving its viewport. */
export function focusDirectConnections() {
  if (state.analysisBusy || state.selected?.kind !== "person") return;
  if (state.directConnectionRoot === state.selected.id) {
    restoreConnectionMap();
    return;
  }
  state.directConnectionRoot = state.selected.id;
  if (!directConnectionScope()) {
    state.directConnectionRoot = "";
    return;
  }
  clearGraphItems(state);
  state.graphSelectionAnchor = "";
  state.view = "tree";
  redrawHighlight();
}

export function restoreConnectionMap() {
  state.directConnectionRoot = "";
  redrawHighlight();
}

function redrawHighlight() {
  const before = $("#graph").getBoundingClientRect();
  render();
  const after = $("#graph").getBoundingClientRect();
  if (before.width && before.height) {
    state.camera.x += before.left - after.left;
    state.camera.y += before.top - after.top;
  }
  applyCamera();
}
