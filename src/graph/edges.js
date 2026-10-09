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
import { relationshipLabel } from "../model/relationship-labels.js";
import { graphLine } from "./geometry.js";
import { graphStrokeAttributes } from "./legend.js";
import { graphTextWidth, svgText } from "./text.js";

export function renderGraphEdges(ns, exporting = false) {
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
  let edges = "";
  for (const r of appState.project.relations) {
    if (!relationShown(r, full)) continue;
    const a = map.get(r.from),
      b = map.get(r.to);
    if (!a || !b || a.id === b.id) continue;
    const key = a.id + "|" + b.id + "|" + r.type;
    if ((a.kind === "group" || b.kind === "group") && seen.has(key)) continue;
    seen.add(key);
    const episodes = pairs.get([a.id, b.id].sort().join("|")) || [r];
    const offset = Math.max(
      -60,
      Math.min(60, (episodes.indexOf(r) - (episodes.length - 1) / 2) * 28),
    );
    const direction = isDirectedRelationship(r.type),
      c = graphLine(a, b, !direction, offset),
      state = edgeState(r),
      onpath = (path.relations || []).includes(r.id),
      active =
        !exporting &&
        appState.selected?.kind === "relation" &&
        appState.selected.id === r.id,
      near =
        !exporting &&
        appState.selected?.kind === "person" &&
        (r.from === appState.selected.id || r.to === appState.selected.id);
    const label =
      a.kind === "group" || b.kind === "group"
        ? translate("ui.familyConnection")
        : isProfessionalRelationship(r.type)
          ? relTypes()[r.type] +
            (r.fromDate || r.toDate
              ? ` · ${r.fromDate || "…"}–${r.toDate || "…"}`
              : "")
          : r.type === "parent"
            ? person(r.from)?.gender === "f"
              ? translate("ui.mother2")
              : person(r.from)?.gender === "m"
                ? translate("ui.father2")
                : translate("ui.parent2")
            : r.type === "step_parent"
              ? translate("ui.stepParenthood")
              : ["spouse", "partner"].includes(r.type)
                ? relationshipLabel(r) +
                  (r.fromDate || r.toDate
                    ? ` · ${r.fromDate || "…"}–${r.toDate || "…"}`
                    : "")
                : r.type === "sibling"
                  ? translate("ui.sibling2")
                  : r.type === "adopted"
                    ? translate("ui.adoption2")
                    : r.type === "acquaintance"
                      ? translate("ui.acquaintance2")
                      : translate("ui.possibleConnection");
    const width = graphTextWidth(label, 14, 400) + 16,
      horizontal = !direction && Math.abs(a.y - b.y) < 70,
      ly =
        horizontal && Math.abs(b.x - a.x) - (a.w + b.w) / 2 < width + 12
          ? Math.min(a.y, b.y) - 17
          : c.y + (direction ? (a.x < b.x ? -12 : a.x > b.x ? 12 : 0) : 0),
      opacity = highlight && !onpath ? 0.22 : 1;
    edges += `<g class="edge" data-edge="${r.id}" ${direct ? 'data-direct-connection="true"' : ""} role="button" tabindex="0" opacity="${opacity}" aria-label="${esc(person(r.from)?.name + " — " + label + " — " + person(r.to)?.name)}"><path d="${c.path}" fill="none" stroke="transparent" stroke-width="18"/>${onpath || active ? `<path d="${c.path}" fill="none" stroke="#d5deea" stroke-width="8" stroke-linecap="round"/>` : ""}<path d="${c.path}" fill="none" ${graphStrokeAttributes(state, near || onpath || active ? 2.6 : 1.7)} ${direction ? `marker-end="url(#arrow-${state})"` : ""}/>${full || direct || cfg.showLabels ? `<rect x="${c.x - width / 2}" y="${ly - 10}" width="${width}" height="22" rx="3" fill="#fff" fill-opacity=".95"/>${svgText(label, c.x - width / 2 + 8, ly + 5, 38, 1, 14, near ? "#081f3c" : "#3e516c", 400, width - 16)}` : ""}</g>`;
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
        const c = graphLine(n, p);
        edges += `<path d="${c.path}" fill="none" ${graphStrokeAttributes("source")} opacity="${highlight ? 0.3 : 1}"/>`;
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
        const c = graphLine(n, p);
        edges += `<path d="${c.path}" fill="none" ${graphStrokeAttributes("property")}/>${svgText(al.percent + "%", c.x, c.y, 12, 1, 13, "#28644a", 600)}`;
      }
    }
  return edges;
}
