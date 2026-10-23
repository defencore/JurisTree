import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { translate as t } from "../i18n/index.js";
import { icon } from "./icons.js";

export function syncMapFocusButton() {
  const button = $('[data-action="toggle-map-focus"]');
  if (!button) return;
  const focused = document.body.classList.contains("map-focused"),
    label = t(focused ? "ui.exitMapFocus" : "ui.enterMapFocus");
  button.setAttribute("aria-pressed", String(focused));
  button.setAttribute("aria-label", label);
  button.title = label;
  button.classList.toggle("active", focused);
}

/** Keep frequent actions beside the map; secondary tools use overlay panels. */
export function mapActions() {
  const focused = document.body.classList.contains("map-focused"),
    focusLabel = t(focused ? "ui.exitMapFocus" : "ui.enterMapFocus");
  const action = (name, symbol, label, primary = false) =>
    `<button class="btn ${primary ? "primary" : ""}" data-action="${name}" aria-label="${t(label)}" title="${t(label)}">${icon(symbol)}<span>${t(label)}</span></button>`;
  return (
    action("add-person", "addPerson", "ui.addPerson", true) +
    action("add-relation", "link", "ui.relationship") +
    action("compare", "compare", "ui.kinship") +
    `<button class="iconbtn ${state.diagramEditing ? "active" : ""}" data-action="diagram-panel" aria-label="${t("ui.diagramTools")}" title="${t("ui.diagramTools")}" aria-pressed="${state.diagramEditing}">${icon("route")}</button>` +
    `<button class="iconbtn" popovertarget="favoriteRail" aria-label="${t("ui.workingPeople")}" title="${t("ui.workingPeople")}">${icon("star")}</button>` +
    `<button class="btn map-options-trigger" popovertarget="mapSettings" aria-expanded="${!!$("#mapSettings")?.matches(":popover-open")}" aria-label="${t("ui.mapOptions")}" title="${t("ui.mapOptions")}">${icon("sliders")}<span>${t("ui.mapOptions")}</span></button>` +
    `<button class="iconbtn" data-action="toggle-inspector" aria-label="${t("ui.detailsPanel")}" title="${t("ui.detailsPanel")}">${icon("user")}</button>` +
    `<button class="iconbtn map-focus-button ${focused ? "active" : ""}" data-action="toggle-map-focus" aria-pressed="${focused}" aria-label="${focusLabel}" title="${focusLabel}">${icon("maximize")}</button>` +
    (state.comparisonPath
      ? `<button class="iconbtn" data-action="clear-comparison" aria-label="${t("ui.clearPathHighlight")}" title="${t("ui.clearPathHighlight")}">${icon("x")}</button>`
      : "")
  );
}
