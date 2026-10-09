import { graphStateInfo, relTypes } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import {
  graphView,
  relationShown,
  visiblePeople,
} from "../model/graph-view.js";
import { person } from "../model/lookup.js";
import { selectedPeople } from "../model/relationship-draft.js";
import { typeOptions } from "./components.js";
import { icon } from "./icons.js";

export function renderGraphControls() {
  const toolbar = $("#graphToolbar"),
    context = $("#graphContext");
  if (!toolbar || !context) return;
  const toolsButton = $('[data-action="mobile-tools"]');
  toolsButton?.setAttribute(
    "aria-expanded",
    String(document.body.classList.contains("mobile-tools-open")),
  );
  const moveButton = $('[data-action="touch-move"]');
  moveButton?.setAttribute("aria-pressed", String(appState.touchMove));
  moveButton?.classList.toggle("active", appState.touchMove);
  if ($("#mobileMapHint"))
    $("#mobileMapHint").textContent = translate(
      appState.touchMove ? "ui.mobileMoveHint" : "ui.mobileMapHint",
    );

  toolbar.hidden = appState.view !== "tree";
  context.hidden = appState.view !== "tree";
  if (appState.view !== "tree") return;
  const cfg = graphView(),
    ps = visiblePeople(false),
    ids = new Set(ps.map((p) => p.id)),
    rs = appState.project.relations.filter(
      (r) => ids.has(r.from) && ids.has(r.to) && relationShown(r),
    );
  appState.multiSelection = new Set(
    [...appState.multiSelection].filter((id) => person(id)),
  );
  const changed =
    cfg.types.length !== Object.keys(relTypes()).length ||
    cfg.states.length !== Object.keys(graphStateInfo()).length ||
    cfg.hiddenRelations.length ||
    !cfg.showIsolated;
  toolbar.innerHTML = `<div class="graph-toolbar-group"><button class="btn small graph-search-btn" data-action="graph-search">${icon("route")}${translate("ui.connectionSearch")}</button><button class="btn small ${changed ? "active" : ""}" data-action="graph-filters">${icon("sliders")}${translate("ui.display")}${changed ? `<span class="filter-mark">${translate("ui.changed")}</span>` : ""}</button><button class="iconbtn small ${appState.selectionMode ? "active" : ""}" data-action="selection-mode" aria-label="${translate("ui.boxSelectPeople")}" title="${translate("ui.boxSelectionShiftDrag")}" aria-pressed="${appState.selectionMode}">${icon("selectBox")}</button><button class="iconbtn small" data-action="graph-help" aria-label="${translate("ui.workingWithTheMap")}" title="${translate("ui.workingWithTheMap")}">${icon("help")}</button></div><div class="graph-toolbar-group"><label class="layout-control"><span>${translate("ui.layout")}</span><select id="graphLayout" aria-label="${translate("ui.mapLayout")}" ${appState.analysisBusy ? "disabled" : ""}>${typeOptions(
    {
      generations: translate("ui.generations3"),
      network: translate("ui.network"),
      circle: translate("ui.circle"),
    },
    cfg.layout,
  )}</select></label><button class="btn small" data-action="saved-map-views" ${appState.analysisBusy ? "disabled" : ""}>${icon("archive")}${translate("ui.savedMapViews")}</button><button class="btn small ${appState.showDocs ? "active" : ""}" id="docsToggle" data-action="toggle-docs" aria-pressed="${appState.showDocs}">${icon("files")}${translate("ui.sources2")}</button></div><span class="graph-view-summary">${ps.length}/${appState.project.people.length} ${translate("ui.people2")} ${rs.length}/${appState.project.relations.length} ${translate("ui.relationships")}</span>`;
  $("#graph").classList.toggle("selection-mode", appState.selectionMode);
  context.hidden =
    !appState.analysisHighlight &&
    !appState.graphFocus &&
    !appState.multiSelection.size;
  const pair = selectedPeople(appState.project.people, appState.multiSelection);
  const pairHint =
    pair.length === 2
      ? `${esc(person(pair[0]).name)} → ${esc(person(pair[1]).name)}`
      : translate("ui.ctrlOrShiftClickToChangeSelection");
  context.innerHTML = `<div>${appState.analysisHighlight ? `<b>${esc(appState.analysisHighlight.label)}</b><span>${appState.graphFocus ? translate("ui.resultsOnly") : translate("ui.resultsHighlightedOnMap")}</span>` : `<b>${translate("ui.selectedPeople2")} ${appState.multiSelection.size}</b><span>${pairHint}</span>`}</div><div class="graph-context-actions">${pair.length === 2 ? `<button class="btn small primary" data-action="link-selected">${icon("link")}${translate("ui.addRelationship")}</button>` : ""}${appState.multiSelection.size > 1 ? `<button class="btn small" data-action="graph-search">${translate("ui.searchSelected")}</button>` : ""}${appState.multiSelection.size ? `<button class="btn small" data-action="focus-selection">${translate("ui.selectedOnly")}</button>` : ""}${appState.analysisHighlight || appState.graphFocus ? `<button class="btn small" data-action="clear-analysis">${translate("ui.showEntireMap")}</button>` : `<button class="btn small ghost" data-action="clear-selection">${translate("ui.clear")}</button>`}</div>`;
}
