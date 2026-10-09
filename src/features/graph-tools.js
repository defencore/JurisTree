import { graphStateInfo, relTypes } from "../core/config.js";
import { $, esc } from "../core/dom.js";
import { isProfessionalRelationship } from "../core/professional-relationships.js";
import { state as appState } from "../core/state.js";
import { fit } from "../graph/camera.js";
import { graphLineSample } from "../graph/legend.js";
import { getLocale, translate } from "../i18n/index.js";
import { edgeState } from "../model/evidence.js";
import {
  findCommonConnections,
  findConnectingNetwork,
  findGraphPaths,
  findNeighborhood,
} from "../model/graph-analysis.js";
import { graphView, resetAnalysis } from "../model/graph-view.js";
import { doc, person, relation } from "../model/lookup.js";
import { withProjectIndex } from "../model/project.js";
import { roleLabel } from "../model/relationship-labels.js";
import { commit } from "../services/history.js";
import { avatar, miniDoc, personOptions } from "../ui/components.js";
import { openDialog, toast } from "../ui/dialog.js";
import { renderGraphAnalysisForm } from "../ui/forms/graph-analysis.js";
import { renderGraphFiltersForm } from "../ui/forms/graph-filters.js";
import { renderGraphHelpForm } from "../ui/forms/graph-help.js";
import { pathDepthOptions } from "../ui/forms/path-options.js";
import { icon, icons } from "../ui/icons.js";

export function graphHelp() {
  openDialog(translate("ui.workingWithTheMap"), renderGraphHelpForm(), {
    footer: false,
  });
}

export async function editGraphFilters() {
  const cfg = graphView(),
    stateCounts = withProjectIndex(() => {
      const counts = {};
      for (const r of appState.project.relations) {
        const state = edgeState(r);
        counts[state] = (counts[state] || 0) + 1;
      }
      return counts;
    });
  const f = await openDialog(
    translate("ui.whichRelationshipsShouldBeShown"),
    renderGraphFiltersForm(cfg, stateCounts),
    {
      wide: true,
      submit: translate("ui.apply"),
    },
  );
  if (!f) return;
  resetAnalysis();
  commit(() => {
    appState.project.graphView = {
      ...cfg,
      types: f.getAll("graph-types"),
      states: f.getAll("graph-states"),
      showLabels: f.has("graph-labels"),
      showIsolated: f.has("graph-isolated"),
      documentLinks: f.has("graph-doc-links"),
      propertyLinks: f.has("graph-property-links"),
      lineStyle: f.get("graph-lines"),
      hiddenRelations: f.has("reveal-hidden-links") ? [] : cfg.hiddenRelations,
    };
  });
  fit();
}

