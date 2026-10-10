import { pruneImageTargets } from "../model/image-regions.js";
import { emitSignal } from "../core/signals.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { validDiagramKeys } from "../model/diagram.js";
import { resetAnalysis } from "../model/graph-view.js";
import { asset, doc, group, person, relation } from "../model/lookup.js";
import { advanceProjectRevision } from "../model/project-revision.js";

export function checkpoint() {
  recordCheckpoint(clone(appState.project));
}
function recordCheckpoint(before) {
  appState.history.push(before);
  if (appState.history.length > 45) appState.history.shift();
  appState.future = [];
}
/** Apply a project edit and keep rendering, history and draft saving in one path. */
export function commit(action) {
  const before = clone(appState.project);
  try {
    action();
    pruneImageTargets(appState.project);
  } catch (error) {
    appState.project = before;
    appState.renderIndex = null;
    throw error;
  }
  commitSnapshot(before);
}
/** Finish an interactive preview through the same history, rendering and saving path. */
export function commitSnapshot(before) {
  recordCheckpoint(before);
  appState.project.updatedAt = new Date().toISOString();
  advanceProjectRevision(appState.project);
  appState.renderIndex = null;
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
        : appState.selected.kind === "property"
          ? asset(appState.selected.id)
          : appState.selected.kind === "group"
            ? group(appState.selected.id)
            : appState.selected.kind === "document"
              ? doc(appState.selected.id)
              : null)
  )
    appState.selected = null;
}
