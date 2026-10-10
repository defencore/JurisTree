import { personDisplayName } from "../model/person-display.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { avatar } from "./components.js";
import { icon } from "./icons.js";

export function favoriteButton(p, compact = false) {
  const label = translate(p.favorite ? "ui.removeFavorite" : "ui.addFavorite");
  return `<button type="button" class="${compact ? "iconbtn small" : "btn small"} favorite-button ${p.favorite ? "active" : ""}" data-favorite="${p.id}" aria-pressed="${!!p.favorite}" aria-label="${esc(label + ": " + personDisplayName(p))}" title="${esc(label)}">${icon("star")}${compact ? "" : esc(label)}</button>`;
}
export function renderFavorites() {
  const people = appState.project.people.filter((p) => p.favorite);
  $("#favoriteList").innerHTML = people.length
    ? people
        .map(
          (p) =>
            `<div class="favorite-row"><button type="button" class="favorite-person" data-fast-person="${p.id}">${avatar(p)}<span>${esc(personDisplayName(p))}</span></button>${favoriteButton(p, true)}</div>`,
        )
        .join("")
    : `<p class="hint">${translate("ui.favoritesHint")}</p>`;
  const rail = $("#favoriteRail");
  rail.hidden = appState.view !== "tree";
  const trigger = $('[popovertarget="favoriteRail"]');
  trigger?.setAttribute(
    "title",
    translate("ui.workingPeople") + ` (${people.length})`,
  );
  rail.innerHTML = `<span>${icon("star")}${translate("ui.workingPeople")}</span><div>${people.map((p) => `<button type="button" class="btn small ${appState.selected?.id === p.id ? "active" : ""}" data-fast-person="${p.id}">${esc(personDisplayName(p))}</button>`).join("") || `<p class="hint">${translate("ui.favoritesHint")}</p>`}</div>`;
}
