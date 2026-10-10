import { renderGraphEdges } from "./edges.js";
import { CAMERA_MAX_ZOOM, CAMERA_MIN_ZOOM } from "../core/config.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { visibleGroupFrames } from "./groups.js";
import { filteredGraphNodes } from "./node-data.js";
import { personFocusCamera } from "./person-focus.js";

export function focusPerson(
  id = appState.selected?.kind === "person" ? appState.selected.id : "",
) {
  const nodes = filteredGraphNodes();
  const node =
    nodes.find((n) => n.kind === "person" && n.id === id) ||
    nodes.find((n) => n.kind === "person") ||
    nodes[0];
  if (!node) return fit();
  const graph = $("#graph");
  graph.scrollIntoView({ block: "nearest", inline: "nearest" });
  const rect = graph.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const overlays = [
    $(".graph-tools"),
    $(".legend"),
    $("#inspector"),
    $("#diagramTools"),
    $(".graph-mobile-actions"),
  ]
    .filter(Boolean)
    .map((el) => el.getBoundingClientRect())
    .filter((box) => box.width && box.height)
    .map((box) => ({
      left: box.left - rect.left,
      right: box.right - rect.left,
      top: box.top - rect.top,
      bottom: box.bottom - rect.top,
    }));
  let camera = personFocusCamera(node, rect, overlays);
  const headers = visibleGroupFrames(nodes)
    .filter(
      ({ group, header }) =>
        (node.groupIds || []).includes(group.id) &&
        header.y >= node.y - 200 &&
        header.x >= node.x - 19 &&
        header.x + header.w <= node.x + node.w + 19,
    )
    .map(({ header }) => header);
  if (headers.length) {
    const framed = personFocusCamera(node, rect, overlays, {
      topSpace: node.y - Math.min(...headers.map((header) => header.y)),
      sideSpace: 19,
    });
    if (framed) camera = framed;
  }
  if (!camera) return;
  appState.camera = camera;
  applyCamera();
}
export function applyCamera() {
  const tools = $(".graph-tools"),
    legend = $("#graphLegend");
  if (tools && legend)
    legend.style.bottom = `calc(${tools.offsetHeight + 20}px + env(safe-area-inset-bottom, 0px))`;
  $("#scene").setAttribute(
    "transform",
    `translate(${appState.camera.x} ${appState.camera.y}) scale(${appState.camera.z})`,
  );
  for (const handle of document.querySelectorAll("[data-diagram-radius]"))
    handle.setAttribute(
      "r",
      Number(handle.dataset.diagramRadius) / appState.camera.z,
    );
  $("#zoomLabel").textContent = Math.round(appState.camera.z * 100) + "%";
}
export function bounds(ns = filteredGraphNodes()) {
  if (!ns.length)
    return {
      x: 0,
      y: 0,
      w: 600,
      h: 400,
    };
  const frames = visibleGroupFrames(ns),
    boxes = [...ns, ...frames, ...frames.map((frame) => frame.header)];
  renderGraphEdges(ns, true, boxes);
  const x = Math.min(...boxes.map((n) => n.x)) - 55,
    y = Math.min(...boxes.map((n) => n.y)) - 55;
  return {
    x,
    y,
    w: Math.max(...boxes.map((n) => n.x + n.w)) - x + 55,
    h: Math.max(...boxes.map((n) => n.y + n.h)) - y + 55,
  };
}
export function fit(ns = filteredGraphNodes()) {
  const el = $("#graph");
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const overlays = [$(".graph-tools"), $(".legend")]
      .filter(Boolean)
      .map((el) => el.getBoundingClientRect())
      .filter(
        (box) =>
          box.width &&
          box.height &&
          box.top < rect.bottom &&
          box.bottom > rect.top,
      ),
    bottomSpace = Math.max(
      0,
      ...overlays.map((box) => rect.bottom - box.top + 12),
    ),
    palette = $("#diagramTools"),
    paletteBox = palette?.matches(":popover-open")
      ? palette.getBoundingClientRect()
      : null,
    topSpace =
      paletteBox && paletteBox.left < rect.right && paletteBox.right > rect.left
        ? Math.max(0, paletteBox.bottom - rect.top + 12)
        : 0,
    height = Math.max(40, rect.height - bottomSpace - topSpace),
    b = bounds(ns);
  appState.camera.z = Math.min(
    1.1,
    Math.max(
      CAMERA_MIN_ZOOM,
      Math.min((rect.width - 40) / b.w, (height - 40) / b.h),
    ),
  );
  appState.camera.x =
    (rect.width - b.w * appState.camera.z) / 2 - b.x * appState.camera.z;
  appState.camera.y =
    topSpace + (height - b.h * appState.camera.z) / 2 - b.y * appState.camera.z;
  applyCamera();
}
export function zoom(factor, x, y) {
  const r = $("#graph").getBoundingClientRect();
  x = x ?? r.width / 2;
  y = y ?? r.height / 2;
  const z = Math.min(
    CAMERA_MAX_ZOOM,
    Math.max(CAMERA_MIN_ZOOM, appState.camera.z * factor),
  );
  appState.camera.x = x - ((x - appState.camera.x) * z) / appState.camera.z;
  appState.camera.y = y - ((y - appState.camera.y) * z) / appState.camera.z;
  appState.camera.z = z;
  applyCamera();
}
