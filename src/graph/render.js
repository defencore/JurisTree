import { $, $$ } from "../core/dom.js";
import { graphStateInfo } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { withProjectIndex } from "../model/project.js";
import { withKinshipIndex } from "../model/kinship-index.js";
import { applyCamera } from "./camera.js";
import { renderGraphControls } from "./controls.js";
import { graphLineStyle, renderGraphLegend } from "./legend.js";
import { filteredGraphNodes, groupBackdrop, nodeSVG } from "./nodes.js";
import { renderGraphEdges } from "./edges.js";
export function renderGraph() {
  if (!appState.project) return;
  return withProjectIndex(renderGraphAll);
}

export function renderGraphAll() {
  renderGraphControls();
  renderGraphLegend();
  $("#graphDefs").innerHTML = graphDefs();
  $("#scene").innerHTML = renderFilteredGraph();
  applyCamera();
  $$('[data-action="undo"]').forEach(
    (b) => (b.disabled = !appState.history.length),
  );
  $$('[data-action="redo"]').forEach(
    (b) => (b.disabled = !appState.future.length),
  );
}

export function graphDefs() {
  return Object.keys(graphStateInfo())
    .map(
      (k) =>
        `<marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="${graphLineStyle(k).color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
    )
    .join("");
}

export function renderFilteredGraph(images = null, exporting = false) {
  return withKinshipIndex(() => renderIndexedGraph(images, exporting));
}
function renderIndexedGraph(images, exporting) {
  const nodes = filteredGraphNodes();
  return (
    groupBackdrop(nodes) +
    renderGraphEdges(nodes, exporting) +
    nodes.map((n) => nodeSVG(n, images, exporting)).join("")
  );
}
