import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { filteredGraphNodes } from "./render.js";
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
    Math.max(0.15, Math.min((rect.width - 40) / b.w, (rect.height - 75) / b.h)),
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
  const z = Math.min(2.5, Math.max(0.12, appState.camera.z * factor));
  appState.camera.x = x - ((x - appState.camera.x) * z) / appState.camera.z;
  appState.camera.y = y - ((y - appState.camera.y) * z) / appState.camera.z;
  appState.camera.z = z;
  applyCamera();
}
