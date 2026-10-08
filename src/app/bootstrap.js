import { state as appState } from "../core/state.js";
import { renderStart, showStartScreen } from "../features/launcher.js";
import { fresh } from "../model/project.js";
import { validateImport } from "../model/validation.js";
import { webTools } from "../services/browser-tools.js";
import { icons } from "../ui/icons.js";
export async function init() {
  appState.db = null;
  appState.project = fresh();
  icons();
  renderStart();
  try {
    appState.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("juristree-draft-v1", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("draft");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const saved = await new Promise((resolve, reject) => {
      const tx = appState.db.transaction("draft"),
        r = tx.objectStore("draft").get("current");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    if (saved)
      appState.savedDraft = {
        project: validateImport(saved.project),
        files: new Map(saved.files || []),
      };
  } catch {
    appState.savedDraft = null;
  }
  appState.initialized = true;
  showStartScreen();
  webTools();
}
