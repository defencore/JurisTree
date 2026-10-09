const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

export function moveCrop(rect, dx, dy, bounds, allowOutside) {
  return {
    ...rect,
    x: allowOutside
      ? rect.x + dx
      : clamp(rect.x + dx, 0, bounds.width - rect.w),
    y: allowOutside
      ? rect.y + dy
      : clamp(rect.y + dy, 0, bounds.height - rect.h),
  };
}

export function scaleCrop(rect, baseSide, percent) {
  const side = (baseSide * 100) / percent;
  return {
    x: rect.x + (rect.w - side) / 2,
    y: rect.y + (rect.h - side) / 2,
    w: side,
    h: side,
  };
}

export function resizeCrop(rect, corner, point, bounds, square) {
  const west = corner.includes("w"),
    north = corner.includes("n"),
    x = west ? rect.x + rect.w : rect.x,
    y = north ? rect.y + rect.h : rect.y;
  let w = Math.max(8, west ? x - point.x : point.x - x),
    h = Math.max(8, north ? y - point.y : point.y - y);
  if (square) w = h = Math.max(w, h);
  else {
    w = Math.min(w, west ? x : bounds.width - x);
    h = Math.min(h, north ? y : bounds.height - y);
  }
  return { x: west ? x - w : x, y: north ? y - h : y, w, h };
}

/** Keep both the image and the selected frame visible, including padded portrait edges. */
export function cropViewport(bounds, rect, width = 700, height = 420) {
  const left = Math.min(0, rect.x),
    top = Math.min(0, rect.y),
    w = Math.max(bounds.width, rect.x + rect.w) - left,
    h = Math.max(bounds.height, rect.y + rect.h) - top,
    scale = Math.min((width - 48) / w, (height - 48) / h);
  return {
    scale,
    x: (width - w * scale) / 2 - left * scale,
    y: (height - h * scale) / 2 - top * scale,
  };
}
