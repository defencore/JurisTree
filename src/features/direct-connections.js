import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { fit } from "../graph/camera.js";
import { directConnectionScope } from "../model/graph-view.js";
import { render } from "../ui/render.js";

/** Override visibility temporarily without editing filters or stored group collapse states. */
export function focusDirectConnections() {
  if (state.analysisBusy || state.selected?.kind !== "person") return;
  state.directConnectionRoot = state.selected.id;
  if (!directConnectionScope()) {
    state.directConnectionRoot = "";
    return;
  }
  state.multiSelection.clear();
  state.graphSelectionAnchor = "";
  state.view = "tree";
  $("#sidebar").classList.remove("open");
  $("#inspector").classList.remove("open");
  document.body.classList.remove("mobile-tools-open");
  $(".legend").open = false;
  render();
  fit();
}

export function restoreConnectionMap() {
  state.directConnectionRoot = "";
  render();
  fit();
}
