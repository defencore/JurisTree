import { relTypes } from "../../core/config.js";
import { state as appState } from "../../core/state.js";
import { pathDepthOptions } from "../../graph/controls.js";
import { translate } from "../../i18n/index.js";
import { icon } from "../icons.js";
export function renderGraphAnalysisForm(fields, settings) {
  return `<div class="analysis-tabs">${[
    ["path", translate("ui.path")],
    ["neighbors", translate("ui.neighborhood")],
    ["common", translate("ui.commonConnections")],
    ["network", translate("ui.connectingNetwork")],
  ]
    .map(
      ([key, label]) =>
        `<button type="button" class="${key === appState.analysisMode ? "active" : ""}" data-analysis-mode="${key}">${label}</button>`,
    )
    .join(
      "",
    )}</div>${fields}<div class="analysis-options"><label class="field">${translate("ui.searchScope")}<select id="analysisScope"><option value="visible">${translate("ui.currentMap")}</option><option value="all">${translate("ui.entireTree")}</option></select></label>${["path", "neighbors", "common"].includes(appState.analysisMode) ? `<label class="field">${translate("ui.direction")}<select id="analysisDirection"><option value="any">${translate("ui.bothDirections")}</option><option value="down">${translate("ui.followArrowsTowardChildren")}</option><option value="up">${translate("ui.reverseArrowsTowardParents")}</option></select></label>` : ""}${appState.analysisMode === "path" ? `<label class="field">${translate("ui.pathMode")}<select id="analysisPathMode"><option value="shortest">${translate("ui.shortest")}</option><option value="alternatives">${translate("ui.alternativesWithinDepth")}</option></select></label>` : ""}${["path", "neighbors"].includes(appState.analysisMode) ? `<label class="field">${appState.analysisMode === "path" ? translate("ui.maximumSteps") : translate("ui.neighborhoodDepth")}<select id="analysisDepth">${appState.analysisMode === "path" ? pathDepthOptions("shortest", 600) : [1, 2, 3, 4, 6, 8].map((n) => `<option value="${n}" ${n === 1 ? "selected" : ""}>${n}</option>`).join("")}</select></label>` : ""}</div><details class="analysis-criteria"><summary>${translate("ui.searchCriteria")}</summary><p class="hint">${translate("ui.currentMapFiltersAlsoApplySearchingTheEntire")}</p><div class="check-grid">${Object.entries(
    relTypes(),
  )
    .map(
      ([key, label]) =>
        `<label><input type="checkbox" name="analysis-types" value="${key}" ${settings.types.includes(key) ? "checked" : ""}>${label}</label>`,
    )
    .join(
      "",
    )}</div><label class="field">${translate("ui.evidence")}<select id="analysisProof"><option value="any">${translate("ui.anyState")}</option><option value="official">${translate("ui.confirmedOnly")}</option><option value="known">${translate("ui.availableSourcesIncludingUnverified")}</option></select></label></details><div class="analysis-run"><p>${appState.analysisMode === "path" ? translate("ui.pathsMayContainFamilySocialOrPossibleConnections") : appState.analysisMode === "neighbors" ? translate("ui.findPeopleWithinAGivenDistanceOfA") : appState.analysisMode === "common" ? translate("ui.compareSharedConnectionsAndSourcesMentioningBothPeople") : translate("ui.connectSelectedPeopleWithShortestPathsAndFind")}</p><button type="button" class="btn primary" data-action="run-graph-analysis">${icon("search")}${translate("ui.find")}</button></div><div id="graphAnalysisResults" aria-live="polite"><p class="analysis-empty">${translate("ui.chooseOptionsAndClickFind")}</p></div>`;
}
