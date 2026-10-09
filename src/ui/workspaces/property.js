import { $ } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { localDateString } from "../../model/dates.js";
import { propertyWorkspace } from "../property-workspace.js";

export function renderProperty() {
  appState.propertyDate ||= localDateString();
  $("#otherView").innerHTML = propertyWorkspace();
}
