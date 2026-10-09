import { PERSON_CARD_HEIGHT, PERSON_CARD_WIDTH } from "../../core/config.js";

/** Translate a partial arrangement without moving or covering hidden cards. */
export function positionScopedLayout(positions, project, scope) {
  if (!positions.size) return positions;
  const root = project.people.find((p) => p.id === scope.rootId),
    rootPosition = positions.get(scope.rootId),
    left = Math.min(...[...positions.values()].map((p) => p.x)),
    top = Math.min(...[...positions.values()].map((p) => p.y)),
    width =
      Math.max(...[...positions.values()].map((p) => p.x)) -
      left +
      PERSON_CARD_WIDTH,
    height =
      Math.max(...[...positions.values()].map((p) => p.y)) -
      top +
      PERSON_CARD_HEIGHT,
    preferred = {
      x: root.x - rootPosition.x + left,
      y: root.y - rootPosition.y + top,
    },
    obstacles = [
      ...project.people
        .filter((p) => !scope.people.has(p.id))
        .map((p) => ({ ...p, w: PERSON_CARD_WIDTH, h: PERSON_CARD_HEIGHT })),
      ...project.documents.map((d, i) => ({
        x: Number.isFinite(d.x) ? d.x : 40 + i * 255,
        y: Number.isFinite(d.y) ? d.y : 780,
        w: 228,
        h: 128,
      })),
      ...project.property.map((a, i) => ({
        x: Number.isFinite(a.x) ? a.x : 680,
        y: Number.isFinite(a.y) ? a.y : 65 + i * 180,
        w: 245,
        h: 128,
      })),
    ],
    gap = 48,
    free = (p) =>
      obstacles.every(
        (o) =>
          p.x + width + gap <= o.x ||
          o.x + o.w + gap <= p.x ||
          p.y + height + gap <= o.y ||
          o.y + o.h + gap <= p.y,
      ),
    candidates = [
      preferred,
      ...obstacles.flatMap((o) => [
        { x: o.x - width - gap, y: preferred.y },
        { x: o.x + o.w + gap, y: preferred.y },
        { x: preferred.x, y: o.y - height - gap },
        { x: preferred.x, y: o.y + o.h + gap },
      ]),
    ];
  candidates.sort(
    (a, b) =>
      Math.hypot(a.x - preferred.x, a.y - preferred.y) -
      Math.hypot(b.x - preferred.x, b.y - preferred.y),
  );
  const origin = candidates.find(free);
  return new Map(
    [...positions].map(([id, p]) => [
      id,
      { x: p.x + origin.x - left, y: p.y + origin.y - top },
    ]),
  );
}
