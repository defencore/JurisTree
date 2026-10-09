export function personFocusCamera(node, viewport, overlays) {
  const margin = 12;
  const obstacles = overlays
    .map((box) => ({
      left: Math.max(0, box.left),
      right: Math.min(viewport.width, box.right),
      top: Math.max(0, box.top),
      bottom: Math.min(viewport.height, box.bottom),
    }))
    .filter((box) => box.right > box.left && box.bottom > box.top);
  const edges = (axis, size) =>
    [
      ...new Set([
        margin,
        size - margin,
        ...obstacles.flatMap((box) =>
          axis === "x"
            ? [box.left - margin, box.right + margin]
            : [box.top - margin, box.bottom + margin],
        ),
      ]),
    ]
      .filter((value) => value >= margin && value <= size - margin)
      .sort((a, b) => a - b);
  const xs = edges("x", viewport.width),
    ys = edges("y", viewport.height);
  let best = null;
  for (let left = 0; left < xs.length - 1; left++)
    for (let right = left + 1; right < xs.length; right++)
      for (let top = 0; top < ys.length - 1; top++)
        for (let bottom = top + 1; bottom < ys.length; bottom++) {
          const frame = {
            left: xs[left],
            right: xs[right],
            top: ys[top],
            bottom: ys[bottom],
          };
          if (
            obstacles.some(
              (box) =>
                frame.left < box.right &&
                frame.right > box.left &&
                frame.top < box.bottom &&
                frame.bottom > box.top,
            )
          )
            continue;
          const z = Math.min(
            1.4,
            (frame.right - frame.left) / node.w,
            (frame.bottom - frame.top) / (node.h + 24),
          );
          const cx = (frame.left + frame.right) / 2,
            cy = (frame.top + frame.bottom) / 2,
            distance = Math.hypot(
              cx - viewport.width / 2,
              cy - viewport.height / 2,
            );
          if (!best || z > best.z || (z === best.z && distance < best.distance))
            best = { z, cx, cy, distance };
        }
  if (!best) return null;
  return {
    z: best.z,
    x: best.cx - (node.x + node.w / 2) * best.z,
    y: best.cy - (node.y + (node.h - 24) / 2) * best.z,
  };
}
