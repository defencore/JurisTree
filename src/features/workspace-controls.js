import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { applyCamera } from "../graph/camera.js";
import { resizeCamera } from "../model/camera-viewport.js";
import { translate as t } from "../i18n/index.js";
import { closeMapPanels, positionMapPanel } from "../ui/map-panels.js";

function changeWorkspace(callback) {
  const graph = $("#graph"),
    before = graph.getBoundingClientRect();
  callback();
  if (state.view === "tree" && before.width && before.height) {
    state.camera = resizeCamera(
      state.camera,
      before,
      graph.getBoundingClientRect(),
    );
    applyCamera();
  }
  for (const panel of document.querySelectorAll("[popover]:popover-open"))
    positionMapPanel(panel);
}

export function toggleNavigation() {
  closeMapPanels();
  if (innerWidth <= 760) {
    $("#inspector").classList.remove("open");
    $("#sidebar").classList.toggle("open");
  } else {
    changeWorkspace(() => document.body.classList.toggle("sidebar-collapsed"));
    const collapsed = document.body.classList.contains("sidebar-collapsed");
    $(".menu-toggle").setAttribute(
      "aria-label",
      t(collapsed ? "ui.openNavigation" : "ui.closeNavigation"),
    );
  }
}

export function closeInspector() {
  changeWorkspace(() => {
    $("#inspector").classList.remove("open");
    document.body.classList.add("inspector-collapsed");
  });
}

export function toggleInspector() {
  closeMapPanels();
  if (innerWidth <= 1050) {
    document.body.classList.remove("inspector-collapsed");
    $("#sidebar").classList.remove("open");
    $("#inspector").classList.toggle("open");
  } else
    changeWorkspace(() =>
      document.body.classList.toggle("inspector-collapsed"),
    );
}
