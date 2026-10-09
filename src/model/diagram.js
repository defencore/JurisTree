export const MAX_DIAGRAM_ROUTES = 3000;
export const MAX_ROUTE_POINTS = 32;
const coordinate = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  Math.abs(value) <= 100000;
export const diagramKey = (kind, id, personId = "") =>
  kind + ":" + id + (personId ? ":" + personId : "");
export function validDiagramKeys(project) {
  return new Set([
    ...project.relations.map((r) => diagramKey("r", r.id)),
    ...project.groups.map((g) => diagramKey("g", g.id)),
    ...project.documents.flatMap((d) =>
      d.people.map((id) => diagramKey("d", d.id, id)),
    ),
    ...project.property.flatMap((a) =>
      (a.allocations || []).map((allocation) =>
        diagramKey("p", a.id, allocation.personId),
      ),
    ),
  ]);
}
export function normalizeDiagram(raw = {}, project) {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    Object.keys(raw).length > MAX_DIAGRAM_ROUTES
  )
    throw Error("Invalid diagram routes");
  const valid = validDiagramKeys(project),
    result = {};
  const point = (p) => {
    if (!p || !coordinate(p.x) || !coordinate(p.y))
      throw Error("Invalid diagram position");
    return { x: p.x, y: p.y };
  };
  for (const [key, route] of Object.entries(raw)) {
    if (!valid.has(key)) continue;
    if (
      !route ||
      !["auto", "orthogonal", "polyline"].includes(route.style) ||
      !Array.isArray(route.points) ||
      route.points.length > MAX_ROUTE_POINTS ||
      (route.style === "auto" && route.points.length > 0) ||
      (key.startsWith("g:") &&
        (route.style !== "auto" || route.points.length > 0))
    )
      throw Error("Invalid diagram route");
    result[key] = {
      style: route.style,
      points: route.points.map(point),
      label: route.label == null ? null : point(route.label),
    };
  }
  return result;
}
export function diagramRoute(project, key) {
  return project.diagram?.[key] || { style: "auto", points: [], label: null };
}
export function snapCoordinate(value, settings, free = false) {
  return settings.snapToGrid && !free
    ? Math.round(value / settings.gridSize) * settings.gridSize
    : value;
}
export function snapPoint(point, settings, free = false) {
  return {
    x: snapCoordinate(point.x, settings, free),
    y: snapCoordinate(point.y, settings, free),
  };
}

/** Align bounding boxes, or distribute them with equal gaps while preserving the outer items. */
export function arrangeItems(items, mode, gridSize = 20) {
  const result = new Map(
    items.map((item) => [item.id, { x: item.x, y: item.y }]),
  );
  if (!items.length) return result;
  if (mode === "grid") {
    for (const item of items)
      result.set(item.id, snapPoint(item, { snapToGrid: true, gridSize }));
    return result;
  }
  if (items.length < 2) return result;
  const left = Math.min(...items.map((i) => i.x)),
    right = Math.max(...items.map((i) => i.x + i.w)),
    top = Math.min(...items.map((i) => i.y)),
    bottom = Math.max(...items.map((i) => i.y + i.h));
  const positions = {
    left: (i) => ({ x: left, y: i.y }),
    right: (i) => ({ x: right - i.w, y: i.y }),
    centerX: (i) => ({ x: (left + right - i.w) / 2, y: i.y }),
    top: (i) => ({ x: i.x, y: top }),
    bottom: (i) => ({ x: i.x, y: bottom - i.h }),
    centerY: (i) => ({ x: i.x, y: (top + bottom - i.h) / 2 }),
  };
  if (positions[mode])
    for (const item of items) result.set(item.id, positions[mode](item));
  else if (["distributeX", "distributeY"].includes(mode) && items.length >= 3) {
    const axis = mode === "distributeX" ? "x" : "y",
      size = axis === "x" ? "w" : "h",
      sorted = [...items].sort((a, b) => a[axis] - b[axis]);
    const first = sorted[0],
      last = sorted.at(-1),
      gap =
        (last[axis] +
          last[size] -
          first[axis] -
          sorted.reduce((sum, i) => sum + i[size], 0)) /
        (sorted.length - 1);
    let cursor = first[axis];
    for (const item of sorted) {
      result.get(item.id)[axis] = cursor;
      cursor += item[size] + gap;
    }
  }
  return result;
}
