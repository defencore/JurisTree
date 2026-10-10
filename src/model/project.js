import { recordConfigs } from "../core/config.js";
import { modeVisibilityVersion } from "../core/workspace-modes.js";
import { defaultGraphView } from "../core/graph-view.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { sourceInScope } from "./evidence.js";
import { profileScope } from "./profile-scope.js";
import { createProjectIndex } from "./project-index.js";

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
  const index = createProjectIndex(appState.project);
  for (const key of ["peopleDocs", "relationDocs", "propertyDocs"])
    index[key] = new Map(
      [...index[key]].map(([id, documents]) => [
        id,
        documents.filter(sourceInScope),
      ]),
    );
  appState.renderIndex = index;
  try {
    return fn();
  } finally {
    appState.renderIndex = previous;
  }
}
