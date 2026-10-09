import { MAX_ROUTE_POINTS } from "./diagram.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function anchor(card, target, orthogonal) {
  const center = { x: card.x + card.w / 2, y: card.y + card.h / 2 },
    dx = target.x - center.x,
    dy = target.y - center.y;
  if (!orthogonal) {
    if (!dx && !dy) return { x: center.x + card.w / 2, y: center.y };
    const scale =
      1 /
      Math.max(Math.abs(dx) / (card.w / 2), Math.abs(dy) / (card.h / 2), 1e-9);
    return { x: center.x + dx * scale, y: center.y + dy * scale };
  }
  return Math.abs(dx) / card.w >= Math.abs(dy) / card.h
    ? {
        x: center.x + (dx >= 0 ? card.w / 2 : -card.w / 2),
        y: clamp(target.y, card.y + 8, card.y + card.h - 8),
        horizontal: true,
      }
    : {
        x: clamp(target.x, card.x + 8, card.x + card.w - 8),
        y: center.y + (dy >= 0 ? card.h / 2 : -card.h / 2),
        horizontal: false,
      };
}
export function connectorVertices(a, b, route) {
  const first = route.points[0] || { x: b.x + b.w / 2, y: b.y + b.h / 2 },
    last = route.points.at(-1) || { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const orthogonal = route.style !== "polyline";
  return [
    anchor(a, first, orthogonal),
    ...route.points,
    anchor(b, last, orthogonal),
  ];
}
function midpoint(points) {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let remaining = lengths.reduce((a, b) => a + b, 0) / 2;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i]) {
      const t = remaining / lengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    remaining -= lengths[i];
  }
  return points[0];
}
export function connectorPoints(a, b, route) {
  const vertices = connectorVertices(a, b, route),
    points = [vertices[0]];
  if (route.style === "orthogonal" && !route.points.length) {
    const start = vertices[0],
      end = vertices.at(-1),
      midX = (start.x + end.x) / 2,
      midY = (start.y + end.y) / 2;
    const bends =
      start.horizontal && end.horizontal
        ? [
            { x: midX, y: start.y },
            { x: midX, y: end.y },
          ]
        : !start.horizontal && !end.horizontal
          ? [
              { x: start.x, y: midY },
              { x: end.x, y: midY },
            ]
          : [
              start.horizontal
                ? { x: end.x, y: start.y }
                : { x: start.x, y: end.y },
            ];
    vertices.splice(1, 0, ...bends);
  }
  for (let i = 1; i < vertices.length; i++) {
    const previous = points.at(-1),
      next = vertices[i];
    if (
      route.style === "orthogonal" &&
      previous.x !== next.x &&
      previous.y !== next.y
    ) {
      const horizontal =
        i === vertices.length - 1
          ? !next.horizontal
          : i === 1
            ? vertices[0].horizontal
            : Math.abs(next.x - previous.x) >= Math.abs(next.y - previous.y);
      points.push(
        horizontal
          ? { x: next.x, y: previous.y, insertIndex: i - 1 }
          : { x: previous.x, y: next.y, insertIndex: i - 1 },
      );
    }
    points.push({ ...next, insertIndex: i - 1 });
  }
  const unique = points.filter(
    (p, i) => !i || p.x !== points[i - 1].x || p.y !== points[i - 1].y,
  );
  return route.points.length
    ? unique
    : unique.filter((p, i) => {
        const before = unique[i - 1],
          after = unique[i + 1];
        return (
          !before ||
          !after ||
          !(
            (before.x === p.x && p.x === after.x) ||
            (before.y === p.y && p.y === after.y)
          )
        );
      });
}
export function shiftConnectorSegment(a, b, route, index, offset) {
  const points = connectorPoints(a, b, route).map(({ x, y }) => ({
    x: clamp(x, -100000, 100000),
    y: clamp(y, -100000, 100000),
  }));
  if (
    route.style !== "orthogonal" ||
    !points[index + 1] ||
    points.length - 2 > MAX_ROUTE_POINTS
  )
    return route;
  const axis = points[index].y === points[index + 1].y ? "y" : "x";
  if (points.length === 2) {
    const [start, end] = points;
    points.splice(
      1,
      0,
      ...[0.25, 0.75].map((t) => ({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      })),
    );
    index = 1;
  }
  for (const i of [index, index + 1])
    if (i > 0 && i < points.length - 1)
      points[i][axis] = clamp(points[i][axis] + offset, -100000, 100000);
  return { ...route, points: points.slice(1, -1) };
}
export function closestRouteInsertion(a, b, route, point) {
  const points = connectorPoints(a, b, route);
  return Math.min(
    route.points.length,
    points[closestSegment(points, point) + 1]?.insertIndex ?? 0,
  );
}
export function routedConnector(a, b, route, automatic) {
  if (route.style === "auto" && !route.points.length) return automatic;
  const points = connectorPoints(a, b, route),
    middle = midpoint(points);
  return {
    path: points.map((p, i) => (i ? "L" : "M") + p.x + " " + p.y).join(" "),
    x: middle.x,
    y: middle.y,
  };
}

export function routeLabelPosition(route, fallback, width, height = 22) {
  if (route.label) return route.label;
  const conflicts = route.points.filter(
    (p) =>
      Math.abs(p.x - fallback.x) < width / 2 + 20 &&
      p.y > fallback.y - 30 &&
      p.y < fallback.y + height + 10,
  );
  return conflicts.length
    ? {
        x: fallback.x,
        y: Math.min(...conflicts.map((p) => p.y)) - height + 10 - 60,
      }
    : fallback;
}
export function closestSegment(vertices, point) {
  let best = 0,
    distance = Infinity;
  for (let i = 0; i < vertices.length - 1; i++) {
    const a = vertices[i],
      b = vertices[i + 1],
      dx = b.x - a.x,
      dy = b.y - a.y,
      t = Math.max(
        0,
        Math.min(
          1,
          ((point.x - a.x) * dx + (point.y - a.y) * dy) /
            (dx * dx + dy * dy || 1),
        ),
      ),
      d = Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
    if (d < distance) {
      distance = d;
      best = i;
    }
  }
  return best;
}