export function updatePathSearchMode() {
  const mode = $("#analysisPathMode").value,
    depth = $("#analysisDepth"),
    value = Math.min(
      Number(depth.value) || 600,
      mode === "alternatives" ? 12 : 600,
    );
  depth.innerHTML = pathDepthOptions(mode, value);
  depth.value = String(value);
}
export function graphAnalysisDialog(mode = null) {
  if (appState.project.people.length < 1) {
    toast(translate("ui.addPeopleToTheTreeFirst"));
    return;
  }
  const chosen = [...appState.multiSelection].filter((id) => person(id));
  appState.analysisMode =
    mode ||
    (chosen.length > 2
      ? "network"
      : chosen.length === 1
        ? "neighbors"
        : "path");
  const from =
      chosen[0] ||
      (appState.selected?.kind === "person" && appState.selected.id) ||
      appState.project.claimantId ||
      appState.project.people[0].id,
    to =
      chosen[1] ||
      appState.project.people.find((p) => p.id !== from)?.id ||
      from;
  const fields =
    appState.analysisMode === "network"
      ? `<p class="field-caption">${translate("ui.peopleToConnect2To8")}</p><div class="network-seed-search search">${icon("search")}<input id="networkSeedSearch" aria-label="${translate("ui.searchPeopleForNetwork")}" placeholder="${translate("ui.findAPerson")}"></div><div class="network-seeds" id="networkSeeds">${appState.project.people.map((p) => `<label data-seed-name="${esc(p.name.toLocaleLowerCase(getLocale()))}"><input type="checkbox" name="network-seeds" value="${p.id}" ${chosen.includes(p.id) ? "checked" : ""}>${avatar(p)}<span>${esc(p.name)}</span></label>`).join("")}</div>`
      : `<div class="form-grid"><label class="field">${appState.analysisMode === "neighbors" ? translate("ui.person") : translate("ui.firstPerson2")}<select id="analysisFrom">${personOptions(from)}</select></label>${appState.analysisMode !== "neighbors" ? `<label class="field">${translate("ui.secondPerson2")}<select id="analysisTo">${personOptions(to)}</select></label>` : ""}</div>`;
  const settings = {
    types: Object.keys(relTypes()),
  };
  openDialog(
    translate("ui.connectionSearch"),
    renderGraphAnalysisForm(fields, settings),
    {
      wide: true,
      footer: false,
    },
  );
  appState.analysisResult = null;
}
export function analysisOptions() {
  const proof = $("#analysisProof")?.value || "any";
  return {
    scope: $("#analysisScope")?.value || "visible",
    direction: $("#analysisDirection")?.value || "any",
    mode: $("#analysisPathMode")?.value || "shortest",
    maxDepth: Number($("#analysisDepth")?.value) || 8,
    types: [
      ...$("#modalContent").querySelectorAll(
        'input[name="analysis-types"]:checked',
      ),
    ].map((x) => x.value),
    states:
      proof === "official"
        ? ["official"]
        : proof === "known"
          ? ["official", "review", "indirect"]
          : Object.keys(graphStateInfo()),
  };
}
export function graphStepLabel(r, from) {
  if (isProfessionalRelationship(r.type)) return roleLabel(r, from);
  if (r.type === "step_parent")
    return translate(r.from === from ? "ui.stepChild" : "ui.stepParent");
  if (["parent", "adopted"].includes(r.type))
    return r.from === from
      ? r.type === "adopted"
        ? translate("ui.adoptedChild2")
        : translate("ui.child2")
      : r.type === "adopted"
        ? translate("ui.adoptiveParent2")
        : translate("ui.parent2");
  return {
    spouse: translate("ui.partner4"),
    partner: translate("ui.personalPartnership"),
    sibling: translate("ui.sibling2"),
    acquaintance: translate("ui.acquaintance2"),
    unconfirmed: translate("ui.possibleConnection"),
  }[r.type];
}
export function graphPathCard(path, index) {
  return `<article class="analysis-path"><div class="analysis-path-head"><b>${translate("ui.path")} ${index + 1}</b><span>${path.relations.length} ${translate("ui.steps")}</span><div><button type="button" class="btn small" data-analysis-path="${index}">${translate("ui.highlight")}</button><button type="button" class="btn small" data-analysis-path="${index}" data-analysis-focus="true">${translate("ui.pathOnly")}</button></div></div><ol>${path.people
    .map((id, i) => {
      const r = i ? relation(path.relations[i - 1]) : null,
        state = r ? edgeState(r) : null;
      return `<li>${r ? `<div class="analysis-step">${graphLineSample(state)}${esc(graphStepLabel(r, path.people[i - 1]))}<small>${graphStateInfo()[state][0]}</small></div>` : ""}<div class="analysis-person">${avatar(person(id))}<b>${esc(person(id)?.name)}</b><small>${i === 0 ? translate("ui.start") : i === path.people.length - 1 ? translate("ui.end") : translate("ui.intermediary")}</small></div></li>`;
    })
    .join("")}</ol></article>`;
}
export function analysisSummary(result, label) {
  return `<div class="analysis-summary"><div><b>${esc(label)}</b><span>${result.people.length} ${translate("ui.people2")} ${result.relations.length} ${translate("ui.relationships")}</span></div><button type="button" class="btn small" data-analysis-result>${translate("ui.highlight")}</button><button type="button" class="btn small" data-analysis-result data-analysis-focus="true">${translate("ui.resultsOnly")}</button></div>`;
}
export function runGraphAnalysis() {
  const options = analysisOptions(),
    from = $("#analysisFrom")?.value,
    to = $("#analysisTo")?.value,
    root = $("#graphAnalysisResults");
  if (appState.analysisMode === "path" || appState.analysisMode === "common")
    if (from === to) {
      root.innerHTML = `<p class="analysis-empty">${translate("ui.selectTwoDifferentPeople2")}</p>`;
      return;
    }
  const seeds =
    appState.analysisMode === "network"
      ? [
          ...$("#modalContent").querySelectorAll(
            'input[name="network-seeds"]:checked',
          ),
        ].map((x) => x.value)
      : [];
  const result =
    appState.analysisMode === "path"
      ? findGraphPaths(from, to, options)
      : appState.analysisMode === "neighbors"
        ? findNeighborhood(from, options)
        : appState.analysisMode === "common"
          ? findCommonConnections(from, to, options)
          : findConnectingNetwork(seeds, options);
  appState.analysisResult = {
    mode: appState.analysisMode,
    result,
    from,
    to,
    seeds,
    options,
  };
  if (result.reason === "hidden") {
    root.innerHTML = `<p class="analysis-empty">${translate("ui.thisPersonIsHiddenByFiltersOrFocus")}</p>`;
    return;
  }
  if (result.reason === "seed_count") {
    root.innerHTML = `<p class="analysis-empty">${translate("ui.select2To8PeopleForAConnecting")}</p>`;
    return;
  }
  if (appState.analysisMode === "path") {
    root.innerHTML = result.paths.length
      ? `<p class="analysis-result-note">${options.mode === "shortest" ? translate("ui.shortestPaths") : `${translate("ui.pathsWithin")} ` + Math.min(options.maxDepth, 12) + ` ${translate("ui.steps")}`}: ${result.paths.length}${result.limited ? ` ${translate("ui.partialResultsShown")}` : ""}</p>${result.paths.map(graphPathCard).join("")}<p class="hint">${translate("ui.eachStepShowsItsTypeAndEvidenceState")}</p>`
      : `<p class="analysis-empty">${translate("ui.noPathMatchesTheseCriteriaChangeRelationshipTypes")}</p>`;
  } else if (appState.analysisMode === "neighbors") {
    const ps = result.people
      .filter((id) => id !== from)
      .sort(
        (a, b) =>
          result.depths[a] - result.depths[b] ||
          person(a).name.localeCompare(person(b).name, getLocale()),
      );
    root.innerHTML =
      analysisSummary(
        result,
        `${translate("ui.neighborhoodDepth2")} ` + options.maxDepth,
      ) +
      `<div class="analysis-person-list">${ps.map((id) => `<div>${avatar(person(id))}<b>${esc(person(id).name)}</b><span>${result.depths[id]} ${translate("ui.steps")}</span></div>`).join("") || `<p class="analysis-empty">${translate("ui.noConnectedPeopleMatchTheseCriteria")}</p>`}</div>`;
  } else if (appState.analysisMode === "common") {
    root.innerHTML =
      (result.common.length
        ? analysisSummary(result, translate("ui.commonConnections")) +
          '<div class="analysis-person-list">' +
          result.common
            .map(
              (id) =>
                `<div>${avatar(person(id))}<b>${esc(person(id).name)}</b></div>`,
            )
            .join("") +
          "</div>"
        : `<p class="analysis-empty">${translate("ui.noCommonPeopleMatchTheseCriteria")}</p>`) +
      `<h3 class="analysis-section-title">${translate("ui.sharedSources")} ${result.sources.length}</h3>${result.sources.map(doc).filter(Boolean).map(miniDoc).join("") || `<p class="hint">${translate("ui.noSourcesMentioningBothPeopleYet")}</p>`}`;
  } else
    root.innerHTML =
      analysisSummary(result, translate("ui.connectingNetwork")) +
      `<p class="analysis-result-note">${result.components.length === 1 ? translate("ui.allSelectedPeopleAreConnected") : `${translate("ui.separateComponents")} ` + result.components.length + translate("ui.noContinuousPathConnectsEveryone")}</p><div class="analysis-person-list">${result.people.map((id) => `<div>${avatar(person(id))}<b>${esc(person(id).name)}</b><span>${seeds.includes(id) ? translate("ui.selected") : translate("ui.intermediary")}</span></div>`).join("")}</div>`;
  icons();
}
