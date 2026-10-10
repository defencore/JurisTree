import { $ } from "../../../core/dom.js";
import { state as appState } from "../../../core/state.js";
import { isMobileLayout } from "../../../core/viewport.js";
import { confirmDelete } from "../../../features/delete.js";
import { toggleGraphSelection } from "../../../features/graph-analysis.js";
import { selectStartTemplate } from "../../../features/launcher.js";
import { showPersonOnMap } from "../../../features/person-navigation.js";
import { openSearchResult } from "../../../features/search.js";
import { fit, focusPerson } from "../../../graph/camera.js";
import { render } from "../../../ui/render.js";
import { handleAction } from "../../actions.js";

export const navigationClicks = [
  {
    priority: 0,
    matches: (b) => b.dataset.historyCommand,
    run: async (b) => {
      await handleAction(b.dataset.historyCommand);
    },
  },
  {
    priority: 17,
    matches: (b) => b.dataset.searchKind,
    run: async (b) => {
      await openSearchResult(b.dataset.searchKind, b.dataset.searchId);
    },
  },
  {
    priority: 25,
    matches: (b) => b.dataset.startTemplate,
    run: async (b) => {
      selectStartTemplate(b.dataset.startTemplate);
    },
  },
  {
    priority: 51,
    matches: (b) => b.dataset.action,
    run: async (b) => {
      await handleAction(b.dataset.action);
    },
  },
  {
    priority: 52,
    matches: (b) => b.dataset.view,
    run: async (b) => {
      appState.view = b.dataset.view;
      if (appState.view === "people") appState.profileFocus = "";
      render();
      if (appState.view === "tree") isMobileLayout() ? focusPerson() : fit();
      if (isMobileLayout()) $("#sidebar").classList.remove("open");
    },
  },
  {
    priority: 53,
    matches: (b) => b.dataset.person,
    run: async (b, e) => {
      if (appState.view === "tree" && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        if (!e.detail) toggleGraphSelection(b.dataset.person);
        return;
      }
      showPersonOnMap(b.dataset.person);
    },
  },
  {
    priority: 59,
    matches: (b) =>
      ["Person", "Relation", "Document", "Property"].some(
        (kind) => b.dataset["delete" + kind],
      ),
    run: async (b) => {
      for (const k of ["Person", "Relation", "Document", "Property"])
        if (b.dataset["delete" + k]) {
          await confirmDelete(k.toLowerCase(), b.dataset["delete" + k]);
          return;
        }
    },
  },
];
