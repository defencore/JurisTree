import { defaultGraphView } from "../core/graph-view.js";
import { state as appState } from "../core/state.js";
import { fit } from "../graph/camera.js";
import { renderGraph } from "../graph/render.js";
import { translate } from "../i18n/index.js";
import { edgeState } from "../model/evidence.js";
import { graphView, resetAnalysis } from "../model/graph-view.js";
import { person, relation } from "../model/lookup.js";
import { commit } from "../services/history.js";
import { closeModal } from "../ui/dialog.js";
import { renderGraphControls } from "../ui/graph-controls.js";
import { render } from "../ui/render.js";
import { clearGraphItems, toggleGraphNode } from "../model/graph-selection.js";
import { redrawDiagram } from "./diagram.js";

export function clearGraphSelection() {
  clearGraphItems(appState);
  redrawDiagram();
}
export function toggleSelectionMode() {
  appState.selectionMode = !appState.selectionMode;
  appState.diagramAddPoint = false;
  if (appState.selectionMode) clearGraphItems(appState);
  redrawDiagram();
}
export function toggleGraphSelection(id) {
  if (!person(id)) return;
  toggleGraphNode(appState, "person", id);
  redrawDiagram();
}

export function applyGraphAnalysis(result, label, focus = false) {
  if (!result?.people?.length) return;
  appState.directConnectionRoot = "";
  appState.graphSelectionAnchor = "";
  if (appState.analysisReturnGroup === null)
    appState.analysisReturnGroup = appState.groupFilter;
  appState.groupFilter = "";
  appState.analysisHighlight = {
    ...result,
    label,
  };
  appState.graphFocus = focus
    ? {
        ...result,
        label,
      }
    : null;
  appState.analysisReveal = new Set(result.relations || []);
  appState.analysisExpandedGroups = new Set(
    appState.project.groups
      .filter((g) =>
        appState.project.people.some(
          (p) =>
            result.people.includes(p.id) && (p.groupIds || []).includes(g.id),
        ),
      )
      .map((g) => g.id),
  );
  clearGraphItems(appState);
  appState.multiSelection = new Set(result.people.filter((id) => person(id)));
  appState.comparisonPath = null;
  appState.view = "tree";
  closeModal();
  render();
  fit();
}
export function hideGraphRelation(id) {
  if (!relation(id)) return;
  resetAnalysis();
  commit(() => {
    const cfg = graphView();
    cfg.hiddenRelations = [...new Set([...cfg.hiddenRelations, id])];
    appState.project.graphView = cfg;
  });
  fit();
}
export function revealGraphRelation(id) {
  if (!relation(id)) return;
  resetAnalysis();
  commit(() => {
    const cfg = graphView();
    cfg.hiddenRelations = cfg.hiddenRelations.filter((v) => v !== id);
    const r = relation(id);
    if (r && !cfg.types.includes(r.type)) cfg.types.push(r.type);
    if (r && !cfg.states.includes(edgeState(r))) cfg.states.push(edgeState(r));
    appState.project.graphView = cfg;
  });
  fit();
}
export function applyGraphPreset(preset) {
  resetAnalysis();
  const cfg = defaultGraphView();
  if (preset === "family")
    cfg.types = ["parent", "spouse", "sibling", "adopted", "step_parent"];
  if (preset === "social") cfg.types = ["spouse", "partner", "acquaintance"];
  if (preset === "proven") cfg.states = ["official"];
  commit(() => (appState.project.graphView = cfg));
  fit();
}
export function showAnalysisResult(index = null, focus = false) {
  if (!appState.analysisResult) return;
  const { result, mode, from, to, seeds } = appState.analysisResult;
  const value = index !== null ? result.paths[index] : result;
  if (!value) return;
  const seedIds =
      mode === "network" ? seeds : mode === "neighbors" ? [from] : [from, to],
    label =
      mode === "path"
        ? translate("ui.pathBetweenPeople")
        : mode === "neighbors"
          ? translate("ui.personSNeighborhood")
          : mode === "common"
            ? translate("ui.commonConnections")
            : translate("ui.connectingNetwork");
  applyGraphAnalysis(
    {
      ...value,
      seedIds,
    },
    label,
    focus,
  );
  appState.multiSelection = new Set(seedIds);
  renderGraph();
  renderGraphControls();
}
