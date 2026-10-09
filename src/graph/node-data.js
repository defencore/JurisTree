import { workspaceModes } from "../core/workspace-modes.js";
import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { sourceInScope } from "../model/evidence.js";
import { fullDiagram, visiblePeople } from "../model/graph-view.js";

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
  if (workspaceModes()[appState.project.purpose].propertyMap)
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
