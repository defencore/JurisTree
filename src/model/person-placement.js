import {
  PERSON_CARD_WIDTH as w,
  PERSON_CARD_HEIGHT as h,
} from "../core/config.js";

const gap = 32;

export function viewportPersonPosition(camera, width, height) {
  return {
    x: (width / 2 - camera.x) / camera.z - w / 2,
    y: (height / 2 - camera.y) / camera.z - h / 2,
  };
}

export function relatedPersonPosition(people, links, personId, fallback) {
  const parenthood = ["parent", "adopted", "step_parent"];
  const incoming = links.filter(
    (r) => r.to === personId && parenthood.includes(r.type),
  );
  const outgoing = links.filter(
    (r) => r.from === personId && parenthood.includes(r.type),
  );
  const anchors = (
    incoming.length ? incoming : outgoing.length ? outgoing : links
  )
    .map((r) =>
      people.find((p) => p.id === (r.from === personId ? r.to : r.from)),
    )
    .filter(Boolean);
  if (!anchors.length) return fallback;
  const x = anchors.reduce((sum, p) => sum + p.x, 0) / anchors.length;
  const y = anchors.reduce((sum, p) => sum + p.y, 0) / anchors.length;
  return incoming.length
    ? { x, y: y + h + gap * 2 }
    : outgoing.length
      ? { x, y: y - h - gap * 2 }
      : { x: x + w + gap, y };
}

/** Search outward from the current view or relatives without moving existing cards. */
export function freePersonPosition(preferred, obstacles) {
  const free = (p) =>
    obstacles.every(
      (o) =>
        p.x + w + gap <= o.x ||
        o.x + o.w + gap <= p.x ||
        p.y + h + gap <= o.y ||
        o.y + o.h + gap <= p.y,
    );
  if (free(preferred)) return preferred;
  for (let radius = 1; ; radius++) {
    const candidates = [];
    for (let dx = -radius; dx <= radius; dx++)
      for (let dy = -radius; dy <= radius; dy++)
        if (Math.max(Math.abs(dx), Math.abs(dy)) === radius)
          candidates.push({
            x: preferred.x + dx * (w + gap),
            y: preferred.y + dy * (h + gap),
            distance: (dx * (w + gap)) ** 2 + (dy * (h + gap)) ** 2,
          });
    candidates.sort((a, b) => a.distance - b.distance);
    const found = candidates.find(free);
    if (found) return { x: found.x, y: found.y };
  }
}
