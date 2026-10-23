import { $, esc } from "../core/dom.js";
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
  const element = $("#saveState"),
    text = message ? translate(message[1]) : "";
  element.dataset.saveStatus = state.saveStatus;
  element.setAttribute("aria-label", text);
  element.title = [text, translate("ui.draftIsSavedOnlyInThisBrowser")]
    .filter(Boolean)
    .join(". ");
  element.innerHTML = message
    ? (message[0] ? icon(message[0]) : "") + `<span>${esc(text)}</span>`
    : "";
}
