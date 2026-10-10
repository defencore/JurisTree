import { translate } from "../../i18n/index.js";
import { clone } from "../../core/utils.js";
import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../../core/config.js";
import { constrainedPlacement } from "../../model/constrained-placement.js";
import {
  connectorPlacementLocked,
  pinLockedGroupAnchors,
} from "../../model/placement-locks.js";
import { diagramRoute } from "../../model/diagram.js";
import { positionBounds } from "./shapes.js";

const overlaps = (a, b, gap = 24) =>
  a.x < b.x + b.w + gap &&
  a.x + a.w + gap > b.x &&
  a.y < b.y + b.h + gap &&
  a.y + a.h + gap > b.y;

/** Keep a shape intact whenever a nearby free translation exists. */
function translateLayout(nodes, positions, obstacles, incremental) {
  if (incremental) return positions;
  const current = positionBounds(
      nodes,
      new Map(nodes.map((node) => [node.key, node])),
    ),
    proposed = positionBounds(nodes, positions),
    fixed = nodes.filter((node) => node.locked),
    offset = fixed.length
      ? {
          x:
            fixed.reduce(
              (sum, node) => sum + node.x - positions.get(node.key).x,
              0,
            ) / fixed.length,
          y:
            fixed.reduce(
              (sum, node) => sum + node.y - positions.get(node.key).y,
              0,
            ) / fixed.length,
        }
      : {
          x: current.x + current.w / 2 - proposed.x - proposed.w / 2,
          y: current.y + current.h / 2 - proposed.y - proposed.h / 2,
        },
    movers = nodes.filter((node) => !node.locked),
    candidates = [offset];
  for (const box of obstacles)
    candidates.push(
      { x: box.x - proposed.x - proposed.w - 48, y: offset.y },
      { x: box.x + box.w - proposed.x + 48, y: offset.y },
      { x: offset.x, y: box.y - proposed.y - proposed.h - 48 },
      { x: offset.x, y: box.y + box.h - proposed.y + 48 },
    );
  candidates.sort(
    (a, b) =>
      Math.hypot(a.x - offset.x, a.y - offset.y) -
      Math.hypot(b.x - offset.x, b.y - offset.y),
  );
  const chosen =
    candidates.slice(0, 128).find((candidate) =>
      movers.every((node) => {
        const point = positions.get(node.key),
          box = { ...node, x: point.x + candidate.x, y: point.y + candidate.y };
        return (
          Math.abs(box.x) <= 100000 &&
          Math.abs(box.y) <= 100000 &&
          obstacles.every((obstacle) => !overlaps(box, obstacle))
        );
      }),
    ) || offset;
  return new Map(
    nodes.map((node) => {
      const p = positions.get(node.key);
      return [node.key, { x: p.x + chosen.x, y: p.y + chosen.y }];
    }),
  );
}

/** Apply only the resolved nodes; outsiders and placement locks are immutable obstacles. */
export function applyLayout(start, input, proposed, style, cfg) {
  const project = clone(start);
  pinLockedGroupAnchors(project);
  const selected = new Map(input.nodes.map((node) => [node.key, node])),
    covered = new Set(),
    fixedMembers = new Set(),
    items = [];
  for (const raw of input.shown.filter((node) => node.kind === "group")) {
    const node = selected.get("group:" + raw.id) || {
      ...raw,
      key: "group:" + raw.id,
      locked: true,
    };
    node.members.forEach((id) => {
      covered.add(id);
      if (node.locked) fixedMembers.add(id);
    });
    items.push({
      ...node,
      id: node.key,
      item: project.groups.find((group) => group.id === node.id),
    });
  }
  for (const [kind, list, w, h] of [
    ["person", "people", PERSON_CARD_WIDTH, PERSON_CARD_HEIGHT],
    ["document", "documents", 228, 128],
    ["property", "property", 245, 128],
  ])
    project[list].forEach((item, index) => {
      // Reserve fixed members even while collapsed so expansion cannot cover them with newly arranged cards.
      if (
        kind === "person" &&
        covered.has(item.id) &&
        !fixedMembers.has(item.id)
      )
        return;
      const key = kind + ":" + item.id,
        node = selected.get(key);
      items.push({
        id: key,
        key,
        kind,
        item,
        w,
        h,
        x:
          node?.x ??
          (Number.isFinite(item.x)
            ? item.x
            : kind === "document"
              ? 40 + index * 255
              : 680),
        y:
          node?.y ??
          (Number.isFinite(item.y)
            ? item.y
            : kind === "document"
              ? 780
              : 65 + index * 180),
        locked: !node || node.locked,
      });
    });
  const obstacles = items.filter((item) => item.locked),
    translated = translateLayout(
      input.nodes,
      proposed,
      obstacles,
      style === "incremental",
    );
  for (const item of items)
    if (!item.locked) Object.assign(item, translated.get(item.key));
  const positions = constrainedPlacement(items);
  for (const item of items) {
    if (item.locked) continue;
    const next = positions.get(item.id);
    if (item.kind === "group")
      for (const person of project.people.filter((person) =>
        item.members.includes(person.id),
      )) {
        person.x = Math.round(person.x + next.x - selected.get(item.key).x);
        person.y = Math.round(person.y + next.y - selected.get(item.key).y);
        if (
          ![person.x, person.y].every(
            (value) => Number.isFinite(value) && Math.abs(value) <= 100000,
          )
        )
          throw Error(translate("ui.noSpaceForLayout"));
      }
    Object.assign(item.item, { x: Math.round(next.x), y: Math.round(next.y) });
  }
  if (style === "orthogonal")
    for (const link of input.links) {
      if (connectorPlacementLocked(project, link.key)) continue;
      const route = diagramRoute(project, link.key);
      if (route.style === "auto") {
        project.diagram ||= {};
        project.diagram[link.key] = { ...clone(route), style: "orthogonal" };
      }
    }
  project.graphView = { ...cfg, layout: style };
  return project;
}
