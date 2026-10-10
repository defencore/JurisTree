import { connectorPlacementLocked } from "../model/placement-locks.js";
import { diagramRoute } from "../model/diagram.js";
import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { theme } from "../core/theme.js";
import { translate } from "../i18n/index.js";
import {
  directConnectionScope,
  fullDiagram,
  groupIsCollapsed,
} from "../model/graph-view.js";
import { svgIcon } from "../ui/icons.js";
import { groupFrames } from "./group-frames.js";
import { graphTextWidth, svgText } from "./text.js";

function groupOpacity(group) {
  const direct = !fullDiagram() && directConnectionScope();
  return direct &&
    !state.project.people.some(
      (person) =>
        direct.people.has(person.id) && person.groupIds?.includes(group.id),
    )
    ? 0.3
    : 1;
}

export function visibleGroupFrames(nodes) {
  const groups = state.project.groups.filter(
    (group) => fullDiagram() || !groupIsCollapsed(group),
  );
  return groupFrames(
    groups,
    nodes,
    (group, count) => graphTextWidth(`${group.name} · ${count}`, 13, 700),
    (group) => diagramRoute(state.project, "g:" + group.id).label,
  );
}

export function groupBackdrop(frames) {
  return frames
    .map(
      ({ group, x, y, w, h }) =>
        `<g class="group-background" opacity="${groupOpacity(group)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${theme.bg}" fill-opacity=".6" stroke="${group.color}" stroke-opacity=".18" stroke-dasharray="6 5"/></g>`,
    )
    .join("");
}

export function groupHeadings(frames, exporting = false) {
  return frames
    .map(({ group, count, header: { x, y, w, h } }) => {
      const label = `${group.name} · ${count}`,
        locked = connectorPlacementLocked(state.project, "g:" + group.id);
      return `<g class="group-heading ${!exporting && state.diagramLabelSelection.has("g:" + group.id) ? "diagram-label-selected" : ""}" data-placement-locked="${locked}" data-route-label="g:${group.id}" data-label-x="${x + w / 2}" data-label-y="${y + 10}" data-label-width="${w}" data-label-height="${h}" opacity="${groupOpacity(group)}" data-toggle-group="${group.id}" tabindex="0" role="button" aria-label="${esc(translate("ui.collapseGroup") + " " + group.name)}"><title>${esc(label)}</title><rect class="group-heading-background" x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${theme.bg}" stroke="${group.color}" stroke-opacity=".18"/>${svgIcon(locked && !exporting ? "lock" : "users", x + 8, y + 8, group.color, 0.7)}${svgText(label, x + 32, y + 21, 150, 1, 13, group.color, 700, w - 64)}${svgIcon("fold", x + w - 24, y + 8, group.color, 0.65)}</g>`;
    })
    .join("");
}
