import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { theme } from "../core/theme.js";
import { translate } from "../i18n/index.js";
import { fullDiagram } from "../model/graph-view.js";
import { svgIcon } from "../ui/icons.js";
import { groupFrames } from "./group-frames.js";
import { graphTextWidth, svgText } from "./text.js";

export function visibleGroupFrames(nodes) {
  const groups = state.project.groups.filter(
    (group) =>
      fullDiagram() ||
      !group.collapsed ||
      state.analysisExpandedGroups.has(group.id),
  );
  return groupFrames(groups, nodes, (group, count) =>
    graphTextWidth(`${group.name} · ${count}`, 13, 700),
  );
}

export function groupBackdrop(frames) {
  return frames
    .map(
      ({ group, x, y, w, h }) =>
        `<g class="group-background"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${theme.bg}" fill-opacity=".6" stroke="${group.color}" stroke-opacity=".18" stroke-dasharray="6 5"/></g>`,
    )
    .join("");
}

export function groupHeadings(frames) {
  return frames
    .map(({ group, count, header: { x, y, w, h } }) => {
      const label = `${group.name} · ${count}`;
      return `<g class="group-heading" data-toggle-group="${group.id}" tabindex="0" role="button" aria-label="${esc(translate("ui.collapseGroup") + " " + group.name)}" style="cursor:pointer"><title>${esc(label)}</title><rect class="group-heading-background" x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${theme.bg}" stroke="${group.color}" stroke-opacity=".18"/>${svgIcon("users", x + 8, y + 8, group.color, 0.7)}${svgText(label, x + 32, y + 21, 150, 1, 13, group.color, 700, w - 64)}${svgIcon("fold", x + w - 24, y + 8, group.color, 0.65)}</g>`;
    })
    .join("");
}
