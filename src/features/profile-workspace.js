import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { person } from "../model/lookup.js";
import { render } from "../ui/render.js";

export function openFullProfile(id) {
  if (!person(id)) return;
  state.profileFocus = id;
  state.selected = { kind: "person", id };
  state.view = "people";
  render();
  $("#otherView").scrollTop = 0;
  $("#sidebar").classList.remove("open");
  $("#inspector").classList.remove("open");
}

export function closeFullProfile() {
  state.profileFocus = "";
  render();
  $("#otherView").scrollTop = 0;
}
