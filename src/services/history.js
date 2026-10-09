import { emitSignal } from "../core/signals.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { validDiagramKeys } from "../model/diagram.js";
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
  const keys = validDiagramKeys(appState.project);
  const nodeKeys = new Set([
    ...appState.project.groups.map((g) => "group:" + g.id),
    ...appState.project.documents.map((d) => "document:" + d.id),
    ...appState.project.property.map((a) => "property:" + a.id),
  ]);
  appState.diagramNodeSelection = new Set(
    [...appState.diagramNodeSelection].filter((key) => nodeKeys.has(key)),
  );
  appState.diagramLabelSelection = new Set(
    [...appState.diagramLabelSelection].filter((key) => keys.has(key)),
  );
  if (!keys.has(appState.diagramConnectionKey)) {
    appState.diagramConnectionKey = "";
    appState.diagramAddPoint = false;
    appState.diagramPointIndex = -1;
  }
  if (appState.directConnectionRoot && !person(appState.directConnectionRoot))
    appState.directConnectionRoot = "";
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
