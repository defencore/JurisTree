import { defaultScopes } from "../../core/workspace-modes.js";
import { eventDomains } from "../../core/event-domains.js";
import { state as appState } from "../../core/state.js";
import { clone } from "../../core/utils.js";
import { importFile } from "../../features/archive.js";
import { processFiles } from "../../features/attachments.js";
import {
  changeCalendarMonth,
  changeCalendarYear,
} from "../../features/calendar.js";
import { updatePathSearchMode } from "../../features/graph-tools.js";
import { renderKinResult } from "../../features/relationships.js";
import { arrangeGraph } from "../../graph/layout.js";
import { dateExact, dateInputValue } from "../../model/dates.js";
import { resetAnalysis } from "../../model/graph-view.js";
import { commit } from "../../services/history.js";
import { renderMain } from "../../ui/render.js";
import { renderCalendar } from "../../ui/workspaces/calendar.js";
import { renderDocuments } from "../../ui/workspaces/documents.js";
import { renderEvents } from "../../ui/workspaces/events.js";
import { renderProperty } from "../../ui/workspaces/property.js";

export function bindChangeEvents() {
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "propertyDate") {
      const date = dateInputValue(t.value);
      if (!date) {
        renderProperty();
        return;
      }
      if (!dateExact(date)) {
        t.reportValidity();
        return;
      }
      appState.propertyDate = date;
      renderProperty();
      return;
    }
    if (
      t.id === "propertyReviewFilter" &&
      ["all", "claims", "review"].includes(t.value)
    ) {
      appState.propertyReviewFilter = t.value;
      renderProperty();
      return;
    }
    if (
      ["eventDomain", "calendarDomain"].includes(t.id) &&
      Object.hasOwn(eventDomains(), t.value)
    ) {
      appState[t.id] = t.value;
      appState[t.id === "eventDomain" ? "eventType" : "calendarType"] = "";
      appState.eventLimit = 80;
      appState.calendarUndatedLimit = 80;
      renderMain();
      return;
    }
    if (t.id === "calendarYear") {
      changeCalendarYear(t.value);
      return;
    }
    if (t.id === "calendarMonth") {
      changeCalendarMonth(t.value);
      return;
    }
    if (t.id === "calendarType") {
      appState.calendarType = t.value;
      renderCalendar();
      return;
    }
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
    if (t.id === "purpose" && Object.hasOwn(defaultScopes, t.value)) {
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
    if (t.id === "importInput" && t.files[0]) {
      const fromStart = appState.pendingStartImport;
      appState.pendingStartImport = false;
      importFile(t.files[0], {
        fromStart,
      });
    }
  });
}
