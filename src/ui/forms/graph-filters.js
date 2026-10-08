import { relTypes, graphStateInfo } from "../../core/config.js";
import { state as appState } from "../../core/state.js";
import { graphLineSample } from "../../graph/legend.js";
import { translate } from "../../i18n/index.js";
import { typeOptions } from "../components.js";
export function renderGraphFiltersForm(cfg, stateCounts) {
  return `<p class="hint">${translate("ui.filtersControlTheMapAllRecordsRemainIn")}</p><div class="graph-presets">${[
    ["all", translate("ui.allRelationships")],
    ["family", translate("ui.family")],
    ["proven", translate("ui.confirmed")],
    ["social", translate("ui.social")],
  ]
    .map(
      ([key, label]) =>
        `<button type="button" class="btn small" data-graph-preset="${key}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="graph-filter-columns"><section><h3>${translate("ui.relationshipTypes")}</h3><div class="graph-checklist">${Object.entries(
    relTypes(),
  )
    .map(
      ([key, label]) =>
        `<label><input type="checkbox" name="graph-types" value="${key}" ${cfg.types.includes(key) ? "checked" : ""}><span>${label}</span><small>${appState.project.relations.filter((r) => r.type === key).length}</small></label>`,
    )
    .join(
      "",
    )}</div></section><section><h3>${translate("ui.evidenceState")}</h3><div class="graph-checklist">${Object.entries(
    graphStateInfo(),
  )
    .map(
      ([key, [label]]) =>
        `<label><input type="checkbox" name="graph-states" value="${key}" ${cfg.states.includes(key) ? "checked" : ""}>${graphLineSample(key)}<span>${label}</span><small>${stateCounts[key] || 0}</small></label>`,
    )
    .join(
      "",
    )}</div></section></div><div class="graph-filter-options"><label><input type="checkbox" name="graph-labels" ${cfg.showLabels ? "checked" : ""}>${translate("ui.lineLabels")}</label><label><input type="checkbox" name="graph-isolated" ${cfg.showIsolated ? "checked" : ""}>${translate("ui.peopleWithoutVisibleRelationships")}</label><label><input type="checkbox" name="graph-doc-links" ${cfg.documentLinks ? "checked" : ""}>${translate("ui.sourceToPersonLines")}</label><label><input type="checkbox" name="graph-property-links" ${cfg.propertyLinks ? "checked" : ""}>${translate("ui.propertyAndShareLines")}</label><label class="field">${translate("ui.lines")}<select name="graph-lines">${typeOptions(
    {
      curve: translate("ui.curved"),
      straight: translate("ui.straight"),
    },
    cfg.lineStyle,
  )}</select></label></div>${cfg.hiddenRelations.length ? `<div class="hidden-link-note"><span>${translate("ui.individuallyHiddenRelationships")} <b>${cfg.hiddenRelations.length}</b></span><label><input type="checkbox" name="reveal-hidden-links">${translate("ui.showThemAgain")}</label></div>` : ""}`;
}
