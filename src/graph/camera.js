import { CAMERA_MAX_ZOOM, CAMERA_MIN_ZOOM } from "../core/config.js";
import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { filteredGraphNodes } from "./node-data.js";

export function focusPerson(
  id = appState.selected?.kind === "person" ? appState.selected.id : "",
) {
  const nodes = filteredGraphNodes();
  const node =
    nodes.find((n) => n.id === id) ||
    nodes.find((n) => n.kind === "person") ||
    nodes[0];
  if (!node) return fit();
  const rect = $("#graph").getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const overlays = [$(".graph-tools"), $(".legend")]
    .filter(Boolean)
    .map((el) => el.getBoundingClientRect())
    .filter((box) => box.width && box.height);
  let z = Math.max(
    0.15,
    Math.min(
      1.1,
      (rect.width - 48) / node.w,
      (rect.height - 76) / (node.h + 24),
    ),
  );
  let centerX = rect.width / 2,
    bottom = 64;
  if (z < 0.85) {
    const right = Math.max(0, ...overlays.map((box) => box.right - rect.left));
    const larger = Math.min(
      1.1,
      (rect.width - 48) / node.w,
      (rect.height - 24) / (node.h + 24),
    );
    if (larger > z && rect.width - right - 48 >= node.w * larger) {
      z = larger;
      centerX = (right + rect.width) / 2;
      bottom = 12;
    }
  }
  const overlapping = overlays.filter(
    (box) =>
      box.right > rect.left + centerX - (node.w * z) / 2 &&
      box.left < rect.left + centerX + (node.w * z) / 2,
  );
  if (overlapping.length) {
    bottom = Math.max(
      bottom,
      rect.bottom - Math.min(...overlapping.map((box) => box.top)) + 12,
    );
    z = Math.max(
      0.15,
      Math.min(z, (rect.height - bottom - 12) / (node.h + 24)),
    );
  }
  const top = 12 + 24 * z;
  appState.camera = {
    z,
    x: centerX - (node.x + node.w / 2) * z,
    y: top + (rect.height - top - bottom) / 2 - (node.y + node.h / 2) * z,
  };
  applyCamera();
}
export function applyCamera() {
  $("#scene").setAttribute(
    "transform",
    `translate(${appState.camera.x} ${appState.camera.y}) scale(${appState.camera.z})`,
  );
  $("#zoomLabel").textContent = Math.round(appState.camera.z * 100) + "%";
}
export function bounds() {
  const ns = filteredGraphNodes();
  if (!ns.length)
    return {
      x: 0,
      y: 0,
      w: 600,
      h: 400,
    };
  const x = Math.min(...ns.map((n) => n.x)) - 55,
    y = Math.min(...ns.map((n) => n.y)) - 55;
  return {
    x,
    y,
    w: Math.max(...ns.map((n) => n.x + n.w)) - x + 55,
    h: Math.max(...ns.map((n) => n.y + n.h)) - y + 55,
  };
}
export function fit() {
  const el = $("#graph"),
    rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const b = bounds();
  appState.camera.z = Math.min(
    1.1,
    Math.max(
      CAMERA_MIN_ZOOM,
      Math.min((rect.width - 40) / b.w, (rect.height - 75) / b.h),
    ),
  );
  appState.camera.x =
    (rect.width - b.w * appState.camera.z) / 2 - b.x * appState.camera.z;
  appState.camera.y =
    (rect.height - b.h * appState.camera.z) / 2 - b.y * appState.camera.z - 10;
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
