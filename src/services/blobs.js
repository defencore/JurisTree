import { state as appState } from "../core/state.js";

export function objectUrl(id) {
  if (!id || !appState.blobs.has(id)) return "";
  if (!appState.urls.has(id))
    appState.urls.set(id, URL.createObjectURL(appState.blobs.get(id)));
  return appState.urls.get(id);
}
export function usedBlobs(model = appState.project, files = appState.blobs) {
  const ids = new Set(model.people.map((p) => p.avatarId).filter(Boolean));
  model.documents.forEach((d) => {
    if (d.assetId) ids.add(d.assetId);
  });
  return [...ids].filter((id) => files.has(id));
}
export function pruneBlobs() {
  const keep = new Set();
  for (const model of [
    appState.project,
    ...appState.history,
    ...appState.future,
  ]) {
    model.people.forEach((p) => {
      if (p.avatarId) keep.add(p.avatarId);
    });
    model.documents.forEach((d) => {
      if (d.assetId) keep.add(d.assetId);
    });
  }
  for (const id of appState.blobs.keys())
    if (!keep.has(id)) {
      appState.blobs.delete(id);
      if (appState.urls.has(id)) {
        URL.revokeObjectURL(appState.urls.get(id));
        appState.urls.delete(id);
      }
    }
}
