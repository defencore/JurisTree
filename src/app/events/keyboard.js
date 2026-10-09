import { $ } from "../../core/dom.js";
import { state as appState } from "../../core/state.js";
import { exportArchive } from "../../features/archive.js";
import { openFiles } from "../../features/attachments.js";
import { viewBiography } from "../../features/biography.js";
import { viewDocument } from "../../features/documents.js";
import { toggleFavorite } from "../../features/favorites.js";
import {
  clearGraphSelection,
  toggleGraphSelection,
} from "../../features/graph-analysis.js";
import { toggleGroup } from "../../features/groups.js";
import { editProperty } from "../../features/property.js";
import { applyCamera, fit, zoom } from "../../graph/camera.js";
import { resetAnalysis } from "../../model/graph-view.js";
import { redo, undo } from "../../services/history.js";
import { render, select } from "../../ui/render.js";

export function bindKeyboardEvents() {
  document.addEventListener("keydown", (e) => {
    if (!appState.editorActive || !$("#startScreen").hidden) return;
    if (e.target.id === "networkSeedSearch" && e.key === "Enter") {
      e.preventDefault();
      return;
    }
    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) ||
      $("#modal").open ||
      $("#cropDialog").open
    )
      return;
    const favorite = e.target.closest("[data-favorite]");
    if (
      favorite &&
      favorite.tagName !== "BUTTON" &&
      ["Enter", " "].includes(e.key)
    ) {
      e.preventDefault();
      toggleFavorite(favorite.dataset.favorite);
      return;
    }
    const biography = e.target.closest("[data-biography]");
    if (
      biography &&
      biography.tagName !== "BUTTON" &&
      ["Enter", " "].includes(e.key)
    ) {
      e.preventDefault();
      viewBiography(biography.dataset.biography);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      exportArchive();
    }
    if (e.key === "Escape") {
      if (appState.graphFocus || appState.analysisHighlight) {
        resetAnalysis();
        appState.multiSelection.clear();
        render();
      } else clearGraphSelection();
      $("#sidebar").classList.remove("open");
      $("#inspector").classList.remove("open");
    }
    if (e.key === "Enter") {
      const gh = e.target.closest("[data-toggle-group]");
      if (gh) toggleGroup(gh.dataset.toggleGroup);
      const n = e.target.closest("[data-node]");
      if (n) {
        if (
          n.dataset.kind === "person" &&
          (e.ctrlKey || e.metaKey || e.shiftKey)
        )
          toggleGraphSelection(n.dataset.node);
        else if (n.dataset.kind === "person") select("person", n.dataset.node);
        else if (n.dataset.kind === "document") viewDocument(n.dataset.node);
        else if (n.dataset.kind === "group") toggleGroup(n.dataset.node);
        else editProperty(n.dataset.node);
      }
      const r = e.target.closest("[data-edge],[data-relation]");
      if (r) select("relation", r.dataset.edge || r.dataset.relation);
      const d = e.target.closest("[data-document]");
      if (d) viewDocument(d.dataset.document);
      if (e.target.id === "dropZone") openFiles();
    }
    if (e.target === $("#graph")) {
      if (e.key === "+" || e.key === "=") zoom(1.2);
      if (e.key === "-") zoom(1 / 1.2);
      if (e.key === "0") fit();
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        appState.camera.x +=
          e.key === "ArrowLeft" ? 35 : e.key === "ArrowRight" ? -35 : 0;
        appState.camera.y +=
          e.key === "ArrowUp" ? 35 : e.key === "ArrowDown" ? -35 : 0;
        applyCamera();
      }
    }
  });
}
