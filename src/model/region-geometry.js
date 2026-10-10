const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export function boundedRegion(rect) {
  const width = clamp(rect.width, 0.001, 1),
    height = clamp(rect.height, 0.001, 1);
  return {
    x: clamp(rect.x, 0, 1 - width),
    y: clamp(rect.y, 0, 1 - height),
    width,
    height,
  };
}
export function drawnRegion(start, end) {
  return boundedRegion({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  });
}
export function movedRegion(rect, dx, dy) {
  return boundedRegion({ ...rect, x: rect.x + dx, y: rect.y + dy });
}
export function resizedRegion(rect, corner, point) {
  const opposite = {
    x: corner.includes("w") ? rect.x + rect.width : rect.x,
    y: corner.includes("n") ? rect.y + rect.height : rect.y,
  };
  return drawnRegion(opposite, point);
}
