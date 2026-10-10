import { state as appState } from "../core/state.js";

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
export function group(id) {
  return appState.renderIndex?.project === appState.project
    ? appState.renderIndex.groups.get(id)
    : appState.project.groups.find((g) => g.id === id);
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
