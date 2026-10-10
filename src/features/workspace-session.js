import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { isMobileLayout } from "../core/viewport.js";
import { fit, focusPerson } from "../graph/camera.js";
import { translate } from "../i18n/index.js";
import { resetAnalysis } from "../model/graph-view.js";
import { resetPersonFilter } from "../model/person-filter-state.js";
import { launchDraft } from "../model/workspace.js";
import { checkpoint } from "../services/history.js";
import { scheduleSave } from "../services/storage.js";
import { openDialog } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
import { render } from "../ui/render.js";
import { updateSaveStatus } from "../ui/save-status.js";

export async function confirmStartReplacement(summary = "") {
  const draft = launchDraft();
  if (!draft) return true;
  const f = await openDialog(
    translate("ui.openAnotherMap"),
    `${summary}<p class="hint">${translate("ui.theCurrentDraft")}${esc(draft.project.title)}${translate("ui.willBeReplacedExportAnArchiveToKeep")}</p><button type="button" class="btn" data-action="start-backup">${icon("archive")}${translate("ui.downloadCurrentDraftZip")}</button>`,
    {
      submit: translate("ui.openAnotherMap2"),
    },
  );
  return !!f;
}
export function activateTree(
  model,
  files = new Map(),
  {
    persist = true,
    view = "tree",
    eventDomain = "family",
    eventMode = "upcoming",
  } = {},
) {
  if (appState.editorActive) checkpoint();
  else {
    appState.history = [];
    appState.future = [];
  }
  resetAnalysis(false);
  appState.diagramEditing = false;
  appState.diagramNodeSelection.clear();
  appState.diagramConnectionKey = "";
  appState.diagramAddPoint = false;
  appState.diagramPointIndex = -1;
  appState.diagramLabelSelection.clear();
  appState.multiSelection.clear();
  appState.graphSelectionAnchor = "";
  appState.selectionMode = false;
  appState.layoutScope = "selected";
  appState.layoutStyle = "";
  appState.touchMove = false;
  document.body.classList.remove("mobile-tools-open");
  appState.project = model;
  for (const [id, b] of files) appState.blobs.set(id, b);
  appState.editorActive = true;
  appState.savedDraft = null;
  appState.view = view;
  appState.profileFocus = "";
  appState.profileSearch = "";
  appState.groupFilter = "";
  resetPersonFilter();
  appState.comparisonPath = null;
  appState.docFilter = "";
  appState.docTypeFilter = "";
  appState.docStatusFilter = "";
  appState.docFileFilter = "";
  appState.docShowAll = false;
  appState.showDocs = false;
  appState.eventSearch = "";
  appState.propertyFocus = "";
  appState.propertyDate = "";
  appState.propertySearch = "";
  appState.propertyReviewFilter = "all";
  appState.eventType = "";
  appState.eventDomain = eventDomain;
  appState.calendarMode = "month";
  appState.calendarUndatedLimit = 80;
  appState.calendarMonth = "";
  appState.calendarDay = "";
  appState.calendarSearch = "";
  appState.calendarType = "";
  appState.calendarDomain = "family";
  appState.eventMode = eventMode;
  appState.eventLimit = 80;
  appState.camera = {
    x: 0,
    y: 0,
    z: 1,
  };
  $("#peopleSearch").value = "";
  $("#globalSearch").value = "";
  $("#globalSearchResults").hidden = true;
  $("#globalSearch").setAttribute("aria-expanded", "false");
  appState.searchLimit = 20;
  $("#sidebar").classList.remove("open");
  $("#inspector").classList.remove("open");
  appState.selected = appState.project.people.length
    ? {
        kind: "person",
        id: appState.project.claimantId || appState.project.people[0].id,
      }
    : null;
  $("#startScreen").hidden = true;
  $("#appShell").hidden = false;
  $("#startError").textContent = "";
  render();
  if (view === "tree")
    requestAnimationFrame(() => (isMobileLayout() ? focusPerson() : fit()));
  if (persist) scheduleSave();
  else updateSaveStatus("restored");
}
