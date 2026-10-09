import { clone } from "../../core/utils.js";
import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../../core/config.js";
import {
  nodePlacementLocked,
  pinLockedGroupAnchors,
} from "../../model/placement-locks.js";
import { avoidLockedCards } from "./locked.js";

/** Resolve a complete placement before committing so layout failures cannot leave partial edits. */
export function layoutProject(
  start,
  positions,
  { cfg, style, scope, groupFilter, direct },
) {
  const project = clone(start),
    person = (id) => project.people.find((p) => p.id === id),
    group = (id) => project.groups.find((g) => g.id === id);

  pinLockedGroupAnchors(project);
  project.graphView = {
    ...cfg,
    layout: style,
  };
  for (const [id, pos] of positions.people) {
    const p = person(id);
    if (p) {
      if (!nodePlacementLocked(project, "person", id)) Object.assign(p, pos);
    } else {
      const g = group(id);
      if (g && !nodePlacementLocked(project, "group", id)) {
        const members = project.people.filter((p) =>
            (p.groupIds || []).includes(id),
          ),
          dx =
            pos.x -
            (Number.isFinite(g.x) ? g.x : Math.min(...members.map((p) => p.x))),
          dy =
            pos.y -
            (Number.isFinite(g.y) ? g.y : Math.min(...members.map((p) => p.y)));
        members.forEach((p) => {
          p.x += dx;
          p.y += dy;
        });
        Object.assign(g, pos);
      }
    }
  }
  if (scope) {
    if (groupFilter && !direct) {
      const selectedGroup = group(groupFilter);
      if (
        selectedGroup &&
        !nodePlacementLocked(project, "group", selectedGroup.id)
      ) {
        selectedGroup.x = null;
        selectedGroup.y = null;
      }
    }
    avoidLockedCards(project, scope);
    return project;
  }
  if (style === "generations") {
    project.groups.forEach((g) => {
      if (!nodePlacementLocked(project, "group", g.id)) {
        g.x = null;
        g.y = null;
      }
    });
    project.documents.forEach((d) => {
      if (!nodePlacementLocked(project, "document", d.id))
        Object.assign(d, positions.documents.get(d.id));
    });
    project.property.forEach((a) => {
      if (!nodePlacementLocked(project, "property", a.id))
        Object.assign(a, positions.property.get(a.id));
    });
  } else {
    const right = Math.max(
        1100,
        ...project.people.map((p) => p.x + PERSON_CARD_WIDTH),
      ),
      bottom = Math.max(
        0,
        ...project.people.map((p) => p.y + PERSON_CARD_HEIGHT),
      ),
      cols = Math.max(1, Math.min(20, Math.floor(right / 265)));
    project.documents.forEach((d, i) => {
      if (!nodePlacementLocked(project, "document", d.id))
        Object.assign(d, {
          x: 55 + (i % cols) * 265,
          y: bottom + 100 + Math.floor(i / cols) * 170,
        });
    });
    project.property.forEach((a, i) => {
      if (!nodePlacementLocked(project, "property", a.id))
        Object.assign(a, {
          x: 55 + (i % cols) * 265,
          y:
            bottom +
            100 +
            Math.ceil(project.documents.length / cols) * 170 +
            Math.floor(i / cols) * 170,
        });
    });
  }
  avoidLockedCards(project, null);
  return project;
}
