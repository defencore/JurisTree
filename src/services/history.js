import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { resetAnalysis } from "../graph/analysis.js";
import { doc, person, relation } from "../model/project.js";
import { scheduleSave } from "./storage.js";
import { render } from "../ui/render.js";
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
  render();
  scheduleSave();
}
export function undo() {
  if (!appState.history.length) return;
  appState.future.push(clone(appState.project));
  appState.project = appState.history.pop();
  repairSelection();
  render();
  scheduleSave();
}
export function redo() {
  if (!appState.future.length) return;
  appState.history.push(clone(appState.project));
  appState.project = appState.future.pop();
  repairSelection();
  render();
  scheduleSave();
}
export function repairSelection() {
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
