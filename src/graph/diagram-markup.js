import { esc } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { diagramRoute } from "../model/diagram.js";

export function connectorAttributes(key, a, b, caption) {
  return (
    'data-connector="' +
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
  const selected =
    !exporting && state.diagramEditing && state.diagramLabelSelection.has(key);
  return (
    '<g class="connector-label' +
    (selected ? " diagram-label-selected" : "") +
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
    "</g>"
  );
}
export function routeHandles() {
  if (
    !state.diagramEditing ||
    !state.diagramConnectionKey ||
    state.diagramConnectionKey.startsWith("g:")
  )
    return "";
  const key = state.diagramConnectionKey,
    route = diagramRoute(state.project, key);
  return route.points
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
    .join("");
}
export function reportRouteBounds(route, boxes) {
  if (boxes)
    for (const p of route.points) boxes.push({ x: p.x, y: p.y, w: 0, h: 0 });
}
