import { commit } from "../../services/history.js";
import { processFiles, setPortrait } from "../../services/files.js";
import { importFile } from "../../services/archive.js";
import { arrangeGraph } from "../../graph/layout.js";
import { updatePathSearchMode } from "../../graph/controls.js";
import { resetAnalysis } from "../../graph/analysis.js";
import { renderKinResult } from "../../features/relationships.js";
import { renderEvents } from "../../features/events.js";
import { renderDocuments } from "../../features/documents.js";
import { clone } from "../../core/utils.js";
import { state as appState } from "../../core/state.js";
export function bindChangeEvents() {
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "graphLayout") {
      arrangeGraph(t.value);
      return;
    }
    if (t.id === "analysisPathMode") {
      updatePathSearchMode();
      return;
    }
    if (["eventType", "eventDays", "eventOrder"].includes(t.id)) {
      if (t.id === "eventType") appState.eventType = t.value;
      if (t.id === "eventDays") appState.eventDays = Number(t.value);
      if (t.id === "eventOrder") appState.eventOrder = t.value;
      appState.eventLimit = 80;
      renderEvents();
      return;
    }
    if (t.id === "docShowAll") {
      appState.docShowAll = t.checked;
      renderDocuments();
      return;
    }
    if (["kinFrom", "kinTo"].includes(t.id)) {
      renderKinResult();
      return;
    }
    if (t.id === "docFileFilter") {
      appState.docFileFilter = t.value;
      renderDocuments();
      return;
    }
    if (t.id === "purpose") {
      appState.docShowAll = false;
      resetAnalysis();
      commit(() => (appState.project.purpose = t.value));
    }
    if (t.id === "subjectSelect")
      commit(() => (appState.project.subjectId = t.value));
    if (t.id === "claimantSelect")
      commit(() => (appState.project.claimantId = t.value));
    if (t.id === "docTypeFilter") {
      appState.docTypeFilter = t.value;
      renderDocuments();
    }
    if (t.id === "fileInput")
      processFiles([...t.files], clone(appState.fileContext));
    if (t.id === "portraitInput" && t.files[0])
      setPortrait(appState.portraitPerson, t.files[0]);
    if (t.id === "importInput" && t.files[0]) {
      const fromStart = appState.pendingStartImport;
      appState.pendingStartImport = false;
      importFile(t.files[0], {
        fromStart,
      });
    }
  });
}
