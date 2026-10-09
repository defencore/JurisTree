import { renderDiagramTools } from "../ui/diagram-tools.js";
import { graphView } from "../model/graph-view.js";
import { routeHandles } from "./diagram-markup.js";
import { graphStateInfo } from "../core/config.js";
import { $, $$ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { withKinshipIndex } from "../model/kinship-index.js";
import { withProjectIndex } from "../model/project.js";
import { renderGraphControls } from "../ui/graph-controls.js";
import { applyCamera } from "./camera.js";
import { renderGraphEdges } from "./edges.js";
import { groupBackdrop, groupHeadings, visibleGroupFrames } from "./groups.js";
import { graphLineStyle, renderGraphLegend } from "./legend.js";
import { filteredGraphNodes } from "./node-data.js";
import { nodeSVG } from "./nodes.js";

export function renderGraph() {
  if (!appState.project) return;
  return withProjectIndex(renderGraphAll);
}

export function renderGraphAll() {
  renderGraphControls();
  renderGraphLegend();
  $("#graphDefs").innerHTML = graphDefs();
  $("#scene").innerHTML = renderFilteredGraph() + routeHandles();
  applyCamera();
  renderDiagramTools();
  $$('[data-action="undo"]').forEach(
    (b) => (b.disabled = !appState.history.length),
  );
  $$('[data-action="redo"]').forEach(
    (b) => (b.disabled = !appState.future.length),
  );
}

export function graphDefs() {
  return (
    `<pattern id="diagram-grid" width="${graphView().gridSize}" height="${graphView().gridSize}" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1" fill="#d5deea"/></pattern>` +
    Object.keys(graphStateInfo())
      .map(
        (k) =>
          `<marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="${graphLineStyle(k).color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
      )
      .join("")
  );
}

export function renderFilteredGraph(images = null, exporting = false) {
  return withKinshipIndex(() => renderIndexedGraph(images, exporting));
}
function renderIndexedGraph(images, exporting) {
  const nodes = filteredGraphNodes(),
    frames = visibleGroupFrames(nodes);
  return (
    (!exporting && graphView().showGrid
      ? '<rect class="diagram-grid" x="-100000" y="-100000" width="200000" height="200000" fill="url(#diagram-grid)" pointer-events="none"/>'
      : "") +
    groupBackdrop(frames) +
    renderGraphEdges(nodes, exporting) +
    nodes.map((n) => nodeSVG(n, images, exporting)).join("") +
    groupHeadings(frames, exporting)
  );
}
