import { recordConfigs } from "../core/config.js";
import { modeVisibilityVersion } from "../core/workspace-modes.js";
import { defaultGraphView } from "../core/graph-view.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { sourceInScope } from "./evidence.js";
import { profileScope } from "./profile-scope.js";
import { propertySources } from "./property-records.js";

export function fresh() {
  return {
    format: "juristree",
    version: 1,
    modeVisibilityVersion,
    title: translate("ui.myFamily"),
    purpose: "family",
    jurisdiction: "",
    demo: false,
    people: [],
    relations: [],
    documents: [],
    property: [],
    groups: [],
    personFilterViews: [],
    mapViews: [],
    diagram: {},
    placementLocks: { nodes: [], connectors: [] },
    scopePreferences: {},
    graphView: defaultGraphView(),
    subjectId: "",
    claimantId: "",
    updatedAt: new Date().toISOString(),
  };
}

export function scopedPerson(p) {
  const result = clone(p),
    visible = profileScope();
  for (const [section, cfg] of Object.entries(recordConfigs()))
    if (!visible.includes(section)) {
      delete result[cfg.key];
      if (cfg.overview) {
        delete result[cfg.overview.field];
        delete result[cfg.overview.sourceIds];
      }
    }
  if (!visible.includes("biography")) {
    delete result.biography;
    delete result.bioSourceIds;
  }
  return result;
}
export function withProjectIndex(fn) {
  if (appState.renderIndex?.project === appState.project) return fn();
  const previous = appState.renderIndex;
  const index = {
    project: appState.project,
    people: new Map(appState.project.people.map((p) => [p.id, p])),
    relations: new Map(appState.project.relations.map((r) => [r.id, r])),
    documents: new Map(appState.project.documents.map((d) => [d.id, d])),
    property: new Map(appState.project.property.map((a) => [a.id, a])),
    peopleDocs: new Map(),
    relationDocs: new Map(),
    propertyDocs: new Map(),
  };
  const propertyBySource = new Map();
  for (const item of appState.project.property)
    for (const id of propertySources(item)) {
      if (!propertyBySource.has(id)) propertyBySource.set(id, []);
      propertyBySource.get(id).push(item.id);
    }
  for (const d of appState.project.documents.filter(sourceInScope))
    for (const [key, ids] of [
      ["peopleDocs", d.people],
      ["relationDocs", d.relations],
      [
        "propertyDocs",
        [
          ...new Set([
            ...(d.propertyIds || []),
            ...(propertyBySource.get(d.id) || []),
          ]),
        ],
      ],
    ])
      for (const id of ids || []) {
        if (!index[key].has(id)) index[key].set(id, []);
        index[key].get(id).push(d);
      }
  appState.renderIndex = index;
  try {
    return fn();
  } finally {
    appState.renderIndex = previous;
  }
}
