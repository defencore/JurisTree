import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { fit } from "../graph/camera.js";
import { resetAnalysis } from "../model/graph-view.js";
import { render, select } from "../ui/render.js";
import { closeSearch, renderSearch } from "../ui/search.js";
import { viewDocument } from "./document-view.js";
import { showPersonOnMap } from "./person-navigation.js";
import { openPropertyHistory } from "./property-history.js";

export async function openSearchResult(kind, id) {
  closeSearch();
  if (kind === "person") {
    showPersonOnMap(id);
  } else if (kind === "document") await viewDocument(id);
  else if (kind === "relation") {
    appState.groupFilter = "";
    resetAnalysis(false);
    select("relation", id);
    fit();
  } else if (kind === "property") openPropertyHistory(id);
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
