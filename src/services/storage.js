import { $ } from "../core/dom.js";
import { state as appState } from "../core/state.js";
import { clone } from "../core/utils.js";
import { translate } from "../i18n/index.js";
import { pruneBlobs, usedBlobs } from "./files.js";
import { toast } from "../ui/dialog.js";
import { icon } from "../ui/icons.js";
export function scheduleSave() {
  if (!appState.editorActive) return;
  clearTimeout(appState.saveTimer);
  $("#saveState").innerHTML = icon("circle") + translate("ui.saving");
  appState.saveTimer = setTimeout(() => saveNow(), 400);
}
export async function saveNow() {
  if (!appState.editorActive || !appState.project) return;
  clearTimeout(appState.saveTimer);
  pruneBlobs();
  const payload = {
    project: clone(appState.project),
    files: usedBlobs().map((id) => [id, appState.blobs.get(id)]),
  };
  appState.saveSerial = appState.saveSerial
    .catch(() => {})
    .then(
      () =>
        new Promise((resolve, reject) => {
          if (!appState.db) return reject(Error("storage"));
          const tx = appState.db.transaction("draft", "readwrite");
          tx.objectStore("draft").put(payload, "current");
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        }),
    );
  try {
    await appState.saveSerial;
    $("#saveState").innerHTML = icon("check") + translate("ui.draftSaved");
  } catch {
    $("#saveState").textContent = translate("ui.saveAZipArchive");
    toast(translate("ui.couldNotSaveTheBrowserDraftExportA"), true);
  }
}
