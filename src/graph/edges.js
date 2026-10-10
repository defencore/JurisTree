import { diagramKey, diagramRoute } from "../model/diagram.js";
import {
  routedConnector,
  routeLabelPosition,
} from "../model/connector-path.js";
import {
  connectorAttributes,
  connectorLabel,
  reportRouteBounds,
} from "./diagram-markup.js";
import { workspaceModes } from "../core/workspace-modes.js";
import { relTypes } from "../core/config.js";
import { esc } from "../core/dom.js";
import {
  isDirectedRelationship,
  isProfessionalRelationship,
} from "../core/professional-relationships.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { edgeState, route } from "../model/evidence.js";
import {
  directConnectionScope,
  fullDiagram,
  graphView,
  relationShown,
} from "../model/graph-view.js";
import { person } from "../model/lookup.js";
import {
  relationshipLabel,
  relationshipPeriod,
} from "../model/relationship-labels.js";
import { graphLine } from "./geometry.js";
import { graphStrokeAttributes } from "./legend.js";
import { graphTextWidth, svgText } from "./text.js";

export function renderGraphEdges(ns, exporting = false, boxes = null) {
  const map = new Map(ns.map((n) => [n.id, n]));
  ns.filter((n) => n.kind === "group").forEach((n) =>
    n.members.forEach((id) => map.set(id, n)),
  );
  const full = fullDiagram(),
    cfg = graphView(),
    direct = !full && directConnectionScope(),
    highlight = full ? null : direct || appState.analysisHighlight,
    path = direct
      ? { relations: [...direct.relations] }
      : highlight || appState.comparisonPath || route(),
    seen = new Set();
  const pairs = new Map();
  for (const r of appState.project.relations) {
    if (!relationShown(r, full)) continue;
    const a = map.get(r.from),
      b = map.get(r.to);
    if (!a || !b || a.id === b.id || a.kind === "group" || b.kind === "group")
      continue;
    const key = [a.id, b.id].sort().join("|");
    if (!pairs.has(key)) pairs.set(key, []);
    pairs.get(key).push(r);
  }
  let edges = "",
    labels = "";
  for (const r of appState.project.relations) {
    if (!relationShown(r, full)) continue;
    const a = map.get(r.from),
      b = map.get(r.to);
    if (!a || !b || a.id === b.id) continue;
    const pairKey = a.id + "|" + b.id + "|" + r.type;
    if ((a.kind === "group" || b.kind === "group") && seen.has(pairKey))
      continue;
    seen.add(pairKey);
    const episodes = pairs.get([a.id, b.id].sort().join("|")) || [r];
    const offset = Math.max(
      -60,
      Math.min(60, (episodes.indexOf(r) - (episodes.length - 1) / 2) * 28),
    );
    const direction = isDirectedRelationship(r.type),
      key = diagramKey("r", r.id),
      route = diagramRoute(appState.project, key),
      c = routedConnector(a, b, route, graphLine(a, b, !direction, offset)),
      state = edgeState(r),
      onpath = (path.relations || []).includes(r.id),
      active =
        !exporting &&
        ((appState.selected?.kind === "relation" &&
          appState.selected.id === r.id) ||
          appState.diagramLabelSelection.has(key)),
      near =
        !exporting &&
        appState.selected?.kind === "person" &&
        (r.from === appState.selected.id || r.to === appState.selected.id);
    const label =
      a.kind === "group" || b.kind === "group"
        ? translate("ui.familyConnection")
        : isProfessionalRelationship(r.type)
          ? relTypes()[r.type]
          : r.type === "parent"
            ? person(r.from)?.gender === "f"
              ? translate("ui.mother2")
              : person(r.from)?.gender === "m"
                ? translate("ui.father2")
                : translate("ui.parent2")
            : r.type === "step_parent"
              ? translate("ui.stepParenthood")
              : ["spouse", "partner"].includes(r.type)
                ? relationshipLabel(r)
                : r.type === "sibling"
                  ? relationshipLabel(r).toLocaleLowerCase()
                  : r.type === "adopted"
                    ? translate("ui.adoption2")
                    : r.type === "acquaintance"
                      ? translate("ui.acquaintance2")
                      : translate("ui.possibleConnection");
    const period =
        a.kind === "group" || b.kind === "group" ? "" : relationshipPeriod(r),
      heights = episodes.map((episode) =>
        a.kind !== "group" && b.kind !== "group" && relationshipPeriod(episode)
          ? 46
          : 22,
      ),
      index = episodes.indexOf(r),
      precedingHeight = heights
        .slice(0, index)
        .reduce((sum, height) => sum + height + 6, 0),
      totalHeight =
        heights.reduce((sum, height) => sum + height, 0) +
        (heights.length - 1) * 6,
      width =
        Math.max(
          graphTextWidth(label, 14, 400),
          graphTextWidth(period, 12, 400),
        ) + 16,
      horizontal = !direction && Math.abs(a.y - b.y) < 70,
      ly =
        horizontal && Math.abs(b.x - a.x) - (a.w + b.w) / 2 < width + 12
          ? Math.min(a.y, b.y) + 5 - totalHeight + precedingHeight
          : c.y -
            (Math.abs(a.y - b.y) < 70 ? offset : 0) +
            precedingHeight +
            heights[index] / 2 -
            totalHeight / 2 +
            (direction && episodes.length === 1
              ? a.x < b.x
                ? -12
                : a.x > b.x
                  ? 12
                  : 0
              : 0),
      opacity = highlight && !onpath ? 0.22 : 1;
    const position = routeLabelPosition(
        route,
        { x: c.x, y: ly },
        width,
        period ? 46 : 22,
      ),
      lx = position.x,
      labelY = position.y,
      box = {
        x: lx - width / 2,
        y: labelY - 10,
        w: width,
        h: period ? 46 : 22,
      },
      showLabel =
        full ||
        direct ||
        cfg.showLabels ||
        (!exporting &&
          appState.diagramEditing &&
          appState.diagramConnectionKey === key);
    reportRouteBounds(route, boxes);
    if (showLabel && boxes) boxes.push(box);
    const caption =
      person(r.from)?.name + " — " + label + " — " + person(r.to)?.name;
    edges += `<g class="edge" data-edge="${r.id}" ${connectorAttributes(key, a, b, caption)} ${direct && onpath ? 'data-direct-connection="true"' : ""} role="button" tabindex="0" opacity="${opacity}" aria-label="${esc(caption + (period ? " · " + period : ""))}"><path d="${c.path}" fill="none" stroke="transparent" stroke-width="18" vector-effect="non-scaling-stroke"/>${onpath || active || (!exporting && appState.diagramEditing && appState.diagramConnectionKey === key) ? `<path d="${c.path}" fill="none" stroke="#d5deea" stroke-width="8" stroke-linecap="round"/>` : ""}<path class="connector-path" d="${c.path}" fill="none" ${graphStrokeAttributes(state, near || onpath || active ? 2.6 : 1.7)} ${direction ? `marker-end="url(#arrow-${state})"` : ""}/></g>`;
    if (showLabel)
      labels += `<g opacity="${opacity}">${connectorLabel(key, box, `<g class="relationship-title">${svgText(label, lx - width / 2 + 8, labelY + 5, 38, 1, 14, near ? "#081f3c" : "#3e516c", 400, width - 16)}</g>${period ? `<g class="relationship-period">${svgText(period, lx - width / 2 + 8, labelY + 27, 60, 1, 12, "#3e516c", 400, width - 16)}</g>` : ""}`, exporting)}</g>`;
  }
  if (appState.showDocs && (full || cfg.documentLinks))
    for (const d of appState.project.documents) {
      const n = map.get(d.id);
      if (!n) continue;
      const linked = new Set();
      for (const id of d.people) {
        const p = map.get(id);
        if (!p || linked.has(p.id)) continue;
        linked.add(p.id);
        const key = diagramKey("d", d.id, id),
          route = diagramRoute(appState.project, key),
          c = routedConnector(n, p, route, graphLine(n, p));
        reportRouteBounds(route, boxes);
        const showLabel =
            route.label ||
            (!exporting &&
              appState.diagramEditing &&
              appState.diagramConnectionKey === key),
          width = Math.min(340, graphTextWidth(d.title, 12, 400) + 16),
          position = routeLabelPosition(route, c, width),
          lx = position.x,
          ly = position.y,
          box = { x: lx - width / 2, y: ly - 10, w: width, h: 22 };
        if (showLabel && boxes) boxes.push(box);
        edges += `<g class="connector" ${connectorAttributes(key, n, p, d.title)} opacity="${highlight ? 0.3 : 1}"><path d="${c.path}" fill="none" stroke="transparent" stroke-width="18" vector-effect="non-scaling-stroke"/><path class="connector-path" d="${c.path}" fill="none" ${graphStrokeAttributes("source")}/></g>`;
        if (showLabel)
          labels += `<g opacity="${highlight ? 0.3 : 1}">${connectorLabel(key, box, svgText(d.title, lx - width / 2 + 8, ly + 5, 40, 1, 12, "#3e516c", 400, width - 16), exporting)}</g>`;
      }
    }
  if (
    workspaceModes()[appState.project.purpose].propertyMap &&
    (full || cfg.propertyLinks)
  )
    for (const a of appState.project.property) {
      const n = map.get(a.id);
      if (!n) continue;
      for (const al of a.allocations || []) {
        const p = map.get(al.personId);
        if (!p) continue;
        const key = diagramKey("p", a.id, al.personId),
          route = diagramRoute(appState.project, key),
          c = routedConnector(n, p, route, graphLine(n, p)),
          label = al.percent + "%",
          width = graphTextWidth(label, 13, 600) + 16,
          position = routeLabelPosition(route, c, width),
          lx = position.x,
          ly = position.y,
          box = { x: lx - width / 2, y: ly - 10, w: width, h: 22 };
        reportRouteBounds(route, boxes);
        if (boxes) boxes.push(box);
        edges += `<g class="connector" ${connectorAttributes(key, n, p, a.title || label)}><path d="${c.path}" fill="none" stroke="transparent" stroke-width="18" vector-effect="non-scaling-stroke"/><path class="connector-path" d="${c.path}" fill="none" ${graphStrokeAttributes("property")}/></g>`;
        labels += connectorLabel(
          key,
          box,
          svgText(
            label,
            lx - width / 2 + 8,
            ly + 5,
            12,
            1,
            13,
            "#28644a",
            600,
            width - 16,
          ),
          exporting,
        );
      }
    }
  return edges + labels;
}
