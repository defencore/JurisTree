import { translate } from "../i18n/index.js";
const valid = (p) => Math.abs(p.x) <= 100000 && Math.abs(p.y) <= 100000;
const overlaps = (a, b, gap) =>
  a.x < b.x + b.w + gap &&
  a.x + a.w + gap > b.x &&
  a.y < b.y + b.h + gap &&
  a.y + a.h + gap > b.y;

/** Find nearby free positions without moving fixed obstacles. Coordinates stay within archive limits. */
export function constrainedPlacement(items, gap = 24) {
  const result = new Map(
      items.map((item) => [item.id, { x: item.x, y: item.y }]),
    ),
    occupied = items.filter((item) => item.locked).map((item) => ({ ...item }));
  for (const item of items.filter((item) => !item.locked)) {
    const pending = [{ x: item.x, y: item.y }],
      seen = new Set();
    let chosen = null;
    for (let attempt = 0; pending.length && attempt < 512; attempt++) {
      pending.sort(
        (a, b) =>
          Math.hypot(a.x - item.x, a.y - item.y) -
          Math.hypot(b.x - item.x, b.y - item.y),
      );
      const point = pending.shift(),
        signature = point.x + ":" + point.y;
      if (!valid(point) || seen.has(signature)) continue;
      seen.add(signature);
      const collisions = occupied.filter((box) =>
        overlaps({ ...item, ...point }, box, gap),
      );
      if (!collisions.length) {
        chosen = point;
        break;
      }
      for (const box of collisions)
        pending.push(
          { x: box.x - item.w - gap, y: point.y },
          { x: box.x + box.w + gap, y: point.y },
          { x: point.x, y: box.y - item.h - gap },
          { x: point.x, y: box.y + box.h + gap },
        );
    }
    if (!chosen) {
      // A clear shelf provides a deterministic escape from densely packed obstacles.
      const point = {
        x: item.x,
        y: Math.max(item.y, ...occupied.map((box) => box.y + box.h + gap)),
      };
      if (valid(point)) chosen = point;
      else throw Error(translate("ui.noSpaceForLayout"));
    }
    result.set(item.id, chosen);
    occupied.push({ ...item, ...chosen });
  }
  return result;
}
