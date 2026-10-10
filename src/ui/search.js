import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { projectSearchIndex } from "../model/search-cache.js";
import { searchIndex } from "../model/search.js";
import { icon, icons } from "./icons.js";

export function closeSearch() {
  $("#globalSearchResults").hidden = true;
  $("#globalSearch").setAttribute("aria-expanded", "false");
}
export function renderSearch() {
  const input = $("#globalSearch"),
    query = input.value.trim();
  if (!query || !appState.editorActive) {
    closeSearch();
    return;
  }
  const matches = searchIndex(projectSearchIndex(appState.project), query),
    shown = matches.slice(0, appState.searchLimit);
  $("#globalSearchResults").innerHTML =
    `<div class="search-result-head"><strong>${translate("ui.searchResults")} (${matches.length})</strong><button type="button" class="iconbtn small" data-action="close-search" aria-label="${translate("ui.closeSearch")}">${icon("x")}</button></div><p class="hint">${translate("ui.searchCombinationHint")}</p><div class="search-result-list">${shown.map((entry) => `<button type="button" class="global-search-result" data-search-kind="${entry.kind}" data-search-id="${entry.id}">${icon({ person: "user", document: "file", relation: "link", property: "home", group: "users" }[entry.kind])}<span><b>${esc(entry.title)}</b><small>${esc([entry.kindLabel, entry.subtitle].filter(Boolean).join(" · "))}</small></span></button>`).join("") || `<p class="empty-search">${translate("ui.noSearchResults")}</p>`}</div>${matches.length > shown.length ? `<button type="button" class="btn" data-action="more-search">${translate("ui.moreSearchResults")} · ${shown.length}/${matches.length}</button>` : ""}`;
  $("#globalSearchResults").hidden = false;
  input.setAttribute("aria-expanded", "true");
  icons();
}
