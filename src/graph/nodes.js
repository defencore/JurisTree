import { getLocale, translate } from "../i18n/index.js";
import {
  PERSON_CARD_WIDTH,
  PERSON_CARD_HEIGHT,
  docStates,
} from "../core/config.js";
import { esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { fullDiagram, visiblePeople } from "./analysis.js";
import { graphRole } from "./roles.js";
import { svgText } from "./text.js";
import { years } from "../model/dates.js";
import { theme } from "../core/theme.js";
import { personCard, personCardActions } from "./cards/person.js";
import { personStatusBadges } from "../ui/person-status.js";
import { requirements, hasFile, sourceInScope } from "../model/evidence.js";
import { person } from "../model/project.js";
import { documentIcon } from "../ui/components.js";
import { svgIcon } from "../ui/icons.js";
export function nodeSVG(n, images = null, exporting = false) {
  const multi =
      !exporting &&
      (appState.multiSelection.has(n.id) ||
        (n.kind === "group" &&
          n.members.some((id) => appState.multiSelection.has(id)))),
    focus = !fullDiagram() && appState.analysisHighlight?.people.includes(n.id),
    dim =
      !fullDiagram() &&
      appState.analysisHighlight &&
      n.kind === "person" &&
      !focus &&
      !(
        appState.selected?.kind === "person" && appState.selected.id === n.id
      ) &&
      !multi,
    active =
      !exporting &&
      appState.selected?.kind === n.kind &&
      appState.selected.id === n.id,
    role = n.kind === "person" && !exporting ? graphRole(n.id) : null;
  const family = appState.project.groups.find((g) =>
    (n.groupIds || []).includes(g.id),
  );
  let inside = "",
    stroke = active || multi || focus ? "#081f3c" : role?.color || "#d5deea";
  if (n.kind === "person") {
    inside = personCard(n, images, role);
    if (!role && family && !active && !multi && !focus) stroke = family.color;
  } else if (n.kind === "document") {
    const s = docStates()[n.status] || docStates().needs_review,
      c =
        s.tone === "available"
          ? "#28644a"
          : s.tone === "review"
            ? "#6c538f"
            : s.tone === "requested"
              ? "#3e516c"
              : "#8d6b2c";
    inside = `<rect x="15" y="17" width="34" height="40" rx="8" fill="#e7eef6"/>${svgIcon(documentIcon(n), 21, 24, "#3e516c", 0.75)}${svgText(n.title, 59, 32, 22, 2, 14, "#081f3c", 700, n.w - 72)}<path d="M15 80H${n.w - 15}" stroke="#e7eef6"/>${svgIcon(s.icon, 15, 93, c, 0.65)}${svgText(s.label, 37, 106, 23, 1, 14, c, 400, n.w - 50)}${svgText(hasFile(n) ? translate("ui.fileAttached2") : translate("ui.noDigitalCopy2"), 15, 70, 35, 1, 12.5, "#3e516c", 400)}`;
  } else if (n.kind === "group") {
    inside = `<rect x="16" y="17" width="43" height="43" rx="12" fill="${n.color}" fill-opacity=".1"/>${svgIcon("users", 26, 27, n.color, 0.9)}${svgText(n.name, 73, 38, 20, 2, 16, "#081f3c", 700, n.w - 85)}${svgText(
      n.members.length +
        ` ${translate("ui.peopleGaps")} ` +
        n.members
          .map(person)
          .flatMap(requirements)
          .filter((r) => !r.done).length,
      16,
      89,
      34,
      1,
      12.5,
      n.color,
      550,
    )}${svgText(translate("ui.clickToExpand"), 16, 111, 34, 1, 12.5, "#3e516c", 400)}`;
    if (!multi && !focus && !active) stroke = n.color;
  } else {
    inside = `<rect x="16" y="17" width="38" height="42" rx="10" fill="#edf6f0"/>${svgIcon("home", 24, 27, "#28644a", 0.9)}${svgText(n.title, 66, 35, 22, 2, 15)}${svgText(n.value ? new Intl.NumberFormat(getLocale()).format(Number(n.value)) + " " + n.currency : translate("ui.valueNotSpecified"), 16, 94, 31, 1, 13, "#3e516c", 400)}`;
  }
  const actions =
    n.kind === "person" && !exporting ? personCardActions(n, dim) : "";
  const label =
    n.kind === "person"
      ? [n.name, years(n), ...personStatusBadges(n).map((b) => b.label)].join(
          " · ",
        )
      : n.name || n.title;
  return `<g class="node${multi ? " multi" : ""}" opacity="${dim ? 0.3 : 1}" data-node="${n.id}" data-kind="${n.kind}" transform="translate(${n.x} ${n.y})" tabindex="0" role="button" aria-label="${esc(label)}"><rect class="card" width="${n.w}" height="${n.h}" rx="6" fill="${theme.paper}" stroke="${stroke}" stroke-opacity="${active || multi || focus || role ? 1 : 0.6}" stroke-width="${active || multi || focus ? 2.3 : role ? 1.7 : 1}" />${inside}</g>${actions}`;
}

export function groupBackdrop(nodes) {
  return appState.project.groups
    .filter(
      (g) =>
        fullDiagram() ||
        !g.collapsed ||
        appState.analysisExpandedGroups.has(g.id),
    )
    .map((g) => {
      const ps = nodes.filter(
        (n) => n.kind === "person" && (n.groupIds || []).includes(g.id),
      );
      if (!ps.length) return "";
      const x = Math.min(...ps.map((p) => p.x)) - 19,
        y = Math.min(...ps.map((p) => p.y)) - 43,
        w = Math.max(...ps.map((p) => p.x + p.w)) - x + 19,
        h = Math.max(...ps.map((p) => p.y + p.h)) - y + 20;
      return `<g class="group-background"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#f4f7fb" fill-opacity=".6" stroke="${g.color}" stroke-opacity=".18" stroke-dasharray="6 5"/><g data-toggle-group="${g.id}" tabindex="0" role="button" aria-label="${translate("ui.collapseGroup")} ${esc(g.name)}" style="cursor:pointer">${svgIcon("users", x + 16, y + 10, g.color, 0.7)}${svgText(g.name + " · " + ps.length, x + 40, y + 25, 55, 1, 13, g.color, 600)}${svgIcon("fold", x + w - 33, y + 10, g.color, 0.65)}</g></g>`;
    })
    .join("");
}

export function filteredGraphNodes() {
  const full = fullDiagram(),
    shown = visiblePeople(full),
    collapsed = full
      ? []
      : appState.project.groups.filter(
          (g) =>
            g.collapsed &&
            !appState.analysisExpandedGroups.has(g.id) &&
            (!appState.groupFilter || appState.groupFilter === g.id),
        ),
    hidden = new Set(),
    ns = [];
  for (const g of collapsed) {
    const members = shown.filter(
      (p) => (p.groupIds || []).includes(g.id) && !hidden.has(p.id),
    );
    if (!members.length) continue;
    members.forEach((p) => hidden.add(p.id));
    ns.push({
      ...g,
      kind: "group",
      members: members.map((p) => p.id),
      x: Number.isFinite(g.x) ? g.x : Math.min(...members.map((p) => p.x)),
      y: Number.isFinite(g.y) ? g.y : Math.min(...members.map((p) => p.y)),
      w: PERSON_CARD_WIDTH,
      h: 130,
    });
  }
  ns.push(
    ...shown
      .filter((p) => !hidden.has(p.id))
      .map((p) => ({
        ...p,
        kind: "person",
        w: PERSON_CARD_WIDTH,
        h: PERSON_CARD_HEIGHT,
      })),
  );
  const peopleIds = new Set(shown.map((p) => p.id));
  if (appState.showDocs)
    ns.push(
      ...appState.project.documents
        .filter(
          (d) =>
            (full || sourceInScope(d)) &&
            (full ||
              d.people.some((id) => peopleIds.has(id)) ||
              (!appState.groupFilter &&
                !appState.graphFocus &&
                !appState.personFilter.rules.length)),
        )
        .map((d, i) => ({
          ...d,
          kind: "document",
          x: Number.isFinite(d.x) ? d.x : 40 + i * 255,
          y: Number.isFinite(d.y) ? d.y : 780,
          w: 228,
          h: 128,
        })),
    );
  if (appState.project.purpose === "property")
    ns.push(
      ...appState.project.property
        .filter(
          (a) =>
            full ||
            (!appState.graphFocus && !appState.personFilter.rules.length) ||
            peopleIds.has(a.ownerId) ||
            (a.allocations || []).some((x) => peopleIds.has(x.personId)),
        )
        .map((a, i) => ({
          ...a,
          kind: "property",
          x: Number.isFinite(a.x) ? a.x : 680,
          y: Number.isFinite(a.y) ? a.y : 65 + i * 180,
          w: 245,
          h: 128,
        })),
    );
  return ns;
}
