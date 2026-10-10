import { state as appState } from "../core/state.js";
import { dataUrl } from "../core/utils.js";
import { bounds } from "./camera.js";
import { exportLineLegend } from "./legend.js";
import { filteredGraphNodes } from "./node-data.js";
import { graphDefs, renderFilteredGraph } from "./render.js";
import { svgText } from "./text.js";
import { translate } from "../i18n/index.js";
import { relationShown, visiblePeople } from "../model/graph-view.js";
import { withProjectIndex } from "../model/project.js";

export async function fullSVG(scope = "full") {
  const images = {};
  for (const p of appState.project.people)
    if (p.avatarId && appState.blobs.has(p.avatarId))
      images[p.avatarId] = await dataUrl(appState.blobs.get(p.avatarId));
  const previous = appState.exportingDiagram;
  appState.exportingDiagram = scope === "view" ? "view" : "full";
  try {
    return withProjectIndex(() => {
      const b = bounds(),
        ns = filteredGraphNodes(),
        width = Math.ceil(Math.max(750, b.w + 12)),
        legend = exportLineLegend(width, b.h + 120),
        height = Math.ceil(b.h + 120 + legend.height + 18),
        people =
          scope === "view"
            ? visiblePeople(false).length
            : appState.project.people.length,
        ids = new Set(
          (scope === "view"
            ? visiblePeople(false)
            : appState.project.people
          ).map((p) => p.id),
        ),
        relations = appState.project.relations.filter(
          (r) => ids.has(r.from) && ids.has(r.to) && relationShown(r),
        ).length,
        sources = ns.filter((n) => n.kind === "document").length;
      const subtitle = `${scope === "view" ? translate("ui.currentMap2") : translate("ui.fullTree")} · ${people} ${translate("ui.people2")} ${relations} ${translate("ui.relationships")}${appState.showDocs ? " · " + sources + ` ${translate("ui.sources")}` : ""}${appState.project.demo ? ` ${translate("ui.fictionalDemoData")}` : ""}`;
      return {
        width,
        height,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${graphDefs()}</defs><rect width="100%" height="100%" fill="#fff"/>${svgText(appState.project.title, 38, 42, 90, 1, 26, "#081f3c", 600)}${svgText(subtitle, 38, 69, 120, 1, 13, "#3e516c", 400)}<g transform="translate(${-b.x + 6} ${105 - b.y})">${renderFilteredGraph(images, true)}</g>${legend.markup}</svg>`,
      };
    });
  } finally {
    appState.exportingDiagram = previous;
  }
}
