import { renderPersonFilterBar } from "../features/person-filters.js";
import {
  personPassesFilter,
  resetPersonFilter,
} from "../features/person-filter-state.js";
import { $, $$ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import { person, withProjectIndex } from "../model/project.js";
import { gaps, route, sourceInScope } from "../model/evidence.js";
import { renderGroups } from "../features/groups.js";
import { renderFavorites } from "../features/favorites.js";
import { renderSearch } from "../features/search.js";
import { renderCalendar } from "../features/calendar.js";
import { renderEvents, familyEvents } from "../features/events.js";
import { renderDocuments, renderGaps } from "../features/documents.js";
import { renderProperty } from "../features/property.js";
import { profileScope } from "../features/profiles.js";
import { renderPeople } from "./people.js";
import { renderInspector } from "./inspector.js";
import { renderSaveStatus } from "./save-status.js";
import { renderStatusBoard } from "./status-board.js";
import { personOptions } from "./components.js";
import { icon, icons } from "./icons.js";
import { resetAnalysis } from "../graph/analysis.js";
import { renderGraphControls } from "../graph/controls.js";
import { renderGraph } from "../graph/render.js";
import { scheduleSave } from "../services/storage.js";
export function render() {
  if (!appState.project) return;
  return withProjectIndex(renderAll);
}

export function renderAll() {
  renderSaveStatus();
  $("#projectTitle").textContent = appState.project.title;
  $("#demoTag").hidden = !appState.project.demo;
  $("#purpose").value = appState.project.purpose;
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
  const titles = {
      tree: translate("ui.relationshipMap"),
      documents: translate("ui.documentsAndSources"),
      gaps: translate("ui.evidenceAndGaps"),
      property: translate("ui.propertyAndShares"),
      events: translate("ui.eventsAndAnniversaries"),
      calendar: translate("ui.calendar"),
    },
    eyebrows = {
      tree: translate("ui.familyRelationships"),
      documents: translate("ui.documentsPhotosRecords"),
      gaps: translate("ui.nextSteps"),
      property: translate("ui.ownershipAndAllocationPlan"),
      events: translate("ui.familyTimeline"),
      calendar: translate("ui.birthdaysAndAnniversaries"),
    };
  $("#viewTitle").textContent = titles[appState.view];
  $("#viewEyebrow").textContent = eyebrows[appState.view];
  $("#viewSubtitle").textContent = appState.project.title;
  $("#canvasWrap").hidden = appState.view !== "tree";
  $("#statusBoard").hidden = ["events", "calendar"].includes(appState.view);
  $("#otherView").hidden = appState.view === "tree";
  $("#viewActions").innerHTML =
    appState.view === "tree"
      ? `<button class="btn" data-action="compare" title="${translate("ui.howAreWeRelated")}">${icon("compare")}<span>${translate("ui.kinship")}</span></button><button class="btn" data-action="add-relation" title="${translate("ui.addRelationship")}">${icon("link")}<span>${translate("ui.relationship")}</span></button><button class="btn primary" data-action="add-person" title="${translate("ui.addPerson")}">${icon("addPerson")}<span>${translate("ui.addPerson")}</span></button>${appState.comparisonPath ? `<button class="iconbtn" data-action="clear-comparison" title="${translate("ui.clearPathHighlight")}" aria-label="${translate("ui.clearPathHighlight")}">${icon("x")}</button>` : ""}`
      : appState.view === "calendar"
        ? `<button class="btn primary" data-action="add-calendar-event">${icon("plus")}${translate("ui.addEvent")}</button>`
        : appState.view === "events"
          ? profileScope().includes("timeline")
            ? `<button class="btn primary" data-action="add-event">${icon("plus")}${translate("ui.addEvent")}</button>`
            : `<button class="btn" data-action="scope">${icon("sliders")}${translate("ui.configureSections")}</button>`
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
  if (appState.view === "calendar") renderCalendar();
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
