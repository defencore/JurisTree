import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { getLanguage, translate } from "../i18n/index.js";
import { buildSearchIndex, searchIndex } from "../model/search.js";
import { focusPerson, fit } from "../graph/camera.js";
import { resetAnalysis } from "../graph/analysis.js";
import { render, select } from "../ui/render.js";
import { icon, icons } from "../ui/icons.js";
import { viewDocument } from "./documents.js";
import { editProperty } from "./property.js";
let cache = null;
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
  const project = appState.project,
    language = getLanguage();
  if (
    !cache ||
    cache.project !== project ||
    cache.updatedAt !== project.updatedAt ||
    cache.language !== language
  )
    cache = {
      project,
      updatedAt: project.updatedAt,
      language,
      index: buildSearchIndex(project),
    };
  const matches = searchIndex(cache.index, query),
    shown = matches.slice(0, appState.searchLimit);
  $("#globalSearchResults").innerHTML =
    `<div class="search-result-head"><strong>${translate("ui.searchResults")} (${matches.length})</strong><button type="button" class="iconbtn small" data-action="close-search" aria-label="${translate("ui.closeSearch")}">${icon("x")}</button></div><p class="hint">${translate("ui.searchCombinationHint")}</p><div class="search-result-list">${shown.map((entry) => `<button type="button" class="global-search-result" data-search-kind="${entry.kind}" data-search-id="${entry.id}">${icon({ person: "user", document: "file", relation: "link", property: "home", group: "users" }[entry.kind])}<span><b>${esc(entry.title)}</b><small>${esc([entry.kindLabel, entry.subtitle].filter(Boolean).join(" · "))}</small></span></button>`).join("") || `<p class="empty-search">${translate("ui.noSearchResults")}</p>`}</div>${matches.length > shown.length ? `<button type="button" class="btn" data-action="more-search">${translate("ui.moreSearchResults")} · ${shown.length}/${matches.length}</button>` : ""}`;
  $("#globalSearchResults").hidden = false;
  input.setAttribute("aria-expanded", "true");
  icons();
}
export async function openSearchResult(kind, id) {
  closeSearch();
  if (kind === "person") {
    select("person", id);
    focusPerson(id);
  } else if (kind === "document") await viewDocument(id);
  else if (kind === "relation") {
    appState.groupFilter = "";
    resetAnalysis(false);
    select("relation", id);
    fit();
  } else if (kind === "property") await editProperty(id);
  else if (kind === "group") {
    appState.groupFilter = id;
    appState.view = "tree";
    resetAnalysis(false);
    render();
    fit();
  }
  closeSearch();
}
export function bindSearchEvents() {
  $("#globalSearch").addEventListener("focus", renderSearch);
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".global-search-bar")) closeSearch();
  });
  document.addEventListener("keydown", (event) => {
    if (
      !appState.editorActive ||
      !$("#startScreen").hidden ||
      $("#modal").open ||
      $("#cropDialog").open
    )
      return;
    const input = $("#globalSearch"),
      results = $("#globalSearchResults"),
      inside = event.target.closest(".global-search-bar");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      input.focus();
      input.select();
      return;
    }
    if (!inside) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.focus();
      closeSearch();
      return;
    }
    if (results.hidden) return;
    const buttons = [...results.querySelectorAll("[data-search-kind]")];
    if (["ArrowDown", "ArrowUp"].includes(event.key) && buttons.length) {
      event.preventDefault();
      const i = buttons.indexOf(document.activeElement),
        offset = event.key === "ArrowDown" ? 1 : -1;
      buttons[
        i < 0
          ? offset === 1
            ? 0
            : buttons.length - 1
          : (i + offset + buttons.length) % buttons.length
      ].focus();
    } else if (
      event.key === "Enter" &&
      event.target === input &&
      buttons.length
    ) {
      event.preventDefault();
      buttons[0].click();
    }
  });
}
