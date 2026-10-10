import { translate } from "../../i18n/index.js";
import { connectedComponents, hierarchyLevels } from "./topology.js";

export function positionBounds(nodes, positions) {
  const left = Math.min(...nodes.map((node) => positions.get(node.key).x)),
    top = Math.min(...nodes.map((node) => positions.get(node.key).y));
  return {
    x: left,
    y: top,
    w:
      Math.max(...nodes.map((node) => positions.get(node.key).x + node.w)) -
      left,
    h:
      Math.max(...nodes.map((node) => positions.get(node.key).y + node.h)) -
      top,
  };
}
export function singleCircle(nodes) {
  const result = new Map();
  if (!nodes.length) return result;
  const separation =
      Math.max(...nodes.map((node) => Math.hypot(node.w, node.h))) + 64,
    radius =
      nodes.length === 1
        ? 0
        : separation / (2 * Math.sin(Math.PI / nodes.length));
  if (radius > 99000) throw Error(translate("ui.noSpaceForLayout"));
  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
    result.set(node.key, {
      x: radius * Math.cos(angle) - node.w / 2,
      y: radius * Math.sin(angle) - node.h / 2,
    });
  });
  return result;
}
export function packComponents(components, layouts) {
  const boxes = components.map((nodes, index) =>
      positionBounds(nodes, layouts[index]),
    ),
    width = Math.max(
      ...boxes.map((box) => box.w),
      Math.sqrt(
        boxes.reduce((sum, box) => sum + (box.w + 100) * (box.h + 100), 0),
      ) * 1.3,
    ),
    result = new Map();
  let x = 0,
    y = 0,
    rowHeight = 0;
  components.forEach((nodes, index) => {
    const box = boxes[index];
    if (x && x + box.w > width) {
      x = 0;
      y += rowHeight + 120;
      rowHeight = 0;
    }
    for (const node of nodes) {
      const point = layouts[index].get(node.key);
      result.set(node.key, { x: point.x - box.x + x, y: point.y - box.y + y });
    }
    x += box.w + 120;
    rowHeight = Math.max(rowHeight, box.h);
  });
  return result;
}
export function multipleCircles(nodes, links) {
  const components = connectedComponents(nodes, links);
  return packComponents(components, components.map(singleCircle));
}
export function hierarchyLayout(nodes, links, rootKey) {
  const components = connectedComponents(nodes, links);
  const layouts = components.map((component) => {
    const levels = hierarchyLevels(component, links, rootKey),
      rows = new Map();
    for (const node of component) {
      const level = levels.get(node.key);
      if (!rows.has(level)) rows.set(level, []);
      rows.get(level).push(node);
    }
    const gap = 70,
      widths = new Map(
        [...rows].map(([level, row]) => [
          level,
          row.reduce((sum, node) => sum + node.w + gap, 0) - gap,
        ]),
      ),
      maxWidth = Math.max(...widths.values()),
      result = new Map();
    let y = 0;
    for (const level of [...rows.keys()].sort((a, b) => a - b)) {
      const row = rows.get(level);
      let x = (maxWidth - widths.get(level)) / 2;
      for (const node of row) {
        result.set(node.key, { x, y });
        x += node.w + gap;
      }
      y += Math.max(...row.map((node) => node.h)) + 110;
    }
    return result;
  });
  return packComponents(components, layouts);
}
