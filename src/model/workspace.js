import { state as appState } from "../core/state.js";

export function launchDraft() {
  return appState.editorActive
    ? {
        project: appState.project,
        files: appState.blobs,
      }
    : appState.savedDraft;
}
