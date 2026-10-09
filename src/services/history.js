import { emitSignal } from "../core/signals.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { resetAnalysis } from "../model/graph-view.js";
import { doc, person, relation } from "../model/lookup.js";

export function checkpoint() {
  appState.history.push(clone(appState.project));
  if (appState.history.length > 45) appState.history.shift();
  appState.future = [];
}
/** Apply a project edit and keep rendering, history and draft saving in one path. */
export function commit(action) {
  checkpoint();
  action();
  appState.project.updatedAt = new Date().toISOString();
  emitSignal("project:changed");
}
export function undo() {
  if (!appState.history.length) return;
  appState.future.push(clone(appState.project));
  appState.project = appState.history.pop();
  repairSelection();
  emitSignal("project:changed");
}
export function redo() {
  if (!appState.future.length) return;
  appState.history.push(clone(appState.project));
  appState.project = appState.future.pop();
  repairSelection();
  emitSignal("project:changed");
}
export function repairSelection() {
  if (!person(appState.graphSelectionAnchor))
    appState.graphSelectionAnchor = "";
  if (appState.profileFocus && !person(appState.profileFocus))
    appState.profileFocus = "";
  appState.multiSelection = new Set(
    [...appState.multiSelection].filter((id) => person(id)),
  );
  if (
    appState.analysisHighlight &&
    appState.analysisHighlight.people.some((id) => !person(id))
  )
    resetAnalysis(false);
  if (
    appState.selected &&
    !(appState.selected.kind === "person"
      ? person(appState.selected.id)
      : appState.selected.kind === "relation"
        ? relation(appState.selected.id)
        : doc(appState.selected.id))
  )
    appState.selected = null;
}
