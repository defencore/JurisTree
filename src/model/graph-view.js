import { normalizeGraphView } from "../core/graph-view.js";
import { state as appState } from "../core/state.js";
import { edgeState } from "./evidence.js";
import { group } from "./lookup.js";
import { personPassesFilter } from "./person-filter-state.js";
import { directConnections } from "./direct-connections.js";

let directCache = null;
export function directConnectionScope() {
  const project = appState.project,
    rootId = appState.directConnectionRoot;
  if (!rootId || !project) return null;
  if (
    !directCache ||
    directCache.project !== project ||
    directCache.rootId !== rootId ||
    directCache.updatedAt !== project.updatedAt
  )
    directCache = {
      project,
      rootId,
      updatedAt: project.updatedAt,
      scope: directConnections(project, rootId),
    };
  return directCache.scope;
}

export function graphView() {
  return normalizeGraphView(appState.project.graphView);
}
export function fullDiagram() {
  return (
    appState.exportingDiagram === true || appState.exportingDiagram === "full"
  );
}
export function relationShown(r, full = fullDiagram(), ignoreFocus = false) {
  if (full) return true;
  const direct = directConnectionScope();
  if (direct) return direct.relations.has(r.id);
  const cfg = graphView();
  if (
    !appState.analysisReveal.has(r.id) &&
    (!cfg.types.includes(r.type) ||
      !cfg.states.includes(edgeState(r)) ||
      cfg.hiddenRelations.includes(r.id))
  )
    return false;
  return (
    ignoreFocus ||
    !appState.graphFocus ||
    appState.graphFocus.relations.includes(r.id)
  );
}
export function visiblePeople(full = fullDiagram()) {
  const direct = !full && directConnectionScope();
  if (direct)
    return appState.project.people.filter((p) => direct.people.has(p.id));
  const cfg = graphView();
  let ps =
    full || !appState.groupFilter
      ? appState.project.people
      : appState.project.people.filter((p) =>
          (p.groupIds || []).includes(appState.groupFilter),
        );
  if (!full) ps = ps.filter((p) => personPassesFilter(p.id));
  if (!full && appState.graphFocus)
    ps = ps.filter((p) => appState.graphFocus.people.includes(p.id));
  if (!full && !cfg.showIsolated) {
    const allowed = new Set(ps.map((p) => p.id)),
      linked = new Set(
        appState.project.relations
          .filter(
            (r) => allowed.has(r.from) && allowed.has(r.to) && relationShown(r),
          )
          .flatMap((r) => [r.from, r.to]),
      );
    ps = ps.filter(
      (p) =>
        linked.has(p.id) ||
        (appState.selected?.kind === "person" &&
          appState.selected.id === p.id) ||
        appState.multiSelection.has(p.id),
    );
  }
  return ps;
}
export function resetAnalysis(restoreGroup = true) {
  appState.directConnectionRoot = "";
  appState.graphFocus = null;
  appState.analysisHighlight = null;
  appState.analysisReveal.clear();
  appState.analysisExpandedGroups.clear();
  if (restoreGroup && appState.analysisReturnGroup !== null)
    appState.groupFilter =
      appState.analysisReturnGroup && group(appState.analysisReturnGroup)
        ? appState.analysisReturnGroup
        : "";
  appState.analysisReturnGroup = null;
}
