import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { icon } from "./icons.js";

/** Store the save phase independently of its current interface language. */
export function updateSaveStatus(phase) {
  state.saveStatus = phase;
  renderSaveStatus();
}
export function renderSaveStatus() {
  const messages = {
    saving: ["circle", "ui.saving"],
    saved: ["check", "ui.draftSaved"],
    restored: ["check", "ui.draftOnDevice"],
    unavailable: ["", "ui.saveAZipArchive"],
  };
  const message = messages[state.saveStatus];
  $("#saveState").innerHTML = message
    ? (message[0] ? icon(message[0]) : "") + translate(message[1])
    : "";
}
