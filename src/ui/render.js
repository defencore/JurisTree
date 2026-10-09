import { workspaceModes } from "../core/workspace-modes.js";
import { $, $$, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { workspaceView } from "../core/workspace-views.js";
import { renderGraph } from "../graph/render.js";
import { translate } from "../i18n/index.js";
import { familyEvents } from "../model/events.js";
import { gaps, route, sourceInScope } from "../model/evidence.js";
import { resetAnalysis } from "../model/graph-view.js";
import { person } from "../model/lookup.js";
import {
  personPassesFilter,
  resetPersonFilter,
} from "../model/person-filter-state.js";
import { withProjectIndex } from "../model/project.js";
import { scheduleSave } from "../services/storage.js";
import { personOptions } from "./components.js";
import { eventRecordActions } from "./event-domains.js";
import { renderFavorites } from "./favorites.js";
import { renderGraphControls } from "./graph-controls.js";
import { renderGroups } from "./groups.js";
import { icon, icons } from "./icons.js";
import { renderInspector } from "./inspector.js";
import { renderPeople } from "./people.js";
import { renderPersonFilterBar } from "./person-filter-bar.js";
import { renderSaveStatus } from "./save-status.js";
import { renderSearch } from "./search.js";
import { renderStatusBoard } from "./status-board.js";
import { renderCalendar } from "./workspaces/calendar.js";
import { renderDocuments } from "./workspaces/documents.js";
import { renderEvents } from "./workspaces/events.js";
import { renderGaps } from "./workspaces/gaps.js";
import { renderProfiles } from "./workspaces/people.js";
import { renderProperty } from "./workspaces/property.js";

export function render() {
  if (!appState.project) return;
  return withProjectIndex(renderAll);
}

export function renderAll() {
  renderSaveStatus();
  $("#projectTitle").textContent = appState.project.title;
  $("#demoTag").hidden = !appState.project.demo;
  const modes = workspaceModes();
  $("#purpose").innerHTML = Object.entries(modes)
    .map(([key, mode]) => `<option value="${key}">${esc(mode.title)}</option>`)
    .join("");
  $("#purpose").value = appState.project.purpose;
  $("#purposeHint").textContent = modes[appState.project.purpose].description;
  $("#profileCount").textContent = appState.project.people.length;
  $("#peopleCount").textContent = appState.project.people.length;
  $("#docCount").textContent =
    appState.project.documents.filter(sourceInScope).length;
  $("#gapCount").textContent = gaps().length;
  $("#assetCount").textContent = appState.project.property.length;
  $("#eventCount").textContent = familyEvents().length;
  $$("[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === appState.view);
    if (b.dataset.view === appState.view)
      b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  document.body.classList.toggle("view-full", appState.view !== "tree");
  renderPersonFilterBar();
  renderGroups();
  renderPeople();
  renderMain();
  renderFavorites();
  renderInspector();
  renderStatusBoard();
  if (!$("#globalSearchResults").hidden) renderSearch();
  icons();
}

export function renderMain() {
  $("#workspaceHistory").hidden = ["tree", "property"].includes(appState.view);
  $('[data-history-command="undo"]').disabled = !appState.history.length;
  $('[data-history-command="redo"]').disabled = !appState.future.length;
  const view = workspaceView(appState.view);
  $("#viewTitle").textContent = translate(view.heading || view.title);
  $("#viewEyebrow").textContent = translate(view.eyebrow);
  $("#otherView").classList.toggle("profiles-view", appState.view === "people");
  document.body.classList.toggle("profiles-active", appState.view === "people");
  $("#viewSubtitle").textContent = appState.project.title;
  $("#canvasWrap").hidden = appState.view !== "tree";
  $("#statusBoard").hidden = [
    "events",
    "calendar",
    "property",
    "people",
  ].includes(appState.view);
  $("#otherView").hidden = appState.view === "tree";
  $("#viewActions").innerHTML = ["tree", "people"].includes(appState.view)
    ? `<button class="btn" data-action="compare" title="${translate("ui.howAreWeRelated")}">${icon("compare")}<span>${translate("ui.kinship")}</span></button><button class="btn" data-action="add-relation" title="${translate("ui.addRelationship")}">${icon("link")}<span>${translate("ui.relationship")}</span></button><button class="btn primary" data-action="add-person" title="${translate("ui.addPerson")}">${icon("addPerson")}<span>${translate("ui.addPerson")}</span></button>${appState.comparisonPath ? `<button class="iconbtn" data-action="clear-comparison" title="${translate("ui.clearPathHighlight")}" aria-label="${translate("ui.clearPathHighlight")}">${icon("x")}</button>` : ""}`
    : ["calendar", "events"].includes(appState.view)
      ? eventRecordActions(
          appState.view === "calendar"
            ? appState.calendarDomain
            : appState.eventDomain,
          appState.view === "calendar",
        )
      : appState.view === "property"
        ? `<button class="btn primary" data-action="add-property">${icon("plus")}<span>${translate("ui.addProperty")}</span></button>`
        : `<button class="btn" data-action="reference" title="${translate("ui.addARecordWithoutAFile")}">${icon("reference")}<span>${translate("ui.recordWithoutAFile")}</span></button><button class="btn primary" data-action="add-document" title="${translate("ui.addFile")}">${icon("upload")}<span>${translate("ui.addFile")}</span></button>`;
  const path = route();
  $("#pathPanel").innerHTML =
    appState.view === "tree" && appState.project.purpose === "inheritance"
      ? `<div class="path-panel">${icon("route")}<span class="label">${translate("ui.owner")}</span><select id="subjectSelect" aria-label="${translate("ui.deceasedEstateOwner")}">${personOptions(appState.project.subjectId, true)}</select><span class="label">${translate("ui.claimant")}</span><select id="claimantSelect" aria-label="${translate("ui.claimant")}">${personOptions(appState.project.claimantId, true)}</select><span class="path-summary">${path.found ? icon("link") + " " + path.relations.length + ` ${translate("ui.familyRelationships2")}` : translate("ui.noRouteFound")}</span></div>`
      : "";
  renderGraphControls();
  if (appState.view === "tree") {
    renderGraph();
    return;
  }
  if (appState.view === "people") renderProfiles();
  else if (appState.view === "calendar") renderCalendar();
  else if (appState.view === "events") renderEvents();
  else if (appState.view === "documents") renderDocuments();
  else if (appState.view === "gaps") renderGaps();
  else renderProperty();
}

export function select(kind, id) {
  if (
    appState.graphFocus &&
    kind === "person" &&
    !appState.graphFocus.people.includes(id)
  )
    resetAnalysis(false);
  appState.multiSelection.clear();
  appState.graphSelectionAnchor = kind === "person" ? id : "";
  appState.comparisonPath = null;
  let scopeChanged = false;
  if (kind === "person") {
    const p = person(id);
    if (!personPassesFilter(id)) {
      resetPersonFilter();
      scopeChanged = true;
    }
    if (
      appState.groupFilter &&
      !(p.groupIds || []).includes(appState.groupFilter)
    ) {
      appState.groupFilter = "";
      scopeChanged = true;
    }
    for (const g of appState.project.groups)
      if (g.collapsed && (p.groupIds || []).includes(g.id)) {
        g.collapsed = false;
        scopeChanged = true;
        scheduleSave();
      }
  }
  appState.selected = {
    kind,
    id,
  };
  if (appState.view !== "tree" || scopeChanged) {
    appState.view = "tree";
    render();
  } else {
    renderPeople();
    renderGraph();
    renderInspector();
    icons();
  }
  renderFavorites();
  $("#inspector").classList.add("open");
  if (innerWidth <= 760) $("#sidebar").classList.remove("open");
}
