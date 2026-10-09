import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../../core/config.js";
import { constrainedPlacement } from "../../model/constrained-placement.js";
import { nodePlacementLocked } from "../../model/placement-locks.js";

/** Resolve movable layout proposals around fixed cards, including cards outside the active scope. */
export function avoidLockedCards(project, scope) {
  if (!project.placementLocks?.nodes.length) return;
  const items = [],
    hidden = new Set();
  for (const group of project.groups.filter((g) => g.collapsed)) {
    const members = project.people.filter(
      (p) => p.groupIds?.includes(group.id) && !hidden.has(p.id),
    );
    if (!members.length) continue;
    members.forEach((p) => hidden.add(p.id));
    items.push({
      id: "group:" + group.id,
      kind: "group",
      item: group,
      members,
      x: Number.isFinite(group.x)
        ? group.x
        : Math.min(...members.map((p) => p.x)),
      y: Number.isFinite(group.y)
        ? group.y
        : Math.min(...members.map((p) => p.y)),
      w: PERSON_CARD_WIDTH,
      h: 130,
      locked: nodePlacementLocked(project, "group", group.id) || !!scope,
    });
  }
  for (const [kind, list, w, h] of [
    ["person", "people", PERSON_CARD_WIDTH, PERSON_CARD_HEIGHT],
    ["document", "documents", 228, 128],
    ["property", "property", 245, 128],
  ])
    for (const item of project[list]) {
      if (kind === "person" && hidden.has(item.id)) continue;
      items.push({
        id: kind + ":" + item.id,
        kind,
        item,
        x: item.x,
        y: item.y,
        w,
        h,
        locked:
          nodePlacementLocked(project, kind, item.id) ||
          (scope && (kind !== "person" || !scope.people.has(item.id))),
      });
    }
  const positions = constrainedPlacement(items);
  for (const entry of items) {
    if (entry.locked) continue;
    const next = positions.get(entry.id);
    if (entry.kind === "group")
      for (const member of entry.members) {
        member.x += next.x - entry.x;
        member.y += next.y - entry.y;
      }
    Object.assign(entry.item, next);
  }
}
