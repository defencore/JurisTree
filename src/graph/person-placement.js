import {
  PERSON_CARD_WIDTH as w,
  PERSON_CARD_HEIGHT as h,
} from "../core/config.js";
import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import {
  freePersonPosition,
  relatedPersonPosition,
  viewportPersonPosition,
} from "../model/person-placement.js";
import { filteredGraphNodes } from "./node-data.js";

export function newPersonPosition(id, links) {
  const rect = $("#graph").getBoundingClientRect();
  const center =
    rect.width && rect.height
      ? viewportPersonPosition(state.camera, rect.width, rect.height)
      : { x: 80, y: 100 };
  const preferred = relatedPersonPosition(
    state.project.people,
    links,
    id,
    center,
  );
  const obstacles = [
    ...state.project.people.map((p) => ({ ...p, w, h })),
    ...filteredGraphNodes().filter(
      (n) => !["person", "group"].includes(n.kind),
    ),
  ];
  return freePersonPosition(preferred, obstacles);
}
