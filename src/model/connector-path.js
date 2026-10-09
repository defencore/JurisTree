function anchor(card, target) {
  const center = { x: card.x + card.w / 2, y: card.y + card.h / 2 },
    dx = target.x - center.x,
    dy = target.y - center.y;
  return Math.abs(dx) / card.w >= Math.abs(dy) / card.h
    ? {
        x: center.x + (dx >= 0 ? card.w / 2 : -card.w / 2),
        y: center.y,
        horizontal: true,
      }
    : {
        x: center.x,
        y: center.y + (dy >= 0 ? card.h / 2 : -card.h / 2),
        horizontal: false,
      };
}
export function connectorVertices(a, b, route) {
  const first = route.points[0] || { x: b.x + b.w / 2, y: b.y + b.h / 2 },
    last = route.points.at(-1) || { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  return [anchor(a, first), ...route.points, anchor(b, last)];
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
export function routedConnector(a, b, route, automatic) {
  if (route.style === "auto" && !route.points.length) return automatic;
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
          ? { x: next.x, y: previous.y }
          : { x: previous.x, y: next.y },
      );
    }
    points.push(next);
  }
  const middle = midpoint(points);
  return {
    path: points.map((p, i) => (i ? "L" : "M") + p.x + " " + p.y).join(" "),
    x: middle.x,
    y: middle.y,
  };
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
