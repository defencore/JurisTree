import { recordConfigs } from "../core/config.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { profileScope } from "../features/profiles.js";
import { defaultGraphView } from "../graph/analysis.js";
import { translate } from "../i18n/index.js";
import { sourceInScope } from "./evidence.js";
import { propertySources } from "./property-records.js";
export function person(id) {
  return appState.renderIndex?.project === appState.project
    ? appState.renderIndex.people.get(id)
    : appState.project.people.find((p) => p.id === id);
}
export function relation(id) {
  return appState.renderIndex?.project === appState.project
    ? appState.renderIndex.relations.get(id)
    : appState.project.relations.find((r) => r.id === id);
}
export function doc(id) {
  return appState.renderIndex?.project === appState.project
    ? appState.renderIndex.documents.get(id)
    : appState.project.documents.find((d) => d.id === id);
}
export function asset(id) {
  return appState.renderIndex?.project === appState.project
    ? appState.renderIndex.property.get(id)
    : appState.project.property.find((a) => a.id === id);
}
export function fresh() {
  return {
    format: "juristree",
    version: 1,
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
    scopePreferences: {},
    graphView: defaultGraphView(),
    subjectId: "",
    claimantId: "",
    updatedAt: new Date().toISOString(),
  };
}
export function group(id) {
  return appState.project.groups.find((g) => g.id === id);
}
export function nodeItem(kind, id) {
  return kind === "person"
    ? person(id)
    : kind === "document"
      ? doc(id)
      : kind === "group"
        ? group(id)
        : asset(id);
}
export function scopedPerson(p) {
  const result = clone(p),
    visible = profileScope();
  for (const [section, cfg] of Object.entries(recordConfigs()))
    if (!visible.includes(section)) delete result[cfg.key];
  if (!visible.includes("biography")) {
    delete result.biography;
    delete result.bioSourceIds;
  }
  if (!visible.includes("health")) {
    delete result.health;
    delete result.healthSourceIds;
  }
  if (!visible.includes("interests")) {
    delete result.hobbies;
    delete result.interests;
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
