import { defaultScopes } from "../core/workspace-modes.js";
import { sectionInfo } from "../core/config.js";
import { state as appState } from "../core/state.js";

export function profileScope() {
  const value = appState.project.scopePreferences?.[appState.project.purpose];
  return Array.isArray(value)
    ? value.filter((k) => sectionInfo()[k])
    : defaultScopes[appState.project.purpose] || defaultScopes.family;
}
