import { connectorPlacementLocked } from "../model/placement-locks.js";
import { svgIcon } from "../ui/icons.js";
import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { diagramRoute, MAX_ROUTE_POINTS } from "../model/diagram.js";
import { connectorPoints } from "../model/connector-path.js";
import { filteredGraphNodes } from "./node-data.js";

export function connectorAttributes(key, a, b, caption) {
  return (
    'data-placement-locked="' +
    connectorPlacementLocked(state.project, key) +
    '" data-connector="' +
    key +
    '" data-from-node="' +
    a.id +
    '" data-to-node="' +
    b.id +
    '" data-connector-caption="' +
    esc(caption) +
    '"'
  );
}
export function connectorLabel(key, box, content, exporting = false) {
  const selected = !exporting && state.diagramLabelSelection.has(key);
  return (
    '<g class="connector-label' +
    (selected ? " diagram-label-selected" : "") +
    '" data-placement-locked="' +
    connectorPlacementLocked(state.project, key) +
    '" data-route-label="' +
    key +
    '" data-label-x="' +
    (box.x + box.w / 2) +
    '" data-label-y="' +
    (box.y + 10) +
    '" data-label-width="' +
    box.w +
    '" data-label-height="' +
    box.h +
    '" role="button" tabindex="0" aria-label="' +
    esc(t("ui.diagramLabelHint")) +
    '"><rect x="' +
    box.x +
    '" y="' +
    box.y +
    '" width="' +
    box.w +
    '" height="' +
    box.h +
    '" rx="3" fill="#fff" fill-opacity=".95"/>' +
    content +
    (!exporting && connectorPlacementLocked(state.project, key)
      ? '<g class="placement-lock-indicator"><title>' +
        esc(t("ui.placementLocked")) +
        "</title>" +
        svgIcon("lock", box.x + box.w + 3, box.y + 2, "#3e516c", 0.6) +
        "</g>"
      : "") +
    "</g>"
  );
}
export function routeHandles() {
  if (
    !state.diagramEditing ||
    state.selectionMode ||
    !state.diagramConnectionKey ||
    connectorPlacementLocked(state.project, state.diagramConnectionKey) ||
    state.diagramConnectionKey.startsWith("g:")
  )
    return "";
  const key = state.diagramConnectionKey,
    route = diagramRoute(state.project, key);
  return (
    segmentHandles(key, route) +
    route.points
      .map(
        (point, index) =>
          '<g class="route-point" data-route-point="' +
          index +
          '" data-connector="' +
          key +
          '" tabindex="0" role="button" aria-label="' +
          esc(t("ui.routePointHint", { number: index + 1 })) +
          '" transform="translate(' +
          point.x +
          " " +
          point.y +
          ')"><circle data-diagram-radius="14" r="' +
          14 / state.camera.z +
          '" fill="transparent"/><circle data-diagram-radius="6" r="' +
          6 / state.camera.z +
          '" fill="#fff" stroke="#081f3c" stroke-width="2" vector-effect="non-scaling-stroke"/></g>',
      )
      .join("")
  );
}
function segmentHandles(key, route) {
  if (route.style !== "orthogonal") return "";
  const el = document.querySelector(
      '#graph [data-connector="' + key + '"][data-from-node]',
    ),
    nodes = filteredGraphNodes(),
    a = nodes.find((n) => n.id === el?.dataset.fromNode),
    b = nodes.find((n) => n.id === el?.dataset.toNode);
  if (!a || !b) return "";
  const points = connectorPoints(a, b, route),
    label = document.querySelector('#graph [data-route-label="' + key + '"]'),
    margin = 16 / state.camera.z;
  if (points.length - 2 > MAX_ROUTE_POINTS) return "";
  return points
    .slice(1)
    .map((end, index) => {
      const start = points[index],
        horizontal = start.y === end.y;
      if (Math.hypot(end.x - start.x, end.y - start.y) * state.camera.z < 48)
        return "";
      const point = [0.5, 0.25, 0.75]
        .map((t) => ({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        }))
        .find(
          (p) =>
            !nodes.some(
              (n) =>
                p.x > n.x - margin &&
                p.x < n.x + n.w + margin &&
                p.y > n.y - margin &&
                p.y < n.y + n.h + margin,
            ) &&
            !route.points.some(
              (w) => Math.hypot(p.x - w.x, p.y - w.y) < margin * 2,
            ) &&
            !(
              label &&
              Math.abs(p.x - Number(label.dataset.labelX)) <
                Number(label.dataset.labelWidth) / 2 + margin &&
              p.y > Number(label.dataset.labelY) - 10 - margin &&
              p.y <
                Number(label.dataset.labelY) -
                  10 +
                  Number(label.dataset.labelHeight) +
                  margin
            ),
        );
      if (!point) return "";
      return `<g class="route-segment" data-route-segment="${index}" data-segment-axis="${horizontal ? "y" : "x"}" data-connector="${key}" transform="translate(${point.x} ${point.y})" role="button" tabindex="0" aria-label="${esc(t("ui.routeSegmentHint"))}"><circle data-diagram-radius="14" r="${14 / state.camera.z}" fill="transparent"/><circle data-diagram-radius="5" r="${5 / state.camera.z}" fill="#e7eef6" stroke="#081f3c" stroke-width="1.5" vector-effect="non-scaling-stroke"/></g>`;
    })
    .join("");
}
export function reportRouteBounds(route, boxes) {
  if (boxes)
    for (const p of route.points) boxes.push({ x: p.x, y: p.y, w: 0, h: 0 });
}
