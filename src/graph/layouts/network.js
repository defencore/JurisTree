export function avoidNodeOverlap(nodes, positions) {
  const placed = [];
  for (const node of nodes) {
    const p = positions.get(node.id);
    let attempts = 0;
    while (attempts++ < nodes.length + 2) {
      const collision = placed.find(
        (n) =>
          Math.abs(p.x - n.x) < (node.w + n.w) / 2 + 36 &&
          Math.abs(p.y - n.y) < (node.h + n.h) / 2 + 34,
      );
      if (!collision) break;
      p.y = collision.y + (node.h + collision.h) / 2 + 35;
    }
    placed.push({
      ...node,
      x: p.x,
      y: p.y,
    });
  }
  const minX = Math.min(...[...positions.values()].map((p) => p.x)),
    minY = Math.min(...[...positions.values()].map((p) => p.y));
  for (const [, p] of positions) {
    p.x = p.x - minX + 55;
    p.y = p.y - minY + 70;
    p.x = Math.round(p.x);
    p.y = Math.round(p.y);
  }
  return positions;
}
export function circularLayout(nodes) {
  const result = new Map();
  if (!nodes.length) return result;
  let index = 0,
    radius = 0;
  while (index < nodes.length) {
    const count = radius
      ? Math.min(nodes.length - index, Math.floor((2 * Math.PI * radius) / 330))
      : 1;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      result.set(nodes[index++].id, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }
    radius = radius ? radius + 350 : 480;
  }
  return avoidNodeOverlap(nodes, result);
}
export async function networkLayout(nodes, relations) {
  if (nodes.length < 3) return circularLayout(nodes);
  const map = new Map(nodes.map((n, i) => [n.id, i]));
  nodes
    .filter((n) => n.kind === "group")
    .forEach((n) => n.members.forEach((id) => map.set(id, map.get(n.id))));
  const links = relations
      .map((r) => [map.get(r.from), map.get(r.to)])
      .filter(([a, b]) => a !== undefined && b !== undefined && a !== b),
    n = nodes.length,
    k = 340,
    radius = Math.max(500, Math.sqrt(n) * 170),
    points = nodes.map((_, i) => ({
      x: radius * Math.cos((i * 2 * Math.PI) / n),
      y: radius * Math.sin((i * 2 * Math.PI) / n),
    })),
    iterations = n > 180 ? 100 : 160;
  for (let iteration = 0; iteration < iterations; iteration++) {
    const forces = points.map(() => ({
      x: 0,
      y: 0,
    }));
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        let dx = points[i].x - points[j].x,
          dy = points[i].y - points[j].y;
        const d = Math.max(1, Math.hypot(dx, dy)),
          f = (k * k) / (d * d);
        forces[i].x += dx * f;
        forces[i].y += dy * f;
        forces[j].x -= dx * f;
        forces[j].y -= dy * f;
      }
    for (const [i, j] of links) {
      const dx = points[j].x - points[i].x,
        dy = points[j].y - points[i].y,
        d = Math.max(1, Math.hypot(dx, dy)),
        f = (d / k) * 0.35;
      forces[i].x += dx * f;
      forces[i].y += dy * f;
      forces[j].x -= dx * f;
      forces[j].y -= dy * f;
    }
    const temperature = 80 * (1 - iteration / iterations) + 3;
    for (let i = 0; i < n; i++) {
      const f = forces[i],
        d = Math.max(1, Math.hypot(f.x, f.y)),
        scale = Math.min(temperature, d) / d;
      points[i].x += f.x * scale;
      points[i].y += f.y * scale;
    }
    if (iteration % 8 === 0)
      await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return avoidNodeOverlap(
    nodes,
    new Map(
      nodes.map((node, i) => [
        node.id,
        {
          ...points[i],
        },
      ]),
    ),
  );
}
