import { singleCircle } from "./shapes.js";

/** Relax links while limiting repulsion work for large charts. */
export async function networkLayout(
  nodes,
  links,
  { incremental = false, yieldFrame = () => Promise.resolve() } = {},
) {
  const initial = incremental
      ? new Map(nodes.map((node) => [node.key, { x: node.x, y: node.y }]))
      : nodes.length <= 180
        ? singleCircle(nodes)
        : new Map(
            nodes.map((node, i) => {
              const columns = Math.ceil(Math.sqrt(nodes.length));
              return [
                node.key,
                { x: (i % columns) * 430, y: Math.floor(i / columns) * 350 },
              ];
            }),
          ),
    points = nodes.map((node) => ({
      x: initial.get(node.key).x + node.w / 2,
      y: initial.get(node.key).y + node.h / 2,
    })),
    index = new Map(nodes.map((node, i) => [node.key, i])),
    pairs = links
      .map((link) => [index.get(link.from), index.get(link.to)])
      .filter(([a, b]) => a !== undefined && b !== undefined && a !== b),
    original = points.map((point) => ({ ...point })),
    n = nodes.length,
    center = {
      x: points.reduce((sum, p) => sum + p.x, 0) / n,
      y: points.reduce((sum, p) => sum + p.y, 0) / n,
    },
    iterations = incremental ? 70 : n > 180 ? 100 : 150,
    k = 370,
    cellSize = k * 2;
  for (let iteration = 0; iteration < iterations; iteration++) {
    const forces = points.map(() => ({ x: 0, y: 0 }));
    const repel = (i, j) => {
      let dx = points[i].x - points[j].x,
        dy = points[i].y - points[j].y;
      if (Math.hypot(dx, dy) < 1) {
        dx = (i % 2 ? 1 : -1) * 2;
        dy = (j % 2 ? 1 : -1) * 2;
      }
      const distance = Math.max(1, Math.hypot(dx, dy)),
        strength = (k * k) / (distance * distance);
      forces[i].x += dx * strength;
      forces[i].y += dy * strength;
      forces[j].x -= dx * strength;
      forces[j].y -= dy * strength;
    };
    if (n <= 180) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) repel(i, j);
    } else {
      const cells = new Map();
      points.forEach((point, i) => {
        const key =
          Math.floor(point.x / cellSize) + ":" + Math.floor(point.y / cellSize);
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(i);
      });
      points.forEach((point, i) => {
        const x = Math.floor(point.x / cellSize),
          y = Math.floor(point.y / cellSize);
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++)
            for (const j of cells.get(x + dx + ":" + (y + dy)) || [])
              if (j > i) repel(i, j);
      });
    }
    for (const [i, j] of pairs) {
      const dx = points[j].x - points[i].x,
        dy = points[j].y - points[i].y,
        strength = Math.max(-0.3, (Math.hypot(dx, dy) - k) / k) * 0.35;
      forces[i].x += dx * strength;
      forces[i].y += dy * strength;
      forces[j].x -= dx * strength;
      forces[j].y -= dy * strength;
    }
    const temperature =
      (incremental ? 24 : 65) * (1 - iteration / iterations) + 2;
    for (let i = 0; i < n; i++) {
      if (incremental && nodes[i].locked) continue;
      const pull = incremental ? original[i] : center,
        strength = incremental ? 0.3 : 0.025,
        force = forces[i];
      force.x += (pull.x - points[i].x) * strength;
      force.y += (pull.y - points[i].y) * strength;
      const size = Math.max(1, Math.hypot(force.x, force.y)),
        scale = Math.min(temperature, size) / size;
      points[i].x += force.x * scale;
      points[i].y += force.y * scale;
    }
    if (iteration % 5 === 0) await yieldFrame();
  }
  return new Map(
    nodes.map((node, i) => [
      node.key,
      { x: points[i].x - node.w / 2, y: points[i].y - node.h / 2 },
    ]),
  );
}
