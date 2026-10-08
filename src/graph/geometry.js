import { graphView } from "./analysis.js";
export function connection(a, b, horizontal = false) {
  let x1 = a.x + a.w / 2,
    y1 = a.y + a.h,
    x2 = b.x + b.w / 2,
    y2 = b.y;
  if (horizontal || Math.abs(a.y - b.y) < 70) {
    const forward = b.x >= a.x;
    x1 = a.x + (forward ? a.w : 0);
    y1 = a.y + a.h / 2;
    x2 = b.x + (forward ? 0 : b.w);
    y2 = b.y + b.h / 2;
    return {
      path: `M${x1} ${y1} C${(x1 + x2) / 2} ${y1},${(x1 + x2) / 2} ${y2},${x2} ${y2}`,
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    };
  }
  if (b.y < a.y) {
    y1 = a.y;
    y2 = b.y + b.h;
  }
  const mid = (y1 + y2) / 2;
  return {
    path: `M${x1} ${y1} C${x1} ${mid},${x2} ${mid},${x2} ${y2}`,
    x: (x1 + x2) / 2,
    y: mid,
  };
}

export function graphLine(a, b, horizontal = false, offset = 0) {
  const across = horizontal || Math.abs(a.y - b.y) < 70;
  const axis = across ? "y" : "x";
  const c = connection(
    { ...a, [axis]: a[axis] + offset },
    { ...b, [axis]: b[axis] + offset },
    horizontal,
  );
  if (graphView().lineStyle === "straight") {
    const coordinates = c.path.match(
      /M([\d.-]+) ([\d.-]+).*?,([\d.-]+) ([\d.-]+)$/,
    );
    if (coordinates)
      c.path = `M${coordinates[1]} ${coordinates[2]} L${coordinates[3]} ${coordinates[4]}`;
  }
  return c;
}
