import { placementLockControls } from "./placement-lock-controls.js";
import { renderDiagramTools } from "./diagram-tools.js";
import { graphStateInfo, relTypes } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { translate } from "../i18n/index.js";
import {
  directConnectionScope,
  graphView,
  relationShown,
  visiblePeople,
} from "../model/graph-view.js";
import { personDisplayName } from "../model/person-display.js";
import { person } from "../model/lookup.js";
import { selectedPeople } from "../model/relationship-draft.js";
import { layoutControls } from "./layout-controls.js";
import { filteredGraphNodes } from "../graph/node-data.js";
import { selectedGraphNodes } from "../model/graph-selection.js";
import { icon } from "./icons.js";

export function renderGraphControls() {
  const toolbar = $("#graphToolbar"),
    context = $("#graphContext");
  if (!toolbar || !context) return;
  renderDiagramTools();
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
  const layoutOpen =
    toolbar.querySelector(".graph-layout-settings")?.open ?? false;
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
  const direct = directConnectionScope(),
    selected =
      appState.selected?.kind === "person" && person(appState.selected.id);
  toolbar.innerHTML = `<div class="graph-toolbar-group"><button class="btn small map-kinship-action" data-action="compare">${icon("compare")}${translate("ui.kinship")}</button><button class="btn small ${direct ? "active" : ""}" data-action="direct-connections" ${!selected || appState.analysisBusy ? "disabled" : ""} aria-pressed="${!!direct}" title="${translate(selected ? "ui.directConnectionsHint" : "ui.chooseDirectPerson")}">${icon("network")}${translate("ui.directConnections")}</button><button class="btn small graph-search-btn" data-action="graph-search">${icon("route")}${translate("ui.connectionSearch")}</button><button class="btn small ${changed ? "active" : ""}" data-action="graph-filters">${icon("sliders")}${translate("ui.display")}${changed ? `<span class="filter-mark">${translate("ui.changed")}</span>` : ""}</button><button class="iconbtn small" data-action="graph-help" aria-label="${translate("ui.workingWithTheMap")}" title="${translate("ui.workingWithTheMap")}">${icon("help")}</button></div><div class="graph-toolbar-group"><button class="btn small ${appState.diagramEditing ? "active" : ""}" data-action="diagram-tools" aria-pressed="${appState.diagramEditing}">${icon("route")}${translate("ui.diagramTools")}</button><button class="btn small" data-action="group-visibility" ${!appState.project.groups.length || appState.analysisBusy ? "disabled" : ""}>${icon("groups")}${translate("ui.manageGroups")}</button><button class="btn small" data-action="saved-map-views" ${appState.analysisBusy ? "disabled" : ""}>${icon("archive")}${translate("ui.savedMapViews")}</button><button class="btn small ${appState.showDocs ? "active" : ""}" id="docsToggle" data-action="toggle-docs" aria-pressed="${appState.showDocs}">${icon("files")}${translate("ui.sources2")}</button></div>${!appState.diagramEditing ? `<details class="graph-layout-settings" ${layoutOpen ? "open" : ""}><summary>${translate("ui.mapLayout")}</summary>${layoutControls()}</details>` + placementLockControls() : ""}<span class="graph-view-summary">${ps.length}/${appState.project.people.length} ${translate("ui.people2")} ${rs.length}/${appState.project.relations.length} ${translate("ui.relationships")}</span>`;
  const selectionButton = $('[data-action="selection-mode"]'),
    gridButton = $('[data-action="toggle-grid"]');
  selectionButton?.classList.toggle("active", appState.selectionMode);
  selectionButton?.setAttribute("aria-pressed", String(appState.selectionMode));
  selectionButton?.setAttribute(
    "aria-label",
    translate("ui.diagramSelectItems"),
  );
  selectionButton?.setAttribute("title", translate("ui.selectionHint"));
  gridButton?.classList.toggle("active", cfg.showGrid);
  gridButton?.setAttribute("aria-pressed", String(cfg.showGrid));
  gridButton?.setAttribute(
    "aria-label",
    translate(cfg.showGrid ? "ui.hideGrid" : "ui.showGrid"),
  );
  gridButton?.setAttribute(
    "title",
    translate(cfg.showGrid ? "ui.hideGrid" : "ui.showGrid"),
  );
  const selectedCount =
    selectedGraphNodes(filteredGraphNodes(), appState).length +
    appState.diagramLabelSelection.size;
  $("#graph").classList.toggle("selection-mode", appState.selectionMode);
  if (appState.diagramEditing) {
    context.hidden = true;
    return;
  }
  if (direct) {
    context.hidden = false;
    context.innerHTML = `<div><b>${esc(translate("ui.directConnectionsOf", { name: personDisplayName(person(direct.rootId)) }))}</b><span>${esc(translate("ui.directConnectionsCount", { count: Math.max(0, ps.filter((p) => direct.people.has(p.id)).length - 1), dimmed: ps.filter((p) => !direct.people.has(p.id)).length }))}</span></div><div class="graph-context-actions"><button class="btn small primary" data-action="restore-connection-map">${icon("eye")}${translate("ui.restoreConnectionMap")}</button></div>`;
    return;
  }
  context.hidden =
    !appState.analysisHighlight && !appState.graphFocus && !selectedCount;
  const pair = selectedPeople(appState.project.people, appState.multiSelection);
  const pairHint =
    pair.length === 2
      ? `${esc(person(pair[0]).name)} → ${esc(person(pair[1]).name)}`
      : "";
  context.innerHTML = `<div>${appState.analysisHighlight ? `<b>${esc(appState.analysisHighlight.label)}</b><span>${appState.graphFocus ? translate("ui.resultsOnly") : translate("ui.resultsHighlightedOnMap")}</span>` : `<b title="${translate("ui.ctrlOrShiftClickToChangeSelection")}">${translate("ui.selectedDiagramItems", { count: selectedCount })}</b>${pairHint ? `<span>${pairHint}</span>` : ""}`}</div><div class="graph-context-actions">${pair.length === 2 ? `<button class="btn small primary" data-action="link-selected">${icon("link")}${translate("ui.addRelationship")}</button>` : ""}${appState.multiSelection.size > 1 ? `<button class="btn small" data-action="graph-search">${translate("ui.searchSelected")}</button>` : ""}${appState.multiSelection.size ? `<button class="btn small" data-action="focus-selection">${translate("ui.selectedOnly")}</button>` : ""}${appState.analysisHighlight || appState.graphFocus ? `<button class="btn small" data-action="clear-analysis">${translate("ui.showEntireMap")}</button>` : `<button class="btn small ghost" data-action="clear-selection">${translate("ui.clear")}</button>`}</div>`;
}
