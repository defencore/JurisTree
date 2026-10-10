import { closeMapPanels } from "../ui/map-panels.js";
import { $ } from "../core/dom.js";
import { focusPerson } from "../graph/camera.js";
import { select } from "../ui/render.js";

export function showPersonOnMap(id) {
  $(".legend").open = false;
  closeMapPanels();
  select("person", id);
  if (innerWidth <= 1100) $("#inspector").classList.remove("open");
  $("#graph").focus({ preventScroll: true });
  focusPerson(id);
}
